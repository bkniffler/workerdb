<div align="center">
  <h2>WorkerDB</h2>
  <strong>Reactive, offline-first, syncable Database in WebWorker based on PouchDB/RxDB, great for electronJS and web-applications</strong>
  <br />
  <br />
  <a href="https://travis-ci.org/bkniffler/workerdb">
    <img src="https://img.shields.io/travis/bkniffler/workerdb.svg?style=flat-square" alt="Build Status">
  </a>
  <a href="https://codecov.io/github/bkniffler/workerdb">
    <img src="https://img.shields.io/codecov/c/github/bkniffler/workerdb.svg?style=flat-square" alt="Coverage Status">
  </a>
  <a href="https://github.com/bkniffler/workerdb">
    <img src="http://img.shields.io/npm/v/workerdb.svg?style=flat-square" alt="Version">
  </a>
  <a href="https://github.com/bkniffler/workerdb">
    <img src="https://img.shields.io/badge/language-typescript-blue.svg?style=flat-square" alt="Language">
  </a>
  <a href="https://github.com/bkniffler/workerdb/master/LICENSE">
    <img src="https://img.shields.io/github/license/bkniffler/workerdb.svg?style=flat-square" alt="License">
  </a>
  <br />
  <br />
</div>

## Bindings

- [react](https://github.com/bkniffler/workerdb/tree/master/packages/react-workerdb)
- vanilla: The database can be used with or without any framework

## Why

[PouchDB](https://github.com/pouchdb/pouchdb) is a great database that, out of the box, enables you to build your sync-enabled apps easily. With [RxDB](https://github.com/pubkey/rxdb) on top you have better performance on bigger datasets as well as reactivity using RxJS and even more features like field-based encryption, schema validation/migration and more.

But if you want to build an app with lots of data, you may hit some issues with your app getting laggy due to the database querying, realtime syncing etc. all sogging up your UI threads' resources. You can try and use different native pouchdb adapters like leveldb or sqlite, but this may only make the queries go a bit faster, but the database communcation, offline-sync, etc. is still expensive. This is where WorkerDB comes into the game.

WorkerDB sits inside a WebWorker, which will, if possible, use a different CPU thread than your main app. All the heavy DB lifting happens inside the webworker, while the UI thread will only send commands to and receive results from the webworker.

## Install

### Yarn

```
yarn add workerdb react-workerdb
```

### NPM

```
npm i workerdb react-workerdb
```

## How to Use

Wether you use it with or without react, you will need to create a worker.js. The worker.js will define your database schema and host the database. Then you may use the react bindings or vanilla to instanciate the worker and query your data.

### Worker.Js

For seeing all possible schema options, please check out RxDB docs [here](https://pubkey.github.io/rxdb/rx-schema.html#example). There is just one additional property added `sync`. If this is defined, the collection will use the provided options to start syncing.

```jsx
import { worker } from 'workerdb';

worker([
  {
    name: 'bird',
    schema: {
      version: 0,
      properties: {
        name: { type: 'string' },
        age: { type: 12 }
      }
    },
    sync: {
      remote: `https://my-server.com/bird`,
      waitForLeadership: false,
      direction: {
        pull: true,
        push: false
      },
      options: {
        live: true,
        retry: true
      }
    }
  }
]);
```

### React

You need to wrap your app with the `WorkerDB` provider. You may then use `Find`, `FindOne` and `Database` components.

```jsx
import { WorkerDB, Find, Collection } from 'react-workerdb';

const worker = new Worker('./worker.js');
export default () => (
  <WorkerDB worker={worker} loading={() => 'Is loading ...'}>
    <div>
      <Collection
        name="bird"
        render={collection => (
          <button onClick={() => collection.insert({ name: 'Filou' })}>
            Add Bird
          </button>
        )}
      />
      <Find
        live
        collection="bird"
        render={docs => <span>There is {docs.length} birds</span>}
      />
      <Find
        live
        collection="bird"
        name={{ $regex: /f/i }}
        render={docs => <span>There is {docs.length} birds</span>}
      />
    </div>
  </WorkerDB>
);
```

### Vanilla

```jsx
import { WorkerDB, WorkerDBWorker, WorkerDBProxy } from 'workerdb';
const worker = new Worker('./worker.js');

const stuff = async () => {
  const db = await WorkerDB.create(worker, {
    name: 'db',
    onSyncing: active => console.log(active),
    onError: err => console.error(err)
  });
  const collection = db.collection('bird');

  await collection.insert({ name: 'Filou' });
  const birds = await collection.find({});

  db.close();
};

stuff();
```
