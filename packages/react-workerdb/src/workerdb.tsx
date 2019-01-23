import * as React from 'react';
import { WorkerDBClientRX } from 'workerdb';
import Context from './context';
import SyncContext from './sync/context';
import render, { RenderProps } from './factory/render';

interface ReactWorkerDBProps extends RenderProps<WorkerDBClientRX> {
  worker: () => WorkerDBClientRX;
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
    ready: boolean;
    closed: boolean;
  } = {
    closed: false,
    ready: false,
    db: null,
    syncing: false,
    error: null
  };
  db: WorkerDBClientRX;
  key: Number;

  init = async (props: ReactWorkerDBProps, reInit = false) => {
    // const { onReady, worker, name = 'db', adapter, authorization } = props;
    const { worker } = props;
    const db = worker();
    db.options.onError = this.onError as any;
    // db.options.onReady = this.onReady as any;
    this.setState({ db: await db.init() });
    if (this.props.onReady) {
      this.props.onReady(db);
    }
    // this.setState({ db });
    if (db) {
      /*worker['db'].cancelTermination = true;
      const db = worker.db;
      db.onError = this.onSyncing;
      db.onSyncing = this.onError;*/
    } /*else {
      const db = await WorkerDBClientRX.create(
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
    }*/
  };

  async componentDidMount() {
    this.init(this.props);
  }

  onSyncing = (syncing: boolean) => this.setState({ syncing });

  onError = (error: Error) => {
    console.error('Error in workerdb', error);
    if (this.props.onError) {
      this.props.onError(error);
    }
    // this.setState({ error });
  };

  /*componentWillReceiveProps(newProps: ReactWorkerDBProps) {
    if (newProps.authorization !== this.props.authorization) {
      this.init(newProps, true);
    }
  }*/

  componentWillUnmount() {
    if (this.state.db) {
      // this.state.db.close();
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
