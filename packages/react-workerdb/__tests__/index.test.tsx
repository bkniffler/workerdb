import * as React from 'react';
import 'jest';
import { Find, FindOne } from '../src';

describe('index', () => {
  it('should be able to be included', () => {
    require('../src/index');
  });

  it('should work', () => {
    interface XType {
      type: string;
    }
    interface YType {
      type2: string;
    }

    const COLLECTION = { X: 'x' };
    const FindX = Find.ofType<XType, Array<YType>>();
    const FindOneX = FindOne.ofType<XType, YType>();

    const node = (
      <div>
        <FindX
          collection={COLLECTION.X}
          transform={x => {
            return x.map(y => ({ type2: y.type }));
          }}
          render={data => data.map(x => x)}
        />
        <FindOneX
          collection={COLLECTION.X}
          transform={x => {
            return { type2: x.type };
          }}
          render={data => data}
        />
      </div>
    );
    expect(node).toBeTruthy();
  });
});
