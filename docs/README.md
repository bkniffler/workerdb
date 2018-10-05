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
