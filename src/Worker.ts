import { registerPromiseWorker } from './WorkerUtils';

declare var Babel: any;
declare function importScripts(url: string): void;

// 使用WebWorker有两个原因
// 1. Babel编译代码开销大，避免阻塞页面（非主要原因）
// 2. Babel编译过程中会使用如`path`的Node.js模块函数，
//    浏览器环境内会报错，在WebWorker内可正常运行
registerPromiseWorker(event => {
  const { code, lang, method } = event;
  // 从CDN加载Babel
  if (method === 'loadScript') {
    try {
      // WebWorker内部方法importScripts
      importScripts('https://unpkg.com/@babel/standalone@7.22.4/babel.min.js');
      return true;
    } catch (error) {
      console.warn(error);
      return;
    }
  }
  if (!Babel) return;
  let compiled, errorMsg;
  // 定义babelConfig
  const isTs = lang === 'typescript';
  const presets = [
    [
      'env',
      {
        targets: {
          browsers: ['defaults', 'not ie 11', 'not ie_mob 11'],
        },
        modules: 'commonjs',
      },
    ],
    'react',
  ];
  isTs && presets.push('typescript');
  const babelConfig = {
    babelrc: false,
    filename: `index.${isTs ? 'tsx' : 'jsx'}`,
    sourceMap: false,
    presets,
    sourceType: 'module',
  };
  try {
    // 编译代码
    const transformed = Babel.transform(code, babelConfig);
    compiled = transformed.code;
  } catch (err: any) {
    console.error(err);
    errorMsg = err?.message;
  }
  return { compiled, errorMsg };
});
