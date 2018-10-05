# Vanilla

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
