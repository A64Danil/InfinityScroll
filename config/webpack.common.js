const paths = require('./paths')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PrettierPlugin = require('prettier-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const path = require('path')
const fs = require('fs');

function escapeHtml(string) {
    return string
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .trim();
}


function generateHtmlPlugins(templateDir) {
    const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
    return templateFiles.map(item => {
        const parts = item.split('.');
        const name = parts[0];
        const namedTitle = name.split('_').join(' ');
        const extension = parts[1];
        // console.log(path.resolve(__dirname, `${templateDir}/${name}.${extension}`))
        return new HtmlWebpackPlugin({
            title: namedTitle,
            origName: name.replace('demoList_', ''),
            filename: `${name}.html`,
            template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
            mode: process.env.mode,
            inject: process.env.mode === 'development',
            // inject: true,
            templateParameters: {
                escapeHtml, // Передаём функцию экранирования в шаблон
            },
        })
    })
}

const htmlPlugins = generateHtmlPlugins('./../src/html/views');

module.exports = {
    entry: {
        // main: path.resolve(__dirname, './src/index.js'),
        // main: [paths.src + '/index.js'],
        main: [paths.src + '/index.ts'],
    },
    output: {
        path: paths.build,
        filename: '[name].bundle.js',
        publicPath: '/', // добавлено
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    plugins: [
        new CleanWebpackPlugin(),
        // Copies files from target to destination folder
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: paths.public,
                    to: 'assets',
                    globOptions: {
                        ignore: ['*.DS_Store'],
                    },
                    noErrorOnMissing: true,
                },
                {
                    from: paths.mocks,
                    to: 'assets/json',
                    globOptions: {
                        ignore: ['*.DS_Store', '*.js', 'db.json', 'bigList10.json'],
                    },
                    noErrorOnMissing: true,
                },
            ],
        }),

        // ESLint configuration
        new ESLintPlugin({
            files: ['.', 'src', 'config'],
            formatter: 'table',
        }),

        // Prettier configuration
        // TODO: отключаем на время билда
        // new PrettierPlugin(),
    ].concat(htmlPlugins),
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
            // изображения
            {
                test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
                type: 'asset/resource',
            },
            // шрифты и SVG
            {
                test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
                type: 'asset/inline',
            },
            // CSS, PostCSS, Sass
            // {
            //     test: /\.(scss|css)$/,
            //     use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
            // },
        ],
    }
}