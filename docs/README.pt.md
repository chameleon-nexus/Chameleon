<div align="center">
  <img src="https://raw.githubusercontent.com/chameleon-nexus/claude-code-vscode/main/media/icon.svg" alt="Chameleon Logo" width="120px">
  <h1>Assistente IA Chameleon</h1>
  <p>
    <strong>Aproveite a IA de ponta para remodelar fluxos de trabalho de codificação e criativos. Sua estação de trabalho IA local de código aberto e extensível.</strong>
  </p>
  <p>
    <a href="../README.md">English</a> | <a href="./README.es.md">Español</a> | <a href="./README.ja.md">日本語</a> | <a href="./README.de.md">Deutsch</a> | <a href="./README.fr.md">Français</a> | <a href="./README.zh.md">简体中文</a> | <a href="./README.pt.md">Português</a> | <a href="./README.vi.md">Tiếng Việt</a> | <a href="./README.hi.md">हिन्दी</a> | <a href="./README.ko.md">한국어</a> | <a href="./README.ru.md">Русский</a> | <a href="./README.ar.md">العربية</a>
  </p>
</div>

---

## 🦎 O que é o Chameleon?

O Chameleon é muito mais que apenas outra janela de chat de IA. É uma extensão VS Code de código aberto poderosa que transforma seu editor em um notebook profissional, local e orientado por IA.

Projetado para desenvolvedores, escritores e pesquisadores, o Chameleon devolve o controle da IA para você. Ele se integra profundamente ao seu fluxo de trabalho, permitindo que você se conecte perfeitamente a qualquer provedor de IA de terceiros (como OpenAI, Google Gemini, DeepSeek, etc.), gerencie modelos locais e em nuvem, e construa sua própria cadeia de ferramentas de IA privada no ambiente familiar do VS Code.

## ✨ Recursos principais

* **🎯 6 motores de IA, 20+ modelos selecionados**: Liberte-se do bloqueio de fornecedores! Suporte para OpenRouter, DeepSeek, Google, Volcengine, Azure, Ollama e outros 6 motores de IA principais, cobrindo 20+ modelos cuidadosamente selecionados, incluindo os mais recentes GPT-4o, Claude 3.5 Sonnet, DeepSeek V3, etc.
* **🧠 5 configurações de modelo especializadas**: Configuração inteligente de modelos de texto curto, texto longo, pensamento, imagem e vídeo, permitindo que cada tarefa use o modelo de IA mais adequado.
* **🎨 Suporte de IA multimodal**: Suporta não apenas conversas de texto, mas também compreensão de imagens, análise de vídeo, reconhecimento OCR e outras capacidades de IA multimídia.
* **⚡ Roteamento inteligente de modelos**: Seleção automática do melhor modelo baseada na complexidade da tarefa, comprimento do conteúdo e tipo de modalidade para um equilíbrio perfeito entre desempenho e custo.
* **📓 Interface de notebook profissional**: Vá além de simples Q&A. Organize suas tarefas orientadas por IA em um notebook de texto rico que combina perfeitamente Markdown, trechos de código e prompts de IA.
* **🔒 Design focado na privacidade**: Suporta execução de modelos locais, dando-lhe controle total sobre a segurança dos dados enquanto oferece a conveniência das APIs em nuvem.
* **🎛️ Integração profunda do IDE**: Parece uma funcionalidade nativa do VS Code. Acesse ferramentas de IA poderosas diretamente através de menus de contexto, code lenses e painéis de barra lateral dedicados.
* **🌍 Suporte a 12 idiomas**: Experiência internacional completa em chinês, inglês, japonês, alemão, francês, espanhol, português, vietnamita, hindi, coreano, russo e árabe.

## 🚀 Instalação e configuração

Escolha o caminho de instalação adequado para você:

### Opção 1: Para usuários finais (Recomendado)

Siga estes passos para instalar e usar a extensão Chameleon do VS Code Marketplace.

**Passo 1: Instalar dependências**

O Chameleon requer `Claude Code` e `Claude Code Router` para funcionar. Tornamos isso fácil:
1. Primeiro, instale esta extensão no VS Code (veja Passo 2).
2. Abra a paleta de comandos (`Ctrl+Shift+P` ou `Cmd+Shift+P`).
3. Execute o comando `Chameleon: Abrir guia de instalação`.
4. Siga os passos detalhados no guia para completar a instalação do Node.js, Git e outros pré-requisitos.

**Passo 2: Instalar a extensão**

