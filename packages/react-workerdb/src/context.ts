import { createContext } from 'react';
import { WorkerDBClientRX } from 'workerdb';

export default createContext<WorkerDBClientRX | undefined>(undefined);
