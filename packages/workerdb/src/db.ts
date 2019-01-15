export interface WorkerDBWorker {
  onerror: ((this: any, ev: any) => any) | null;
  onmessage: ((this: any, ev: any) => any) | null;
  postMessage: (data: any) => void;
  terminate: Function;
}

export interface WorkerDBMock {
  send: (data: any) => void;
  listen: ((data: any) => void);
}

export interface WorkerDBSyncing {
  (value: boolean): void;
}

export interface WorkerDBError {
  (value: Error): void;
}

export interface WorkerDBOptions {
  name?: string;
  adapter?: string;
  onError?: WorkerDBError;
  onSyncing?: WorkerDBSyncing;
  authorization?: string;
}

export interface WorkerDBCollection<T = any> {
  findOne: (value?: any) => T;
  find: (value?: any) => [T];
  remove: (id: string) => void;
  insert: (value: T) => Promise<T>;
  upsert: (value: T) => Promise<T>;
}

export interface WorkerDBCallback {
  (error: Error | null, value?: any): any;
}

class WorkerDB {
  worker: WorkerDBWorker;
  onError?: WorkerDBError;
  onSyncing?: WorkerDBSyncing;

  static create = (
    worker: WorkerDBWorker,
    options: WorkerDBOptions = {}
  ): Promise<WorkerDB> => {
    const { name, adapter, onError, onSyncing, authorization } = options;
    const db = new WorkerDB(worker);
    db.onError = onError;
    db.onSyncing = onSyncing;
    return db.init({ name, adapter, authorization });
  };

  constructor(worker: WorkerDBWorker) {
    this.worker = worker;
    this.worker.onmessage = this.onMessage;
    this.worker.onerror = this.onErr;
  }

  listeners = {};

  id = 0;
  terminateIn5: Number;

  // Send a query to database, either callbase (watch) or promise (once)
  query = (
    collection: string | null,
    type: string,
    value: any,
    cb?: WorkerDBCallback
  ): Promise<any> | Function => {
    const { id } = this;
    this.id += 1;

    const listener = (callback: WorkerDBCallback) => (data: any) => {
      if (data && data.live === false) {
        delete this.listeners[data.id];
      }
      if (data && data.error) {
        return callback(data.error);
      }
      return callback(null, data.value);
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
          type: 'stop'
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
    if (this.listeners[data.id]) {
      this.listeners[data.id](data);
    }
    if (data.type === 'syncing' && this.onSyncing) {
      this.onSyncing(data.value);
    } else if (data.type === 'error' && this.onError) {
      this.onError(data.value);
    }
  };

  // Listen to messages from webworker
  onErr = (event: any) => {
    this.onErr(event);
  };

  c = (name: string): WorkerDBCollection => this.collection(name);
  collection = (name: string): WorkerDBCollection => {
    const { query } = this;
    const handler = {
      get(obj: any, propName: string) {
        return (dd: any, cb: WorkerDBCallback) => query(name, propName, dd, cb);
      }
    };
    return new Proxy({ method: true }, handler);
  };

  init = async (value: any): Promise<WorkerDB> => {
    await this.query('', 'init', value);
    return this;
  };

  reset = async (): Promise<WorkerDB> => {
    await this.query('', 'reset', {});
    return this;
  };

  // Send message to webworker
  send = (data: any) => {
    this.worker.postMessage(data);
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
          this.worker.terminate();
          this.terminated = true;
          this.cancelTermination = false;
        }
        yay(this);
      }, 100);
    });
  };
}

export default WorkerDB;
