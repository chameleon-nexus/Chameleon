<div align="center">
  <h1>Chameleon 智能助手</h1>
  <p>
    <strong>驾驭顶尖AI，重塑编码与创作流程。您的开源、可扩展的本地AI工作站。</strong>
  </p>
  <p>
    <a href="../README.md">English</a> | <a href="./README.es.md">Español</a> | <a href="./README.ja.md">日本語</a> | <a href="./README.de.md">Deutsch</a> | <a href="./README.fr.md">Français</a> | <a href="./README.zh.md">简体中文</a> | <a href="./README.pt.md">Português</a> | <a href="./README.vi.md">Tiếng Việt</a> | <a href="./README.hi.md">हिन्दी</a> | <a href="./README.ko.md">한국어</a> | <a href="./README.ru.md">Русский</a> | <a href="./README.ar.md">العربية</a>
  </p>
</div>

---

## 🦎 Chameleon 是什么？

Chameleon 不仅仅是又一个AI聊天窗口。它是一款强大的开源VS Code插件，能将您的编辑器转变为一个专业级的**多CLI启动器**和**智能代理商城**。

Chameleon专为开发者、创作者和研究人员设计，通过其**通用多CLI启动器**无缝集成**Claude Code**和**Gemini CLI**，并提供广泛的第三方AI模型支持。它配备了一个包含数百个专业AI代理的**综合代理商城**，让您能够连接任何AI供应商，管理本地与云端模型，并在您最熟悉的VS Code环境中，构建完全属于您自己的、私有的AI工具链。

<div align="center">
  <img src="../docs/images/1.png" alt="Chameleon导航界面" width="800px">
  <p><em>通用多CLI启动器 - 在Claude Code和Gemini CLI之间无缝切换</em></p>
</div>

## ✨ 核心功能

### 🚀 通用多CLI启动器
* **Claude Code集成**：原生支持Claude Code CLI，包含官方和第三方AI路由
* **Gemini CLI支持**：完整集成Gemini CLI，包括广泛的第三方AI模型兼容性
* **统一界面**：单一控制台无缝管理多个CLI工具和AI供应商

### 🛒 代理商城
* **500+专业代理**：从我们的综合AI代理商城中发现和下载专业代理
* **分类组织**：架构设计、编程语言、基础设施、质量与安全、数据与AI、文档编写和业务分析代理
* **一键安装**：直接下载代理到Claude Code或Codex，支持自动格式转换
* **社区驱动**：持续扩展的社区贡献专业代理集合

<div align="center">
  <img src="../docs/images/2.png" alt="代理商城 - 英文界面" width="800px">
  <p><em>代理商城 - 浏览和下载500+专业AI代理</em></p>
</div>

#### 🌍 多语言支持
我们的代理商城支持12种语言的本地化界面：

<div align="center">
  <img src="../docs/images/3.png" alt="代理商城 - 日文界面" width="800px">
  <p><em>日文界面 - 为日本开发者提供完整的本地化体验</em></p>
</div>

<div align="center">
  <img src="../docs/images/5.png" alt="代理商城 - 中文界面" width="800px">
  <p><em>中文界面 - 原生中文语言支持</em></p>
</div>

### 🎯 高级AI引擎支持
* **6种AI引擎，20+精选模型**：告别供应商锁定！支持OpenRouter、DeepSeek、Google、Volcengine、Azure、Ollama等6种主流AI引擎，涵盖20+个精选模型，包括最新的GPT-4o、Claude 3.5 Sonnet、DeepSeek V3等。
* **第三方模型集成**：通过Claude Code和Gemini CLI广泛支持第三方AI模型
* **智能模型路由**：根据任务复杂度和需求自动选择最佳AI模型

### 🧠 智能模型配置
* **5种专用模型配置**：智能配置短文本、长文本、思考、图像、视频5种专用模型，让每个任务都使用最适合的AI模型。
* **多模态AI支持**：不仅支持文本对话，还支持图像理解、视频分析、OCR识别等多媒体AI能力。
* **智能模型路由**：根据任务复杂度、内容长度、模态类型自动选择最佳模型，在性能与成本间找到完美平衡。

### 💼 专业开发功能
* **专业级笔记本界面**：超越简单的问答。在富文本笔记本中组织AI驱动任务，完美融合Markdown、代码片段和AI指令。
* **智能文档处理**：通过AI驱动的摘要、优化和翻译功能增强您的写作和分析能力。
* **深度IDE集成**：如同VS Code原生功能，通过右键菜单、代码镜头、专属面板随时调用AI工具。
* **隐私优先设计**：支持本地模型运行，让您完全掌控数据安全，同时支持云端API的便利性。
* **完全可定制**：从主题到模型路由规则，您可以定制Chameleon的每个方面以满足您的确切需求。
* **12种语言支持**：完整的中英日德法西葡越印韩俄阿国际化体验。

## 🚀 安装方法

选择最适合您需求的安装方法：

### 📦 方法一：VS Code 商城（推荐）

**安装Chameleon最简单的方法 - 适合大多数用户。**

