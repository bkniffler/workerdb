import { IWorkerActionType } from './actions';
import { WorkerDBServerCore } from '../core';

export interface IWorkerDBWorker {
  onerror: ((this: any, ev: any) => any) | null;
  onmessage: ((this: any, ev: any) => any) | null;
  postMessage: (data: any) => void;
  terminate: Function;
}

export interface IWorkerDBMock {
  send: (data: any) => void;
  listen: ((data: any) => void);
}

export interface IWorkerDBSyncing {}

export interface IWorkerDBError {}

export interface IWorkerDBOptions {
  onClosed?: () => void;
  onReady?: (value: WorkerDBClientRX) => void;
  onError?: (value: Error) => void;
  onSyncing?: (value: boolean) => void;
}

export interface IWorkerDBCollection<T = any> {
  findOne: (value?: any) => T;
  find: (value?: any) => [T];
  remove: (id: string) => void;
  insert: (value: T) => Promise<T>;
  upsert: (value: T) => Promise<T>;
}

export interface IWorkerDBCallback {
  (error: Error | null, value?: any): any;
}

export class WorkerDBClientRX extends WorkerDBServerCore {
  options: IWorkerDBOptions = {};
  subscriptions = {};
  ref = 0;
  terminateIn5: Number;
  isReady = false;
  isClosed = false;

  constructor(options?: IWorkerDBOptions) {
    super();
    this.options = options || this.options;
  }

  // Send a query to database, either callbase (watch) or promise (once)
  query = (
    collection: string | null,
    type: string,
    value: any,
    cb?: IWorkerDBCallback
  ) => {
    const { ref } = this;
    this.ref += 1;

    const listener = (callback: IWorkerDBCallback) => (data: any) => {
      if (data && data.live === false) {
        delete this.subscriptions[data.ref];
      }
      if (data && data.error) {
        return callback(data.error);
      }
      return callback(null, data.value);
    };

    const send = () =>
      this.listener({
        ref,
        collection,
        type,
        live: !!cb,
        value
      });

    if (cb) {
      this.subscriptions[ref] = listener(cb);
      send();
      return () =>
        this.listener({
          ref,
          type: 'stop'
        });
    }

    return new Promise((yay, nay) => {
      this.subscriptions[ref] = listener((err, val) =>
        err ? nay(err) : yay(val)
      );
      send();
    });
  };

  // Listen to messages from webworker
  exec = (data: {
    type: IWorkerActionType;
    ref: string;
    value: any;
    error: any;
  }) => {
    if (this.subscriptions[data.ref]) {
      this.subscriptions[data.ref](data);
    }
    if (data.type === 'syncing' && this.options.onSyncing) {
      this.options.onSyncing(data.value);
    } else if (data.type === 'error' && this.options.onError) {
      this.options.onError(data.error);
    } else if (data.type === 'ready') {
      this.isReady = true;
      if (this.options.onReady) {
        this.options.onReady(this);
      }
    } else if (data.type === 'close') {
      this.isClosed = true;
      if (this.options.onClosed) {
        this.options.onClosed();
      }
    }
  };

  c = (name: string) => {
    return this.collection(name);
  };

  collection = (name: string): IWorkerDBCollection => {
    const { query } = this;
    const handler = {
      get(obj: any, propName: string) {
        return (dd: any, cb: IWorkerDBCallback) =>
          query(name, propName, dd, cb);
      }
    };
    return new Proxy({ method: true }, handler);
  };

  /*init = async (value: any) => {
    await this.query('', 'init', value);
    return this;
  };*/

  reset = async () => {
    await this.query('', 'reset', {});
    return this;
  };

  cancelTermination = false;
  terminated = false;
  // Close Database
  close = () => {
    this.cancelTermination = false;
    // Delay termination to allow cancelation while hot reloading
    return new Promise(yay => {
      setTimeout(async () => {
        if (!this.cancelTermination) {
          try {
            await this.query('', 'close', {});
          } catch (e) {}
          // this.worker.terminate();
          this.terminated = true;
          this.cancelTermination = false;
        }
        yay(this);
      }, 100);
    });
  };
}
