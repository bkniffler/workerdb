import 'jest';
import * as wait from 'wait-for-expect';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { Find, WorkerDB, Call } from '../src';
import mock from '../../workerdb/src/worker-mock';

describe('index', () => {
  it('should be able to be included', () => {
    require('../src/index');
  });

  it('should work', async () => {
    interface XType {
      _id: string;
      name: string;
    }

    const COLLECTION = { BIRD: 'bird' };
    const FindBird = Find.ofType<XType, Array<string>>();
    const CallBird = Call.ofType<XType, string>();

    let ready: any = false;
    let error: any = null;
    const worker = await mock(collections(), {
      init: async (db: any) => {
        await db.bird.insert({ name: 'Oscar' });
        await db.bird.insert({ name: 'Oscar1' });
        await db.bird.insert({ name: 'Filou' });
        await db.bird.insert({ name: 'Oscar2' });
      }
    }).toWorker();
    const component = renderer.create(
      <WorkerDB
        worker={() => worker}
        onReady={() => (ready = true)}
        onError={(err: Error) => (error = err)}
        adapter="memory"
      >
        <div>
          <FindBird
            collection={COLLECTION.BIRD}
            transform={data => data.map(({ name }) => name)}
            sort="name"
            render={data => (
              <React.Fragment>
                {data.map(x => (
                  <span key={x}>{x}</span>
                ))}
              </React.Fragment>
            )}
          />
          <CallBird
            collection={COLLECTION.BIRD}
            method="custom"
            render={data => <React.Fragment>{data}</React.Fragment>}
          />
        </div>
      </WorkerDB>
    );

    await (wait as any)(() => {
      expect(ready).toEqual(true);
      expect(error).toEqual(null);
    });
    expect(ready).toEqual(true);
    expect(error).toEqual(null);
    await new Promise(yay => setTimeout(yay, 3000));
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});

const collections = () => [
  {
    name: 'bird',
    schema: {
      type: 'object',
      version: 0,
      properties: {
        name: {
          type: 'string',
          index: true
        }
      }
    },
    methods: {
      custom: (col: any, value: any) =>
        col
          .findOne({ name: 'Filou' })
          .exec()
          .then((x: any) => x.name)
    }
  }
];
