import 'jest';
import { WorkerDBServerRX, WorkerDBClientRX, createLocal } from '../src';

describe('index', () => {
  it('should be able to be included', async () => {
    const server = new WorkerDBServerRX(
      [
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
      ],
      {
        adapter: 'memory'
      } as any
    );
    const client = createLocal(new WorkerDBClientRX(), server);
    await client.c('bird').insert({ name: 'Oscar' });
    await client.c('bird').insert({ name: 'Oscar2' });
    await client.c('bird').insert({ name: 'Filou' });
    await client.c('bird').insert({ name: 'Oscar' });
    await client.c('bird').find();
    await client.close();
    expect(client.terminated).toBe(true);
  });
  it('should throw', async () => {
    const server = new WorkerDBServerRX(
      [
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
      ],
      {
        adapter: 'memory'
      } as any
    );
    const db = createLocal(new WorkerDBClientRX(), server);
    let err = false;
    await server.db;
    await new Promise(yay => setTimeout(yay, 100));
    expect(db.isReady).toBe(true);
    await db
      .c('birdo')
      .insert({ name: 'Oscar' })
      .catch(e => (err = true));
    expect(err).toBe(true);
    await db.close();
    expect(db.terminated).toBe(true);
  });
});
