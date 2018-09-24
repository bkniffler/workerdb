import * as React from 'react';
import Context from './context';
import render, { RenderProps } from './factory/render';

const WorkerDBConsumer = (props: RenderProps) => (
  <Context.Consumer>{value => render(props, { value })}</Context.Consumer>
);

export default WorkerDBConsumer;
