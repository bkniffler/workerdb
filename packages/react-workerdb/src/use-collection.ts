import * as React from 'react';
import { IWorkerDBCollection, WorkerDBClientRX } from 'workerdb';
import Context from './context';

function useCollection<T = any>(name: string): IWorkerDBCollection<T> {
  const value = React.useContext(Context) as WorkerDBClientRX;
  return value && value.c(name);
}

export default useCollection;
