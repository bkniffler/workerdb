import React from 'react';
import { WorkerDB, Find, Database } from '../../packages/react-workerdb';
import App from './components/app';

const worker = new Worker('./worker.js');
export default () => (
  <WorkerDB
    worker={worker}
    loading={() => (
      <div style={{ textAlign: 'center', height: 200, padding: 50 }}>
        Is loading ...
      </div>
    )}
  >
    <App />
  </WorkerDB>
);
