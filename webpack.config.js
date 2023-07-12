'use strict';
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const {DEFAULT_GlOBALS} = require('./src/constant')

const isPro = process.env.NODE_ENV === 'production';

const config = {
  devtool: isPro ? false : 'source-map',
  mode: isPro ? 'production' : 'development',
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
  externals: DEFAULT_GlOBALS,
  module: {
    rules: [
      {
        test: /\.Worker\.ts$/,
        include: path.resolve(__dirname, 'src'),
        use: { loader: 'worker-loader' },
      },
      {
        test: /\.(ts|tsx|js)$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'babel-loader',
      },
      {
        test: /\.less$/i,
        include: path.resolve(__dirname, 'src'),
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: false,
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

isPro && config.plugins.push(new BundleAnalyzerPlugin());

module.exports = config;
