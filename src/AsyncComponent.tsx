import React, { useEffect, useState, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Alert } from 'antd';
import { nanoid } from 'nanoid';
import Less from 'less';

type MockCode = { js?: string; css?: string };

// 定义导入远程组件的第三方包
const packages = {
  react: React,
  antd: require('antd'),
};

const getParsedModule = (code: string) => {
  const _exports = { default: undefined as any };
  const _require = (name: keyof typeof packages) => packages[name];
  // 由于远程组件不在模块内
  // 所以需要模拟组件内的require和exports
  Function('require, exports', code)(_require, _exports);
  return _exports;
};

// 模拟接口
const mockFetch = (mockCode: MockCode) =>
  new Promise<MockCode>(resolve => {
    setTimeout(() => {
      resolve(mockCode);
    }, 1e3);
  });

const AsyncComponent: React.FC<
  React.PropsWithChildren & { name: string; mockCode: MockCode }
> = props => {
  const { name, mockCode, children } = props;
  const [Component, setComponent] = useState<React.ComponentType<any>>();
  const [scopedCss, setScopedCss] = useState<string>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);
  const uid = useRef(nanoid()); // 组件唯一id

  useEffect(() => {
    if (!name || !mockCode.js) return;
    setError(undefined);
    setLoading(true);
    mockFetch(mockCode).then(res => {
      try {
        const CompExport = getParsedModule(res.js!);
        if (!CompExport.default) {
          throw new Error('远程组件没有export default');
        }
        setComponent(() => CompExport.default);
        // 根据唯一id加载css，实现样式隔离
        res.css &&
          Less.render(`div[data-css=${uid.current}]{${res.css}}`).then(output => {
            setScopedCss(output.css);
          });
        setLoading(false);
      } catch (err: any) {
        // 错误边界只能捕获react组件render过程中的错误
        // 这里是捕获react组件运行前的错误
        setError(err);
      }
    });
  }, [mockCode]);

  const renderError = ({ error }: { error: any }) => {
    return <Alert type="error" showIcon message={`远程组件${name}异常：${error?.message}`}></Alert>;
  };

  if (!mockCode.js) return;

  if (error) return renderError({ error });

  if (!Component || loading) return <div>loading</div>;

  return (
    <div data-css={uid.current}>
      {scopedCss && <style>{scopedCss}</style>}
      {/**错误边界，避免远程组件内部报错影响外部页面 */}
      <ErrorBoundary fallbackRender={renderError}>
        <Component {...props}>{children}</Component>
      </ErrorBoundary>
    </div>
  );
};

export default AsyncComponent;
