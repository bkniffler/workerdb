import * as React from 'react';
import { WorkerDBClientRX } from 'workerdb';
import Context from './context';

function useInsert<T = any>(name: string): (value: T) => void {
  const value = React.useContext(Context) as WorkerDBClientRX;
  const collection = value && value.c(name);
  return collection && collection.insert;
}

export default useInsert;
