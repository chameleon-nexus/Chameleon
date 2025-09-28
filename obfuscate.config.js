const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// 简化的混淆配置，适合VS Code扩展
const obfuscationOptions = {
    // 基础混淆
    compact: true,
    
    // 控制流混淆（轻度）
    controlFlowFlattening: false,
    controlFlowFlatteningThreshold: 0.1,
    
    // 死代码注入（禁用，可能导致扩展问题）
    deadCodeInjection: false,
    
    // 调试保护（禁用，影响调试）
    debugProtection: false,
    debugProtectionInterval: 0,
    
    // 禁用console输出
    disableConsoleOutput: true,
    
    // 标识符生成器
    identifierNamesGenerator: 'hexadecimal',
    
    // 日志
    log: false,
    
    // 数字表达式转换（轻度）
    numbersToExpressions: false,
    
    // 重命名全局变量（禁用，VS Code扩展需要）
    renameGlobals: false,
    
    // 自我保护（禁用，可能导致问题）
    selfDefending: false,
    
    // 简化
    simplify: true,
    
    // 字符串分割
    splitStrings: true,
    splitStringsChunkLength: 10,
    
    // 字符串数组
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['none'], // 修复：必须是数组，且值必须有效
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    
    // 对象键转换（禁用，VS Code API需要）
    transformObjectKeys: false,
    
    // Unicode转义
    unicodeEscapeSequence: false
};

function obfuscateFile(inputPath, outputPath) {
    try {
        console.log(`正在混淆文件: ${inputPath}`);
        
        const sourceCode = fs.readFileSync(inputPath, 'utf8');
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions);
        
        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, obfuscatedCode.getObfuscatedCode());
        console.log(`混淆完成: ${outputPath}`);
        
        const originalSize = fs.statSync(inputPath).size;
        const obfuscatedSize = fs.statSync(outputPath).size;
        console.log(`原始大小: ${originalSize} bytes`);
        console.log(`混淆后大小: ${obfuscatedSize} bytes`);
        console.log(`压缩率: ${((1 - obfuscatedSize / originalSize) * 100).toFixed(2)}%`);
        
    } catch (error) {
        console.error('混淆失败:', error);
        process.exit(1);
    }
}

module.exports = {
    obfuscateFile,
    obfuscationOptions
};
