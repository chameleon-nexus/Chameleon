<div align="center">
  <img src="https://raw.githubusercontent.com/chameleon-nexus/claude-code-vscode/main/media/icon.svg" alt="Chameleon Logo" width="120px">
  <h1>カメレオン インテリジェントアシスタント</h1>
  <p>
    <strong>最先端AIを活用し、コーディングとクリエイティブワークフローを再構築。あなたのオープンソース、拡張可能なローカルAIワークステーション。</strong>
  </p>
  <p>
    <a href="../README.md">English</a> | <a href="./README.es.md">Español</a> | <a href="./README.ja.md">日本語</a> | <a href="./README.de.md">Deutsch</a> | <a href="./README.fr.md">Français</a> | <a href="./README.zh.md">简体中文</a> | <a href="./README.pt.md">Português</a> | <a href="./README.vi.md">Tiếng Việt</a> | <a href="./README.hi.md">हिन्दी</a> | <a href="./README.ko.md">한국어</a> | <a href="./README.ru.md">Русский</a> | <a href="./README.ar.md">العربية</a>
  </p>
</div>

---

## 🦎 カメレオンとは？

カメレオンは単なるAIチャットウィンドウではありません。VS CodeをプロフェッショナルグレードのローカルファーストAI駆動ノートブックに変換する強力なオープンソースVS Code拡張機能です。

開発者、ライター、研究者向けに設計されたカメレオンは、AIの制御権をあなたに委ねます。ワークフローに深く統合され、任意のサードパーティAIプロバイダー（OpenAI、Google Gemini、DeepSeekなど）にシームレスに接続し、ローカルとクラウドモデルを管理し、VS Codeの馴染みのある環境内で完全にあなた自身のプライベートAIツールチェーンを構築できます。

## ✨ コア機能

* **🎯 6つのAIエンジン、20+の厳選モデル**：ベンダーロックインから解放！OpenRouter、DeepSeek、Google、Volcengine、Azure、Ollamaなど6つの主要AIエンジンをサポートし、最新のGPT-4o、Claude 3.5 Sonnet、DeepSeek V3など20+の厳選モデルをカバー。
* **🧠 5つの専用モデル設定**：短テキスト、長テキスト、思考、画像、動画の5つの専用モデルをインテリジェントに設定し、各タスクに最適なAIモデルを使用。
* **🎨 マルチモーダルAIサポート**：テキスト対話だけでなく、画像理解、動画分析、OCR認識などのマルチメディアAI機能をサポート。
* **⚡ インテリジェントモデルルーティング**：タスクの複雑さ、コンテンツの長さ、モダリティタイプに基づいて最適なモデルを自動選択し、パフォーマンスとコストの完璧なバランスを実現。
* **📓 プロフェッショナルグレードノートブックインターフェース**：シンプルなQ&Aを超えて。AI駆動タスクをリッチテキストノートブックで整理し、Markdown、コードスニペット、AIプロンプトを完璧に融合。
* **🔒 プライバシーファースト設計**：ローカルモデル実行をサポートし、データセキュリティを完全にコントロールしながら、クラウドAPIの利便性も提供。
* **🎛️ 深度IDE統合**：VS Codeのネイティブ機能のように、右クリックメニュー、コードレンズ、専用パネルからAIツールをいつでも呼び出し。
* **🌍 12言語サポート**：完全な中英日独仏西葡越印韓露阿国際化体験。

## 🚀 インストール方法

ニーズに最適なインストール方法を選択してください：

### 📦 方法1: VS Code Marketplace（推奨）

**Chameleonをインストールする最も簡単な方法 - ほとんどのユーザーに最適です。**

1. **拡張機能のインストール:**
   - Visual Studio Codeを開く
   - 拡張機能ビューに移動（`Ctrl+Shift+X`または`Cmd+Shift+X`）
   - **"chameleon-ai-launcher"**を検索
   - 「インストール」をクリック

2. **依存関係のインストール:**
   - インストール後、コマンドパレットを開く（`Ctrl+Shift+P`または`Cmd+Shift+P`）
   - `Chameleon: Open Installation Guide`コマンドを実行
   - Node.js、Git、Claude Code、Gemini CLIのインストール手順に従う

3. **設定と開始:**
   - `Chameleon: Open AI Settings`を実行してAIプロバイダーを設定
   - アクティビティバーのChameleonアイコンをクリックして開始！

### 📁 方法2: 事前ビルドVSIXパッケージ

**拡張機能パッケージファイルから直接インストール。**

