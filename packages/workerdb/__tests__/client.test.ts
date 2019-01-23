import 'jest';
import { createLocal, WorkerDBServerRX, WorkerDBClientRX } from '../src';

describe('index', () => {
  it('multiple clients', async () => {
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
    const client2 = createLocal(new WorkerDBClientRX(), server);
    await client.init();
    expect(client.isReady).toBe(true);
    expect(client2.isReady).toBe(true);
    await client.close();
    expect(client.terminated).toBe(true);
    expect(client2.terminated).toBe(true);
  });
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
    await client.init();
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
    const client = createLocal(new WorkerDBClientRX(), server);
    await client.init();
    let err = false;
    // await new Promise(yay => setTimeout(yay, 100));
    expect(client.isReady).toBe(true);
    await client
      .c('birdo')
      .insert({ name: 'Oscar' })
      .catch(e => (err = true));
    expect(err).toBe(true);
    await client.close();
    expect(client.terminated).toBe(true);
  });
});
