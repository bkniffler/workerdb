import { combineLatest } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import RxDB, { RxCollectionCreator, RxDatabase, RxDatabaseCreator } from 'rxdb';

declare const self: Worker;

interface RxCollectionCreatorWithSync extends RxCollectionCreator {
  sync?: any;
  methods?: any;
}

interface WorkerMessageBody {
  id?: string;
  type: string;
  value?: any;
  error?: Error | string;
}

type WorkerSender = (body: WorkerMessageBody) => void;

RxDB.plugin(require('pouchdb-adapter-http'));
RxDB.plugin(require('pouchdb-adapter-idb'));

export default (
  collections: Array<RxCollectionCreatorWithSync>,
  webworker = self
) => {
  const listener = inner(collections, webworker.postMessage);
  webworker.onmessage = event => {
    const { data } = event;
    listener(data);
  };
};

export const inner = (
  collections: Array<RxCollectionCreatorWithSync>,
  send: WorkerSender,
  addPlugins?: Function,
  init?: Function
) => {
  let _db: Promise<RxDatabase>;
  let replicationStates: any;
  const listeners = {};
  const rx = addPlugins ? addPlugins(RxDB) : RxDB;
  const customMethods = {};
  const createDB = async (data: RxDatabaseCreator) => {
    if (_db) {
      const db = await _db;
      await db.destroy();
    }
    _db = rx.create({
      name: data.name || 'db',
      adapter: data.adapter || 'idb',
      multiInstance: false,
      queryChangeDetection: true
    });
    const db = await _db;
    replicationStates = {};
    await Promise.all(
      collections.map(col =>
        db.collection(col).then(c => {
          customMethods[c.name] = col.methods;
          if (col.sync) {
            replicationStates[c.name] = c.sync(col.sync);
          }
          return c;
        })
      )
    );
    combineLatest(
      ...Object.keys(replicationStates).map(
        key => replicationStates[key].active$
      ),
      (...results: Array<boolean>) => {
        return results.indexOf(true) !== -1;
      }
    )
      .pipe(distinctUntilChanged())
      .subscribe(value => {
        send({
          type: 'syncing',
          value
        });
      });
    return db;
  };

  return async (data: any) => {
    if (data.type === 'init') {
      try {
        const db = await createDB(data.value);
        if (init) {
          await init(db);
        }
        send({
          id: data.id,
          type: 'ready'
        });
      } catch (error) {
        send({ type: 'error', error });
      }
    }
    const db = await _db;
    if (!db) {
      throw new Error('Not initialized');
    }
    if (data.type === 'close') {
      return db.destroy();
    } else if (data.type === 'stop') {
      listeners[data.id].unsubscribe();
      delete listeners[data.id];
    } else if (['active'].indexOf(data.type) !== -1) {
      listeners[data.id] = replicationStates[data.collection].subscribe(
        (value: boolean) => {
          send({
            id: data.id,
            type: data.type,
            value
          });
        }
      );
    } else if ((customMethods[data.collection] && customMethods[data.collection][data.type]) || ['find', 'findOne'].indexOf(data.type) !== -1) {
      const {
        id,
        _id,
        sort,
        ...rest
      }: { id: any; _id: any; sort?: string;[x: string]: any } =
        data.value || {};
      const isCustom = (customMethods[data.collection] && customMethods[data.collection][data.type]);

      if (isCustom) {
        const query = customMethods[data.collection][data.type](db[data.collection], id || _id || rest);
        return Promise.resolve(query)
          .then((value: any) =>
            send({
              id: data.id,
              type: data.type,
              value
            })
          )
          .catch((error: Error) =>
            send({
              id: data.id,
              type: data.type,
              error: error.message
            })
          );
      }
      let query = db[data.collection][data.type](id || _id || rest);
      if (sort) {
        query = query.sort(sort);
      }
      if (data.live === true) {
        listeners[data.id] = query.$.subscribe((value: any) => {
          send({
            id: data.id,
            type: data.type,
            value: Array.isArray(value)
              ? value.map(x => x.toJSON())
              : value.toJSON()
          });
        });
      }
      return query
        .exec()
        .then((value: any) =>
          send({
            id: data.id,
            type: data.type,
            value: Array.isArray(value)
              ? value.map(x => x.toJSON())
              : value.toJSON()
          })
        )
        .catch((error: Error) =>
          send({
            id: data.id,
            type: data.type,
            error: error.message
          })
        );
    } else if (['remove'].indexOf(data.type) !== -1) {
      const value = data.value || {};
      const query = db[data.collection].findOne(
        value.id || value._id || value // eslint-disable-line
      );
      return query[data.type]()
        .then((value: any) =>
          send({
            id: data.id,
            type: data.type,
            value: Array.isArray(value)
              ? value.map(x => x.toJSON())
              : value.toJSON()
          })
        )
        .catch((error: Error) =>
          send({
            id: data.id,
            type: data.type,
            error: error.message
          })
        );
    } else if (['insert', 'upsert'].indexOf(data.type) !== -1) {
      return db[data.collection]
      [data.type](data.value)
        .then((value: any) =>
          send({
            id: data.id,
            type: data.type,
            value: value.toJSON()
          })
        )
        .catch((error: Error) =>
          send({
            id: data.id,
            type: data.type,
            error: error.message
          })
        );
    }
  };
};
