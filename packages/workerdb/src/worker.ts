import { combineLatest } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import RxDB, { RxCollectionCreator, RxDatabase, RxDatabaseCreator } from 'rxdb';

declare const self: Worker;

interface RxCollectionCreatorWithSync extends RxCollectionCreator {
  sync?: any;
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
  webworker.onmessage = async event => {
    const { data } = event;
    listener(data);
  };
};

export const inner = (
  collections: Array<RxCollectionCreatorWithSync>,
  send: WorkerSender,
  addPlugins?: Function
) => {
  let _db: Promise<RxDatabase>;
  let replicationStates: any;
  const listeners = {};
  const rx = addPlugins ? addPlugins(RxDB) : RxDB;
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
  };

  return async (data: any) => {
    if (data.type === 'init') {
      return createDB(data.value)
        .then(() => {
          send({
            id: data.id,
            type: 'ready'
          });
        })
        .catch(error => send({ type: 'error', error }));
    }
    const db = await _db;
    if (!db) {
      throw new Error('Not initialized');
    }
    if (data.type === 'close') {
      return db.destroy();
    } else if (data.type === 'stop') {
      listeners[data.id].unsubscribe();
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
    } else if (['find', 'findOne'].indexOf(data.type) !== -1) {
      const value = data.value || {};
      const query = db[data.collection][data.type](
        value.id || value._id || value // eslint-disable-line
      );
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