1. **安装扩展：**
   - 打开 Visual Studio Code
   - 进入扩展视图（`Ctrl+Shift+X` 或 `Cmd+Shift+X`）
   - 搜索 **"chameleon-ai-launcher"**
   - 点击"安装"

2. **安装依赖：**
   - 安装完成后，打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
   - 运行 `Chameleon: Open Installation Guide` 命令
   - 按照分步说明安装 Node.js、Git、Claude Code 和 Gemini CLI

3. **配置并开始使用：**
   - 运行 `Chameleon: Open AI Settings` 来配置您的AI供应商
   - 点击活动栏中的Chameleon图标开始使用！

### 📁 方法二：预构建VSIX包

**直接从扩展包文件安装。**

1. **下载VSIX：**
   - 前往 [GitHub Releases](https://github.com/chameleon-nexus/Chameleon/releases)
   - 下载最新的 `chameleon-ai-launcher-x.x.x.vsix` 文件

2. **通过VS Code安装：**
   ```bash
   # 方法A：命令行
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # 方法B：VS Code界面
   # 1. 打开VS Code
   # 2. 进入扩展视图（Ctrl+Shift+X）
   # 3. 点击"..."菜单 → "从VSIX安装..."
   # 4. 选择下载的.vsix文件
   ```

3. **完成设置：**
   - 按照方法一相同的依赖安装和配置步骤

### 🛠️ 方法三：从源代码构建

**适合想要贡献或自定义扩展的开发者。**

**前置要求：**
- Git
- Node.js（v16或更高版本）
- npm或yarn

**步骤：**

1. **克隆和构建：**
   ```bash
   # 克隆仓库
   git clone https://github.com/chameleon-nexus/Chameleon.git
   cd Chameleon
   
   # 安装依赖
   npm install
   
   # 编译扩展
   npm run compile
   
   # 打包扩展（可选）
   npm install -g @vscode/vsce
   vsce package
   ```

2. **开发安装：**
   ```bash
   # 方法A：安装打包版本
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # 方法B：开发模式运行
   # 在VS Code中打开项目并按F5启动扩展开发主机
   ```

3. **安装依赖：**
   - 按照安装指南中的说明安装Node.js、Git、Claude Code和Gemini CLI
   - 通过扩展设置配置AI供应商

---

## ⚙️ 安装后设置

**无论您选择哪种安装方法，都需要完成以下步骤：**

1. **安装Multi-CLI依赖：**
   - Node.js和npm
   - Git
   - Claude Code CLI（`npm install -g @anthropic-ai/claude-code`）
   - Gemini CLI包

2. **配置AI供应商：**
   - 打开命令面板并运行 `Chameleon: Open AI Settings`
   - 为OpenAI、Anthropic、Google或其他供应商添加您的API密钥

3. **验证安装：**
   - 点击VS Code活动栏中的Chameleon图标
   - 浏览Claude Code和Gemini CLI页面
   - 检查所有依赖项是否显示为"已安装"

**需要帮助？** 运行 `Chameleon: Open Installation Guide` 获取详细的分步说明！

## 🌍 国际化

Chameleon支持12种语言：
- English (en)
- 简体中文 (zh)
- 日本語 (ja)
- Deutsch (de)
- Français (fr)
- Español (es)
- Português (pt)
- Tiếng Việt (vi)
- हिन्दी (hi)
- 한국어 (ko)
- Русский (ru)
- العربية (ar)

## 🔧 故障排除

### 常见问题

1. **扩展无法激活**：
   - 检查VS Code开发者控制台（帮助 > 切换开发人员工具）
   - 确认扩展已启用
   - 检查是否有冲突的扩展

2. **AI供应商连接问题**：
   - 验证API密钥配置是否正确
   - 检查网络连接
   - 查看API超时设置
   - 使用内置连接测试功能

3. **安装指南无法工作**：
   - 确保您有管理员权限（Windows）
   - 检查Node.js和Git是否正确安装
   - 尝试按照指南步骤手动安装

### 调试模式

启用调试日志：
1. 打开VS Code设置
2. 搜索"chameleon.debug"
3. 启用调试模式
4. 在输出面板中查看"Chameleon"日志

## 🤝 参与贡献

Chameleon 是一个为社区而生的开源项目。我们欢迎任何形式的贡献！请查阅我们的 [贡献指南](CONTRIBUTING.md) 以了解详情。

### 开发设置

1. Fork 仓库
2. 创建功能分支
3. 进行修改
4. 如适用，添加测试
5. 提交拉取请求

## 📄 开源许可

本项目基于 MIT 许可协议开源 - 详情请见 [LICENSE](LICENSE) 文件。

## 🆘 支持

- **问题反馈**: [GitHub Issues](https://github.com/chameleon-nexus/claude-code-vscode/issues)
- **讨论交流**: [GitHub Discussions](https://github.com/chameleon-nexus/claude-code-vscode/discussions)
- **文档资料**: [Wiki](https://github.com/chameleon-nexus/claude-code-vscode/wiki)

## 📝 更新日志

### v0.1.0 (初始发布)
- 通用AI供应商支持
- 专业级笔记本界面
- 深度IDE集成
- 隐私优先设计
- 完整国际化（12种语言）
- 全面的安装指南

---

**为开发者社区而打造 ❤️**
