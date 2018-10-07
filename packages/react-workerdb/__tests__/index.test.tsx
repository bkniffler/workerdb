import 'jest';
import * as wait from 'wait-for-expect';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { Find, WorkerDB } from '../src';
import { inner } from '../../workerdb/src/worker';

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

    let listener: any;
    listener = await getWorker(data => worker.onmessage({ data }));
    let ready = true;
    let error: any = null;
    let terminated = false;
    const worker = {
      // postMessage: (data: any) => worker['onme' + 'ssage']({ data }),
      onmessage: (data: any) => data,
      postMessage: (data: any) => {
        listener(data);
      },
      terminate: () => (terminated = true)
    };
    const component = renderer.create(
      <WorkerDB
        worker={worker}
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

const getWorker = (cb: (data: any) => void): Function => {
  return inner(
    [
      {
        name: 'bird',
        schema: {
          type: 'object',
          version: 0,
          properties: {
            name: { type: 'string' }
          }
        },
        methods: {
          custom: (col: any, value: any) => col.find(value)
        }
      }
    ],
    cb,
    (rx: any) => {
      rx.plugin(require('pouchdb-adapter-memory'));
      return rx;
    },
    async (db: any) => {
      await db.bird.insert({ name: 'Oscar' });
      await db.bird.insert({ name: 'Filou' });
    }
  );
};
