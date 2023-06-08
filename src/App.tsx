import React, { useRef, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import AsyncComponent from './AsyncComponent';
import { Alert, Button } from 'antd';
import { registerPromiseWorkerApi } from './WorkerUtils';

const WorkerSource = require('worker-loader?inline=no-fallback&esModule=false!./Worker');

function App() {
  const [code, setCode] = useState('');
  const [compiledCode, setCompiledCode] = useState('');
  const [evalErrorMessage, setEvalErrorMessage] = useState('');
  const [mockCode, setMockCode] = useState('');
  const worker = useRef(registerPromiseWorkerApi(new WorkerSource()));

  useEffect(() => {
    worker.current.postMessage({ method: 'loadScript' });
  }, []);

  const handleCompile = () => {
    if (!code) return;
    worker.current.postMessage({ code }).then(({ compiled, errorMsg }) => {
      if (errorMsg) {
        setEvalErrorMessage(errorMsg);
      } else {
        setEvalErrorMessage('');
        setCompiledCode(compiled);
      }
    });
  };

  return (
    <>
      <div className="input-code">
        <CodeMirror
          theme={vscodeDark}
          value={code}
          width="600px"
          height="100%"
          extensions={[javascript({ jsx: true })]}
          onChange={setCode}
          onBlur={handleCompile}
        />
        {evalErrorMessage && <Alert banner type="error" message={evalErrorMessage}></Alert>}
      </div>
      <CodeMirror
        className="compiled-code"
        theme={vscodeDark}
        value={compiledCode}
        width="600px"
        height="100%"
        extensions={[javascript()]}
      />
      <div style={{ marginLeft: 10, marginBottom: 10 }}>
        <Button onClick={() => compiledCode && setMockCode(compiledCode)}>预览</Button>
        <AsyncComponent name="MyButton" mockCode={mockCode} />
      </div>
    </>
  );
}

export default App;
