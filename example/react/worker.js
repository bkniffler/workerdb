import { worker } from '../../packages/workerdb';

worker([
  {
    name: 'todo',
    schema: {
      version: 0,
      properties: {
        title: { type: 'string' },
        completed: { type: 'boolean' }
      }
    }
  }
]);
