'use strict';
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const config = {
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  stats: {
    children: true,
  },
  cache: {
    type: 'filesystem', // 使用文件缓存
  },
  entry: './src/main.tsx',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  output: {
    filename: '[name].js',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    dayjs: 'dayjs',
    antd: 'antd',
  },
  module: {
    rules: [
      {
        test: /\.Worker\.ts$/,
        use: { loader: 'worker-loader' },
      },
      {
        test: /\.(ts|tsx|js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.less$/i,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
    ],
  },
  plugins: [
    new BundleAnalyzerPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: false,
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer'],
    }),
  ],
  optimization: {
    usedExports: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            ascii_only: true,
          },
        },
      }),
    ],
  },
  devServer: {
    port: 5173,
    hot: true,
    client: {
      overlay: false,
    },
  },
};

module.exports = config;