1. Abra o Visual Studio Code.
2. Vá para a visualização de extensões (`Ctrl+Shift+X`).
3. Procure por **"Chameleon - 智能文档助手"**.
4. Clique em "Instalar".

**Passo 3: Configurar provedores de IA**

1. Abra a paleta de comandos (`Ctrl+Shift+P`).
2. Execute o comando `Chameleon: Abrir configurações de IA`.
3. Selecione o provedor de IA que deseja usar e insira sua chave API.
4. Configuração concluída! Clique no ícone do Chameleon na barra de atividade do VS Code para começar.

### Opção 2: Para desenvolvedores (Do código fonte)

Siga estes passos se quiser executar a extensão do código fonte ou contribuir para o projeto.

**Pré-requisitos:**
* Git instalado.
* Node.js instalado (v16 ou superior recomendado).
* Todas as dependências do **Guia de Instalação** (`Claude Code`, `Claude Code Router`, etc.) devem estar instaladas e configuradas.

**Passos:**

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/chameleon-nexus/claude-code-vscode.git
   cd claude-code-vscode
   ```

2. **Instalar dependências do projeto:**
   ```bash
   npm install
   ```

3. **Compilar o código:**
   * Compilação única: `npm run compile`
   * Observar mudanças de arquivos e compilar automaticamente: `npm run watch`

4. **Executar a extensão:**
   * Abra esta pasta do projeto no VS Code.
   * Pressione `F5` para iniciar uma nova janela "Extension Development Host" com a extensão Chameleon em execução.

## 🎯 Motores de IA e modelos suportados

O Chameleon suporta **6 motores de IA principais** através do Claude Code Router, cobrindo **20+ modelos cuidadosamente selecionados** para capacidades de IA de nível profissional:

### 🔥 Motores de IA de texto

#### **OpenRouter**
- **Claude 3.5 Sonnet**: Capacidade de raciocínio mais poderosa
- **Claude 3 Haiku**: Versão rápida e leve
- **GPT-4o**: Modelo multimodal mais recente
- **GPT-4o-mini**: Versão leve com excelente custo-benefício
- **Llama 3.1 405B**: Modelo grande de código aberto
- **Gemini Pro 1.5**: Especialista em contexto longo

#### **DeepSeek**
- **DeepSeek Chat**: Modelo de conversa geral
- **DeepSeek Coder**: Geração de código profissional

#### **Google Gemini**
- **Gemini Pro**: Modelo de raciocínio geral
- **Gemini Pro Vision**: Modelo de compreensão de imagens

#### **Volcengine**
- **DeepSeek V3**: Versão Volcengine (contexto longo de 128K tokens)

#### **Azure OpenAI**
- **GPT-4**: Modelo de raciocínio avançado clássico
- **GPT-4 Turbo**: Modelo de raciocínio de alta performance
- **GPT-3.5 Turbo**: Modelo de resposta rápida

#### **Ollama** (Implantação local)
- **Llama 3.1**: Modelo de conversa de código aberto
- **CodeLlama**: Modelo especializado em código
- **Mistral**: Modelo de raciocínio eficiente
- **Gemma**: Modelo leve

### 🎨 Motores de IA multimodais

#### **Motor de compreensão de imagens - Seedream**
- Análise de imagens profissional, reconhecimento OCR, compreensão de gráficos
- Suporta múltiplos formatos de imagem e tarefas visuais complexas

#### **Motor de processamento de vídeo - Seedance**
- Análise de conteúdo de vídeo profissional e geração de resumos
- Suporta compreensão de vídeos longos e reconhecimento de ações

### ⚙️ Configuração inteligente de modelos

O Chameleon suporta **5 configurações de modelo especializadas** para escolher o modelo de IA mais adequado para diferentes cenários:

#### **1. Modelo de texto curto** (Resposta rápida)
- Adequado para: Q&A simples, conclusão de código, tradução rápida
- Recomendado: GPT-3.5-turbo, Claude 3 Haiku, DeepSeek Chat

#### **2. Modelo de texto longo** (Contexto grande)
- Adequado para: Análise de documentos longos, revisão de código, raciocínio complexo
- Recomendado: GPT-4o, Claude 3.5 Sonnet, DeepSeek V3

#### **3. Modelo de pensamento** (Raciocínio profundo)
- Adequado para: Resolução de problemas complexos, design de arquitetura, cálculos matemáticos
- Recomendado: Claude 3.5 Sonnet, GPT-4, Llama 3.1 405B

#### **4. Modelo de imagem** (Compreensão visual)
- Adequado para: Análise de imagens, OCR, compreensão de gráficos
- Recomendado: Motor Seedream

#### **5. Modelo de vídeo** (Processamento de vídeo)
- Adequado para: Resumo de vídeo, análise de conteúdo, reconhecimento de ações
- Recomendado: Motor Seedance

### 🚀 Estratégia de roteamento de modelos

O sistema de roteamento inteligente do Chameleon seleciona automaticamente o melhor modelo baseado em:

- **Complexidade da tarefa**: Tarefas simples → modelos rápidos, tarefas complexas → modelos de raciocínio
- **Comprimento do conteúdo**: Texto curto → modelos leves, documentos longos → modelos de contexto grande
- **Tipo de modalidade**: Texto → modelos de linguagem, imagens → motor Seedream, vídeo → motor Seedance
- **Preferências do usuário**: Especificação manual de modelos específicos
- **Otimização de custos**: Equilíbrio perfeito entre desempenho e custo

## 🏗️ Arquitetura

### Componentes
```
Extensão Chameleon
├── Painel de boas-vindas          # Interface de introdução
├── Painel de configurações         # Configuração de provedores de IA
├── Painel de chat                # Interface de conversa de IA
├── Painel de guia de instalação   # Instruções de instalação
├── Painel de configurações do sistema # Configurações de idioma e tema
└── Cliente Claude               # Integração de modelos de IA
```

### Estrutura de arquivos
```
chameleon/
├── src/
│   ├── extension.ts           # Ponto de entrada principal da extensão
│   ├── webviews/              # Painéis de UI
│   │   ├── settingsPanel.ts   # Configurações de IA
│   │   ├── chatPanel.ts       # Interface de chat
│   │   ├── installGuidePanel.ts # Guia de instalação
│   │   └── systemSettingsPanel.ts # Configurações do sistema
│   └── utils/                 # Funções utilitárias
│       ├── i18n.ts           # Internacionalização
│       └── claudeClient.ts   # Cliente de IA
├── l10n/                     # Arquivos de tradução
├── package.json              # Manifesto da extensão
└── README.md                 # Este arquivo
```

## 🌍 Internacionalização

O Chameleon suporta 12 idiomas:
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

## 🔧 Solução de problemas

### Problemas comuns

1. **A extensão não ativa**:
   - Verificar o console do desenvolvedor do VS Code (Ajuda > Alternar ferramentas de desenvolvedor)
   - Confirmar que a extensão está habilitada
   - Verificar extensões conflitantes

2. **Problemas de conexão de provedores de IA**:
   - Verificar se as chaves API estão configuradas corretamente
   - Verificar conectividade de rede
   - Revisar configurações de timeout da API
   - Usar a função de teste de conexão integrada

3. **O guia de instalação não funciona**:
   - Confirmar privilégios de administrador (Windows)
   - Verificar se Node.js e Git estão instalados corretamente
   - Tentar instalação manual seguindo o guia

### Modo debug

Habilitar registro de debug:
1. Abrir configurações do VS Code
2. Buscar "chameleon.debug"
3. Habilitar modo debug
4. Verificar logs "Chameleon" no painel de saída

## 🤝 Contribuindo

O Chameleon é um projeto de código aberto construído para a comunidade. Damos as boas-vindas a todos os tipos de contribuições! Por favor, consulte nosso [Guia de Contribuição](CONTRIBUTING.md) para detalhes.

### Configuração de desenvolvimento

1. Fazer fork do repositório
2. Criar um branch de funcionalidade
3. Fazer mudanças
4. Adicionar testes se aplicável
5. Enviar um pull request

## 📄 Licença de código aberto

Este projeto é de código aberto sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Relatórios de problemas**: [GitHub Issues](https://github.com/chameleon-nexus/claude-code-vscode/issues)
- **Discussões**: [GitHub Discussions](https://github.com/chameleon-nexus/claude-code-vscode/discussions)
- **Documentação**: [Wiki](https://github.com/chameleon-nexus/claude-code-vscode/wiki)

## 📝 Registro de mudanças

### v0.1.0 (Lançamento inicial)
- Suporte universal de provedores de IA
- Interface de notebook profissional
- Integração profunda do IDE
- Design focado na privacidade
- Internacionalização completa (12 idiomas)
- Guia de instalação abrangente

---

**Feito com ❤️ para a comunidade de desenvolvedores**
