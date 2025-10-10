# SpecKit-CN 集成到 Chameleon 依赖检测

本文档说明如何在 Chameleon 项目中添加 SpecKit-CN 的依赖检测和自动安装功能。

## 📋 功能说明

在 Claude 页面的依赖检测中添加 **SpecKit-CN** 项目，支持：
- ✅ 检测 SpecKit-CN 是否已安装
- ✅ 一键自动安装 SpecKit-CN
  - 将 `claude/.specify/` 复制到项目根目录的 `.specify/`
  - 将 `claude/.claude/commands/` 复制到用户目录 `C:\Users\{username}\.claude\commands`

---

## 🔧 修改步骤

### 步骤 1: 修改 `src/extension.ts`

#### 1.1 在 `checkModeDependencies` 函数中添加 SpecKit-CN 检测

找到第 263-273 行的 `claude-router` 分支，修改为：

```typescript
case 'claude-router':
    console.log('[Extension] 检测 claude-router 模式依赖');
    result = {
        'node': baseDeps.node,
        'git': baseDeps.git,
        'npm': baseDeps.npm,
        '@anthropic-ai/claude-code': await checkNpmPackage('@anthropic-ai/claude-code'),
        '@chameleon-nexus-tech/claude-code-router': await checkNpmPackage('@chameleon-nexus-tech/claude-code-router'),
        'claude-code-router-config': await checkCCRConfig(),
        'speckit-cn': await checkSpecKitCN(),  // 新增：检测 SpecKit-CN
    };
    break;
```

#### 1.2 在文件末尾（第 416 行之后）添加检测函数

```typescript
// 检查 SpecKit-CN 是否已安装
async function checkSpecKitCN(): Promise<boolean> {
    try {
        const fs = require('fs');
        const os = require('os');
        
        // 检查两个位置：
        // 1. 项目根目录的 .specify
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return false;
        }
        
        const projectRoot = workspaceFolders[0].uri.fsPath;
        const projectSpecifyPath = path.join(projectRoot, '.specify');
        
        // 2. 用户目录的 .claude/commands
        const userCommandsPath = path.join(os.homedir(), '.claude', 'commands');
        
        // 检查关键文件是否存在
        const projectExists = fs.existsSync(projectSpecifyPath) && 
                            fs.existsSync(path.join(projectSpecifyPath, 'templates'));
        
        const userExists = fs.existsSync(userCommandsPath) &&
                         fs.existsSync(path.join(userCommandsPath, '提需求.md'));
        
        console.log('[Extension] SpecKit-CN 检测结果:', { projectExists, userExists });
        
        return projectExists && userExists;
    } catch (error) {
        console.error('[Extension] SpecKit-CN 检测失败:', error);
        return false;
    }
}

// 安装 SpecKit-CN
async function installSpecKitCN(): Promise<boolean> {
    try {
        const fs = require('fs');
        const os = require('os');
        const { promisify } = require('util');
        const copyFile = promisify(fs.copyFile);
        const mkdir = promisify(fs.mkdir);
        const readdir = promisify(fs.readdir);
        const stat = promisify(fs.stat);
        
        // GitHub 仓库 URL
        const REPO_URL = 'https://github.com/chameleon-nexus/speckit-cn';
        const TEMP_DIR = path.join(os.tmpdir(), 'speckit-cn-temp');
        
        vscode.window.showInformationMessage('开始下载 SpecKit-CN...');
        
        // 1. 克隆仓库到临时目录
        const { spawn } = require('child_process');
        await new Promise((resolve, reject) => {
            // 如果临时目录已存在，先删除
            if (fs.existsSync(TEMP_DIR)) {
                fs.rmSync(TEMP_DIR, { recursive: true, force: true });
            }
            
            const gitClone = spawn('git', ['clone', '--depth', '1', REPO_URL, TEMP_DIR], {
                stdio: 'pipe'
            });
            
            gitClone.on('close', (code: number) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Git clone 失败，退出码: ${code}`));
                }
            });
            
            gitClone.on('error', (error: Error) => {
                reject(error);
            });
        });
        
        vscode.window.showInformationMessage('下载完成，开始安装...');
        
        // 2. 复制文件
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('未找到工作区文件夹');
        }
        
        const projectRoot = workspaceFolders[0].uri.fsPath;
        
        // 递归复制目录函数
        async function copyDir(src: string, dest: string) {
            await mkdir(dest, { recursive: true });
            const entries = await readdir(src, { withFileTypes: true });
            
            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                
                if (entry.isDirectory()) {
                    await copyDir(srcPath, destPath);
                } else {
                    await copyFile(srcPath, destPath);
                }
            }
        }
        
        // 复制 .specify 到项目根目录
        const sourceSpecifyPath = path.join(TEMP_DIR, 'claude', '.specify');
        const destSpecifyPath = path.join(projectRoot, '.specify');
        
        if (fs.existsSync(sourceSpecifyPath)) {
            console.log('[Extension] 复制 .specify 到项目根目录:', destSpecifyPath);
            await copyDir(sourceSpecifyPath, destSpecifyPath);
        }
        
        // 复制 .claude/commands 到用户目录
        const sourceCommandsPath = path.join(TEMP_DIR, 'claude', '.claude', 'commands');
        const destCommandsPath = path.join(os.homedir(), '.claude', 'commands');
        
        if (fs.existsSync(sourceCommandsPath)) {
            console.log('[Extension] 复制 commands 到用户目录:', destCommandsPath);
            await copyDir(sourceCommandsPath, destCommandsPath);
        }
        
        // 3. 清理临时目录
        if (fs.existsSync(TEMP_DIR)) {
            fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        }
        
        vscode.window.showInformationMessage('✅ SpecKit-CN 安装完成！');
        return true;
        
    } catch (error) {
        console.error('[Extension] SpecKit-CN 安装失败:', error);
        vscode.window.showErrorMessage(`SpecKit-CN 安装失败: ${(error as Error).message}`);
        return false;
    }
}
```

#### 1.3 注册安装命令

在第 58 行附近（commands 注册区域）添加：

```typescript
vscode.commands.registerCommand('chameleon.installSpecKitCN', async () => {
    const result = await installSpecKitCN();
    if (result) {
        // 重新检测依赖
        vscode.commands.executeCommand('chameleon.checkDependencies', 'claude-router');
    }
}),
```

---

### 步骤 2: 修改 `src/webviews/claudeWelcomePanel.ts`

#### 2.1 在 `_setWebviewMessageListener` 方法中添加消息处理

找到第 103-106 行的 switch 语句，添加新的 case：

```typescript
case 'installDependency':
    await this.installDependency(message.dependency);
    break;
