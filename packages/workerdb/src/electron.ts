import { WorkerDBServerCore } from './core';

export function createElectronServer(
  server: WorkerDBServerCore,
  ipcMain: any,
  window: any
) {
  server.addListener((data: any) => window.webContents.send('workerdb', data));
  ipcMain.on('workerdb', (event: any, data: any) => {
    server.exec(data);
  });
  return server;
}

export function createElectronClient(
  client: WorkerDBServerCore,
  ipcRenderer: any
) {
  client.addListener((data: any) => ipcRenderer.send('workerdb', data));
  ipcRenderer.on('workerdb', (event: any, data: any) => {
    client.exec(data);
  });
  return client;
}
