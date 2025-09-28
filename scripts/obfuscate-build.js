const { obfuscateFile } = require('../obfuscate.config.js');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建混淆版本...');

// 检查编译输出是否存在
const compiledPath = path.join(__dirname, '../out/extension.js');
if (!fs.existsSync(compiledPath)) {
    console.error('❌ 编译文件不存在，请先运行 npm run compile');
    process.exit(1);
}

// 创建混淆版本
const obfuscatedPath = path.join(__dirname, '../out/extension_obfuscated.js');
obfuscateFile(compiledPath, obfuscatedPath);

// 备份原始文件并替换
const backupPath = path.join(__dirname, '../out/extension_original.js');
fs.copyFileSync(compiledPath, backupPath);
fs.copyFileSync(obfuscatedPath, compiledPath);

console.log('✅ 混淆构建完成！');
console.log(`📁 原始文件备份到: ${backupPath}`);
console.log(`📁 混淆文件位置: ${compiledPath}`);
console.log('🎯 现在可以运行 vsce package 进行打包');

