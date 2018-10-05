import * as React from 'react';
import { WorkerDBCollection } from 'workerdb';
import * as equal from 'fast-deep-equal';
import Collection from '../collection';
import renderMethod, { RenderProps } from './render';

export interface RenderPropsWithCollection extends RenderProps<any> {
  collection: string;
  defaultValue?: any;
  live?: boolean;
}

export interface RenderPropsWithCollectionAndDB
  extends RenderPropsWithCollection {
  col: WorkerDBCollection;
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
    unlisten?: Function;
    prevProps?: any;

    update(props: any) {
      const {
        error,
        render,
        loading,
        children,
        col,
        collection,
        live,
        ...rest
      } = props;
      if (!col) {
        return;
      } else if (this.prevProps && equal(this.prevProps, rest)) {
        return;
      } else if (this.prevProps) {
        this.removeListener();
      }
      // this.setState({ loading: true });
      this.prevProps = rest;
      if (live) {
        this.unlisten = col[method](rest, this.cb);
      } else {
        col[method](rest)
          .then((value: any) => this.cb(null, value))
          .catch((err: Error) => this.cb(err, null));
      }
    }

    removeListener() {
      if (this.unlisten) {
        this.unlisten();
      }
      this.unlisten = undefined;
    }

    componentDidMount() {
      this.update(this.props);
    }

    componentDidUpdate() {
      this.update(this.props);
    }

    componentWillUnmount() {
      this.removeListener();
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
        value: this.state.value || this.props.defaultValue,
        value2: this.props.col
      });
    }
  }

  const OuterComponent: React.SFC<RenderPropsWithCollection> = props => (
    <Collection
      name={props.collection}
      render={col => <InnerComponent {...props} col={col} />}
    />
  );
  OuterComponent.displayName = name;
  return OuterComponent;
};
