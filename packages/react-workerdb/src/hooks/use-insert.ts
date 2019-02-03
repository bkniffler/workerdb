import * as React from 'react';
import { WorkerDB } from 'workerdb';
import Context from '../context';

function useInsert<T = any>(name: string): (value: T) => Promise<T> {
  const value = React.useContext(Context) as WorkerDB;
  const collection = value && value.c(name);
  return collection && collection.insert;
}

export default useInsert;
