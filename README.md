<div align="center">
  <img src="https://raw.githubusercontent.com/chameleon-nexus/claude-code-vscode/main/media/icon.png" alt="Chameleon Logo" width="120px">
  <h1>Chameleon AI Assistant</h1>
  <p>
    <strong>Your Open-Source, Universal AI Workstation inside VS Code.</strong>
  </p>
  <p>
    Harness the power of leading AI models, break free from vendor lock-in, and reshape your coding and content creation workflow.
  </p>
  <p>
    <a href="./README.md">English</a> | <a href="./docs/README.es.md">Español</a> | <a href="./docs/README.ja.md">日本語</a> | <a href="./docs/README.de.md">Deutsch</a> | <a href="./docs/README.fr.md">Français</a> | <a href="./docs/README.zh.md">简体中文</a> | <a href="./docs/README.pt.md">Português</a> | <a href="./docs/README.vi.md">Tiếng Việt</a> | <a href="./docs/README.hi.md">हिन्दी</a> | <a href="./docs/README.ko.md">한국어</a> | <a href="./docs/README.ru.md">Русский</a> | <a href="./docs/README.ar.md">العربية</a>
  </p>
</div>

---

## 🦎 What is Chameleon?

Chameleon is more than just another AI chat window. It's a powerful, open-source VS Code extension that transforms your editor into a professional-grade, local-first AI-powered Notebook.

Designed for developers, writers, and researchers, Chameleon puts you in control. It integrates deeply with your workflow, allowing you to connect to any third-party AI provider (like OpenAI, Google Gemini, DeepSeek, and more), manage local and remote models, and build your own, private AI toolchain—all within the familiar environment of VS Code.

## ✨ Core Features

* **🎯 6 AI Engines, 20+ Selected Models**: Break free from vendor lock-in! Support for OpenRouter, DeepSeek, Google, Volcengine, Azure, Ollama and other 6 major AI engines, covering 20+ carefully selected models, including the latest GPT-4o, Claude 3.5 Sonnet, DeepSeek V3, etc.
* **Professional Notebook Interface**: Move beyond simple prompts. Structure your AI-driven tasks in a rich notebook format that combines Markdown, code snippets, and AI prompts. Perfect for complex tasks like code reviews, architectural design, and in-depth document analysis.
* **Intelligent Document Processing**: Supercharge your writing and analysis with AI-powered summarization, optimization, and translation.
* **Deep IDE Integration**: Chameleon feels like a native part of VS Code. Access powerful AI tools directly from the context menu, code lenses, and a dedicated sidebar panel.
* **Privacy-First**: Run your AI tasks in a local, secure environment. Chameleon is designed to work with local models and gives you full control over your data.
* **Fully Customizable**: From themes to model routing rules, you can tailor every aspect of Chameleon to fit your exact needs.

## 🚀 Installation and Setup

Choose the path that's right for you:

### Option 1: For End Users (Recommended)

Follow these steps to install and use the Chameleon extension from the VS Code Marketplace.

**Step 1: Install Dependencies**

Chameleon requires `Claude Code` and `Claude Code Router` to function. We've made this easy:
1. Install the Chameleon extension (see Step 2).
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Run the `Chameleon: Open Installation Guide` command.
4. Follow the step-by-step instructions in the guide to install Node.js, Git, and other required components.

**Step 2: Install the Extension**

1. Open Visual Studio Code.
2. Go to the Extensions view (`Ctrl+Shift+X`).
3. Search for **"Chameleon - 智能文档助手"**.
4. Click "Install".

**Step 3: Configure AI Providers**

1. Open the Command Palette (`Ctrl+Shift+P`).
2. Run the `Chameleon: Open AI Settings` command.
3. Select an AI provider and enter your API key.
4. You're all set! Click the Chameleon icon in the activity bar to start.

### Option 2: For Developers (From Source Code)

Follow these steps if you want to run the extension from the source code or contribute to the project.

**Prerequisites:**
* Git
* Node.js (v16 or higher recommended)
* All dependencies from the **Installation Guide** (`Claude Code`, `Claude Code Router`, etc.) must be installed and running.

**Steps:**

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/chameleon-nexus/claude-code-vscode.git
   cd claude-code-vscode
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Compile the Code:**
   * To compile once: `npm run compile`
   * To watch for changes and compile automatically: `npm run watch`

4. **Run the Extension:**
   * Open the project folder in VS Code.
   * Press `F5` to open the Extension Development Host window with the Chameleon extension running.

## 🎯 Supported AI Engines & Models

Chameleon supports **6 major AI engines** through Claude Code Router, covering **20+ carefully selected models** for professional-grade AI capabilities:

### 🔥 Text AI Engines

#### **OpenRouter**
- **Claude 3.5 Sonnet**: Most powerful reasoning capability
- **Claude 3 Haiku**: Fast and lightweight version
- **GPT-4o**: Latest multimodal model
- **GPT-4o-mini**: Lightweight version with excellent cost-performance
- **Llama 3.1 405B**: Open-source large model
- **Gemini Pro 1.5**: Long context expert

#### **DeepSeek**
- **DeepSeek Chat**: General conversation model
- **DeepSeek Coder**: Professional code generation

#### **Google Gemini**
- **Gemini Pro**: General reasoning model
- **Gemini Pro Vision**: Image understanding model

