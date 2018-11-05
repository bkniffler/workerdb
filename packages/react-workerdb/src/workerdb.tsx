import * as React from 'react';
import { WorkerDB, WorkerDBWorker } from 'workerdb';
import Context from './context';
import SyncContext from './sync/context';
import render, { RenderProps } from './factory/render';

interface WorkerDBCreateWorker {
  (): WorkerDBWorker;
}

interface ReactWorkerDBProps extends RenderProps<WorkerDB> {
  worker: WorkerDBCreateWorker;
  name?: string;
  adapter?: string;
  authorization?: string;
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
  key: Number;

  init = async (props: ReactWorkerDBProps, reInit = false) => {
    const { onReady, worker, name = 'db', adapter, authorization } = props;

    if (worker['db'] && !reInit && !worker['db'].terminated) {
      worker['db'].cancelTermination = true;
      const db = worker['db'];
      db.onError = this.onSyncing;
      db.onSyncing = this.onError;
      this.setState({ db });
    } else {
      const db = await WorkerDB.create(
        typeof worker === 'function' ? worker() : worker,
        {
          name,
          adapter,
          authorization,
          onSyncing: this.onSyncing,
          onError: this.onError
        }
      );
      worker['db'] = db;

      this.setState({ db });
      if (onReady) {
        onReady(db);
      }
    }
  };

  async componentDidMount() {
    this.init(this.props);
  }

  onSyncing = (syncing: boolean) => this.setState({ syncing });
  onError = (error: Error) => {
    if (this.props.onError) {
      this.props.onError(error);
    }
    this.setState({ error });
  };

  componentWillReceiveProps(newProps: ReactWorkerDBProps) {
    if (newProps.authorization !== this.props.authorization) {
      this.init(newProps, true);
    }
  }

  componentWillUnmount() {
    if (this.state.db) {
      this.state.db.close();
    }
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