1. **VSIXをダウンロード:**
   - [GitHub Releases](https://github.com/chameleon-nexus/Chameleon/releases)にアクセス
   - 最新の`chameleon-ai-launcher-x.x.x.vsix`ファイルをダウンロード

2. **VS Code経由でインストール:**
   ```bash
   # 方法A: コマンドライン
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # 方法B: VS Code UI
   # 1. VS Codeを開く
   # 2. 拡張機能ビューに移動（Ctrl+Shift+X）
   # 3. "..."メニューをクリック → "VSIXからインストール..."
   # 4. ダウンロードした.vsixファイルを選択
   ```

3. **設定を完了:**
   - 方法1と同じ依存関係インストールと設定手順に従う

### 🛠️ 方法3: ソースコードからビルド

**拡張機能に貢献またはカスタマイズしたい開発者向け。**

**前提条件:**
- Git
- Node.js（v16以上）
- npmまたはyarn

**手順:**

1. **クローンとビルド:**
   ```bash
   # リポジトリをクローン
   git clone https://github.com/chameleon-nexus/Chameleon.git
   cd Chameleon
   
   # 依存関係をインストール
   npm install
   
   # 拡張機能をコンパイル
   npm run compile
   
   # 拡張機能をパッケージ化（オプション）
   npm install -g @vscode/vsce
   vsce package
   ```

2. **開発用インストール:**
   ```bash
   # 方法A: パッケージ版をインストール
   code --install-extension chameleon-ai-launcher-x.x.x.vsix
   
   # 方法B: 開発モードで実行
   # VS Codeでプロジェクトを開き、F5を押して拡張機能開発ホストを起動
   ```

3. **依存関係のインストール:**
   - インストールガイドの説明に従ってNode.js、Git、Claude Code、Gemini CLIをインストール
   - 拡張機能設定を通じてAIプロバイダーを設定

---

## ⚙️ インストール後の設定

**インストール方法に関係なく、以下の手順を完了してください:**

1. **Multi-CLI依存関係のインストール:**
   - Node.jsとnpm
   - Git
   - Claude Code CLI（`npm install -g @anthropic-ai/claude-code`）
   - Gemini CLIパッケージ

2. **AIプロバイダーの設定:**
   - コマンドパレットを開き`Chameleon: Open AI Settings`を実行
   - OpenAI、Anthropic、Googleまたは他のプロバイダーのAPIキーを追加

3. **インストールの確認:**
   - VS CodeアクティビティバーのChameleonアイコンをクリック
   - Claude CodeとGemini CLIページを確認
   - すべての依存関係が「インストール済み」と表示されることを確認

**ヘルプが必要ですか？** 詳細な手順については`Chameleon: Open Installation Guide`を実行してください！

1. コマンドパレットを開きます（`Ctrl+Shift+P`）。
2. `Chameleon: AI設定を開く`コマンドを実行します。
3. 使用したいAIプロバイダーを選択し、APIキーを入力します。
4. 設定完了！VS Codeアクティビティバーのカメレオンアイコンをクリックして開始します。

### パス2：開発者（ソースコードから実行）

ソースコードから実行、修正、またはコードに貢献したい場合は、このパスに従ってください。

**前提条件：**
* Gitがインストール済み。
* Node.jsがインストール済み（v16以上推奨）。
* **インストールガイド**に従って、`Claude Code`、`Claude Code Router`などの依存関係のインストールと設定が完了済み。

**操作手順：**

1. **リポジトリのクローン：**
   ```bash
   git clone https://github.com/chameleon-nexus/claude-code-vscode.git
   cd claude-code-vscode
   ```

2. **プロジェクト依存関係のインストール：**
   ```bash
   npm install
   ```

3. **コードのコンパイル：**
   * 一回のコンパイル: `npm run compile`
   * ファイル変更の監視と自動コンパイル: `npm run watch`

4. **拡張機能の実行：**
   * VS Codeでこのプロジェクトフォルダを開きます。
   * `F5`キーを押すと、「拡張開発ホスト」の新しいウィンドウが起動し、カメレオン拡張機能がそのウィンドウで実行されます。

## 🎯 サポートされるAIエンジンとモデル

カメレオンはClaude Code Routerを通じて**6つの主要AIエンジン**をサポートし、**20+の厳選モデル**をカバーし、プロフェッショナルグレードのAI機能を提供します：

### 🔥 テキストAIエンジン

#### **OpenRouter**
- **Claude 3.5 Sonnet**: 最強の推論能力
- **Claude 3 Haiku**: 高速軽量版
- **GPT-4o**: 最新マルチモーダルモデル
- **GPT-4o-mini**: 軽量版、コストパフォーマンス抜群
- **Llama 3.1 405B**: オープンソース大モデル
- **Gemini Pro 1.5**: 長コンテキスト専門家

#### **DeepSeek**
- **DeepSeek Chat**: 汎用対話モデル
- **DeepSeek Coder**: プロフェッショナルコード生成

#### **Google Gemini**
- **Gemini Pro**: 汎用推論モデル
- **Gemini Pro Vision**: 画像理解モデル

#### **Volcengine**
- **DeepSeek V3**: Volcengine版（128Kトークン長コンテキスト）

#### **Azure OpenAI**
- **GPT-4**: クラシック高度推論モデル
- **GPT-4 Turbo**: 高性能推論モデル
- **GPT-3.5 Turbo**: 高速応答モデル

#### **Ollama**（ローカル展開）
- **Llama 3.1**: オープンソース対話モデル
- **CodeLlama**: コード専用モデル
- **Mistral**: 効率的推論モデル
- **Gemma**: 軽量モデル

### 🎨 マルチモーダルAIエンジン

#### **画像理解エンジン - Seedream**
- プロフェッショナルな画像分析、OCR認識、チャート理解
- 複数の画像形式と複雑な視覚タスクをサポート

#### **動画処理エンジン - Seedance**
- プロフェッショナルな動画コンテンツ分析と要約生成
- 長い動画の理解とアクション認識をサポート

### ⚙️ インテリジェントモデル設定

カメレオンは**5つの専用モデル設定**をサポートし、異なるシナリオに最適なAIモデルを選択できます：

#### **1. 短テキストモデル**（高速応答）
- 適用：簡単なQ&A、コード補完、高速翻訳
- 推奨：GPT-3.5-turbo、Claude 3 Haiku、DeepSeek Chat

#### **2. 長テキストモデル**（大コンテキスト）
- 適用：長文書分析、コードレビュー、複雑な推論
- 推奨：GPT-4o、Claude 3.5 Sonnet、DeepSeek V3

#### **3. 思考モデル**（深度推論）
- 適用：複雑な問題解決、アーキテクチャ設計、数学計算
- 推奨：Claude 3.5 Sonnet、GPT-4、Llama 3.1 405B

#### **4. 画像モデル**（視覚理解）
- 適用：画像分析、OCR、チャート理解
- 推奨：Seedreamエンジン

#### **5. 動画モデル**（動画処理）
- 適用：動画要約、コンテンツ分析、アクション認識
- 推奨：Seedanceエンジン

### 🚀 モデルルーティング戦略

カメレオンのインテリジェントルーティングシステムは、以下の条件に基づいて最適なモデルを自動選択します：

- **タスクの複雑さ**: 簡単なタスク→高速モデル、複雑なタスク→推論モデル
- **コンテンツの長さ**: 短テキスト→軽量モデル、長文書→大コンテキストモデル
- **モダリティタイプ**: テキスト→言語モデル、画像→Seedreamエンジン、動画→Seedanceエンジン
- **ユーザー設定**: 特定のモデルの手動指定
- **コスト最適化**: パフォーマンスとコストの完璧なバランス

## 🏗️ アーキテクチャ

### コンポーネント
```
カメレオン拡張機能
├── ウェルカムパネル          # 入門インターフェース
├── 設定パネル              # AIプロバイダー設定
├── チャットパネル          # AI対話インターフェース
├── インストールガイドパネル  # インストール説明
├── システム設定パネル      # 言語とテーマ設定
└── Claudeクライアント      # AIモデル統合
```

### ファイル構造
```
chameleon/
├── src/
│   ├── extension.ts           # メイン拡張エントリ
│   ├── webviews/              # UIパネル
│   │   ├── settingsPanel.ts   # AI設定
│   │   ├── chatPanel.ts       # チャットインターフェース
│   │   ├── installGuidePanel.ts # インストールガイド
│   │   └── systemSettingsPanel.ts # システム設定
│   └── utils/                 # ユーティリティ関数
│       ├── i18n.ts           # 国際化
│       └── claudeClient.ts   # AIクライアント
├── l10n/                     # 翻訳ファイル
├── package.json              # 拡張マニフェスト
└── README.md                 # このファイル
```

## 🌍 国際化

カメレオンは12言語をサポート：
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

## 🏪 AGTHub - AI Agent マーケットプレイス

**[AGTHub](https://www.agthub.org)** は Chameleon の公式 AI Agent マーケットプレイスで、AI Agent の発見、共有、管理のための包括的なプラットフォームを提供します。

### 🌟 主要機能

- **🔍 豊富な Agent ライブラリ**：複数のカテゴリーにわたる数百の無料およびプレミアム AI Agent を閲覧
- **📤 簡単な公開**：ウェブまたは CLI を通じてカスタム Agent をグローバルコミュニティと共有
- **💰 収益化**：プレミアム Agent を販売して AI Agent ビジネスを構築
- **⭐ コミュニティ評価**：コミュニティのレビューと評価で最高の Agent を発見
- **🌐 多言語サポート**：英語、简体中文、日本語、Tiếng Việt に完全対応
- **🚀 直接統合**：AGTHub から Chameleon にワンクリックで Agent をインストール

### 🎯 Chameleon ユーザー向け

AGTHub は Chameleon の Agent マーケットプレイスとシームレスに統合：

1. **閲覧と発見**：[www.agthub.org](https://www.agthub.org) または Chameleon 内で直接 Agent を探索
2. **ワンクリックインストール**：Chameleon のマーケットプレイスパネルから無料 Agent を即座にインストール
3. **プレミアムアクセス**：AGTHub でプレミアム Agent を購入して高度な機能を利用
4. **最新情報を入手**：Agent の更新と新リリースの自動通知を受信

### 🛠️ Agent 開発者向け

コミュニティと Agent を作成して共有：

- **ウェブ公開**：直感的な [AGTHub ダッシュボード](https://www.agthub.org/dashboard) を使用して Agent を公開
- **CLI 公開**：`agt publish` を使用してコマンドラインから公開（[@chameleon-nexus/agents-cli](https://www.npmjs.com/package/@chameleon-nexus/agents-cli) が必要）
- **バージョン管理**：Agent を簡単に更新 - 新バージョンが自動的に古いバージョンを置き換え
- **分析**：ダウンロード数、評価、ユーザーフィードバックを追跡
- **プレミアムオプション**：プレミアム Agent を提供して作品を収益化

### 💼 エンタープライズ向け

エンタープライズチーム向けの特別機能：

- **エンタープライズログイン**：組織アカウント専用の認証
- **無料プレミアムアクセス**：エンタープライズユーザーはすべての有料 Agent に無料でアクセス可能
- **一括管理**：チーム全体の Agent を効率的に管理
- **プライベート公開**：組織内で Agent を内部共有

### 🔗 クイックリンク

- **AGTHub ウェブサイト**：[https://www.agthub.org](https://www.agthub.org)
- **無料 Agent**：[無料 Agent を閲覧](https://www.agthub.org)
- **プレミアム Agent**：[プレミアムセクションを探索](https://www.agthub.org/paid)
- **開発者ダッシュボード**：[Agent を公開](https://www.agthub.org/dashboard)
- **CLI ツール**：[npm の Agents CLI](https://www.npmjs.com/package/@chameleon-nexus/agents-cli)

> **💡 プロのヒント**：Chameleon の内蔵マーケットプレイスはクイック閲覧に最適ですが、詳細な Agent の説明、レビュー、高度な検索フィルターを備えた完全な体験には [AGTHub](https://www.agthub.org) をご覧ください！

## 🔧 トラブルシューティング

### よくある問題

1. **拡張機能がアクティブ化されない**：
   - VS Code開発者コンソールを確認（ヘルプ > 開発者ツールの切り替え）
   - 拡張機能が有効になっていることを確認
   - 競合する拡張機能がないか確認

2. **AIプロバイダー接続の問題**：
   - APIキーが正しく設定されていることを確認
   - ネットワーク接続を確認
   - APIタイムアウト設定を確認
   - 内蔵の接続テスト機能を使用

3. **インストールガイドが動作しない**：
   - 管理者権限があることを確認（Windows）
   - Node.jsとGitが正しくインストールされていることを確認
   - ガイドの手順に従って手動インストールを試行

### デバッグモード

デバッグログを有効にする：
1. VS Code設定を開く
2. "chameleon.debug"を検索
3. デバッグモードを有効にする
4. 出力パネルで"Chameleon"ログを確認

## 🤝 貢献

カメレオンはコミュニティのために構築されたオープンソースプロジェクトです。あらゆる形の貢献を歓迎します！詳細については[貢献ガイド](CONTRIBUTING.md)をご覧ください。

### 開発設定

1. リポジトリをフォーク
2. 機能ブランチを作成
3. 変更を加える
4. 該当する場合はテストを追加
5. プルリクエストを提出

## 📄 オープンソースライセンス

このプロジェクトはMITライセンスの下でオープンソース化されています - 詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 🆘 サポート

- **問題報告**: [GitHub Issues](https://github.com/chameleon-nexus/claude-code-vscode/issues)
- **ディスカッション**: [GitHub Discussions](https://github.com/chameleon-nexus/claude-code-vscode/discussions)
- **ドキュメント**: [Wiki](https://github.com/chameleon-nexus/claude-code-vscode/wiki)

## 📝 更新履歴

### v0.1.0 (初期リリース)
- 汎用AIプロバイダーサポート
- プロフェッショナルグレードノートブックインターフェース
- 深度IDE統合
- プライバシーファースト設計
- 完全国際化（12言語）
- 包括的なインストールガイド

---

**開発者コミュニティのために作られました ❤️**