case 'installSpecKitCN':  // 新增
    await this.installSpecKitCN();
    break;
```

#### 2.2 添加安装方法

在第 250 行（installDependency 方法之后）添加：

```typescript
private async installSpecKitCN() {
    try {
        vscode.window.showInformationMessage('开始安装 SpecKit-CN...');
        
        const result = await vscode.commands.executeCommand('chameleon.installSpecKitCN');
        
        if (result) {
            // 安装成功，重新检测依赖
            await this.checkDependencies();
        }
    } catch (error) {
        vscode.window.showErrorMessage(`SpecKit-CN 安装失败: ${(error as Error).message}`);
    }
}
```

#### 2.3 修改前端 HTML - 更新 getModeDependencies 函数

找到第 604-612 行的 `getModeDependencies` 函数，修改为：

```javascript
function getModeDependencies(mode) {
    if (mode === 'claude-native') {
        return ['@anthropic-ai/claude-code'];
    }
    if (mode === 'claude-router') {
        return [
            '@chameleon-nexus-tech/claude-code-router', 
            'claude-code-router-config',
            'speckit-cn'  // 新增
        ];
    }
    return [];
}
```

#### 2.4 更新前端显示名称

找到第 730-739 行的 `getDepDisplayName` 函数，添加：

```javascript
function getDepDisplayName(dep) {
    const names = {
        'node': 'Node.js',
        'git': 'Git',
        '@anthropic-ai/claude-code': 'Claude Code (Official)',
        '@chameleon-nexus-tech/claude-code-router': 'Claude Code Router (Chameleon Nexus Fork)',
        'claude-code-router-config': 'Claude Code Router Configuration',
        'speckit-cn': 'SpecKit-CN (中文规格驱动开发工具)'  // 新增
    };
    return names[dep] || dep;
}
```

#### 2.5 修改前端安装按钮逻辑

找到第 682-704 行的按钮创建逻辑，修改为：

```javascript
if (dep === 'claude-code-router-config') {
    const configBtn = document.createElement('button');
    configBtn.className = 'install-btn';
    configBtn.textContent = L.clickToConfigure;
    configBtn.onclick = () => openInstallPage(dep);
    buttonContainer.appendChild(configBtn);
} else if (dep === 'speckit-cn') {  // 新增：特殊处理 SpecKit-CN
    const installBtn = document.createElement('button');
    installBtn.className = 'install-btn';
    installBtn.textContent = '一键安装';
    installBtn.onclick = () => installSpecKitCN();
    buttonContainer.appendChild(installBtn);
    
    const websiteBtn = document.createElement('button');
    websiteBtn.className = 'install-btn';
    websiteBtn.textContent = L.buttonWebsite;
    websiteBtn.onclick = () => openInstallPage(dep);
    buttonContainer.appendChild(websiteBtn);
} else {
    // 原有逻辑...
}
```

#### 2.6 添加前端 installSpecKitCN 函数

在第 777 行（installDependency 函数之后）添加：

```javascript
function installSpecKitCN() {
    console.log('[ClaudeFrontend] installSpecKitCN called');
    vscode.postMessage({
        command: 'installSpecKitCN'
    });
}
```

#### 2.7 更新 openInstallPage 函数

找到第 751-759 行的 `urls` 对象，添加：

```javascript
const urls = {
    'node': 'https://nodejs.org/',
    'git': 'https://git-scm.com/downloads',
    'npm': 'https://www.npmjs.com/',
    '@anthropic-ai/claude-code': 'https://github.com/anthropics/claude-code',
    '@chameleon-nexus-tech/claude-code-router': 'https://github.com/chameleon-nexus/claude-code-router',
    'speckit-cn': 'https://github.com/chameleon-nexus/speckit-cn'  // 新增
};
```

---

## 🎯 修改完成后的效果

### 依赖检测显示

在 Claude 页面会显示：

```
📋 依赖检测

