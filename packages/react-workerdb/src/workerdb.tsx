import * as React from 'react';
import { WorkerDB, WorkerDBWorker } from 'workerdb';
import Context from './context';
import SyncContext from './sync/context';
import render, { RenderProps } from './factory/render';

interface WorkerDBCreateWorker {
  (): WorkerDBWorker;
}

interface ReactWorkerDBProps extends RenderProps<WorkerDB> {
  worker: WorkerDBCreateWorker | WorkerDBWorker;
  name?: string;
  onReady?: Function;
  onError?: Function;
}

export default class ReactWorkerDB extends React.Component<ReactWorkerDBProps> {
  state: {
    db: any;
    syncing: boolean;
    error: Error | null;
  } = {
    db: null,
    syncing: false,
    error: null
  };
  db: WorkerDB;

  async componentDidMount() {
    const { onReady, onError, worker, name = 'db' } = this.props;

    const db = await WorkerDB.create(
      typeof worker === 'function' ? worker() : worker,
      {
        name,
        onSyncing: (syncing: boolean) => this.setState({ syncing }),
        onError: (error: Error) => {
          if (onError) {
            onError(error);
          }
          this.setState({ error });
        }
      }
    );

    this.setState({ db });
    if (onReady) {
      onReady(db);
    }
  }

  componentWillUnmount() {
    this.state.db.close();
  }

  render() {
    return (
      <Context.Provider value={this.state.db}>
        <SyncContext.Provider value={this.state.syncing}>
          {render(this.props, {
            loading: !this.state.db,
            error: this.state.error,
            value: this.state.db
          })}
        </SyncContext.Provider>
      </Context.Provider>
    );
  }
}
