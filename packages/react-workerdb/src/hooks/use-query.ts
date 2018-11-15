import * as React from 'react';
import { WorkerDB } from 'workerdb';
import { stringify } from '../utils';
import Context from '../context';

interface IUseQuery<T> {
  value: T;
  error: Error | null;
  loading: boolean;
}
interface IUseQueryOptions<T = any, T2 = any> {
  disabled?: boolean;
  transformer?: (value: T) => T2;
  args?: any;
}

function useQuery<T = any, T2 = T>(
  type: string,
  method: string,
  options: IUseQueryOptions = {}
): [T2, Error | null, boolean] {
  const [{ value, error, loading }, setValue]: [
    IUseQuery<T2>,
    (newValue: IUseQuery<T2>) => void
  ] = React.useState({
    value: undefined,
    error: undefined,
    loading: true
  } as any);
  const { disabled = false, transformer, args } = options;
  const context = React.useContext(Context) as WorkerDB;

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

  const skip = !context || !context.query || disabled;
  React.useEffect(
    skip ? () => {} : () => context.query(type, method, args, useFindChange),
    [type, method, stringify(args)]
  );

  return disabled
    ? ([undefined, undefined, false] as any)
    : [value, error, loading];
}

export default useQuery;
