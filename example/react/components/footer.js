import React from 'react';
import classNames from 'classNames';
import { pluralize } from './utils';
import { ALL_TODOS, ACTIVE_TODOS, COMPLETED_TODOS } from './constants';

export default props => {
  var activeTodoWord = pluralize(props.count, 'item');
  var clearButton = null;

  if (props.completedCount > 0) {
    clearButton = (
      <button className="clear-completed" onClick={props.onClearCompleted}>
        Clear completed
      </button>
    );
  }

  var nowShowing = props.nowShowing;
  return (
    <footer className="footer">
      <span className="todo-count">
        <strong>{props.count}</strong> {activeTodoWord} left
      </span>
      <ul className="filters">
        <li>
          <a
            href="javascript:;"
            onClick={() => props.push(ALL_TODOS)}
            className={classNames({ selected: nowShowing === ALL_TODOS })}
          >
            All
          </a>
        </li>{' '}
        <li>
          <a
            href="javascript:;"
            onClick={() => props.push(ACTIVE_TODOS)}
            className={classNames({
              selected: nowShowing === ACTIVE_TODOS
            })}
          >
            Active
          </a>
        </li>{' '}
        <li>
          <a
            href="javascript:;"
            onClick={() => props.push(COMPLETED_TODOS)}
            className={classNames({
              selected: nowShowing === COMPLETED_TODOS
            })}
          >
            Completed
          </a>
        </li>
      </ul>
      {clearButton}
    </footer>
  );
};
