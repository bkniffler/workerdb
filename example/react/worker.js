import { worker } from 'workerdb';

worker([
  {
    name: 'bird',
    schema: {
      version: 0,
      properties: {
        name: { type: 'string' }
      }
    },
    sync: {
      remote: `https://my-server.com/bird`,
      waitForLeadership: false,
      direction: {
        pull: true,
        push: false
      },
      options: {
        live: true,
        retry: true
      }
    }
  }
]);
