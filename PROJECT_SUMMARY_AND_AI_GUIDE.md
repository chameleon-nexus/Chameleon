# Chameleon生态系统项目总结与AI助手指南

## 项目概述

Chameleon生态系统是一个完整的AI代理管理平台，包含三个核心项目：

### 1. **chameleon** - VS Code扩展
- **位置**: `C:\Users\birds\Desktop\rpa\cursor\chameleon\`
- **类型**: TypeScript VS Code扩展
- **功能**: 为VS Code提供AI代理市场和管理界面

### 2. **agents-cli** - 命令行工具
- **位置**: `C:\Users\birds\Desktop\rpa\cursor\agents-cli\`
- **类型**: Node.js CLI工具
- **功能**: 通过命令行管理AI代理的安装、卸载、搜索等

### 3. **agents-registry** - 代理注册表
- **位置**: `C:\Users\birds\Desktop\rpa\cursor\agents-registry\`
- **类型**: GitHub数据仓库
- **功能**: 存储所有AI代理的元数据和文件

## 核心架构与数据流

```
GitHub Registry (agents-registry)
    ↓ (HTTP API)
VS Code Extension (chameleon) ←→ CLI Tool (agents-cli)
    ↓ (文件系统)
本地代理目录 (~/.claude/agents/, ~/.codex/agents/, ~/.copilot/agents/)
```

## 项目详细说明

### Chameleon VS Code扩展

**核心文件结构**:
```
src/
├── extension.ts                 # 扩展入口点
├── webviews/
│   ├── agentMarketplacePanel.ts # 代理市场UI
│   ├── navigationPanel.ts      # 主导航界面
│   └── loginPanel.ts           # 登录界面
├── services/
│   ├── agentRegistryService.ts # GitHub注册表交互
│   └── agentInstallerService.ts # 本地代理安装管理
└── utils/
    └── i18n.ts                 # 国际化支持
```

**关键功能**:
1. **多语言支持**: 支持中文、英文、日文等14种语言
2. **代理市场**: 浏览、搜索、安装GitHub注册表中的代理
3. **本地管理**: 安装/卸载代理到各CLI的官方目录
4. **配置管理**: 支持登录开关配置(`chameleon.requireLogin`)

**重要配置**:
- `package.json` 中的 `chameleon.requireLogin` 控制是否需要登录验证
- 支持Claude Code、Codex、Copilot三种CLI目标

### Agents-CLI 命令行工具

**核心文件结构**:
```
src/
├── cli.ts                      # CLI入口点
├── commands/
│   ├── search.ts              # 搜索代理
│   ├── install.ts             # 安装代理
│   ├── uninstall.ts           # 卸载代理
│   └── list.ts                # 列出已安装代理
└── services/
    ├── registry.ts            # 注册表服务
    └── installer.ts           # 安装服务
```

**支持的命令**:
```bash
agt search <query>                    # 搜索代理
agt install <author/agent-name>       # 安装代理
agt install <author/agent-name@version> # 安装特定版本
agt uninstall <author/agent-name>     # 卸载代理
agt list                             # 列出已安装代理
```

**安装路径**:
- Claude Code: `~/.claude/agents/`
- Codex: `~/.codex/agents/`
- Copilot: `~/.copilot/agents/`

**文件命名格式**: `author_agent-name_version.md`

### Agents-Registry 数据仓库

**数据结构**:
```
index/
├── main.json                   # 主索引(包含分类定义)
├── featured.json              # 精选代理列表
└── categories/
    ├── code-quality.json      # 代码质量分类
    ├── web-programming.json   # Web编程分类
    └── ...                    # 其他分类文件
agents/
└── <author>/
    └── <agent-name>/
        └── <agent-name>_v<version>.md
