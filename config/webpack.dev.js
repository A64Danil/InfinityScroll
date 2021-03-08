const webpack = require('webpack')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const paths = require('./paths')


module.exports = merge(common, {
    // Set the mode to development or production
    mode: 'development',
    // Control how source maps are generated
    devtool: 'inline-source-map',
    devServer: {
        historyApiFallback: true,
        contentBase: paths.build,
        // open: true,
        compress: true,
        // hot: true,
        port: 8080,
    },
    plugins: [
        // Only update what has changed on hot reload
        new webpack.HotModuleReplacementPlugin(),
    ],
    module: {
        rules: [
            // CSS, PostCSS, Sass
            {
                test: /\.(scss|css)$/,
                // use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
                use: [
                    'style-loader',
                    {loader: 'css-loader', options: {sourceMap: true, importLoaders: 1, modules: false }},
                    {loader: 'postcss-loader', options: {sourceMap: true}},
                    {loader: 'sass-loader', options: {sourceMap: true}},
                ],
            },
        ],
    }
})