import React from 'react';
import { WorkerDB, Find, Database } from '../../packages/react-workerdb';
import App from './components/app';

const worker = new Worker('./worker.js');
export default () => (
  <WorkerDB worker={worker} loading={() => 'Is loading ...'}>
    <App />
  </WorkerDB>
);
