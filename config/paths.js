const path = require('path')

module.exports = {
    // Source files
    src: path.resolve(__dirname, '../src'),

    // Production build files
    build: path.resolve(__dirname, '../dist'),

    // Production build files
    lib: path.resolve(__dirname, '../lib'),

    // Static files that get copied to build folder
    public: path.resolve(__dirname, '../public'),
}