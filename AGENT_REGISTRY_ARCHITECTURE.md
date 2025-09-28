# Agent Registry Architecture Design

## 概述 (Overview)

这是一个完整的 AI Agent 管理系统架构，类似于 Maven Central 或 npm registry，允许用户通过 CLI 和 VS Code 图形界面来搜索、下载、安装和发布 AI agents。

## 项目结构 (Project Structure)

### 1. agents-registry (静态文件服务器)
**GitHub**: https://github.com/chameleon-nexus/agents-registry
**作用**: 作为静态文件服务器，存储所有 agent 的元数据和文件

```
agents-registry/
├── registry.json              # 全局 agent 索引
├── agents/
│   ├── {author}/
│   │   ├── {agent-name}/
│   │   │   ├── metadata.json  # Agent 元数据
│   │   │   ├── agent.md       # Agent 文件
│   │   │   └── README.md      # 文档
│   │   └── ...
│   └── ...
├── scripts/
│   └── import-agents-main.py  # 从现有项目导入脚本
└── README.md
```

### 2. agents-cli (命令行工具)
**GitHub**: https://github.com/chameleon-nexus/agents-cli
**作用**: 提供命令行界面来管理 agents

```
agents-cli/
├── main.go                    # 主入口
├── cmd/
│   ├── root.go               # 根命令
│   ├── search.go             # 搜索命令
│   ├── install.go            # 安装命令
│   ├── list.go               # 列表命令
│   ├── update.go             # 更新命令
│   └── publish.go            # 发布命令
├── pkg/
│   ├── registry/             # 注册表服务
│   │   ├── client.go         # HTTP 客户端
│   │   ├── models.go         # 数据模型
│   │   └── cache.go          # 缓存管理
│   ├── installer/            # 安装器
│   │   ├── claude.go         # Claude Code 安装
│   │   └── models.go         # 安装模型
│   └── utils/                # 工具函数
│       └── config.go         # 配置管理
├── go.mod
└── README.md
```

### 3. chameleon (VS Code 扩展)
**GitHub**: https://github.com/chameleon-nexus/Chameleon
**作用**: 提供图形界面来管理 agents

```
chameleon/
├── src/
│   ├── services/
│   │   └── agentRegistryService.ts  # 注册表服务
│   └── webviews/
│       └── agentMarketplacePanel.ts # 商城界面
└── ...
```

## 核心设计理念 (Core Design Principles)

### 1. 分离关注点 (Separation of Concerns)
- **agents-registry**: 纯静态文件存储，使用 GitHub Raw API 提供 HTTPS 访问
- **agents-cli**: 专注于命令行交互和本地文件管理
- **chameleon**: 专注于 VS Code 集成和图形界面

### 2. 无服务器架构 (Serverless Architecture)
- 使用 GitHub 作为免费的静态文件服务器
- 通过 GitHub Raw API 提供 HTTPS 访问
- 无需维护独立服务器，降低运营成本

### 3. 渐进式增强 (Progressive Enhancement)
- 首先专注于 Claude Code CLI 支持
- 后续扩展到 Codex、Copilot 等其他 CLI 工具
- 保持向后兼容性

## 数据格式设计 (Data Format Design)

### registry.json (全局索引)
```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "totalAgents": 100,
  "agents": {
    "agent-id": {
      "name": { "en": "Agent Name", "zh": "代理名称" },
      "description": { "en": "Description", "zh": "描述" },
      "author": "Author Name",
      "category": "development",
      "tags": ["tag1", "tag2"],
      "latest": "1.0.0",
      "versions": ["1.0.0"],
      "downloads": 1000,
      "rating": 4.5,
      "ratingCount": 20,
      "license": "MIT",
      "compatibility": {
        "claudeCode": ">=1.0.0"
      },
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  },
  "categories": {
    "development": {
      "en": "Code Development",
      "zh": "代码开发",
      "description": {
        "en": "Agents for coding, refactoring, and code quality",
        "zh": "用于编码、重构和代码质量的代理"
      },
      "icon": "💻"
    }
  },
  "stats": {
    "totalDownloads": 50000,
    "activeUsers": 1000,
    "topAgents": ["agent1", "agent2"],
    "recentUpdates": ["agent3", "agent4"]
  }
}
```

