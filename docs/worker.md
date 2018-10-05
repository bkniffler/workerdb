# Worker.Js

For seeing all possible schema options, please check out RxDB docs [here](https://pubkey.github.io/rxdb/rx-schema.html#example). There is just one additional property added `sync`. If this is defined, the collection will use the provided options to start syncing.

```jsx
import { worker } from 'workerdb';

worker([
  {
    name: 'bird',
    schema: {
      version: 0,
      properties: {
        name: { type: 'string' },
        age: { type: 12 }
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
```
