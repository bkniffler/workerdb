import * as React from 'react';
import { WorkerDB } from 'workerdb';
import Context from './context';
import render, { RenderProps } from './factory/render';

const WorkerDBConsumer = (props: RenderProps<WorkerDB>) => (
  <Context.Consumer>{value => render(props, { value })}</Context.Consumer>
);

export default WorkerDBConsumer;
