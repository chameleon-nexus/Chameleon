# Chameleon生态系统 - AI助手快速参考

## 🏗️ 三项目架构关系

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                        │
│               agents-registry (数据源)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ index/main.json (分类定义)                           │   │
│  │ index/featured.json (精选代理)                       │   │
│  │ index/categories/*.json (分类代理列表)               │   │
│  │ agents/author/agent-name/agent_v1.0.0.md (代理文件) │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   VS Code Extension                         │
│                  chameleon (用户界面)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ agentMarketplacePanel.ts (市场UI)                   │   │
│  │ agentRegistryService.ts (数据获取)                  │   │
│  │ agentInstallerService.ts (安装管理)                 │   │
│  │ navigationPanel.ts (主界面)                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │ 共享逻辑
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Command Line Tool                        │
│                  agents-cli (命令行)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ src/commands/install.ts (安装命令)                   │   │
│  │ src/commands/uninstall.ts (卸载命令)                 │   │
│  │ src/services/installer.ts (安装逻辑)                 │   │
│  │ src/services/registry.ts (注册表交互)                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │ 文件系统操作
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Local File System                        │
│                   本地代理存储目录                           │
│  ~/.claude/agents/author_agent-name_v1.0.0.md              │
│  ~/.codex/agents/author_agent-name_v1.0.0.md               │
│  ~/.copilot/agents/author_agent-name_v1.0.0.md             │
│  ~/.agents/installed.json (安装记录)                        │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 关键技术栈

| 项目 | 技术栈 | 主要依赖 |
|------|--------|----------|
| **chameleon** | TypeScript + VS Code API | vscode, esbuild, i18n |
| **agents-cli** | Node.js + Commander.js | commander, axios, fs-extra |
| **agents-registry** | JSON数据 + GitHub Pages | 静态文件托管 |

## 📁 核心文件映射表

### 需要同时修改的文件（数据一致性）
```
agents-registry/index/featured.json
agents-registry/index/categories/*.json
→ 添加/删除代理时必须同步更新
```

### 安装逻辑文件（功能一致性）
```
chameleon/src/services/agentInstallerService.ts
agents-cli/src/services/installer.ts
→ 安装路径、文件命名、版本处理逻辑必须一致
```

### 注册表交互文件（API一致性）
```
chameleon/src/services/agentRegistryService.ts
agents-cli/src/services/registry.ts
→ GitHub API调用、数据解析逻辑必须一致
```

## 🚨 修改时的注意事项

### 1. 数据一致性检查清单
- [ ] 代理在`featured.json`中存在
- [ ] 代理在对应的`categories/*.json`中存在
- [ ] 代理文件在`agents/author/agent-name/`目录中存在
- [ ] 多语言字段完整（至少en、zh）

### 2. 安装逻辑一致性检查清单
- [ ] 文件命名格式：`author_agent-name_version.md`
- [ ] 安装路径正确：`~/.claude/agents/`等
- [ ] 版本处理一致：默认1.0.0，处理'latest'
- [ ] 错误处理统一

### 3. UI国际化检查清单
- [ ] 所有用户可见文本都有翻译
- [ ] `getLocalizedText`函数正确调用
- [ ] 分类名称使用`categoryNameFixes`修复
- [ ] 当前语言检测正确

## 🐛 常见问题快速诊断

### 问题：代理安装失败 "Agent not found"
**检查顺序**：
1. `agents-registry/index/featured.json` 是否包含该代理
2. `agents-registry/index/categories/*.json` 对应分类是否包含该代理
3. 代理ID格式是否正确 (`author/agent-name`)

### 问题：分类显示乱码或英文
**检查顺序**：
1. `agentMarketplacePanel.ts` 中的 `categoryNameFixes` 映射
2. `getLocalizedText` 函数的 `categoryKey` 参数传递
3. `agents-registry/index/main.json` 中分类的多语言字段

### 问题：安装后文件名不正确
**检查顺序**：
1. `getInstallPath` 方法的文件名构造逻辑
2. `parseAgentId` 方法的解析结果
3. 版本号处理（确保不是'latest'）

### 问题：VS Code扩展无法加载
**检查顺序**：
1. `package.json` 中的 `vscode:prepublish` 脚本
2. TypeScript编译错误
3. CSP违规（检查内联事件处理器）

## 📋 快速修改模板

### 添加新代理
1. 在 `agents-registry/agents/author/agent-name/` 创建代理文件
2. 更新 `agents-registry/index/featured.json`
3. 更新对应的 `agents-registry/index/categories/*.json`
4. 提交并推送到GitHub

### 修复显示问题
1. 检查 `agentMarketplacePanel.ts` 的渲染逻辑
2. 更新 `getLocalizedText` 函数
3. 添加必要的 `categoryNameFixes` 映射
4. 重新编译和测试

### 添加新配置
1. 在 `package.json` 的 `contributes.configuration` 中添加
2. 在相关的 `.ts` 文件中读取配置
3. 更新相关的UI逻辑
4. 添加多语言翻译

---
**快速参考版本**: v1.0 | **最后更新**: 2025-09-30
