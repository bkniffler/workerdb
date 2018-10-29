import * as React from 'react';
import { WorkerDBCollection, WorkerDB } from 'workerdb';
import Context from './context';

function useCollection<T = any>(name: string): WorkerDBCollection<T> {
  const value = React['useContext'](Context) as WorkerDB;
  return value && value.c(name);
}

export default useCollection;
