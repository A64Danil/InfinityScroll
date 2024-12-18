const paths = require('./paths')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const glob = require('glob');
const path = require('path')

const { CleanWebpackPlugin } = require('clean-webpack-plugin')

// TODO: жесть, почему из-за такого пути CleanWebpack плагин ругается????
// const cssEntryPoints = glob.sync('./src/styles/demo/*.scss').reduce((acc, file) => {
const cssEntryPoints = glob.sync('./src/styles/**/*.scss').reduce((acc, file) => {
    const name = path.basename(file, '.scss'); // Имя файла без расширения
    acc[name] = file; // Добавляем SCSS-файлы как entry points
    return acc;
}, {});

console.log(cssEntryPoints)


const cssConfig = {
    mode: 'production',
    devtool: false,
    entry: cssEntryPoints,
    output: {
        path: paths.delete,
        filename: '[name].deleteMe',
    },
    plugins: [

        new CleanWebpackPlugin({
            dry: false,
            dangerouslyAllowCleanPatternsOutsideProject: true,
            cleanOnceBeforeBuildPatterns: ['../dist/js/main.*.js', '../dist/js/runtime.*.js'],
        }),
        new MiniCssExtractPlugin({
            filename: '../dist/styles/[name].css',
            chunkFilename: '[id].css',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(scss|css)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 2,
                            sourceMap: false,
                            modules: false,
                            // modules: true,
                        },
                    },
                    'postcss-loader',
                    'sass-loader',
                ],
            },
        ],
    },
    optimization: {
        // minimize: true,
        minimize: false,
    }
};

const mainProdConfig = merge(common, {
    mode: 'production',
    devtool: false,
    entry: {
        infinityScroll: [paths.src + '/js/infinityScroll.ts'],
    },
    output: {
        path: paths.dist,
        publicPath: '',
        // filename: 'js/[name].[contenthash].bundle.js',
        filename: 'js/[name].bundle.js',
        library: 'InfinityScroll', // Имя, под которым будет доступен класс
        libraryTarget: 'global', // Указываем, что класс добавляется в глобальный объект (window)
        // libraryTarget: 'window', // Указываем, что класс добавляется в глобальный объект (window)
        libraryExport: 'InfinityScroll', // Экспортирует конкретное свойство, а не весь объект
    },
    optimization: {
        // minimize: true,
        minimize: false,
        minimizer: [
            (compiler) => {
                const TerserPlugin = require('terser-webpack-plugin');
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            // pure_funcs: ['console.log'], // Удалить только console.log
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
        // runtimeChunk: {
        //     name: 'runtime',
        // },
        runtimeChunk: false,
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },
})

module.exports = [mainProdConfig, cssConfig]