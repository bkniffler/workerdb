export default (props: RenderProps, state: any) => {
  const {
    error: handleError,
    render: handleRender,
    loading: handleLoading,
    children
  } = props;

  if (handleError && state.error) {
    return handleError(state.error);
  } else if (handleLoading && state.loading) {
    return handleLoading(state.loading);
  } else if (handleRender) {
    return handleRender(state.value);
  }

  if (children && typeof children === 'function') {
    return children(state);
  }
  return children;
};

export interface RenderProps {
  error?: Function;
  render?: Function;
  loading?: Function;
  children?: Function | React.ReactNode;
}
