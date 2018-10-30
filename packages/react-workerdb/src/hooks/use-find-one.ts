import * as React from 'react';
import { WorkerDB } from 'workerdb';
import { stringify } from '../utils';
import Context from '../context';

interface IUseFindOne<T> {
  value: T;
  error: Error | null;
  loading: boolean;
}

function useFindOne<T = any>(
  name: string,
  args?: any
): [T, Error | null, boolean] {
  const [{ value, error, loading }, setValue]: [
    IUseFindOne<T>,
    (newValue: IUseFindOne<T>) => void
  ] = React['useState']({ value: null, error: undefined, loading: true });
  const context = React['useContext'](Context) as WorkerDB;

  function useFindChange(error: Error | null, value: T) {
    if (error) {
      setValue({ error, loading: false, value });
    }
    setValue({ value, error: null, loading: false });
  }

  React['useEffect'](() => context.query(name, 'find', args, useFindChange), [
    stringify(args)
  ]);

  return [value, error, loading];
}

export default useFindOne;
