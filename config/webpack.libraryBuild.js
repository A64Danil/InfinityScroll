const paths = require('./paths')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PrettierPlugin = require('prettier-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const path = require('path')
const fs = require('fs');


module.exports = {
    // mode: 'none',
    mode: 'production',
    devtool: false,
    entry: {
        main: [paths.src + '/js/infinityScroll.ts'],
    },
    output: {
        path: paths.lib,
        // filename: 'InfinityScroll.bundle.[contenthash].js',
        filename: `infinityScroll-${process.env.VERSION}.js`,
        // publicPath: '/', // добавлено
        library: 'InfinityScroll', // Имя, под которым будет доступен класс
        libraryTarget: 'global', // Указываем, что класс добавляется в глобальный объект (window)
        // libraryTarget: 'window', // Указываем, что класс добавляется в глобальный объект (window)
        libraryExport: 'InfinityScroll', // Экспортирует конкретное свойство, а не весь объект

    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    plugins: [
        new CleanWebpackPlugin(),
        // ESLint configuration
        new ESLintPlugin({
            files: ['.', 'src', 'config'],
            formatter: 'table',
        }),
        // Prettier configuration
        new PrettierPlugin(),
    ],
    module: {
        rules: [
            // JavaScript
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
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
    optimization: {
        minimize: true,
        minimizer: [
            (compiler) => {
                const TerserPlugin = require('terser-webpack-plugin');
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            pure_funcs: ['console.log'], // Удалить только console.log
                            // drop_console: true, // Удалить все консоли
                        },
                        keep_classnames: /^InfinityScroll$/, // Сохраняем конкретное имя класса
                    },
                }).apply(compiler);
            },
        ],
        // minimizer: [new CssMinimizerPlugin(), "..."],
        // Once your build outputs multiple chunks, this option will ensure they share the webpack runtime
        // instead of having their own. This also helps with long-term caching, since the chunks will only
        // change when actual code changes, not the webpack runtime.
        runtimeChunk: false,
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },
}