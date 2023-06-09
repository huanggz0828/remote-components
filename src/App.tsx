import React, { useRef, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { less } from '@codemirror/lang-less';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import AsyncComponent from './AsyncComponent';
import { Alert, Button, Layout, Segmented, Space } from 'antd';
import { registerPromiseWorkerApi } from './WorkerUtils';
import Less from 'less';

const WorkerSource = require('worker-loader?inline=no-fallback&esModule=false!./Worker');

function App() {
  const [code, setCode] = useState('');
  const [lessCode, setLessCode] = useState('');
  const [activeLang, setActiveLang] = useState('javascript');
  const [compiledCode, setCompiledCode] = useState('');
  const [compiledCss, setCompiledCss] = useState('');
  const [jsErrorMessage, setJsErrorMessage] = useState('');
  const [cssErrorMessage, setCssErrorMessage] = useState('');
  const [mockCode, setMockCode] = useState({});
  // 注册WebWorker
  const worker = useRef(registerPromiseWorkerApi(new WorkerSource()));

  useEffect(() => {
    // WebWorker内从CDN加载Babel
    worker.current.postMessage({ method: 'loadScript' });
  }, []);

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
        <Button onClick={() => setMockCode({ js: compiledCode, css: compiledCss })}>
          预览组件
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
              onBlur={() => handleCompileJs()}
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
              onBlur={() => handleCompileCss()}
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
        <AsyncComponent name="MyButton" mockCode={mockCode} />
      </Layout.Content>
    </>
  );
}

export default App;
