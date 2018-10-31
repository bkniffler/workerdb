import * as React from 'react';
import { WorkerDB } from 'workerdb';
import { stringify } from '../utils';
import Context from '../context';

interface IUseQuery<T> {
  value: T;
  error: Error | null;
  loading: boolean;
}

function useQuery<T = any, T2 = T>(
  type: string,
  method: string,
  args?: any,
  transformer?: (value: T) => T2
): [T2, Error | null, boolean] {
  const [{ value, error, loading }, setValue]: [
    IUseQuery<T2>,
    (newValue: IUseQuery<T2>) => void
  ] = React['useState']({ value: undefined, error: undefined, loading: true });
  const context = React['useContext'](Context) as WorkerDB;

  function useFindChange(error: Error | null, value: any) {
    if (error) {
      setValue({ error, loading: false, value });
    }
    if (transformer) {
      setValue({ value: transformer(value), error: null, loading: false });
    } else {
      setValue({ value, error: null, loading: false });
    }
  }

  if (context) {
    React['useEffect'](() => context.query(type, method, args, useFindChange), [
      type,
      method,
      stringify(args)
    ]);
  }

  return [value, error, loading];
}

export default useQuery;
