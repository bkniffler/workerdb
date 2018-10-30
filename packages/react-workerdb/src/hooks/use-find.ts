import * as React from 'react';
import { WorkerDB } from 'workerdb';
import { stringify } from '../utils';
import Context from '../context';

interface IUseFind<T> {
  value: Array<T>;
  error: Error | null;
  loading: boolean;
}

function useFind<T = any>(
  type: string,
  args?: any
): [Array<T>, Error | null, boolean] {
  const [{ value, error, loading }, setValue]: [
    IUseFind<T>,
    (newValue: IUseFind<T>) => void
  ] = React['useState']({ value: [], error: null, loading: true });
  const context = React['useContext'](Context) as WorkerDB;

  function useFindChange(error: Error | null, value: Array<T>) {
    if (error) {
      setValue({ error, loading: false, value });
    }
    setValue({ value, error: null, loading: false });
  }

  React['useEffect'](() => context.query(type, 'find', args, useFindChange), [
    type,
    stringify(args)
  ]);

  return [value, error, loading];
}

export default useFind;
