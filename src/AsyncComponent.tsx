import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Alert } from 'antd';

const packages = {
  react: React,
  antd: require('antd'),
};

const getParsedModule = (code: string) => {
  const _exports = { default: undefined as any };
  Function('require, exports', code)(
    (name: keyof typeof packages) => packages[name],
    _exports
  );
  return _exports;
};

const mockFetch = (mockCode: string) =>
  new Promise<string>(resolve => {
    setTimeout(() => {
      resolve(mockCode);
    }, 1e3);
  });

const AsyncComponent: React.FC<
  React.PropsWithChildren & { name: string; mockCode: string }
> = props => {
  const { name, mockCode, children } = props;
  const [Component, setComponent] = useState<React.ComponentType<any>>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!name || !mockCode) return;
    setError(undefined);
    setLoading(true);
    mockFetch(mockCode).then(res => {
      try {
        const CompExport = getParsedModule(res);
        if (!CompExport.default) {
          throw new Error('远程组件没有export default');
        }
        setComponent(() => CompExport.default);
        setLoading(false);
      } catch (err: any) {
        setError(err);
      }
    });
  }, [mockCode]);

  const renderError = ({ error }: { error: any }) => {
    return <Alert type="error" showIcon message={`远程组件${name}异常：${error?.message}`}></Alert>;
  };

  if (!mockCode) return;

  if (error) return renderError({ error });

  if (!Component || loading) return <div>loading</div>;

  return (
    <ErrorBoundary fallbackRender={renderError}>
      <Component {...props}>{children}</Component>
    </ErrorBoundary>
  );
};

export default AsyncComponent;
