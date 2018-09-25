import React, { Component } from 'react';
import { Collection, Find } from '../../../packages/react-workerdb';
import TodoFooter from './footer';
import TodoItem from './item';
import {
  ALL_TODOS,
  ACTIVE_TODOS,
  COMPLETED_TODOS,
  ENTER_KEY
} from './constants';

class TodoApp extends Component {
  state = {
    nowShowing: ALL_TODOS,
    editing: null,
    newTodo: ''
  };

  handleChange = event => {
    this.setState({ newTodo: event.target.value });
  };

  handleNewTodoKeyDown = event => {
    if (event.keyCode !== ENTER_KEY) {
      return;
    }

    event.preventDefault();

    var title = this.state.newTodo.trim();

    if (title) {
      this.props.collection.insert({ title });
      this.setState({ newTodo: '' });
    }
  };

  toggleAll = event => {
    var checked = event.target.checked;
    this.props.model.toggleAll(checked);
  };

  toggle = todo => {
    this.props.collection.upsert({ ...todo, completed: !todo.completed });
  };

  destroy = todo => {
    this.props.collection.remove(todo);
  };

  edit = todo => {
    this.setState({ editing: todo._id });
  };

  save = (todo, title) => {
    this.props.collection.upsert({ ...todo, title });
    this.setState({ editing: null });
  };

  cancel = () => {
    this.setState({ editing: null });
  };

  clearCompleted = () => {
    this.props.model.clearCompleted();
  };

  push = nowShowing => {
    this.setState({ nowShowing });
  };

  render() {
    var footer;
    var main;
    var todos = this.props.todos;

    var shownTodos = todos.filter(todo => {
      switch (this.state.nowShowing) {
        case ACTIVE_TODOS:
          return !todo.completed;
        case COMPLETED_TODOS:
          return todo.completed;
        default:
          return true;
      }
    });

    var todoItems = shownTodos.map(todo => {
      return (
        <TodoItem
          key={todo._id}
          todo={todo}
          onToggle={this.toggle.bind(this, todo)}
          onDestroy={this.destroy.bind(this, todo)}
          onEdit={this.edit.bind(this, todo)}
          editing={this.state.editing === todo._id}
          onSave={this.save.bind(this, todo)}
          onCancel={this.cancel}
        />
      );
    });

    var activeTodoCount = todos.reduce((accum, todo) => {
      return todo.completed ? accum : accum + 1;
    }, 0);

    var completedCount = todos.length - activeTodoCount;

    if (activeTodoCount || completedCount) {
      footer = (
        <TodoFooter
          push={this.push}
          count={activeTodoCount}
          completedCount={completedCount}
          nowShowing={this.state.nowShowing}
          onClearCompleted={this.clearCompleted}
        />
      );
    }

    if (todos.length) {
      main = (
        <section className="main">
          <input
            id="toggle-all"
            className="toggle-all"
            type="checkbox"
            onChange={this.toggleAll}
            checked={activeTodoCount === 0}
          />
          <label htmlFor="toggle-all" />
          <ul className="todo-list">{todoItems}</ul>
        </section>
      );
    }

    return (
      <div>
        <header className="header">
          <h1>todos</h1>
          <input
            className="new-todo"
            placeholder="What needs to be done?"
            value={this.state.newTodo}
            onKeyDown={this.handleNewTodoKeyDown}
            onChange={this.handleChange}
            autoFocus={true}
          />
        </header>
        {main}
        {footer}
      </div>
    );
  }
}

export default () => (
  <Find
    live
    collection="todo"
    render={(todos, collection) => (
      <TodoApp collection={collection} todos={todos} />
    )}
  />
);
