import { registerPromiseWorker } from './WorkerUtils';

declare var Babel: any;
declare function importScripts(url: string): void;

registerPromiseWorker(event => {
  const { code, method } = event;
  if (method === 'loadScript') {
    try {
      importScripts('https://unpkg.com/@babel/standalone@7.22.4/babel.min.js');
      return true;
    } catch (error) {
      console.warn(error);
      return;
    }
  }
  if (!Babel) return;
  let compiled, errorMsg;
  try {
    const transformed = Babel.transform(code, {
      babelrc: false,
      filename: 'repl.jsx',
      sourceMap: false,
      assumptions: {},
      presets: [
        [
          'env',
          {
            targets: {
              browsers: ['defaults', 'not ie 11', 'not ie_mob 11'],
            },
            modules: 'commonjs',
            forceAllTransforms: false,
            shippedProposals: false,
            useBuiltIns: false,
            spec: false,
            loose: false,
          },
        ],
        [
          'react',
          {
            runtime: 'classic',
          },
        ],
      ],
      plugins: [],
      sourceType: 'module',
    });
    compiled = transformed.code;
  } catch (err: any) {
    console.error(err);
    errorMsg = err?.message;
  }
  return { compiled, errorMsg };
});
