export interface WorkerMessageBody {
  id?: string;
  type: string;
  value?: any;
  error?: Error | string;
}

export type WorkerListener = (body: WorkerMessageBody) => void;

export abstract class WorkerDBServerCore {
  listeners: WorkerListener[] = [];

  constructor() {}

  addListener(listener: WorkerListener) {
    this.listeners.push(listener);
    return () => this.removeListener(listener);
  }

  removeListener(listener: WorkerListener) {
    this.listeners.filter(x => x !== listener);
  }

  clearListeners() {
    this.listeners = [];
  }

  listener(data: any) {
    this.listeners.forEach(element => {
      element(data);
    });
  }

  abstract exec(data: any): any;
}
