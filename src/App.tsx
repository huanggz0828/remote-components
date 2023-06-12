import React, { useRef, useState } from 'react';
import Less from 'less';
import { useMount, useDebounceEffect } from 'ahooks';

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { less } from '@codemirror/lang-less';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

import { Alert, Button, Layout, Modal, Segmented, Space } from 'antd';
import AsyncComponent from './AsyncComponent';
import { registerPromiseWorkerApi } from './WorkerUtils';
import { DEFAULT_JS, DEFAULT_LESS } from './constans';

const WorkerSource = require('worker-loader?inline=no-fallback&esModule=false!./Worker');

function App() {
  const [code, setCode] = useState(DEFAULT_JS);
  const [lessCode, setLessCode] = useState(DEFAULT_LESS);
  const [activeLang, setActiveLang] = useState('javascript');
  const [compiledCode, setCompiledCode] = useState('');
  const [compiledCss, setCompiledCss] = useState('');
  const [jsErrorMessage, setJsErrorMessage] = useState('');
  const [cssErrorMessage, setCssErrorMessage] = useState('');
  // 注册WebWorker
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

  const handleCompileJs = (lang: string | undefined = activeLang) => {
    setJsErrorMessage('');
    if (!code) return;
    // 通知WebWorker编译代码
    worker.current.postMessage({ code, lang }).then(({ compiled, errorMsg }) => {
      if (errorMsg) {
        setJsErrorMessage(errorMsg);
      } else {
        setCompiledCode(compiled);
      }
    });
  };

  const handleCompileCss = () => {
    setCssErrorMessage('');
    if (!lessCode) return;
    // Less程序化编译
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
      });
  };

  useDebounceEffect(
    () => {
      handleCompileJs();
    },
    [code],
    { wait: 500 }
  );

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
        <Button
          onClick={() =>
            Modal.info({
              title: '预览',
              width: 500,
              content: (
                <AsyncComponent
                  name="MyButton"
                  mockCode={{ js: compiledCode, css: compiledCss }}
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
          <CodeMirror
            readOnly
            theme={vscodeDark}
            value={compiledCode}
            width="600px"
            height="100%"
            extensions={[javascript()]}
          />
          编译后css
          <CodeMirror
            readOnly
            theme={vscodeDark}
            value={compiledCss}
            width="600px"
            height="100%"
            extensions={[less()]}
          />
        </div>
        <AsyncComponent name="MyButton" mockCode={{ js: compiledCode, css: compiledCss }} />
      </Layout.Content>
    </>
  );
}

export default App;
