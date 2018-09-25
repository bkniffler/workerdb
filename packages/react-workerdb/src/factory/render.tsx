export default (props: RenderProps<any>, state: any) => {
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

export interface RenderProps<T> {
  error?: (error: Error) => React.ReactNode;
  render?: (data: T) => React.ReactNode;
  loading?: (loading: boolean) => React.ReactNode;
  children?: (data: T | any) => React.ReactNode | React.ReactNode;
}
