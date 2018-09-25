import { WorkerDB, Find, Database } from 'react-workerdb';

const worker = new Worker('./worker.js');
export default () => (
  <WorkerDB worker={worker} loading={() => 'Is loading ...'}>
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
