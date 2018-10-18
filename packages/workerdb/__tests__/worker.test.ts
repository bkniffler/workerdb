import 'jest';
import worker, { inner } from '../src/worker';

describe('index', () => {
  it('should be able to be included', () => {
    worker([
      {
        name: 'bird',
        schema: {
          version: 0,
          properties: {
            name: { type: 'string' }
          }
        }
      }
    ]);
  });
  it('should be able to start', async () => {
    const listener = await getWorker();
    await listener({ type: 'close' });
  });
  it('should be able to be query', async () => {
    let invocations = 0;
    let results: Array<any> = [];
    const listener = await getWorker((data: any) => {
      invocations += 1;
      results.push(data.value);
    });
    await listener({ type: 'find', collection: 'bird' });
    await listener({
      type: 'insert',
      value: { name: 'Filou' },
      collection: 'bird'
    });
    await listener({ type: 'find', collection: 'bird' });
    await listener({ type: 'close' });
    expect(invocations).toBe(3);
    expect(results[0]).toEqual([]);
    expect(results[1]).toBeTruthy();
    expect(results[1].name).toBe('Filou');
    expect(results[2]).toBeTruthy();
    expect(results[2][0]).toBeTruthy();
    expect(results[2][0].name).toBe('Filou');
  });
  it('should be able to live query', async () => {
    let invocations = 0;
    let results: Array<any> = [];
    const listener = await getWorker((data: any) => {
      invocations += 1;
      results.push(data.value);
    });
    await listener({ id: 1, type: 'find', live: true, collection: 'bird' });
    await listener({
      type: 'insert',
      value: { name: 'Filou' },
      collection: 'bird'
    });
    await listener({ id: 1, type: 'stop', live: true, collection: 'bird' });
    await listener({
      type: 'insert',
      value: { name: 'Filou' },
      collection: 'bird'
    });
    await listener({ type: 'close' });
    expect(invocations).toBe(4);
  });
  it('should be able to call custom', async () => {
    let invocations = 0;
    let results: Array<any> = [];
    const listener = await getWorker((data: any) => {
      invocations += 1;
      results.push(data.value);
    });
    await listener({
      id: 1,
      type: 'call:custom',
      collection: 'bird'
    });
    await listener({ type: 'close' });
    expect(invocations).toBe(1);
  });
  it('should be able to throw if method not found', async () => {
    let invocations = 0;
    let results: Array<any> = [];
    const listener = await getWorker((data: any) => {
      invocations += 1;
      results.push(data.value);
    });
    try {
      await listener({
        id: 1,
        type: 'call:custom2',
        live: true,
        collection: 'bird'
      });
    } catch (err) {
      expect(invocations).toBe(0);
    }
    await listener({ type: 'close' });
  });
});

const getWorker = (cb?: Function): Promise<Function> => {
  let resolved = false;
  return new Promise((yay, nay) => {
    const listener = inner(
      [
        {
          name: 'bird',
          schema: {
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
      data => {
        if (data.type === 'ready') {
          resolved = true;
          yay(listener);
        } else if (cb) {
          cb(data);
        }
      },
      (rx: any) => {
        rx.plugin(require('pouchdb-adapter-memory'));
        return rx;
      }
    );
    listener({
      type: 'init',
      value: {
        adapter: 'memory'
      }
    });
    setTimeout(() => {
      if (!resolved) {
        nay();
      }
    }, 1000);
  });
};
