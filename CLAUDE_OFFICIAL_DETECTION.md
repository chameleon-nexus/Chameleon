# Claude Code (Official) NPM包检测功能

## 功能概述

在Chameleon扩展的Claude页面中，现在会自动检测是否已通过npm全局安装了"Claude Code (Official)"包（`@anthropic-ai/claude-code`），并在依赖状态列表中显示其安装状态。

## 实现的功能

### 1. NPM包安装状态检测
- 使用`checkNpmPackage('@anthropic-ai/claude-code')`函数检测npm包是否已全局安装
- 在Claude页面的依赖检查中显示检测结果
- 支持claude-native和claude-router两种模式

### 2. UI显示增强
- 在依赖列表中显示"Claude Code (Official)"
- 显示安装状态：已安装/未安装
- 提供安装按钮和npm官网链接

### 3. 安装引导
- 点击安装按钮在终端中执行`npm install -g @anthropic-ai/claude-code`
- 点击官网按钮跳转到npm包页面
- 提供完整的安装命令执行

## 技术实现

### 1. 后端检测逻辑 (extension.ts)
```typescript
// 使用现有的checkNpmPackage函数检测
'@anthropic-ai/claude-code': await checkNpmPackage('@anthropic-ai/claude-code')
```

### 2. 依赖检测集成
在`checkModeDependencies`函数中：
- **claude-native模式**: 检测`@anthropic-ai/claude-code`包
- **claude-router模式**: 同时检测`@anthropic-ai/claude-code`和路由器包

### 3. 前端UI更新 (claudeWelcomePanel.ts)
- 更新`getDepDisplayName`函数显示"Claude Code (Official)"
- 更新`openInstallPage`函数跳转到npm包页面
- 更新`installDependency`函数执行npm安装命令

## 检测机制

### NPM包检测方法
```bash
npm list -g @anthropic-ai/claude-code
```

### 检测逻辑
1. 执行npm list命令
2. 检查命令返回码（0表示已安装）
3. 处理超时和错误情况
4. 返回布尔值结果

## 安装流程

### 自动安装
1. 用户点击"安装"按钮
2. 系统在终端中执行：`npm install -g @anthropic-ai/claude-code`
3. 用户可以在终端中查看安装进度
4. 安装完成后可点击"重新检查依赖"验证

### 手动安装
用户也可以手动在终端中执行：
```bash
npm install -g @anthropic-ai/claude-code
```

## 支持的模式

### Claude Native模式
依赖检测顺序：
1. Node.js
2. Git  
3. NPM
4. **Claude Code (Official)** - 显示在npm之后

### Claude Router模式  
依赖检测顺序：
1. Node.js
2. Git
3. NPM
4. **Claude Code (Official)** - 显示在npm之后
5. Claude Code Router (Chameleon Nexus Fork)
6. Claude Code Router Configuration

## 用户体验改进

1. **统一检测**: 在一个界面中查看所有Claude相关依赖
2. **实时反馈**: 显示清晰的安装/未安装状态
3. **一键安装**: 点击按钮直接执行安装命令
4. **官网链接**: 提供npm包页面链接供用户查看详情

## 技术特点

- **准确检测**: 使用npm官方命令，检测结果可靠
- **跨平台**: 支持Windows、macOS、Linux
- **超时处理**: 15秒超时机制防止卡死
- **错误处理**: 完善的错误捕获和用户提示

## 测试方法

1. 打开VS Code
2. 启动Chameleon扩展
3. 进入Claude页面
4. 查看依赖状态列表中的"Claude Code (Official)"项
5. 验证显示的安装状态是否正确
6. 测试安装按钮功能（如果未安装）

## 注意事项

- 检测的是全局npm包安装状态
- 需要npm环境正确配置
- 安装需要网络连接
- 某些环境可能需要管理员权限

## 更新日志

- **v0.1.1**: 修正Claude Code (Official)检测逻辑
- 使用npm包检测替代VS Code扩展检测
- 更新显示名称和安装链接
- 简化安装流程
