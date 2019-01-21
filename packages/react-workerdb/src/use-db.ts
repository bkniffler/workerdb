import * as React from 'react';
import { WorkerDBClientRX } from 'workerdb';
import Context from './context';

const defaultValue = {};
function useDB(): WorkerDBClientRX {
  const value = React.useContext(Context) as WorkerDBClientRX;
  return value || defaultValue;
}

export default useDB;
