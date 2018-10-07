import * as React from 'react';
import { WorkerDBCollection } from 'workerdb';
import * as equal from 'fast-deep-equal';
import renderMethod, { RenderProps } from './render';

export interface RenderPropsWithCollection<T> extends RenderProps<T> {
  defaultValue?: any;
  live?: boolean;
}

export interface RenderPropsWithCollectionAndDB<T>
  extends RenderPropsWithCollection<T> {
  method: string;
  transform?: (original: T) => any;
  collection: WorkerDBCollection;
}

// const name = method.slice(0, 1).toUpperCase() + method.slice(1);

class WorkerDBFactoryComponent<T> extends React.Component<
  RenderPropsWithCollectionAndDB<T>
> {
  state: { loading: boolean; error: Error | null; value: any } = {
    loading: true,
    error: null,
    value: null
  };
  unlisten?: Function;
  prevProps?: any;
  method: '';

  update(props: RenderPropsWithCollectionAndDB<T>) {
    const {
      error,
      render,
      loading,
      children,
      collection,
      transform,
      live,
      ...rest
    } = props;
    if (!collection) {
      return;
    } else if (this.prevProps && equal(this.prevProps, rest)) {
      return;
    } else if (this.prevProps) {
      this.removeListener();
    } else if (!this.method) {
      throw new Error('this.method needs to be set (find, findOne, ...)');
    }

    // this.setState({ loading: true });
    this.prevProps = rest;
    if (live) {
      this.unlisten = collection[this.method](rest, this.cb);
    } else {
      collection[this.method](rest)
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
      return this.setState({ loading: false, error });
    }
    if (this.props.transform) {
      return this.props.transform(value);
    }
    this.setState({ loading: false, value });
  };

  render() {
    return renderMethod(this.props, {
      error: this.state.error,
      loading: this.state.loading,
      value: this.state.value || this.props.defaultValue,
      value2: this.props.collection
    });
  }
}

export default WorkerDBFactoryComponent;
