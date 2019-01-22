import 'jest';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { WorkerDB, useFind } from '../src';
import { createLocal, WorkerDBServerRX, WorkerDBClientRX } from 'workerdb';

/*
// Worker.js
createWorkerServer(worker);

// Server.js
const worker = new Worker();
const client = createWorkerClient(new WorkerDBClientRX(), worker);
*/

describe('index', () => {
  it('should be able to be included', () => {
    require('../src/index');
  });
  it('should work', async () => {
    const COLLECTION = { BIRD: 'bird' };

    let ready: any = false;
    let error: any = null;
    const server = new WorkerDBServerRX(collections(), {
      adapter: 'memory',
      name: 'test0',
      init: async (db: any) => {
        await db.bird.insert({ name: 'Oscar' });
        await db.bird.insert({ name: 'Oscar1' });
        await db.bird.insert({ name: 'Filou' });
        await db.bird.insert({ name: 'Oscar2' });
      }
    } as any);
    function Find() {
      const [data, err, loading] = useFind(
        COLLECTION.BIRD,
        { sort: 'name' },
        data => data.map(({ name }) => name)
      );
      if (loading || err) {
        return null;
      }
      return (
        <React.Fragment>
          {data.map(x => (
            <span key={x}>{x}</span>
          ))}
        </React.Fragment>
      );
    }
    const component = renderer.create(
      <WorkerDB
        worker={() => createLocal(new WorkerDBClientRX(), server)}
        onReady={() => (ready = true)}
        onError={(err: Error) => (error = err)}
      >
        <div>
          <Find />
          {/*<CallBird
            collection={COLLECTION.BIRD}
            method="custom"
            render={data => <React.Fragment>{data}</React.Fragment>}
          />*/}
        </div>
      </WorkerDB>
    );

    await new Promise(yay => setTimeout(yay, 1000));
    expect(ready).toEqual(true);
    expect(error).toEqual(null);
    await new Promise(yay => setTimeout(yay, 1000));
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    server.close();
  });
  it('should work multi', async () => {
    const COLLECTION = { BIRD: 'bird' };

    let ready: any = false;
    let error: any = null;
    const server = new WorkerDBServerRX(collections(), {
      adapter: 'memory',
      name: 'test1',
      init: async (db: any) => {
        await db.bird.insert({ name: 'Oscar' });
        await db.bird.insert({ name: 'Oscar1' });
        await db.bird.insert({ name: 'Filou' });
        await db.bird.insert({ name: 'Oscar2' });
        return db;
      }
    } as any);
    const client = createLocal(new WorkerDBClientRX(), server);
    await client.init();

    function Find() {
      const [data, err, loading] = useFind(
        COLLECTION.BIRD,
        { sort: 'name' },
        data => data.map(({ name }) => name)
      );
      if (loading || err) {
        return null;
      }
      return (
        <React.Fragment>
          {data.map(x => (
            <span key={x}>{x}</span>
          ))}
        </React.Fragment>
      );
    }
    const component = renderer.create(
      <WorkerDB
        worker={() => createLocal(new WorkerDBClientRX(), server)}
        onReady={() => (ready = true)}
        onError={(err: Error) => (error = err)}
      >
        <div>
          <Find />
          {/*<CallBird
            collection={COLLECTION.BIRD}
            method="custom"
            render={data => <React.Fragment>{data}</React.Fragment>}
          />*/}
        </div>
      </WorkerDB>
    );

    await new Promise(yay => setTimeout(yay, 1000));
    expect(ready).toEqual(true);
    expect(error).toEqual(null);
    await new Promise(yay => setTimeout(yay, 1000));
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    server.close();
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
