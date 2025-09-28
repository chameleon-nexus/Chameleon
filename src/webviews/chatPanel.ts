import * as vscode from 'vscode';
import { ClaudeClient } from '../utils/claudeClient';
import { t } from '../utils/i18n';

export class ChatPanel {
    // 1. 添加一个静态属性来持有当前面板实例
    public static currentPanel: ChatPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    // 2. 将构造函数变为私有，防止外部直接 new
    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.setupWebview();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    // 3. 创建一个静态方法来创建或显示面板
    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // 如果面板已存在，则显示它
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel.panel.reveal(column);
            return;
        }

        // 否则，创建一个新面板
        const panel = vscode.window.createWebviewPanel(
            'chameleonChat',
            t('chat.title'), // 在这里使用 t() 函数
            column || vscode.ViewColumn.Three,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
    }

    private setupWebview(): void {
        this.panel.webview.html = this.getWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'sendMessage':
                        await this.handleSendMessage(message.text);
                        break;
                    case 'clearHistory':
                        this.clearHistory();
                        break;
                }
            },
            null,
            this.disposables
        );

        // Handle panel disposal
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    private async handleSendMessage(message: string): Promise<void> {
        try {
            console.log('处理聊天消息:', message);
            
            const isChinese = vscode.env.language.startsWith('zh');
            
            // 显示正在处理状态
            this.panel.webview.postMessage({ 
                command: 'addMessage', 
                sender: 'ai', 
                message: isChinese ? '🤔 思考中...' : '🤔 Thinking...',
                isThinking: true
            });
            
            // 直接传递用户的自然语言请求，让Claude自主分析和执行
            const projectPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
            
            // 创建流式回调函数 - 完全按照原始逻辑
            const streamCallback = (streamMessage: any) => {
                // 实时处理每个流式消息
                if (streamMessage.type === 'system' && streamMessage.subtype === 'init') {
                    const systemInitMessage = isChinese 
                        ? `🔧 系统初始化完成\n📁 工作目录: ${streamMessage.cwd}\n🛠️ 可用工具: ${streamMessage.tools.slice(0, 5).join(', ')}${streamMessage.tools.length > 5 ? '...' : ''}`
                        : `🔧 System initialization completed\n📁 Working directory: ${streamMessage.cwd}\n🛠️ Available tools: ${streamMessage.tools.slice(0, 5).join(', ')}${streamMessage.tools.length > 5 ? '...' : ''}`;
                    
                    this.panel.webview.postMessage({
                        command: 'addMessage',
                        sender: 'ai',
                        message: systemInitMessage
                    });
                }
                else if (streamMessage.type === 'assistant' && streamMessage.message?.content) {
                    for (const content of streamMessage.message.content) {
                        if (content.type === 'tool_use') {
                            let toolMessage = isChinese 
                                ? `🔧 调用工具: ${content.name}`
                                : `🔧 Calling tool: ${content.name}`;
                            
                            if (content.input) {
                                const input = content.input;
                                if (input.pattern) {
                                    toolMessage += isChinese 
                                        ? `\n📝 扫描模式: ${input.pattern}`
                                        : `\n📝 Scan pattern: ${input.pattern}`;
                                } else if (input.file_path) {
                                    toolMessage += isChinese 
                                        ? `\n📄 读取文件: ${input.file_path.split('\\').pop()}`
                                        : `\n📄 Reading file: ${input.file_path.split('\\').pop()}`;
                                }
                            }
                            
                            this.panel.webview.postMessage({
                                command: 'addMessage',
                                sender: 'ai',
                                message: toolMessage
                            });
                        }
                    }
                }
                else if (streamMessage.type === 'user' && streamMessage.message?.content) {
                    for (const content of streamMessage.message.content) {
                        if (content.type === 'tool_result' && content.content) {
                            // 显示工具结果的简要反馈 - 保持原始逻辑
                            if (content.content.includes('.txt')) {
                                const fileCount = (content.content.match(/\.txt/g) || []).length;
                                const fileFoundMessage = isChinese 
                                    ? `✅ 发现 ${fileCount} 个文档文件`
                                    : `✅ Found ${fileCount} document files`;
                                
                                this.panel.webview.postMessage({
                                    command: 'addMessage',
                                    sender: 'ai',
                                    message: fileFoundMessage
                                });
                            }
                            else if (content.content.length > 50) {
                                const fileReadMessage = isChinese 
                                    ? `✅ 文件内容已读取 (${Math.round(content.content.length / 100)} KB)`
                                    : `✅ File content read (${Math.round(content.content.length / 100)} KB)`;
                                
                                this.panel.webview.postMessage({
                                    command: 'addMessage',
                                    sender: 'ai',
                                    message: fileReadMessage
                                });
                            }
                        }
                    }
                }
            };
            
            // 先清除"思考中"状态
            this.panel.webview.postMessage({ 
                command: 'updateLastMessage', 
                message: isChinese ? '🔧 开始处理任务...' : '🔧 Starting task processing...' 
            });

            // 创建Claude客户端并发送消息（带流式回调）
            const claudeClient = new ClaudeClient();
            const response = await claudeClient.sendMessage(
                message, // 直接传递用户消息，不做任何修改
                'deepseek-v3-250324',
                { projectPath: projectPath },
                streamCallback // 传入流式回调
            );
            
            // 显示生成阶段
            this.panel.webview.postMessage({
                command: 'addMessage',
                sender: 'ai',
                message: isChinese ? '🎯 正在生成摘要...' : '🎯 Generating summary...'
            });
            
            // 最后显示最终结果
            this.panel.webview.postMessage({ 
                command: 'addMessage', 
                sender: 'ai', 
                message: response.content || (isChinese ? '处理完成' : 'Processing completed') 
            });
            
        } catch (error: any) {
            console.error('聊天消息处理错误:', error);
            this.panel.webview.postMessage({ 
                command: 'updateLastMessage', 
                message: '抱歉，处理您的请求时出现了错误。请稍后重试。' 
            });
        }
    }

    private clearHistory(): void {
        this.panel.webview.postMessage({
            command: 'clearHistory'
        });
    }

    private getWebviewContent(): string {
        const isChinese = vscode.env.language.startsWith('zh');
        
        if (isChinese) {
            return this.getChineseContent();
        } else {
            return this.getEnglishContent();
        }
    }

    private getEnglishContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chameleon Chat</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .chat-header {
            padding: 15px 20px;
            background: var(--vscode-panel-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chat-title {
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .chat-actions {
            display: flex;
            gap: 10px;
        }
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        #chatHistory {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            scroll-behavior: smooth;
        }
        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            max-width: 80%;
            word-wrap: break-word;
        }
        .message.user {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: auto;
            text-align: right;
        }
        .message.ai {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            white-space: pre-wrap;
        }
        .input-container {
            padding: 15px 20px;
            background: var(--vscode-panel-background);
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 10px;
            align-items: flex-end;
        }
        #messageInput {
            flex: 1;
            min-height: 38px;
            max-height: 120px;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
        }
        #messageInput:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        #sendButton {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        #sendButton:hover {
            background: var(--vscode-button-hoverBackground);
        }
        #sendButton:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .ai-toolbar {
            padding: 8px 20px;
            background: var(--vscode-panel-background);
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13px;
        }
        .ai-toolbar-label {
            color: var(--vscode-foreground);
            font-weight: 500;
            white-space: nowrap;
        }
        .ai-toolbar-selector {
            display: flex;
            align-items: center;
        }
        #aiModelSelector {
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            min-width: 120px;
            outline: none;
        }
        #aiModelSelector:hover {
            border-color: var(--vscode-focusBorder);
        }
        #aiModelSelector:focus {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }
    </style>
