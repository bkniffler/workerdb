import * as React from 'react';
import { WorkerDBClientRX } from 'workerdb';
import Context from './context';

function useRemove(name: string): (id: string) => void {
  const value = React.useContext(Context) as WorkerDBClientRX;
  const collection = value && value.c(name);
  return collection && collection.remove;
}

export default useRemove;
