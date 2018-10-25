import * as React from 'react';
import Collection from '../collection';
import FactoryComponent, {
  RenderPropsWithCollection
} from '../factory/component';

export interface CallProps<T, TResult>
  extends RenderPropsWithCollection<TResult> {
  method: string;
  transform?: (orginal: T) => TResult;
  // map?: (orginal: T) => TMap;
  collection: string;
}

class Call<T, TResult> extends React.Component<CallProps<T, TResult>> {
  static ofType<T, TResult = T>() {
    return Call as new (props: CallProps<T, TResult>) => Call<T, TResult>;
  }
  transform = (value: any) => {
    const { transform } = this.props;
    if (transform) {
      return transform(value);
    }
    return value;
  };
  render() {
    const { transform, collection, method, ...props } = this.props;
    return (
      <Collection
        name={collection}
        render={col => (
          <FactoryComponent
            {...props}
            transform={this.transform}
            method={method}
            collection={col}
          />
        )}
      />
    );
  }
}

export default Call;
