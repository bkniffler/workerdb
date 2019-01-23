import { WorkerDBServerCore } from './core';

export function createSocketIOClient(
  client: WorkerDBServerCore,
  socketIOClient: any
) {
  // const socket = ioClient(url);
  const listener = (data: any) => socketIOClient.emit('workerdb', data);
  client.addListener(listener);
  socketIOClient.on('workerdb', (data: any) => {
    client.exec(data);
  });
  socketIOClient.on('disconnect', () => {
    client.removeListener(listener);
  });
  return client;
}

export function createSocketIOServer(
  server: WorkerDBServerCore,
  socketIOServer: any
) {
  // const io = require('socket.io')();
  socketIOServer.on('connection', (socket: any) => {
    const listener = (data: any) => socket.emit('workerdb', data);
    server.addListener(listener);
    socket.on('workerdb', (data: any) => {
      server.exec(data);
    });
    socket.on('disconnect', () => {
      server.removeListener(listener);
    });
  });
  // io.listen(port);
  return server;
}
