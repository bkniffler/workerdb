import 'jest';
import { WorkerDBServerRX } from '../src';

describe('index', () => {
  it('should be able to start', async () => {
    const worker = await new WorkerDBServerRX(collections(), {
      adapter: 'memory'
    } as any);
    await worker.close();
  });
  it('should be able to be query', async () => {
    let invocations = 0;
    let results: Array<any> = [];
    const worker = new WorkerDBServerRX(collections(), {
      adapter: 'memory'
    } as any);
    await worker.db;
    worker.addListener((data: any) => {
      invocations += 1;
      if (data.error) {
        throw data.error;
      }
      results.push(data.value);
    });
    await worker.exec({ type: 'find', collection: 'bird' });
    await worker.exec({
      type: 'insert',
      value: { name: 'Filou' },
      collection: 'bird'
    });
    await worker.exec({
      type: 'insert',
      value: { name: 'Filou4' },
      collection: 'bird'
    });
    await worker.exec({
      type: 'insert',
      value: { name: 'Filou3' },
      collection: 'bird'
    });
    await worker.exec({
      type: 'insert',
      value: { name: 'Filou1' },
      collection: 'bird'
    });
    await worker.exec({
      type: 'find',
      collection: 'bird',
      value: { sort: 'name' }
    });
    await worker.close();
    expect(invocations).toBe(7);
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
    const worker = new WorkerDBServerRX(collections(), {
      adapter: 'memory'
    } as any);
    await worker.db;
    worker.addListener((data: any) => {
      invocations += 1;
      results.push(data.value);
    });
    await worker.exec({ id: 1, type: 'find', live: true, collection: 'bird' });
    await worker.exec({
      type: 'insert',
      value: { name: 'Filou' },
      collection: 'bird'
    });
    await worker.exec({ id: 1, type: 'stop', live: true, collection: 'bird' });
    await worker.exec({
      type: 'insert',
      value: { name: 'Filou' },
      collection: 'bird'
    });
    await worker.close();
    expect(invocations).toBe(4);
  });
  it('should be able to call custom', async () => {
    let invocations = 0;
    let results: Array<any> = [];
    const worker = await new WorkerDBServerRX(collections(), {
      adapter: 'memory'
    } as any);
    await worker.db;
    worker.addListener((data: any) => {
      invocations += 1;
      results.push(data.value);
    });
    await worker.exec({
      id: 1,
      type: 'custom',
      collection: 'bird'
    });
    await worker.close();
    expect(invocations).toBe(2);
  });
  it('should be able to throw if method not found', async () => {
    let invocations = 0;
    let results: Array<any> = [];
    const worker = await new WorkerDBServerRX(collections(), {
      adapter: 'memory'
    } as any);
    await worker.db;
    worker.addListener((data: any) => {
      invocations += 1;
      results.push(data.value);
    });
    try {
      await worker.exec({
        id: 1,
        type: 'custom2',
        live: true,
        collection: 'bird'
      });
    } catch (err) {
      expect(invocations).toBe(0);
    }
    await worker.close();
  });
});

const collections = () => [
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
];
