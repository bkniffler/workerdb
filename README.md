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
  <a href="https://www.npmjs.com/package/workerdb">
    <img src="https://img.shields.io/npm/dm/workerdb.svg?style=flat-square" alt="Downloads">
  </a>
  <a href="https://github.com/bkniffler/workerdb">
    <img src="https://img.shields.io/github/issues/bkniffler/workerdb.svg?style=flat-square" alt="Issues">
  </a>
  <a href="https://github.com/bkniffler/workerdb">
    <img src="https://img.shields.io/github/package-json/v/bkniffler/workerdb.svg?style=flat-square" alt="Version">
  </a>
  <a href="https://github.com/bkniffler/workerdb">
    <img src="https://img.shields.io/github/forks/bkniffler/workerdb.svg?style=flat-square" alt="Forks">
  </a>
  <a href="https://github.com/bkniffler/workerdb">
    <img src="https://img.shields.io/github/stars/bkniffler/workerdb.svg?style=flat-square" alt="Stars">
  </a>
  <a href="https://github.com/bkniffler/workerdb/master/LICENSE">
    <img src="https://img.shields.io/github/license/bkniffler/workerdb.svg?style=flat-square" alt="License">
  </a>
  <br />
  <br />
</div>

## Bindings

- react (react-workerdb)

## Why

PouchDB is a great database that, out of the box, enables you to build your sync-enabled apps easily. With RxDB on top you have better performance on bigger datasets as well as reactivity using RxJS and even more features like field-based encryption, schema validation/migration and more.

But if you want to build an app with lots of data, you may hit some issues with your app getting laggy due to the database querying, realtime syncing etc. all sogging up your UI thread resources. You can try and use different native pouchdb adapters like leveldb or sqlite, but this may only make the queries go faster. This is where WorkerDB comes into the game.

WorkerDB sits inside a WebWorker, which will, if possible, use a different CPU thread than your main app. All the heavy DB lifting happens inside the webworker, while the UI thread will only send commands to and receive results from the webworker.

## Example (React)

```jsx
// your index.js
import { WorkerDB, Find, Database } from 'react-workerdb';

export default () => (
  <WorkerDB
    worker={() => new WebWorker('./worker.js')}
    loading={() => 'Is loading ...'}
  >
    <div>
      <Database
        render={db => (
          <button onClick={() => db.bird.insert({ name: 'Filou' })}>
            Add Bird
          </button>
        )}
      />
      <Find
        live
        collection="bird"
        render={docs => <span>There is {docs.length} birds</span>}
      />
    </div>
  </WorkerDB>
);
```

```jsx
// your wroker.js
import { worker } from 'workerdb';

worker([
  {
    name: 'bird',
    schema: {
      version: 0,
      properties: {
        name: { type: 'string' }
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
