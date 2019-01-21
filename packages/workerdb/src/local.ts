import { WorkerDBServerCore } from './core';

export function createLocal<
  T extends WorkerDBServerCore,
  T2 extends WorkerDBServerCore
>(client: T, server: T2): T {
  client.addListener(server.exec);
  server.addListener(client.exec);
  return client;
}
