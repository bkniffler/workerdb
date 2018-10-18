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
  } else if (handleRender && !state.loading) {
    return handleRender(state.value, state.value2);
  }

  if (children && typeof children === 'function') {
    return (children as Function)(state);
  }
  return children || null;
};

export interface RenderProps<T> {
  error?: (error: Error) => React.ReactNode;
  render?: (data: T, data2?: any) => React.ReactNode;
  loading?: (loading: boolean) => React.ReactNode;
  children?: React.ReactNode | ((data: T | any) => React.ReactNode);
}
