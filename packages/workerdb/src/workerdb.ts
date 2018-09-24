const methods = ['findOne', 'find', 'insert'];

export interface WorkerDBWorker {
  onmessage: any | null;
  postMessage: (data: any) => void;
  terminate: Function;
}

export interface WorkerDBListener {
  (channel: string, value: any): any;
}

export interface WorkerDBCallback {
  (error: Error | null, value?: any): any;
}

export type WorkerDBProxy<T> = {
  get(): T;
  set(value: T): void;
};

export default class WorkerDB {
  worker: WorkerDBWorker;
  listener: WorkerDBListener;
  proxy: WorkerDBProxy<any>;

  constructor(worker: WorkerDBWorker, listener: WorkerDBListener) {
    this.worker = worker;
    this.worker.onmessage = this.onMessage;
    this.listener = listener;
  }

  listeners = {};

  id = 0;

  // Send a query to database, either callbase (watch) or promise (once)
  query = (
    collection: string,
    type: string,
    value: any,
    cb: null | WorkerDBCallback
  ) => {
    const { id } = this;
    this.id += 1;

    const listener = (callback: WorkerDBCallback) => (data: any) => {
      if (data && data.live === false) {
        delete this.listeners[data.id];
      }
      if (data && data.error) {
        return callback(data.error);
      }
      return callback(null, data);
    };

    const send = () =>
      this.send({
        id,
        collection,
        type,
        live: !!cb,
        value
      });

    if (cb) {
      this.listeners[id] = listener(cb);
      send();
      return () =>
        this.send({
          id,
          method: 'stop'
        });
    }

    return new Promise((yay, nay) => {
      this.listeners[id] = listener((err, val) => (err ? nay(err) : yay(val)));
      send();
    });
  };

  // Listen to messages from webworker
  onMessage = (event: MessageEvent) => {
    const { data } = event;
    if (data.type === 'ready') {
      const { query } = this;
      const collectionMethod = (name: string) => {
        const handler = {
          get(obj: any, propName: string) {
            if (methods.indexOf(propName) === -1) {
              throw new Error(`${propName} is not supported`);
              // return undefined;
            }
            return (dd: any, cb: WorkerDBCallback) =>
              query(name, propName, dd, cb);
          }
        };
        return new Proxy({ method: true }, handler);
      };
      const collection = new Proxy(
        { collection: true },
        {
          get(obj: any, propName: string) {
            return collectionMethod(propName);
          }
        }
      );
      this.proxy = collection;
      this.listener('ready', this.proxy);
    } else if (data.type === 'syncing') {
      this.listener('syncing', data.value);
    } else if (data.type === 'error') {
      this.listener('error', data.value);
    } else if (methods.indexOf(data.type) && this.listeners[data.id]) {
      this.listeners[data.id](data.value);
    }
  };

  init(value: any) {
    this.send({ type: 'init', value });
  }

  // Send message to webworker
  send = (data: any) => {
    this.worker.postMessage(data);
  };

  getProxy = () => this.proxy;

  // Close Database
  close = () => {
    this.worker.terminate();
  };
}
