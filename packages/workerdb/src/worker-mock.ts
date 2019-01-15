import { inner, RxCollectionCreatorWithSync } from './worker';
import { WorkerDBOptions } from './db';

export type IListener = (data: any) => void;
export interface IWorkerMockResponse {
  terminated: boolean;
  send: Function;
  listen: Function;
  init: Function;
  close: Function;
  toWorker: () => Worker;
}
export interface IWorkerMockOptions extends WorkerDBOptions {
  plugins?: Function;
  init?: Function;
}
export default (
  collections: Array<RxCollectionCreatorWithSync>,
  options: IWorkerMockOptions = {}
): IWorkerMockResponse => {
  let { plugins, init, ...rest } = options;
  if (!plugins) {
    plugins = (rx: any) => {
      rx.plugin(require('pouchdb-adapter-memory'));
      return rx;
    };
  }
  if (!rest.adapter) {
    rest.adapter = 'memory';
  }
  let listener: IListener;
  let startListener: any;
  // let terminate = false;
  const send = inner(
    collections,
    (data: any) => {
      if (data.type === 'ready' && startListener) {
        startListener();
      } else if (data.type === 'error' && startListener) {
        startListener(data.error);
      } else if (listener) {
        listener(data);
      }
    },
    { plugins: plugins, init }
  );
  const worker = {
    terminated: false,
    send,
    listen: (newListener: IListener) => (listener = newListener),
    init: () =>
      new Promise(async (yay, nay) => {
        let resolved = false;
        startListener = (err: any) => {
          resolved = true;
          startListener = undefined;
          if (err) {
            nay(err);
          } else {
            yay(worker);
          }
        };
        try {
          await send({
            type: 'init',
            value: rest
          });
          setTimeout(() => {
            if (!resolved) {
              nay(new Error('Could not create worker'));
            }
          }, 1000);
        } catch (err) {
          nay(err);
        }
      }),
    close: () =>
      send({
        type: 'close'
      }),
    toWorker: () => {
      worker.listen((data: any) => {
        webworker.onmessage({ data });
      });
      const webworker = {
        // postMessage: (data: any) => worker['onme' + 'ssage']({ data }),
        onmessage: (data: any) => data,
        onerror: (err: any) => err,
        postMessage: (data: any) => {
          worker.send(data);
        },
        terminate: () => {
          worker.terminated = true;
        }
      };
      return webworker as any;
    }
  };
  return worker;
};