### metadata.json (单个 Agent 详细信息)
```json
{
  "id": "agent-id",
  "name": { "en": "Agent Name", "zh": "代理名称" },
  "description": { "en": "Short description", "zh": "简短描述" },
  "longDescription": { "en": "Long description", "zh": "详细描述" },
  "author": "Author Name",
  "license": "MIT",
  "homepage": "https://github.com/author/agent",
  "category": "development",
  "tags": ["tag1", "tag2"],
  "compatibility": {
    "claudeCode": {
      "minVersion": "1.0.0",
      "tested": ["1.0.0", "1.1.0"]
    }
  },
  "versions": {
    "1.0.0": {
      "releaseDate": "2024-01-15T00:00:00Z",
      "changes": "Initial release",
      "files": {
        "agent": "agent.md"
      }
    }
  },
  "latest": "1.0.0",
  "downloads": 1000,
  "rating": 4.5,
  "ratingCount": 20,
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

## API 设计 (API Design)

### GitHub Raw API 端点
- **注册表索引**: `https://raw.githubusercontent.com/chameleon-nexus/agents-registry/main/registry.json`
- **Agent 元数据**: `https://raw.githubusercontent.com/chameleon-nexus/agents-registry/main/agents/{author}/{name}/metadata.json`
- **Agent 文件**: `https://raw.githubusercontent.com/chameleon-nexus/agents-registry/main/agents/{author}/{name}/agent.md`

### CLI 命令设计
```bash
# 搜索
agents search "code review"
agents search --category=development --tag=security

# 安装
agents install chameleon-team/code-reviewer
agents install chameleon-team/code-reviewer@1.0.0
agents install --all-free

# 列表
agents list
agents list --installed
agents list --updates

# 更新
agents update
agents update chameleon-team/code-reviewer

# 发布 (未来功能)
agents publish ./my-agent.md
```

## 技术栈 (Technology Stack)

### agents-registry
- **存储**: GitHub 仓库
- **API**: GitHub Raw API
- **格式**: JSON + Markdown
- **脚本**: Python (导入工具)

### agents-cli
- **语言**: Go
- **框架**: Cobra (CLI), Viper (配置)
- **依赖**: 
  - HTTP 客户端 (内置)
  - 缓存系统 (内存)
  - 文件系统操作

### chameleon (VS Code 扩展)
- **语言**: TypeScript
- **框架**: VS Code Extension API
- **UI**: Webview + HTML/CSS/JavaScript
- **国际化**: 多语言支持 (中英文)

## 缓存策略 (Caching Strategy)

### CLI 缓存
- **位置**: `~/.agents-cli/cache/`
- **TTL**: 5分钟 (可配置)
- **策略**: 内存缓存 + 磁盘持久化
- **清理**: 自动过期清理

### VS Code 扩展缓存
- **位置**: 内存
- **TTL**: 5分钟
- **策略**: Map-based 缓存
- **清理**: 定时清理过期项

## 安装策略 (Installation Strategy)

### Claude Code CLI
- **目标目录**: `~/.claude/agents/`
- **文件格式**: `{agent-id}.md`
- **注册表**: `~/.claude/agents/.registry.json`
- **兼容性检查**: 版本匹配

### 未来支持的 CLI
- **Codex**: `~/.codex/agents/`
- **Copilot**: `~/.copilot/agents/`
- **通用**: 可配置安装路径

## 搜索和过滤 (Search and Filtering)

### 搜索维度
- **文本搜索**: 名称、描述、标签
- **分类过滤**: development, debugging, data, documentation
- **标签过滤**: 精确匹配
- **作者过滤**: 模糊匹配
- **兼容性过滤**: CLI 工具版本

### 排序选项
- **下载量**: 默认排序
- **评分**: 用户评分
- **名称**: 字母顺序
- **更新时间**: 最近更新

