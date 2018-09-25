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
  let db: RxDatabase;
  const listeners = {};
  const rx = addPlugins ? addPlugins(RxDB) : RxDB;
  const createDB = async (data: RxDatabaseCreator) => {
    if (db) {
      await db.destroy();
    }
    db = await rx.create({
      name: data.name || 'db',
      adapter: data.adapter || 'idb',
      multiInstance: false,
      queryChangeDetection: true
    });
    const states = await Promise.all(
      collections.map(col =>
        db.collection(col).then(c => {
          if (col.sync) {
            return c.sync(col.sync);
          }
          return undefined;
        })
      )
    );
    const replicationStates = {};
    states.forEach((state, i) => {
      if (!state) {
        return;
      }
      const { name } = collections[i];
      replicationStates[name] = {};
      state.active$.subscribe(active => {
        replicationStates[name].active = active;
        const isActive =
          Object.keys(replicationStates)
            .map(x => replicationStates[x].active)
            .indexOf(true) !== -1;
        send({
          type: 'syncing',
          value: isActive
        });
      });
      /* state.alive$.subscribe(alive => {
        replicationStates[name].alive = alive;
        const isAlive =
          Object.keys(replicationStates)
            .map(x => replicationStates[x].alive)
            .indexOf(true) !== -1;
        worker.postMessage({
          type: 'alive',
          alive: isAlive
        });
      }); */
      state.error$.subscribe(error => {
        send({ type: 'error', error });
      });
    });
  };

  return async (data: any) => {
    if (data.type === 'init') {
      createDB(data.value)
        .then(() => {
          send({
            id: data.id,
            type: 'ready'
          });
        })
        .catch(error => send({ type: 'error', error }));
    } else if (data.type === 'close') {
      return db.destroy();
    } else if (data.type === 'stop') {
      listeners[data.id].unsubscribe();
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
