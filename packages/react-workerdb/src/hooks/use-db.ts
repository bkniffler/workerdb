import * as React from 'react';
import { WorkerDB } from 'workerdb';
import Context from '../context';

function useDB(): WorkerDB {
  const value = React['useContext'](Context) as WorkerDB;
  return value;
}

export default useDB;