## 国际化支持 (Internationalization)

### 支持语言
- **英文 (en)**: 默认语言
- **中文 (zh)**: 简体中文

### 本地化内容
- Agent 名称和描述
- 分类名称和描述
- UI 界面文本
- 错误消息

## 版本管理 (Version Management)

### 语义化版本
- 格式: `major.minor.patch`
- 兼容性: 向后兼容检查
- 更新策略: 自动检测可用更新

### 版本历史
- 每个版本的变更日志
- 发布日期记录
- 文件变更追踪

## 安全考虑 (Security Considerations)

### 内容安全
- Agent 文件内容审核 (通过 PR 审查)
- 恶意代码检测 (社区监督)
- 许可证验证

### 访问控制
- GitHub 仓库权限管理
- PR 审核流程
- 贡献者验证

## 扩展性设计 (Scalability Design)

### 水平扩展
- 支持多个注册表源
- 镜像仓库支持
- CDN 加速 (GitHub CDN)

### 垂直扩展
- 分类系统扩展
- 标签系统扩展
- 元数据字段扩展

## 监控和分析 (Monitoring and Analytics)

### 使用统计
- 下载计数 (通过 GitHub API)
- 搜索热词统计
- 用户行为分析

### 性能监控
- API 响应时间
- 缓存命中率
- 错误率统计

## 发布流程 (Publishing Workflow)

### 当前流程 (手动)
1. Fork agents-registry 仓库
2. 添加 agent 文件到相应目录
3. 更新 registry.json
4. 提交 Pull Request
5. 代码审查和合并

### 未来流程 (自动化)
1. 使用 `agents publish` 命令
2. 自动验证 agent 格式
3. 自动创建 PR
4. 自动化测试和部署

## 最佳实践 (Best Practices)

### Agent 开发
- 遵循统一的 Markdown 格式
- 提供清晰的使用说明
- 包含示例和测试用例
- 定期更新和维护

### 版本发布
- 遵循语义化版本规范
- 提供详细的变更日志
- 测试兼容性
- 及时修复问题

### 文档维护
- 保持 README 更新
- 提供多语言支持
- 包含使用示例
- 维护 API 文档

## 故障处理 (Error Handling)

### 网络错误
- 自动重试机制
- 降级到缓存数据
- 用户友好的错误消息

### 数据错误
- 格式验证
- 兼容性检查
- 回滚机制

### 用户错误
- 输入验证
- 帮助提示
- 错误恢复建议

## 未来规划 (Future Roadmap)

### Phase 1 (当前)
- ✅ 基础架构搭建
- ✅ Claude Code CLI 支持
- ✅ VS Code 扩展集成
- ✅ 基础搜索和安装功能

### Phase 2 (短期)
- [ ] Codex CLI 支持
- [ ] Copilot CLI 支持
- [ ] 自动化发布流程
- [ ] 用户评分系统

### Phase 3 (中期)
- [ ] 多注册表支持
- [ ] 高级搜索功能
- [ ] 社区功能 (评论、讨论)
- [ ] 分析和统计面板

### Phase 4 (长期)
- [ ] 企业版功能
- [ ] 私有注册表
- [ ] 高级权限管理
- [ ] 商业化支持

## 贡献指南 (Contributing Guidelines)

### 代码贡献
1. Fork 相应的仓库
2. 创建功能分支
3. 编写测试用例
4. 提交 Pull Request
5. 代码审查和合并

### Agent 贡献
1. 遵循 Agent 开发规范
2. 提供完整的文档
3. 测试兼容性
4. 提交到 agents-registry

### 问题报告
1. 使用 GitHub Issues
2. 提供详细的复现步骤
3. 包含环境信息
4. 附加相关日志

## 联系方式 (Contact)

- **项目主页**: https://github.com/chameleon-nexus
- **问题反馈**: GitHub Issues
- **功能建议**: GitHub Discussions
- **社区交流**: (待建立)

---

**最后更新**: 2024-09-28
**版本**: 1.0.0
**维护者**: Chameleon Team
