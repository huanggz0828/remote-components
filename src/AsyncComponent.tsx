import React, { useEffect, useState, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Alert, Spin } from 'antd';
import { nanoid } from 'nanoid';
import Less from 'less';

type MockResponse = { name: string; js?: string; css?: string };

/** 将远程代码做成模块 */
const getParsedModule = (name: string, code: string) => {
  // 简易沙箱
  const fakeWindow = {};
  const proxyWindow: Window = new Proxy(window, {
    // 获取属性
    get(target, key) {
      if (key === Symbol.unscopables) return false;

      // 内部可能访问当这几个变量，都直接返回代理对象
      if (['window', 'self', 'globalThis'].includes(key as string)) {
        return proxyWindow;
      }

      return Reflect.get(target, key) || Reflect.get(fakeWindow, key);
    },
    // 设置属性
    set(target, key, value) {
      return Reflect.set(fakeWindow, key, value);
    },
    // 判断属性是否有
    has(target, key) {
      return key in target || key in fakeWindow;
    },
  });
  // 取出组件的exports
  Function('window', `with(window){${code}}`)(proxyWindow);
  return Reflect.get(fakeWindow, name);
};

/** 模拟接口 */
const mockFetch = (mockResponse: MockResponse, delay: number) =>
  new Promise<MockResponse>(resolve => {
    setTimeout(() => {
      resolve(mockResponse);
    }, delay);
  });

interface AsyncComponentProps extends React.PropsWithChildren {
  mockResponse: MockResponse; // 模拟代码
  mockDelay?: number; // 模拟接口延迟
}

const AsyncComponent: React.FC<AsyncComponentProps> = props => {
  const { mockResponse, mockDelay, children } = props;
  const [Component, setComponent] = useState<React.ComponentType<any>>();
  const [scopedCss, setScopedCss] = useState<string>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);
  const uid = useRef(nanoid()); // 组件唯一id

  const init = (res: MockResponse) => {
    try {
      const CompExport = getParsedModule(res.name, res.js!);
      if (!CompExport.default) {
        throw new Error('远程组件没有export default');
      }
      setComponent(() => CompExport.default);
      // 根据唯一id加载css，实现样式隔离
      res.css &&
        Less.render(`div[data-css='${uid.current}']{${res.css}}`).then(output => {
          setScopedCss(output.css);
        });
      setLoading(false);
    } catch (err: any) {
      // 错误边界只能捕获react组件render过程中的错误
      // 这里是捕获react组件运行前的错误
      setError(err);
    }
  };

  useEffect(() => {
    if (!mockResponse.name || !mockResponse.js) return;
    setError(undefined);
    setLoading(true);
    mockDelay ? mockFetch(mockResponse, mockDelay).then(init) : init(mockResponse);
  }, [mockResponse]);

  const renderError = ({ error }: { error: any }) => {
    return <Alert type="error" showIcon message={`远程组件${name}异常：${error?.message}`}></Alert>;
  };

  if (!mockResponse.js) return;

  if (error) return renderError({ error });

  if (!Component || loading) return <Spin size="large" />;

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
