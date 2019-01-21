import * as React from 'react';
import { WorkerDBClientRX } from 'workerdb';
import { stringify } from './utils';
import Context from './context';

interface IUseFind<T> {
  value: Array<T>;
  error: Error | null;
  loading: boolean;
}

function useFind<T = any, T2 = T>(
  type: string,
  args?: any,
  transformer?: (value: Array<T>) => Array<T2>
): [Array<T2>, Error | null, boolean] {
  const [{ value, error, loading }, setValue]: [
    IUseFind<T2>,
    (newValue: IUseFind<T2>) => void
  ] = React.useState({ value: [], error: null, loading: true } as any);
  const context = React.useContext(Context) as WorkerDBClientRX;

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

  React.useEffect(
    context && context.query
      ? () => context.query(type, 'find', args, useFindChange)
      : () => {},
    [context, type, stringify(args)]
  );

  return [value, error, loading];
}

export default useFind;
