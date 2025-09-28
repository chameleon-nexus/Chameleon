const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const JavaScriptObfuscator = require('javascript-obfuscator');

module.exports = {
    entry: './src/extension.ts',
    target: 'node',
    mode: 'production',
    externals: {
        vscode: 'commonjs vscode'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'extension.js',
        path: path.resolve(__dirname, 'out'),
        libraryTarget: 'commonjs2'
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    mangle: true,
                    compress: {
                        drop_console: true,
                        drop_debugger: true,
                        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
                    },
                    format: {
                        comments: false
                    }
                },
                extractComments: false
            })
        ]
    },
    plugins: [
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tapAsync('ObfuscatePlugin', (compilation, callback) => {
                    const obfuscationResult = JavaScriptObfuscator.obfuscate(
                        compilation.assets['extension.js'].source(),
                        {
                            // 混淆选项
                            compact: true,
                            controlFlowFlattening: true,
                            controlFlowFlatteningThreshold: 1,
                            deadCodeInjection: true,
                            deadCodeInjectionThreshold: 0.4,
                            debugProtection: true,
                            debugProtectionInterval: 4000,
                            disableConsoleOutput: true,
                            identifierNamesGenerator: 'hexadecimal',
                            log: false,
                            numbersToExpressions: true,
                            renameGlobals: false,
                            selfDefending: true,
                            simplify: true,
                            splitStrings: true,
                            splitStringsChunkLength: 5,
                            stringArray: true,
                            stringArrayCallsTransform: true,
                            stringArrayEncoding: ['base64'],
                            stringArrayIndexShift: true,
                            stringArrayRotate: true,
                            stringArrayShuffle: true,
                            stringArrayWrappersCount: 2,
                            stringArrayWrappersChainedCalls: true,
                            stringArrayWrappersParametersMaxCount: 4,
                            stringArrayWrappersType: 'function',
                            stringArrayThreshold: 1,
                            transformObjectKeys: true,
                            unicodeEscapeSequence: false
                        }
                    );
                    
                    compilation.assets['extension.js'] = {
                        source: () => obfuscationResult.getObfuscatedCode(),
                        size: () => obfuscationResult.getObfuscatedCode().length
                    };
                    
                    callback();
                });
            }
        }
    ]
};

