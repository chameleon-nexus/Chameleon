# AGTHub Integration for Chameleon VS Code Extension

## 概述

Chameleon VS Code 插件现已完全集成 AGTHub Agent 市场，支持：
- 🔍 从 AGTHub 搜索和浏览 Agents
- 📥 下载并安装 Agents
- 📤 发布自己的 Agents
- ⭐ 对 Agents 进行评分
- 🔐 邮箱验证码登录

## 配置

### 1. AGTHub API URL 配置

在 VS Code 设置中，可以配置 AGTHub API 地址：

**文件 > 首选项 > 设置** 或 `Cmd/Ctrl + ,`

搜索 `chameleon.agtHubApiUrl`

```json
{
  "chameleon.agtHubApiUrl": "https://agthub.vercel.app"
}
```

可选值：
- **生产环境**: `https://agthub.vercel.app` (默认)
- **本地开发**: `http://localhost:3000`
- **自定义域名**: `https://your-agthub-domain.com`

### 2. 切换数据源

默认使用 AGTHub 作为数据源（`useAGTHub = true`）

如需切换回 GitHub Registry，可在代码中修改：
```typescript
// src/webviews/agentMarketplacePanel.ts
private useAGTHub: boolean = false; // 改为 false 使用 GitHub Registry
```

## 功能说明

### 🔐 登录功能

1. **点击 "Login" 按钮**
2. **输入邮箱地址**
3. **点击 "Send Code" 获取验证码**
4. **输入6位验证码**
5. **点击 "Login" 完成登录**

登录后：
- 显示用户名
- 显示 "Publish Agent" 按钮
- 显示 "Logout" 按钮
- 可以对 Agents 进行评分

### 📤 发布 Agent

**前提条件**：需要先登录

1. **点击 "Publish Agent" 按钮**
2. **填写必填字段**：
   - Agent ID: 唯一标识符（如：`my-agent`）
   - Version: 版本号（如：`1.0.0`）
   - Category: 分类
   - Tags: 标签（逗号分隔）
   - Name (English): 英文名称
   - Description (English): 英文描述
   - License: 许可证（默认 MIT）
   - Agent Content: Markdown 格式的 Agent 内容

3. **可选字段**：
   - Name (Chinese): 中文名称
   - Description (Chinese): 中文描述
   - Homepage URL: 主页链接

4. **点击 "Publish" 提交**

**审核机制**：
- 如果包含敏感词，Agent 会进入 "Pending Review" 状态
- 管理员审核通过后才会显示
- 正常发布的 Agent 会立即显示

### ⭐ 评分功能

**前提条件**：需要先登录

1. **在 Agent 卡片下方看到 "Rate this agent:" 区域**
2. **点击星星进行评分（1-5星）**
3. **评分会立即提交并更新**

评分特点：
- 使用 IMDb 式贝叶斯平均算法
- 每个用户对每个 Agent 只能评分一次
- 可以修改已提交的评分
- 显示总评分和评分人数

### 📥 下载/安装 Agent

1. **搜索或浏览 Agents**
2. **点击 "Download to Claude Code" 或 "Download to Codex" 按钮**
3. **Agent 会自动下载并安装到对应目录**

安装位置：
- **Claude Code**: `~/.claude/agents/`
- **Codex**: `AGENTS.md` 文件

### 🔍 搜索和筛选

- **CLI Type 筛选**: Claude Code / Codex
- **Category 筛选**: 按分类浏览
- **关键词搜索**: 搜索 Agent 名称、描述、标签

## API 端点

| 功能 | 端点 | 方法 | 认证 |
|------|------|------|------|
| 搜索 Agents | `/api/agents/search` | GET | 否 |
| Agent 详情 | `/api/agents/:id` | GET | 否 |
| 下载 Agent | `/api/agents/:id/download` | GET | 否 |
| 发布 Agent | `/api/agents/publish` | POST | 是 |
| 评分 | `/api/agents/:id/rate` | POST | 是 |
| 删除评分 | `/api/agents/:id/rate` | DELETE | 是 |
| 登录 | `/api/cli/login` | POST | 否 |
| 发送验证码 | `/api/auth/send-code` | POST | 否 |

## 开发调试

### 本地开发环境

1. **启动 AGTHub 本地服务器**：
```bash
cd c:\Users\birds\Desktop\rpa\cursor\agthub
npm run dev
# 运行在 http://localhost:3000
```

2. **修改 Chameleon 配置**：
```json
{
  "chameleon.agtHubApiUrl": "http://localhost:3000"
}
```

3. **重启 VS Code 或重新加载窗口**

### 调试日志

所有操作都会在 VS Code 开发者控制台输出日志：
- **Help > Toggle Developer Tools** 或 `Cmd/Ctrl + Shift + I`
- 查看 **Console** 标签页

## 数据流程

```
VS Code Extension (Frontend)
    ↕️
AGTHubService (API Client)
    ↕️
AGTHub Backend (API Server)
    ↕️
PostgreSQL Database
```

## 故障排除

### 问题：无法登录

**解决方案**：
1. 检查 API URL 配置是否正确
2. 确认 AGTHub 服务器正在运行
3. 检查邮箱是否在黑名单中
4. 查看 VS Code 开发者控制台的错误信息

### 问题：发布失败

**解决方案**：
1. 确认已登录
2. 检查所有必填字段是否填写
3. 查看是否包含敏感词（会进入审核）
4. 检查网络连接

### 问题：评分不生效

**解决方案**：
1. 确认已登录
2. 刷新 Agent 列表
3. 检查开发者控制台错误信息

## 注意事项

⚠️ **重要提示**：

1. **登录状态**：Token 存储在 VS Code GlobalState，关闭 VS Code 后仍然保持登录
2. **发布内容**：确保发布的内容符合社区规范，避免包含敏感词
3. **评分限制**：每个用户对每个 Agent 只能评分一次（可修改）
4. **数据缓存**：搜索结果会缓存 5 分钟以提升性能

## 技术栈

- **Frontend**: VS Code Webview (HTML/CSS/JavaScript)
- **Backend Service**: TypeScript Class (`AGTHubService`)
- **API Client**: Node.js HTTP/HTTPS
- **Authentication**: Token-based (stored in GlobalState)
- **Caching**: In-memory Map with TTL

## 文件结构

```
chameleon/
├── src/
│   ├── services/
│   │   ├── agtHubService.ts          # AGTHub API 客户端
│   │   ├── agentRegistryService.ts   # GitHub Registry 客户端（备用）
│   │   └── agentInstallerService.ts  # Agent 安装服务
│   └── webviews/
│       └── agentMarketplacePanel.ts  # Agent 市场 UI
├── package.json                       # 插件配置（含 AGTHub URL 设置）
└── AGTHUB_INTEGRATION.md             # 本文档
```

## 更新日志

### v1.0.0 - 2025-01-06
- ✅ 集成 AGTHub API
- ✅ 添加登录功能（邮箱验证码）
- ✅ 添加发布 Agent 功能
- ✅ 添加评分功能
- ✅ 支持 URL 配置
- ✅ 优化 UI/UX

## 反馈和贡献

如有问题或建议，请提交 Issue 或 Pull Request。