#### **Volcengine**
- **DeepSeek V3**: Volcengine version (128K tokens long context)

#### **Azure OpenAI**
- **GPT-4**: Classic advanced reasoning model
- **GPT-4 Turbo**: High-performance reasoning model
- **GPT-3.5 Turbo**: Fast response model

#### **Ollama** (Local Deployment)
- **Llama 3.1**: Open-source conversation model
- **CodeLlama**: Code-specialized model
- **Mistral**: Efficient reasoning model
- **Gemma**: Lightweight model

### 🎨 Multimodal AI Engines

#### **Image Understanding Engine - Seedream**
- Professional image analysis, OCR recognition, chart understanding
- Supports multiple image formats and complex visual tasks

#### **Video Processing Engine - Seedance**
- Professional video content analysis and summary generation
- Supports long video understanding and action recognition

### ⚙️ Smart Model Configuration

Chameleon supports **5 specialized model configurations** to choose the most suitable AI model for different scenarios:

#### **1. Short Text Model** (Fast Response)
- Suitable for: Simple Q&A, code completion, quick translation
- Recommended: GPT-3.5-turbo, Claude 3 Haiku, DeepSeek Chat

#### **2. Long Text Model** (Large Context)
- Suitable for: Long document analysis, code review, complex reasoning
- Recommended: GPT-4o, Claude 3.5 Sonnet, DeepSeek V3

#### **3. Thinking Model** (Deep Reasoning)
- Suitable for: Complex problem solving, architecture design, mathematical calculations
- Recommended: Claude 3.5 Sonnet, GPT-4, Llama 3.1 405B

#### **4. Image Model** (Visual Understanding)
- Suitable for: Image analysis, OCR, chart understanding
- Recommended: Seedream engine

#### **5. Video Model** (Video Processing)
- Suitable for: Video summarization, content analysis, action recognition
- Recommended: Seedance engine

### 🚀 Model Routing Strategy

Chameleon's intelligent routing system automatically selects the best model based on:

- **Task Complexity**: Simple tasks → fast models, complex tasks → reasoning models
- **Content Length**: Short text → lightweight models, long documents → large context models
- **Modality Type**: Text → language models, images → Seedream engine, video → Seedance engine
- **User Preference**: Manual specification of specific models
- **Cost Optimization**: Perfect balance between performance and cost

## ⚙️ Configuration

### Settings Access
Access settings via `Chameleon: Open AI Settings` or through the welcome page:

```json
{
  "chameleon.defaultModel": "deepseek-chat",
  "chameleon.apiTimeout": 60000,
  "chameleon.enableRouting": true,
  "chameleon.outputLanguage": "en"
}
```

### Model Routing
Configure intelligent model routing based on:
- **Task Type**: Code review, architecture, debugging, document analysis
- **Content Length**: Long vs short prompts
- **User Preference**: Manual model selection
- **Performance**: Speed vs quality trade-offs

## 🏗️ Architecture

### Components
```
Chameleon Extension
├── Welcome Panel          # Getting started interface
├── Settings Panel         # AI provider configuration
├── Chat Panel            # AI conversation interface
├── Install Guide Panel   # Installation instructions
├── System Settings Panel # Language and theme settings
└── Claude Client         # AI model integration
```

### File Structure
```
chameleon/
├── src/
│   ├── extension.ts           # Main extension entry
│   ├── webviews/              # UI panels
│   │   ├── settingsPanel.ts   # AI settings
│   │   ├── chatPanel.ts       # Chat interface
│   │   ├── installGuidePanel.ts # Installation guide
│   │   └── systemSettingsPanel.ts # System settings
│   └── utils/                 # Utility functions
│       ├── i18n.ts           # Internationalization
│       └── claudeClient.ts   # AI client
├── l10n/                     # Translation files
├── package.json              # Extension manifest
└── README.md                 # This file
```

## 🌍 Internationalization

Chameleon supports 12 languages:
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

## 🔧 Troubleshooting

### Common Issues

1. **Extension Not Activating**:
   - Check VS Code developer console (Help > Toggle Developer Tools)
   - Verify extension is enabled
   - Check for conflicting extensions

2. **AI Provider Connection Issues**:
   - Verify API keys are correctly configured
   - Check network connectivity
   - Review API timeout settings
   - Test connection using the built-in connection test

3. **Installation Guide Not Working**:
   - Ensure you have administrator privileges (Windows)
   - Check if Node.js and Git are properly installed
   - Try manual installation following the guide steps

### Debug Mode

Enable debug logging:
1. Open VS Code settings
2. Search for "chameleon.debug"
3. Enable debug mode
4. Check Output panel for "Chameleon" logs

## 🤝 Contributing

Chameleon is an open-source project built for the community. We welcome all contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get involved.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/chameleon-nexus/claude-code-vscode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chameleon-nexus/claude-code-vscode/discussions)
- **Documentation**: [Wiki](https://github.com/chameleon-nexus/claude-code-vscode/wiki)

## 📝 Changelog

### v0.1.0 (Initial Release)
- Universal AI provider support
- Professional notebook interface
- Deep IDE integration
- Privacy-first design
- Full internationalization (12 languages)
- Comprehensive installation guide

---

**Made with ❤️ for the developer community**