● Node.js - 已安装
● Git - 已安装  
● npm - 已安装
● Claude Code (Official) - 已安装
● Claude Code Router (Chameleon Nexus Fork) - 已安装
● Claude Code Router Configuration - 已配置
● SpecKit-CN (中文规格驱动开发工具) - 未安装
  [一键安装] [官网]
```

### 安装过程

1. 用户点击"一键安装"按钮
2. 系统自动从 GitHub 克隆 SpecKit-CN 仓库
3. 复制文件到指定位置：
   - `.specify/` → 项目根目录
   - `.claude/commands/` → 用户目录
4. 显示安装完成提示
5. 自动重新检测依赖，状态变为"已安装"

---

## 📝 使用说明

### 安装后的文件位置

```
项目目录/
└── .specify/
    ├── memory/
    │   └── constitution.md
    ├── scripts/
    │   └── powershell/
    └── templates/

C:\Users\{username}\
└── .claude\
    └── commands\
        ├── 提需求.md
        ├── 需求变更.md
        ├── 定规则.md
        ├── 定计划.md
        ├── 分任务.md
        ├── 测试清单.md
        ├── 一致性分析.md
        └── 开始开发.md
```

### 使用 SpecKit-CN 命令

安装完成后，在 Chameleon 的 Claude Code 中可以直接使用：

```bash
/提需求 创建一个博客系统
/定计划
/分任务
/开始开发
```

---

## 🐛 故障排除

### 安装失败

**问题**: Git clone 失败
**解决**: 
1. 确保已安装 Git
2. 检查网络连接
3. 手动克隆仓库后再试

**问题**: 文件复制失败
**解决**:
1. 检查目标目录权限
2. 确保磁盘空间充足
3. 手动创建必要的目录

### 检测失败

**问题**: 安装后仍显示未安装
**解决**:
1. 点击"重新检测依赖"按钮
2. 重启 VS Code
3. 手动检查文件是否存在

---

## 📞 支持

- **SpecKit-CN**: https://github.com/chameleon-nexus/speckit-cn
- **Chameleon**: https://github.com/chameleon-nexus/Chameleon


