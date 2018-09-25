import { createContext } from 'react';
import { WorkerDB } from 'workerdb';

export default createContext<WorkerDB | undefined>(undefined);