</head>
<body>
    <div class="chat-header">
        <div class="chat-title">
            🦎 Chameleon Assistant
        </div>
        <div class="chat-actions">
            <button class="btn btn-secondary" onclick="clearHistory()">Clear History</button>
        </div>
    </div>
    
    <div id="chatHistory"></div>
    
    <div class="input-container">
        <textarea 
            id="messageInput" 
            placeholder="Type your message here..."
            rows="1"
        ></textarea>
        <button id="sendButton" onclick="sendMessage()">Send</button>
    </div>
    
    <div class="ai-toolbar">
        <div class="ai-toolbar-label">AI Model:</div>
        <div class="ai-toolbar-selector">
            <select id="aiModelSelector" onchange="selectAIModel(this.value)">
                <option value="auto">Auto</option>
                <option value="claude">Claude Code</option>
                <option value="gemini">Gemini CLI</option>
            </select>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Auto-adjust textarea height
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Enter key to send message
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // AI模型选择功能
        let selectedAIModel = 'auto';
        
        function selectAIModel(model) {
            selectedAIModel = model;
            
            // 发送选择结果到扩展
            vscode.postMessage({
                command: 'selectAIModel',
                model: model
            });
        }
        
        // 页面加载时设置默认选择
        document.addEventListener('DOMContentLoaded', function() {
            const selector = document.getElementById('aiModelSelector');
            if (selector) {
                selector.value = 'auto'; // 默认选择auto
            }
        });

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            
            if (!text) return;
            
            // Add user message to chat history
            addMessage('user', text);
            
            // Clear input
            input.value = '';
            input.style.height = 'auto';
            
            // Send message to extension
            vscode.postMessage({
                command: 'sendMessage',
                text: text
            });
            
            // Disable send button
            document.getElementById('sendButton').disabled = true;
        }

        function addMessage(sender, message) {
            const chatHistory = document.getElementById('chatHistory');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}\`;
            messageDiv.textContent = message;
            
            chatHistory.appendChild(messageDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
            
            // Re-enable send button when AI responds
            if (sender === 'ai') {
                document.getElementById('sendButton').disabled = false;
            }
        }

        function updateLastMessage(message) {
            const chatHistory = document.getElementById('chatHistory');
            const lastMessage = chatHistory.querySelector('.message.ai:last-child');
            if (lastMessage) {
                lastMessage.textContent = message;
            }
        }

        function clearHistory() {
            document.getElementById('chatHistory').innerHTML = '';
            vscode.postMessage({ command: 'clearHistory' });
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'addMessage':
                    addMessage(message.sender, message.message);
                    break;
                case 'updateLastMessage':
                    updateLastMessage(message.message);
                    break;
                case 'clearHistory':
                    document.getElementById('chatHistory').innerHTML = '';
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    private getChineseContent(): string {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chameleon 聊天</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .chat-header {
            padding: 15px 20px;
            background: var(--vscode-panel-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chat-title {
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .chat-actions {
            display: flex;
            gap: 10px;
        }
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        #chatHistory {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            scroll-behavior: smooth;
        }
        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            max-width: 80%;
            word-wrap: break-word;
        }
        .message.user {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: auto;
            text-align: right;
        }
        .message.ai {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            white-space: pre-wrap;
        }
        .input-container {
            padding: 15px 20px;
            background: var(--vscode-panel-background);
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 10px;
            align-items: flex-end;
        }
        #messageInput {
            flex: 1;
            min-height: 38px;
            max-height: 120px;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
        }
        #messageInput:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        #sendButton {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        #sendButton:hover {
            background: var(--vscode-button-hoverBackground);
        }
        #sendButton:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .ai-toolbar {
            padding: 8px 20px;
            background: var(--vscode-panel-background);
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13px;
        }
        .ai-toolbar-label {
            color: var(--vscode-foreground);
            font-weight: 500;
            white-space: nowrap;
        }
        .ai-toolbar-selector {
            display: flex;
            align-items: center;
        }
        #aiModelSelector {
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            min-width: 120px;
            outline: none;
        }
        #aiModelSelector:hover {
            border-color: var(--vscode-focusBorder);
        }
        #aiModelSelector:focus {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }
    </style>
</head>
<body>
    <div class="chat-header">
        <div class="chat-title">
            🦎 Chameleon 助手
        </div>
        <div class="chat-actions">
            <button class="btn btn-secondary" onclick="clearHistory()">清除历史</button>
        </div>
    </div>
    
    <div id="chatHistory"></div>
    
    <div class="input-container">
        <textarea 
            id="messageInput" 
            placeholder="输入您的问题..."
            rows="1"
        ></textarea>
        <button id="sendButton" onclick="sendMessage()">发送</button>
    </div>
    
    <div class="ai-toolbar">
        <div class="ai-toolbar-label">AI模型:</div>
        <div class="ai-toolbar-selector">
            <select id="aiModelSelector" onchange="selectAIModel(this.value)">
                <option value="auto">自动</option>
                <option value="claude">Claude Code</option>
                <option value="gemini">Gemini CLI</option>
            </select>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // 自动调整textarea高度
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // 回车发送消息
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // AI模型选择功能
        let selectedAIModel = 'auto';
        
        function selectAIModel(model) {
            selectedAIModel = model;
            
            // 发送选择结果到扩展
            vscode.postMessage({
                command: 'selectAIModel',
                model: model
            });
        }
        
        // 页面加载时设置默认选择
        document.addEventListener('DOMContentLoaded', function() {
            const selector = document.getElementById('aiModelSelector');
            if (selector) {
                selector.value = 'auto'; // 默认选择auto
            }
        });

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            
            if (!text) return;
            
            // 添加用户消息到聊天历史
            addMessage('user', text);
            
            // 清空输入框
            input.value = '';
            input.style.height = 'auto';
            
            // 发送消息到扩展
            vscode.postMessage({
                command: 'sendMessage',
                text: text
            });
            
            // 禁用发送按钮
            document.getElementById('sendButton').disabled = true;
        }

        function addMessage(sender, message) {
            const chatHistory = document.getElementById('chatHistory');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}\`;
            messageDiv.textContent = message;
            
            chatHistory.appendChild(messageDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
            
            // AI响应时重新启用发送按钮
            if (sender === 'ai') {
                document.getElementById('sendButton').disabled = false;
            }
        }

        function updateLastMessage(message) {
            const chatHistory = document.getElementById('chatHistory');
            const lastMessage = chatHistory.querySelector('.message.ai:last-child');
            if (lastMessage) {
                lastMessage.textContent = message;
            }
        }

        function clearHistory() {
            document.getElementById('chatHistory').innerHTML = '';
            vscode.postMessage({ command: 'clearHistory' });
        }

        // 处理来自扩展的消息
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'addMessage':
                    addMessage(message.sender, message.message);
                    break;
                case 'updateLastMessage':
                    updateLastMessage(message.message);
                    break;
                case 'clearHistory':
                    document.getElementById('chatHistory').innerHTML = '';
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    public dispose(): void {
        ChatPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}