import * as React from 'react';
import { WorkerDB } from 'workerdb';
import Context from './context';
import render, { RenderProps } from './factory/render';

function WorkerDBConsumer(props: RenderProps<WorkerDB>) {
  return (
    <Context.Consumer>{value => render(props, { value })}</Context.Consumer>
  );
}

export default WorkerDBConsumer;
