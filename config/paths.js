const path = require('path')

module.exports = {
    // Source files
    src: path.resolve(__dirname, '../src'),

    // Production build files
    build: path.resolve(__dirname, '../build'),

    // Production finish files
    dist: path.resolve(__dirname, '../dist'),

    // Only library files
    lib: path.resolve(__dirname, '../lib'),

    // Bad useless files
    delete: path.resolve(__dirname, '../delete'),

    // Static files that get copied to build folder
    public: path.resolve(__dirname, '../public'),
}