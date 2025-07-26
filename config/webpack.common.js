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
    function getTemplateFiles(dir, basePath = '') {
        const items = fs.readdirSync(path.resolve(__dirname, dir), { withFileTypes: true });
        let files = [];

        items.forEach(item => {
            if (item.isFile()) {
                const relativePath = basePath ? path.join(basePath, item.name) : item.name;
                files.push({
                    fullPath: path.join(dir, item.name),
                    relativePath: relativePath
                });
            } else if (item.isDirectory()) {
                const newBasePath = basePath ? path.join(basePath, item.name) : item.name;
                files = files.concat(getTemplateFiles(path.join(dir, item.name), newBasePath));
            }
        });

        return files;
    }

    const templateFiles = getTemplateFiles(templateDir);

    return templateFiles.map(fileInfo => {
        const item = path.basename(fileInfo.relativePath);
        const parts = item.split('.');
        const name = parts[0];
        const namedTitle = name.split('_').join(' ');
        const extension = parts[1];

        // Сохраняем структуру папок в filename
        const outputPath = fileInfo.relativePath.replace(path.extname(fileInfo.relativePath), '.html');

        return new HtmlWebpackPlugin({
            title: namedTitle,
            // TODO: уже не надо - убрать
            origName: name.replace('demoList_', ''),
            libVersion: process.env.VERSION,
            filename: outputPath, // Теперь включает путь с папками
            template: path.resolve(__dirname, fileInfo.fullPath),
            mode: process.env.mode,
            inject: process.env.mode === 'development',
            // inject: true,
            templateParameters: {
                escapeHtml,
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
        // new CleanWebpackPlugin(),
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