const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  devServer: {
    port: 2300,
  },
  devtool: isDev ? 'source-map' : false,
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './src/index.html'),
      filename: 'index.html',
    }),
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, './src/assets/favicon.ico'),
          to: path.resolve(__dirname, 'dist'),
        },
        {
          from: path.resolve(__dirname, './src/assets/svg/background-book-1.svg'),
          to: path.resolve(__dirname, 'dist'),
        },
        {
          from: path.resolve(__dirname, './src/assets/svg/background-book-2.svg'),
          to: path.resolve(__dirname, 'dist'),
        },
        {
          from: path.resolve(__dirname, './src/assets/svg/background-book-3.svg'),
          to: path.resolve(__dirname, 'dist'),
        },
        {
          from: path.resolve(__dirname, './src/assets/svg/background-book-4.svg'),
          to: path.resolve(__dirname, 'dist'),
        },
        {
          from: path.resolve(__dirname, './src/assets/svg/background-book-5.svg'),
          to: path.resolve(__dirname, 'dist'),
        },
        {
          from: path.resolve(__dirname, './src/assets/svg/background-book-6.svg'),
          to: path.resolve(__dirname, 'dist'),
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: '[contenthash].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(png|jpg|svg|jpeg|svg)$/,
        type: 'asset/resource',
      },
      {
        test: /\.xml$/,
        use: ['xml-loader'],
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        type: 'asset/resource',
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-typescript'],
          },
        },
      },
    ],
  },
};
