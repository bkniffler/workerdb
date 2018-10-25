import 'jest';
import worker, { inner } from '../src/worker';

describe('index', () => {
  it('should be able to be included', () => {
    worker([
      {
        name: 'bird',
        schema: {
          type: 'object',
          version: 0,
          properties: {
            name: { type: 'string', index: true }
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
      if (data.error) {
        throw data.error;
      }
      results.push(data.value);
    });
    await listener({ type: 'find', collection: 'bird' });
    await listener({
      type: 'insert',
      value: { name: 'Filou' },
      collection: 'bird'
    });
    await listener({
      type: 'insert',
      value: { name: 'Filou4' },
      collection: 'bird'
    });
    await listener({
      type: 'insert',
      value: { name: 'Filou3' },
      collection: 'bird'
    });
    await listener({
      type: 'insert',
      value: { name: 'Filou1' },
      collection: 'bird'
    });
    await listener({ type: 'find', collection: 'bird', value: { sort: 'name' } });
    await listener({ type: 'close' });
    expect(invocations).toBe(6);
    expect(results[0]).toEqual([]);
    expect(results[1]).toBeTruthy();
    expect(results[1].name).toBe('Filou');
    expect(results[2]).toBeTruthy();
    expect(results[2].name).toBe('Filou4');
    expect(results[3]).toBeTruthy();
    expect(results[3].name).toBe('Filou3');
    expect(results[4]).toBeTruthy();
    expect(results[4].name).toBe('Filou1');
    expect(results[5]).toBeTruthy();
    expect(results[5].length).toBe(4);
    expect(results[5][0].name).toBe('Filou');
    expect(results[5][1].name).toBe('Filou1');
    expect(results[5][2].name).toBe('Filou3');
    expect(results[5][3].name).toBe('Filou4');
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
      type: 'custom',
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
        type: 'custom2',
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
            type: 'object',
            version: 0,
            properties: {
              name: { type: 'string', index: true }
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
