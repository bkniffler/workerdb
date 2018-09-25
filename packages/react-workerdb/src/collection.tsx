import * as React from 'react';
import { WorkerDBCollection } from 'workerdb';
import Context from './context';
import render, { RenderProps } from './factory/render';

interface RenderPropsCollection extends RenderProps<WorkerDBCollection> {
  name: string;
}
const WorkerDBCollection = (props: RenderPropsCollection) => (
  <Context.Consumer>
    {value => render(props, { value: value && value.c(props.name) })}
  </Context.Consumer>
);

export default WorkerDBCollection;