```

**数据格式示例**:
```json
{
  "id": "code-reviewer",
  "author": "chameleon-team",
  "name": {
    "en": "Code Reviewer",
    "zh": "代码审查助手"
  },
  "description": {
    "en": "AI-powered code review assistant",
    "zh": "AI驱动的代码审查助手"
  },
  "category": "code-quality",
  "version": "1.0.0",
  "compatibility": {
    "claude-code": true,
    "codex": true,
    "copilot": true
  }
}
```

## 最近完成的重要工作

### 1. 多语言显示修复
**问题**: Agent描述同时显示中英文，分类名称出现乱码
**解决方案**:
- 修改`getLocalizedText`函数优先显示当前语言
- 添加`categoryNameFixes`映射修复特定乱码问题
- 移除硬编码分类，改为动态从注册表加载

### 2. 安装功能实现
**问题**: VS Code界面只有"下载"功能，缺少真正的安装管理
**解决方案**:
- 实现`installAgent`和`uninstallAgent`方法
- 添加安装状态检查和UI状态更新
- 统一CLI和GUI的安装逻辑

### 3. 文件命名规范化
**问题**: 安装的代理文件缺少作者和版本信息
**解决方案**:
- 统一文件命名格式为`author_agent-name_version.md`
- 修改`getInstallPath`方法支持新格式
- 确保版本号处理(默认1.0.0，处理'latest')

### 4. 登录配置功能
**问题**: 扩展总是要求登录，无法跳过
**解决方案**:
- 添加`chameleon.requireLogin`配置项
- 修改启动逻辑根据配置决定显示登录页或导航页
- 更新注销逻辑支持配置检查

### 5. 数据一致性修复
**问题**: `featured.json`和`categories/*.json`数据不一致导致安装失败
**解决方案**:
- 确保代理同时存在于精选列表和对应分类中
- 移除所有模拟数据，只使用真实注册表数据
- 添加详细的调试日志

## 技术要点

### 国际化(i18n)
- 使用`l10n/`目录存储翻译文件
- 支持14种语言的完整翻译
- 动态语言检测和切换

### Content Security Policy (CSP)
- Webview使用严格的CSP策略
- 禁止内联事件处理器，使用事件委托
- 所有脚本必须通过nonce验证

### 代理ID格式
- 标准格式: `author/agent-name`
- 版本格式: `author/agent-name@version`
- 支持npm风格的包管理

### 错误处理
- 完整的错误捕获和用户友好的错误消息
- 网络请求失败的重试机制
- 文件操作的权限检查

## 开发和调试

### 构建命令
```bash
# Chameleon扩展
npm run compile          # TypeScript编译
npm run esbuild         # 生产构建
vsce package           # 打包VSIX

# Agents-CLI
npm run build          # 构建CLI
npm publish           # 发布到npm
```

### 调试技巧
1. **VS Code扩展**: 使用F5启动调试模式
2. **Webview调试**: 右键webview → "检查元素"
3. **CLI调试**: 使用`console.log`和`--verbose`标志
4. **网络调试**: 检查GitHub API响应和缓存

### 常见问题
1. **编译错误**: 检查TypeScript版本和依赖
2. **CSP错误**: 避免内联脚本，使用事件监听器
3. **网络错误**: 检查GitHub API限制和网络连接
4. **文件权限**: 确保目标目录可写

## AI助手使用指南

当其他AI助手需要帮助用户处理这些项目时，请注意：

### 关键文件优先级
1. **高优先级**: `agentMarketplacePanel.ts`, `agentInstallerService.ts`, `agentRegistryService.ts`
2. **中优先级**: `extension.ts`, `package.json`, CLI的`installer.ts`和`registry.ts`
3. **低优先级**: 翻译文件、样式文件、文档文件

### 修改原则
1. **数据一致性**: 确保注册表数据在所有地方保持一致
2. **多语言支持**: 任何UI文本都要考虑国际化
3. **向后兼容**: 保持现有API和配置的兼容性
4. **错误处理**: 添加适当的错误处理和用户反馈

### 测试要点
1. **多语言**: 测试中文、英文环境下的显示
2. **安装流程**: 测试完整的安装/卸载流程
3. **网络异常**: 测试网络失败时的降级处理
4. **权限问题**: 测试文件系统权限限制

## 项目状态

✅ **已完成**:
- 多语言显示修复
- 安装功能实现
- 登录配置功能
- 数据一致性修复
- VSIX打包优化

🔄 **持续维护**:
- 代理注册表内容更新
- 新语言支持添加
- 性能优化
- 用户反馈处理

📋 **未来计划**:
- 代理版本管理增强
- 本地代理开发工具
- 代理依赖管理
- 社区贡献工具

---

**最后更新**: 2025年9月30日
**版本**: Chameleon v0.1.0, CLI v1.6.1
**维护者**: Chameleon团队
