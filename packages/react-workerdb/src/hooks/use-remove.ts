import * as React from 'react';
import { WorkerDB } from 'workerdb';
import Context from '../context';

function useRemove(name: string): (id: string) => void {
  const value = React.useContext(Context) as WorkerDB;
  const collection = value && value.c(name);
  return collection && collection.remove;
}

export default useRemove;
