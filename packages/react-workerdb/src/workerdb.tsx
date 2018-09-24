import * as React from 'react';
import { WorkerDB, WorkerDBWorker, WorkerDBProxy } from 'workerdb';
import Context from './context';
import SyncContext from './sync/context';
import render, { RenderProps } from './factory/render';

interface WorkerDBCreateWorker {
  (): WorkerDBWorker;
}

interface ReactWorkerDBProps extends RenderProps {
  worker: WorkerDBCreateWorker | WorkerDBWorker;
  name?: string;
  onReady?: Function;
  onError?: Function;
}

export default class ReactWorkerDB extends React.Component<ReactWorkerDBProps> {
  state: {
    ready: boolean;
    syncing: boolean;
    proxy: WorkerDBProxy<any> | null;
    error: Error | null;
  } = {
    ready: false,
    syncing: false,
    proxy: null,
    error: null
  };
  db: WorkerDB;

  componentDidMount() {
    const { worker, name = 'db' } = this.props;
    const db = new WorkerDB(
      typeof worker === 'function' ? worker() : worker,
      this.listener
    );
    db.init({ name });
    this.db = db;
  }

  componentWillUnmount() {
    this.db.close();
  }

  listener = (name: string, value: any) => {
    const { onReady, onError } = this.props;
    if (name === 'ready') {
      if (onReady) {
        onReady(value);
      }
      this.setState({ proxy: value, ready: true });
    } else if (name === 'syncing') {
      this.setState({ syncing: value });
    } else if (name === 'error') {
      if (onError) {
        onError(value);
      }
      this.setState({ error: value });
    }
  };

  render() {
    return (
      <Context.Provider value={this.state.proxy}>
        <SyncContext.Provider value={this.state.syncing}>
          {render(this.props, {
            loading: !this.state.ready,
            error: this.state.error,
            value: this.state.proxy
          })}
        </SyncContext.Provider>
      </Context.Provider>
    );
  }
}
