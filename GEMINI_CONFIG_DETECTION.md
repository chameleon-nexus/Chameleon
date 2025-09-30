# Gemini CLI OpenRouter 配置检测功能

## 功能概述

为Gemini页面的第三方模式（gemini-router）添加了配置检测功能，与Claude页面的第三方模式保持一致。现在会自动检测Gemini CLI OpenRouter的配置状态。

## 实现的功能

### 1. 配置文件检测
- 检测路径：`~/.gemini-cli-openrouter/config.json`
- 检测配置项：`OPENROUTER_API_KEY`
- 验证API密钥是否已设置且非空

### 2. UI显示增强
- 在依赖列表中显示"Gemini CLI OpenRouter 配置"
- 显示配置状态：已配置/未配置
- 提供配置按钮直接跳转到设置页面

### 3. 配置引导
- 点击配置按钮直接打开Chameleon设置页面
- 显示友好的配置提示信息
- 与Claude Router配置保持一致的用户体验

## 技术实现

### 1. 后端检测逻辑 (extension.ts)
```typescript
// 检查Gemini CLI OpenRouter配置文件是否存在
async function checkGeminiOpenRouterConfig(): Promise<boolean> {
    try {
        const os = require('os');
        const fs = require('fs');
        const configPath = path.join(os.homedir(), '.gemini-cli-openrouter', 'config.json');
        
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return config && config.OPENROUTER_API_KEY && config.OPENROUTER_API_KEY.trim() !== '';
        }
        
        return false;
    } catch (error) {
        return false;
    }
}
```

### 2. 依赖检测集成
在`checkModeDependencies`函数中的gemini-router模式：
```typescript
case 'gemini-router':
    result = {
        ...baseDeps,
        '@chameleon-nexus-tech/gemini-cli-openrouter': await checkNpmPackage('@chameleon-nexus-tech/gemini-cli-openrouter'),
        'gemini-cli-openrouter-config': await checkGeminiOpenRouterConfig(),
    };
    break;
```

### 3. 前端UI更新 (geminiWelcomePanel.ts)
- 更新`getDepDisplayName`函数添加配置项显示名称
- 更新`getModeDependencies`函数包含配置检测
- 添加配置状态显示逻辑
- 添加配置按钮和点击处理

## 检测机制

### 配置文件结构
```json
{
    "OPENROUTER_API_KEY": "your-api-key-here"
}
```

### 检测逻辑
1. 检查配置文件是否存在：`~/.gemini-cli-openrouter/config.json`
2. 解析JSON配置文件
3. 验证`OPENROUTER_API_KEY`字段存在且非空
4. 返回布尔值结果

## 支持的模式

### Gemini Native模式 (官方)
- 检测基础依赖：Node.js, Git, NPM
- 检测Gemini CLI (官方)包

### Gemini Router模式 (第三方)  
- 检测基础依赖：Node.js, Git, NPM
- 检测Gemini CLI OpenRouter包
- **新增**：检测Gemini CLI OpenRouter配置

## 多语言支持

### 英文 (en/geminiWelcome.json)
```json
{
  "configRouter": "Gemini CLI OpenRouter Configuration",
  "configureInSettings": "Please configure Gemini CLI OpenRouter in settings"
}
```

### 中文 (zh/geminiWelcome.json)
```json
{
  "configRouter": "Gemini CLI OpenRouter 配置",
  "configureInSettings": "请在设置页面中配置Gemini CLI OpenRouter"
}
```

## 用户体验改进

1. **统一体验**: 与Claude页面的配置检测保持一致
2. **实时反馈**: 显示清晰的已配置/未配置状态
3. **一键配置**: 点击按钮直接跳转到设置页面
4. **多语言**: 支持中英文界面显示

## 依赖显示顺序

### Gemini Router模式依赖列表
1. Node.js
2. Git
3. NPM
4. Gemini CLI OpenRouter包
5. **Gemini CLI OpenRouter配置** ← 新增

## 配置流程

1. 用户选择"Gemini CLI (第三方)"模式
2. 系统检测依赖状态，包括配置状态
3. 如果配置未完成，显示"未配置"状态
4. 用户点击"点击配置"按钮
5. 系统打开Chameleon设置页面
6. 用户在设置页面配置API密钥
7. 返回Gemini页面点击"重新检查依赖"验证配置

## 技术特点

- **文件系统检测**: 直接检查配置文件存在性和内容
- **JSON解析**: 安全的配置文件解析和验证
- **错误处理**: 完善的异常捕获和默认值处理
- **跨平台**: 支持Windows、macOS、Linux

## 测试方法

1. 打开VS Code
2. 启动Chameleon扩展
3. 进入Gemini页面
4. 选择"Gemini CLI (第三方)"模式
5. 查看依赖状态列表中的"Gemini CLI OpenRouter 配置"项
6. 验证显示的配置状态是否正确
7. 测试配置按钮功能

## 更新日志

- **v0.1.1**: 为Gemini页面第三方模式添加配置检测功能
- 与Claude页面保持一致的用户体验
- 支持OpenRouter API密钥配置检测
- 添加多语言支持
