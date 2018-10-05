# React

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
