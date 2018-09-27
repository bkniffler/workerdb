# react-workerdb

React bindings for [workerdb](https://github.com/bkniffler/workerdb)

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

### React

You need to wrap your app with the `WorkerDB` provider. You may then use `Find`, `FindOne` and `Database` components.

```jsx
import { WorkerDB, Find, FindOne, Collection } from 'react-workerdb';

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
      <Collection
        name="bird"
        render={collection => (
          <button
            onClick={() => collection.upsert({ _id: '123', name: 'Filou' })}
          >
            Update bird
          </button>
        )}
      />
      <Collection
        name="bird"
        render={collection => (
          <button onClick={() => collection.remove({ _id: '123' })}>
            Delete bird
          </button>
        )}
      />
      <Find
        live
        collection="bird"
        render={docs => <span>There is {docs.length} birds</span>}
      />
      <FindOne
        live
        collection="bird"
        id="123"
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
