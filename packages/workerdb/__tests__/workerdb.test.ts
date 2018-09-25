import 'jest';
import WorkerDB from '../src/workerdb';

describe('index', () => {
  it('should be able to be included', async () => {
    let terminated = false;
    const worker = {
      postMessage: (data: any) => worker['onme' + 'ssage']({ data }),
      terminate: () => (terminated = true)
    };
    const db = await WorkerDB.create(worker);
    await db.c('birdie').find();
    db.close();
    expect(terminated).toBe(true);
  });
});
