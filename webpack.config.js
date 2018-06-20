const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        library: 'faultfixers-react-native-lib',
        libraryTarget: 'commonjs2',
    },
    externals: [
        {
            'faultfixers-js-lib': 'faultfixers-js-lib',
            moment: 'moment',
            'prop-types': 'prop-types',
            react: 'react',
            'react-moment': 'react-moment',
            'react-native': 'react-native',
        },
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['babel-loader'],
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin(),
    ],
};
