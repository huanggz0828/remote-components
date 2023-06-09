'use strict';
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
  devtool: 'source-map',
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
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: false,
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer'],
    }),
  ],
  devServer: {
    port: 5173,
    hot: true,
    client: {
      overlay: false,
    },
  },
  optimization: {
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
};

module.exports = config;
