import { createContext } from 'react';
import { WorkerDBProxy } from 'workerdb';

export default createContext<WorkerDBProxy<any> | null>(null);
