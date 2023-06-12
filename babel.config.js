'use strict';

module.exports = function (api) {
  api.cache(true);
  return {
    targets: {
      // This is browserslist defaults
      browsers: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead'],
    },
    presets: [
      [
        '@babel/preset-env',
        {
          modules: false,
          useBuiltIns: 'entry',
          corejs: 3,
          shippedProposals: true,
        },
      ],
      '@babel/preset-react',
      [
        '@babel/preset-typescript',
        {
          allowDeclareFields: true,
          onlyRemoveTypeImports: true,
        },
      ],
    ],
  };
};
