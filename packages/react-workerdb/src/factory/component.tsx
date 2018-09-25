import * as React from 'react';
import { WorkerDB } from 'workerdb';
import Context from '../context';
import renderMethod, { RenderProps } from './render';

export interface RenderPropsWithCollection extends RenderProps<any> {
  collection: string;
  defaultValue?: any;
  live?: boolean;
}

export interface RenderPropsWithCollectionAndDB
  extends RenderPropsWithCollection {
  db?: WorkerDB;
}

export default (method: string): React.ReactNode => {
  const name = method.slice(0, 1).toUpperCase() + method.slice(1);

  class InnerComponent extends React.Component<RenderPropsWithCollectionAndDB> {
    displayName = `${name}Inner`;
    state: { loading: boolean; error: Error | null; value: any } = {
      loading: true,
      error: null,
      value: null
    };
    unlisten: Function;

    componentDidMount() {
      const {
        error,
        render,
        loading,
        children,
        collection,
        db,
        live,
        ...rest
      } = this.props;
      if (!db) {
        return;
      }
      if (live) {
        this.unlisten = db.c(collection)[method](rest, this.cb);
      } else {
        db.c(collection)
          [method](rest)
          .then((value: any) => this.cb(null, value))
          .catch((err: Error) => this.cb(err, null));
      }
    }

    componentWillUnmount() {
      if (this.unlisten) {
        this.unlisten();
      }
    }

    cb = (error: Error | null, value: any) => {
      if (error) {
        this.setState({ loading: false, error });
      } else {
        this.setState({ loading: false, value });
      }
    };

    render() {
      return renderMethod(this.props, {
        error: this.state.error,
        loading: this.state.loading,
        value: this.state.value || this.props.defaultValue
      });
    }
  }

  const OuterComponent: React.SFC<RenderPropsWithCollection> = props => (
    <Context.Consumer>
      {db => <InnerComponent {...props} db={db} />}
    </Context.Consumer>
  );
  OuterComponent.displayName = name;
  return OuterComponent;
};
