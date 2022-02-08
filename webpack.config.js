const { resolve } = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    target: 'web',
    stats: 'minimal',
    mode: isProduction ? 'production' : 'development',
    devtool: false,
    entry: {
        index: resolve(__dirname, 'src', 'index.ts'),
    },
    output: {
        libraryTarget: 'commonjs2',
        libraryExport: 'default',
        path: __dirname,
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {},
                    },
                ],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        targets: 'Chromium 87',
                                    },
                                ],
                            ],
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
        extensions: [
            '.js',
            '.json',
            '.ts',
        ],
        mainFiles: ['index'],
    },
    optimization: isProduction ? {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    toplevel: true,
                },
            }),
        ],
    } : undefined,
};
