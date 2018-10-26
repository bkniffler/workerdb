import * as React from 'react';
import { WorkerDBCollection, WorkerDB } from 'workerdb';
import Context from './context';

function useCollection(name: string): WorkerDBCollection {
  const value = React['useContext'](Context) as WorkerDB;
  return value && value.c(name);
}

export default useCollection;
