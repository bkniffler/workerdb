import * as React from 'react';
import { WorkerDB } from 'workerdb';
import Context from '../context';

const defaultValue = {};
function useDB(): WorkerDB {
  const value = React.useContext(Context) as WorkerDB;
  return value || defaultValue;
}

export default useDB;
