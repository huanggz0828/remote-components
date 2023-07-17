import React, { useRef, useState, useEffect } from 'react';
import Less from 'less';
import { useMount, useDebounceEffect } from 'ahooks';

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { less } from '@codemirror/lang-less';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

import { Alert, Button, Layout, Modal, Segmented, Space, Spin } from 'antd';
import AsyncComponent from './AsyncComponent';
import { registerPromiseWorkerApi } from './utils/WorkerUtils';
import { DEFAULT_JS, DEFAULT_LESS, loadScript } from './utils/constant';
import ExternalForm from './ExternalForm';

const WorkerSource = require('worker-loader?inline=no-fallback&esModule=false!./utils/Worker');

export type ExternalList = { libraryName: string; libraryGlobal: string; libraryUrl: string }[];

const compName = 'MyApp';
// https://unpkg.com/lodash@4.17.21/lodash.js
function App() {
  const [code, setCode] = useState(DEFAULT_JS); // 编译前js代码
  const [codeLoading, setCodeLoading] = useState(false); // 编译js代码loading
  const [lessCode, setLessCode] = useState(DEFAULT_LESS); // 编译前css代码
  const [lessCodeLoading, setLessCodeLoading] = useState(false); // 编译css代码loading
  const [activeLang, setActiveLang] = useState('javascript'); // 当前语言模式
  const [compiledCode, setCompiledCode] = useState(''); // 编译后js代码
  const [compiledCss, setCompiledCss] = useState(''); // 编译后css代码
  const [jsErrorMessage, setJsErrorMessage] = useState(''); // js编译报错信息
  const [cssErrorMessage, setCssErrorMessage] = useState(''); // css编译报错信息
  const [externalList, setExternalList] = useState<ExternalList>([]);

  /**
   * 使用WebWorker有两个原因
   * 1. Babel编译代码开销大，避免阻塞页面（非主要原因）
   * 2. Babel编译过程中会使用如`path`的Node.js模块函数，
   *    浏览器环境内会报错，在worker-loader的inline模式下可正常运行
   *    inline=no-fallback等效inline=true&fallback=false
   */
  const worker = useRef(registerPromiseWorkerApi(new WorkerSource()));

  useMount(() => {
    // WebWorker内从CDN加载Babel
    worker.current.postMessage({ method: 'loadScript' }).then(res => {
      if (res) {
        handleCompileJs();
        handleCompileCss();
      }
    });
  });

  /**编译js */
  const handleCompileJs = (lang: string | undefined = activeLang) => {
    setJsErrorMessage('');
    if (!code) return;
    setCodeLoading(true);
    // 通知WebWorker编译代码
    worker.current
      .postMessage({
        globals: externalList.reduce(
          (pre, cur) => ({ ...pre, [cur.libraryName]: cur.libraryGlobal }),
          {}
        ),
        name: compName,
        code,
        lang,
      })
      .then(({ compiled, errorMsg }) => {
        setCodeLoading(false);
        if (errorMsg) {
          setJsErrorMessage(errorMsg);
        } else {
          setCompiledCode(compiled);
        }
      });
  };

  /**编译css */
  const handleCompileCss = () => {
    setCssErrorMessage('');
    if (!lessCode) return;
    // Less程序化编译
    setLessCodeLoading(true);
    Less.render(lessCode)
      .then(output => {
        setCompiledCss(output.css);
      })
      .catch(({ message, line, column, extract }) => {
        // 格式化错误信息
        const realLine = line - 1;
        const extractWithLine = (extract as string[]).map(
          (lineCode, index) =>
            `${index ? '   ' : '> '}${realLine + index} |${lineCode.replace(/ /g, '  ')}`
        );
        extractWithLine.splice(1, 0, `${'  '.repeat(column + 1)}^`);
        setCssErrorMessage(`${message} (${realLine}:${column})\n\n${extractWithLine.join('\n')}`);
      })
      .finally(() => {
        setLessCodeLoading(false);
      });
  };

  // 结束输入500ms后开始编译，避免编写过程中编译报错
  useDebounceEffect(
    () => {
      handleCompileJs();
    },
    [code],
    { wait: 500 }
  );

  useEffect(() => {
    handleCompileJs();
  }, [externalList]);

  useDebounceEffect(
    () => {
      handleCompileCss();
    },
    [lessCode],
    { wait: 500 }
  );

  return (
    <>
      <Space style={{ marginBottom: 10 }}>
        <div>
          语言模式：
          <Segmented
            options={['javascript', 'typescript']}
            onChange={val => {
              setActiveLang(val as string);
              handleCompileJs(val as string);
            }}
          />
        </div>
        <ExternalForm
          onOk={data => {
            setExternalList(data);
            data.forEach(item => loadScript(item.libraryUrl));
          }}
        />
        <Button
          onClick={() =>
            Modal.info({
              title: '预览',
              width: 500,
              content: (
                <AsyncComponent
                  mockResponse={{ name: compName, js: compiledCode, css: compiledCss }}
                  mockDelay={1e3}
                />
              ),
            })
          }
        >
          预览远程组件
        </Button>
      </Space>
      <Layout.Content>
        <div className="code-container">
          <div className="input-code">
            {activeLang}
            <CodeMirror
              theme={vscodeDark}
              value={code}
              width="600px"
              height="100%"
              extensions={[javascript({ jsx: true, typescript: activeLang === 'typescript' })]}
              onChange={setCode}
            />
            {jsErrorMessage && <Alert banner type="error" description={jsErrorMessage}></Alert>}
          </div>
          <div className="input-code">
            less
            <CodeMirror
              theme={vscodeDark}
              value={lessCode}
              width="600px"
              height="100%"
              extensions={[less()]}
              onChange={setLessCode}
            />
            {cssErrorMessage && <Alert banner type="error" description={cssErrorMessage}></Alert>}
          </div>
        </div>

        <div className="code-container">
          编译后js
          <Spin spinning={codeLoading}>
            <CodeMirror
              readOnly
              theme={vscodeDark}
              value={compiledCode}
              width="600px"
              height="100%"
              extensions={[javascript()]}
            />
          </Spin>
          编译后css
          <Spin spinning={lessCodeLoading}>
            <CodeMirror
              readOnly
              theme={vscodeDark}
              value={compiledCss}
              width="600px"
              height="100%"
              extensions={[less()]}
            />
          </Spin>
        </div>
        <AsyncComponent mockResponse={{ name: compName, js: compiledCode, css: compiledCss }} />
      </Layout.Content>
    </>
  );
}

export default App;
