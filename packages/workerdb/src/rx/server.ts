import { combineLatest } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import RxDB, {
  PouchDB,
  RxCollectionCreator,
  RxDatabase,
  RxDatabaseCreator
} from 'rxdb';
import { WorkerDBServerCore } from '../core';
import { IWorkerActionType } from './actions';

export interface IRxCollectionCreatorWithSync extends RxCollectionCreator {
  sync?: any;
  methods?: any;
}

export interface IRxDatabaseCreatorWithAuth extends RxDatabaseCreator {
  plugins?: Function;
  init?: Function;
  autoInit?: boolean;
  authorization?: string;
}

RxDB.plugin(require('pouchdb-adapter-http'));
RxDB.plugin(require('pouchdb-adapter-idb'));

export class WorkerDBServerRX extends WorkerDBServerCore {
  subscriptions = {};
  terminated: boolean = false;
  collections: Array<IRxCollectionCreatorWithSync>;
  db: Promise<RxDatabase>;
  replicationStates: any;
  customMethods = {};
  options: IRxDatabaseCreatorWithAuth;

  constructor(
    collections: Array<IRxCollectionCreatorWithSync>,
    options: IRxDatabaseCreatorWithAuth
  ) {
    super();
    this.collections = collections;
    this.options = options || {};
    if (!this.options.plugins && this.options.adapter === 'memory') {
      this.options.plugins = (rx: any) => {
        rx.plugin(require('pouchdb-adapter-memory'));
        return rx;
      };
    }
    if (this.options.autoInit !== false) {
      this.init(this.options);
    }
  }

  init = async (data: any, ref?: string) => {
    try {
      this.db = this.createDB(data)
        .then(db => {
          if (this.options.init) {
            return this.options.init(db);
          }
          return db;
        })
        .then(db => {
          this.listener({ type: 'ready', ref });
          return db;
        });
    } catch (error) {
      this.listener({ type: 'error', ref, error });
    }
    return;
  };

  close = async (ref?: string) => {
    const db = await this.db;
    return db.destroy().then(() => {
      this.terminated = true;
      this.listener({ type: 'close', ref });
    });
  };

  createDB = async (data: IRxDatabaseCreatorWithAuth) => {
    const rx = this.options.plugins ? this.options.plugins(RxDB) : RxDB;
    const db = await rx.create({
      name: data.name || 'db',
      adapter: data.adapter || 'idb',
      multiInstance: false,
      queryChangeDetection: true
    });
    this.replicationStates = {};
    await Promise.all(
      this.collections.map(col =>
        db.collection(col).then((c: any) => {
          this.customMethods[c.name] = col.methods;
          if (col.sync) {
            if (col.sync.remote) {
              col.sync.remote = new PouchDB(
                col.sync.remote,
                data.authorization
                  ? {
                      headers: { Authorization: data.authorization }
                    }
                  : ({} as any)
              );
            }
            this.replicationStates[c.name] = c.sync(col.sync);
          }
          return c;
        })
      )
    );
    combineLatest(
      ...Object.keys(this.replicationStates).map(
        key => this.replicationStates[key].active$
      ),
      (...results: Array<boolean>) => {
        return results.indexOf(true) !== -1;
      }
    )
      .pipe(distinctUntilChanged())
      .subscribe(value => {
        this.listener({ type: 'syncing', value });
      });
    return db;
  };

  exec = async (data: any) => {
    const ref = data.ref as string;
    const type = data.type as IWorkerActionType;
    if (type === 'init') {
      return this.init(data.value, data.ref);
    }
    const db = await this.db;
    if (!db) {
      throw new Error('Not initialized');
    }
    if (type === 'close') {
      return this.close(data.ref);
    } else if (type === 'reset') {
      return db.remove().then(() => {
        this.listener({ type: 'reset' });
      });
    } else if (type === 'stop') {
      if (this.subscriptions[ref]) {
        this.subscriptions[ref].unsubscribe();
        delete this.subscriptions[ref];
      } else {
        console.warn(
          'Trying to unsubscribe from listener',
          ref,
          'but none listening'
        );
      }
    } else if (['active'].indexOf(type) !== -1) {
      this.subscriptions[ref] = this.replicationStates[
        data.collection
      ].subscribe((value: boolean) => {
        this.listener({
          ref,
          type,
          value
        });
      });
    } else if (
      (this.customMethods[data.collection] &&
        this.customMethods[data.collection][type]) ||
      ['find', 'findOne'].indexOf(type) !== -1
    ) {
      if (!db[data.collection]) {
        return this.listener({
          ref,
          type,
          error: new Error('Could not find collection ' + data.collection)
        });
      }
      const {
        id,
        _id,
        sort,
        ...rest
      }: { id: any; _id: any; sort?: string; [x: string]: any } =
        (typeof data.value === 'string' ? { id: data.value } : data.value) ||
        {};
      const isCustom =
        this.customMethods[data.collection] &&
        this.customMethods[data.collection][type];

      if (isCustom) {
        const query = this.customMethods[data.collection][type](
          db[data.collection],
          id || _id || rest
        );
        return Promise.resolve(query)
          .then((value: any) =>
            this.listener({
              ref,
              type,
              value
            })
          )
          .catch((error: Error) =>
            this.listener({
              ref,
              type,
              error: error.message
            })
          );
      }
      let query = db[data.collection][type](id || _id || rest);
      if (sort) {
        query = query.sort(sort);
      }
      if (data.live === true) {
        this.subscriptions[ref] = query.$.subscribe((value: any) => {
          this.listener({
            ref,
            type,
            value: Array.isArray(value)
              ? value.map(x => x.toJSON())
              : value.toJSON()
          });
        });
        return query.exec();
      }
      return query
        .exec()
        .then((value: any) =>
          this.listener({
            ref,
            type,
            value: Array.isArray(value)
              ? value.map(x => x.toJSON())
              : value.toJSON()
          })
        )
        .catch((error: Error) =>
          this.listener({
            ref,
            type,
            error: error.message
          })
        );
    } else if (['remove'].indexOf(type) !== -1) {
      if (!db[data.collection]) {
        return this.listener({
          ref,
          type,
          error: new Error('Could not find collection ' + data.collection)
        });
      }
      const value = data.value || {};
      const query = db[data.collection].findOne(
        value.id || value._id || value // eslint-disable-line
      );
      return query[type]()
        .then((value: any) =>
          this.listener({
            ref,
            type,
            value: Array.isArray(value)
              ? value.map(x => x.toJSON())
              : value.toJSON()
          })
        )
        .catch((error: Error) =>
          this.listener({
            ref,
            type,
            error: error.message
          })
        );
    } else if (['insert', 'upsert', 'update'].indexOf(type) !== -1) {
      if (!db[data.collection]) {
        return this.listener({
          ref,
          type,
          error: new Error('Could not find collection ' + data.collection)
        });
      }
      if (data.value && data.value._id) {
        return db[data.collection]
          .findOne(data.value._id)
          .update({ $set: data.value })
          .then((value: any) =>
            this.listener({
              ref,
              type,
              value: value.toJSON()
            })
          )
          .catch((error: Error) =>
            this.listener({
              ref,
              type,
              error: error.message
            })
          );
      }
      return db[data.collection]
        [type](data.value)
        .then((value: any) =>
          this.listener({
            ref,
            type,
            value: value.toJSON()
          })
        )
        .catch((error: Error) =>
          this.listener({
            ref,
            type,
            error: error.message
          })
        );
    }
  };
}
