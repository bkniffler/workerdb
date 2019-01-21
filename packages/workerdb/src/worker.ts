import { WorkerDBServerCore } from './core';

declare var self: Worker;
export function createWorker(
  server: WorkerDBServerCore,
  webworker: Worker = self
) {
  const listener = (body: any) => webworker.postMessage(body);
  server.addListener(listener);
  webworker.onmessage = event => server.exec(event.data);
  webworker.onerror = event => {
    console.error(event);
  };
  return server;
}
