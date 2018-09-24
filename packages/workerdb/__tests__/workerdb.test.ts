import 'jest';
import WorkerDB from '../src/workerdb';

describe('index', () => {
  it('should be able to be included', () => {
    const worker = {
      onmessage: null,
      postMessage: () => console.log('POST'),
      terminate: () => console.log('POST')
    };
    const db = new WorkerDB(worker, (x, y) => {
      console.log(x, y);
    });
    db.init({ name: 'hi' });
  });
});
