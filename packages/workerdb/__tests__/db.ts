import 'jest';
import { WorkerDB, workerMock } from '../src';

describe('index', () => {
  it('should be able to be included', async () => {
    const mock = workerMock([
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
    const worker = mock.toWorker();
    const db = await WorkerDB.create(worker, {
      adapter: 'memory'
    });
    await db.c('bird').insert({ name: 'Oscar' });
    await db.c('bird').insert({ name: 'Oscar2' });
    await db.c('bird').insert({ name: 'Filou' });
    await db.c('bird').insert({ name: 'Oscar' });
    await db.c('bird').find();
    await db.close();
    expect(mock.terminated).toBe(true);
  });
  it('should throw', async () => {
    const mock = workerMock([
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
    const worker = mock.toWorker();
    const db = await WorkerDB.create(worker, {
      adapter: 'memory'
    });
    let err = false;
    await db
      .c('birdo')
      .insert({ name: 'Oscar' })
      .catch(e => (err = true));
    expect(err).toBe(true);
    await db.close();
    expect(mock.terminated).toBe(true);
  });
});
