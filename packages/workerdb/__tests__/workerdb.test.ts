import 'jest';
import WorkerDB from '../src/workerdb';

describe('index', () => {
  it('should be able to be included', async () => {
    let terminated = false;
    const worker = {
      onerror: null,
      onmessage: null,
      postMessage: (data: any) => worker['onme' + 'ssage']({ data }),
      terminate: () => (terminated = true)
    };
    const db = await WorkerDB.create(worker);
    await db.c('birdie').insert({ name: 'Oscar' });
    await db.c('birdie').insert({ name: 'Oscar2' });
    await db.c('birdie').insert({ name: 'Filou' });
    await db.c('birdie').insert({ name: 'Oscar' });
    await db.c('birdie').find();
    db.close();
    expect(terminated).toBe(true);
  });
});
