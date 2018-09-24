import 'jest';
import { inner } from '../src/worker';

describe('index', () => {
  it('should be able to be included', () => {
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
                name: { type: 'string' }
              }
            }
          }
        ],
        ({ type }) => {
          if (type === 'ready') {
            resolved = true;
            yay();
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
  });
});
