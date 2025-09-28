import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { t } from '../utils/i18n';

export class OutputManagementPanel {
    public static currentPanel: OutputManagementPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.setupWebview();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (OutputManagementPanel.currentPanel) {
            OutputManagementPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'chameleonOutputManagement',
            t('toolbox.outputStyle.title'),
            column || vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        OutputManagementPanel.currentPanel = new OutputManagementPanel(panel, extensionUri);
    }

    private setupWebview() {
        this.panel.webview.html = this._getHtmlTemplate();
        this._setWebviewMessageListener();
        this.loadOutputStyle(); // 页面加载时获取现有配置
    }

    private _setWebviewMessageListener() {
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'saveOutputStyle':
                        await this.saveOutputStyle(message.style);
                        break;
                    case 'resetOutputStyle':
                        await this.resetOutputStyle();
                        break;
                    case 'loadOutputStyle':
                        await this.loadOutputStyle();
                        break;
                    case 'backToToolbox':
                        this.panel.dispose();
                        break;
                }
            },
            undefined,
            this.disposables
        );
    }

    private async loadOutputStyle() {
        try {
            const settingsPath = this.getClaudeSettingsPath();
            console.log('[OutputManagementPanel] Loading output style from:', settingsPath);
            let outputStyle = 'default'; // 默认值
            
            try {
                // 检查文件是否存在
                await fs.access(settingsPath);
                
                // 读取文件内容
                const content = await fs.readFile(settingsPath, 'utf8');
                const settings = JSON.parse(content);
                
                // 获取outputStyle，如果没有则使用默认值
                outputStyle = settings.outputStyle || 'default';
                console.log('[OutputManagementPanel] Found outputStyle in settings:', outputStyle);
                
            } catch (error) {
                // 文件不存在或解析失败，使用默认值
                console.log('[OutputManagementPanel] Settings file not found or invalid, using default. Error:', (error as Error).message);
            }
            
            console.log('[OutputManagementPanel] Sending output style to webview:', outputStyle);
            this.panel.webview.postMessage({
                command: 'outputStyleLoaded',
                success: true,
                style: { outputStyle: outputStyle }
            });
        } catch (error) {
            console.error('[OutputManagementPanel] Failed to load output style:', error);
            this.panel.webview.postMessage({
                command: 'outputStyleLoaded',
                success: false,
                error: (error as Error).message
            });
        }
    }

    private async saveOutputStyle(style: any) {
        try {
            console.log('[OutputManagementPanel] Saving output style:', style);
            
            const settingsPath = this.getClaudeSettingsPath();
            const settingsDir = path.dirname(settingsPath);
            
            // 确保目录存在
            await fs.mkdir(settingsDir, { recursive: true });
            
            // 读取现有配置或创建新配置
            let settings: any = {};
            try {
                const content = await fs.readFile(settingsPath, 'utf8');
                settings = JSON.parse(content);
            } catch (error) {
                // 文件不存在或解析失败，使用空对象
                console.log('[OutputManagementPanel] Creating new settings file');
            }
            
            // 更新outputStyle
            settings.outputStyle = style.outputStyle;
            
            // 写入文件
            await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
            
            this.panel.webview.postMessage({
                command: 'outputStyleSaved',
                success: true
            });
            
            vscode.window.showInformationMessage(`输出格式已设置为: ${style.outputStyle}`);
        } catch (error) {
            console.error('[OutputManagementPanel] Failed to save output style:', error);
            this.panel.webview.postMessage({
                command: 'outputStyleSaved',
                success: false,
                error: (error as Error).message
            });
            vscode.window.showErrorMessage(`保存输出格式失败: ${(error as Error).message}`);
        }
    }

    private async resetOutputStyle() {
        try {
            const defaultStyle = 'default';
            
            const settingsPath = this.getClaudeSettingsPath();
            const settingsDir = path.dirname(settingsPath);
            
            // 确保目录存在
            await fs.mkdir(settingsDir, { recursive: true });
            
            // 读取现有配置或创建新配置
            let settings: any = {};
            try {
                const content = await fs.readFile(settingsPath, 'utf8');
                settings = JSON.parse(content);
            } catch (error) {
                // 文件不存在或解析失败，使用空对象
                console.log('[OutputManagementPanel] Creating new settings file for reset');
            }
            
            // 重置outputStyle为默认值
            settings.outputStyle = defaultStyle;
            
            // 写入文件
            await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
            
            this.panel.webview.postMessage({
                command: 'outputStyleReset',
                success: true,
                style: { outputStyle: defaultStyle }
            });
            
            vscode.window.showInformationMessage('输出格式已重置为默认值');
        } catch (error) {
            console.error('[OutputManagementPanel] Failed to reset output style:', error);
            this.panel.webview.postMessage({
                command: 'outputStyleReset',
                success: false,
                error: (error as Error).message
            });
            vscode.window.showErrorMessage(`重置输出格式失败: ${(error as Error).message}`);
        }
    }

    /**
     * 获取 .claude/settings.local.json 文件路径
     */
    private getClaudeSettingsPath(): string {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            // 项目级别设置
            return path.join(workspaceFolder.uri.fsPath, '.claude', 'settings.local.json');
        } else {
            // 如果没有打开的项目，使用用户主目录
            const os = require('os');
            return path.join(os.homedir(), '.claude', 'settings.local.json');
        }
    }

    private _getHtmlTemplate(): string {
        const title = t('toolbox.outputStyle.title');
        const description = t('toolbox.outputStyle.description');
        const codeStyle = t('toolbox.outputStyle.codeStyle');
        const docStyle = t('toolbox.outputStyle.documentationStyle');
        const responseFormat = t('toolbox.outputStyle.responseFormat');
        const includeExamples = t('toolbox.outputStyle.includeExamples');
        const includeParams = t('toolbox.outputStyle.includeParams');
        const includeMetadata = t('toolbox.outputStyle.includeMetadata');
        const backToMain = t('toolbox.backToMain');
        const save = t('save');
        const reset = t('reset');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .header h1 {
            color: var(--vscode-textLink-foreground);
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        
        .header p {
            color: var(--vscode-descriptionForeground);
            margin: 0;
            font-size: 16px;
        }
        
        .back-btn {
            position: absolute;
            top: 20px;
            left: 20px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .back-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .form-container {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 30px;
        }
        
        .form-section {
            margin-bottom: 30px;
        }
        
        .form-section:last-child {
            margin-bottom: 0;
        }
        
        .form-section h3 {
            color: var(--vscode-textLink-foreground);
            margin: 0 0 15px 0;
            font-size: 18px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: inherit;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }
        
        .checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .checkbox-item input[type="checkbox"] {
            width: auto;
            margin: 0;
        }
        
        .checkbox-item label {
            margin: 0;
            cursor: pointer;
            font-weight: normal;
        }
        
        .form-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: inherit;
            min-width: 100px;
            transition: all 0.3s ease;
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
        
        .preview-section {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .preview-section h3 {
            color: var(--vscode-textLink-foreground);
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        
        .preview-box {
            background: var(--vscode-textBlockQuote-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
            font-family: var(--vscode-editor-font-family);
            font-size: 14px;
            line-height: 1.6;
        }
        
        .success-message {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 20px;
            color: var(--vscode-textLink-foreground);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 0 10px;
            }
            
            .form-container {
                padding: 20px;
            }
            
            .form-actions {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <button class="back-btn" onclick="backToToolbox()">${backToMain}</button>
    
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>${description}</p>
        </div>
        
        <div class="form-container">
            <form id="outputStyleForm">
                <!-- Claude Code 输出格式设置 -->
                <div class="form-section">
                    <h3>Claude Code 输出格式</h3>
                    <div class="form-group">
                        <label>选择输出风格</label>
                        <select id="outputStyle">
                            <option value="default">Default - Claude 高效完成编程任务并提供简洁响应</option>
                            <option value="Explanatory">Explanatory - Claude 解释实现选择和代码库模式</option>
                            <option value="Learning">Learning - Claude 暂停并让您编写代码进行实践练习</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <p style="color: var(--vscode-descriptionForeground); font-size: 14px; margin-top: 8px;">
                            此设置将保存到 <code>.claude/settings.local.json</code> 文件中
                        </p>
                    </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="form-actions">
                    <button type="submit" class="btn">${save}</button>
                    <button type="button" class="btn btn-secondary" onclick="resetStyle()">${reset}</button>
                </div>
            </form>
        </div>
        
        <!-- 预览区域 -->
        <div class="preview-section">
            <h3>配置预览</h3>
            <div class="preview-box" id="previewBox">
                <p><strong>当前输出格式:</strong> <span id="previewOutputStyle">default</span></p>
                <p><strong>配置文件路径:</strong> <code id="previewSettingsPath">.claude/settings.local.json</code></p>
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // 表单提交
        document.getElementById('outputStyleForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const style = {
                outputStyle: document.getElementById('outputStyle').value
            };
            
            vscode.postMessage({
                command: 'saveOutputStyle',
                style: style
            });
        });
        
        // 重置样式
        function resetStyle() {
            if (confirm('确定要重置所有输出样式配置为默认值吗？')) {
                vscode.postMessage({
                    command: 'resetOutputStyle'
                });
            }
        }
        
        // 返回工具箱
        function backToToolbox() {
            vscode.postMessage({
                command: 'backToToolbox'
            });
        }
        
        // 更新预览
        function updatePreview() {
            const outputStyle = document.getElementById('outputStyle').value;
            
            document.getElementById('previewOutputStyle').textContent = outputStyle;
            
            // 更新配置文件路径显示
            const settingsPath = outputStyle === 'Default' ? 
                '.claude/settings.local.json' : 
                '.claude/settings.local.json';
            document.getElementById('previewSettingsPath').textContent = settingsPath;
        }
        
        // 绑定预览更新事件
        document.getElementById('outputStyle').addEventListener('change', updatePreview);
        
        // 消息处理
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'outputStyleLoaded':
                    if (message.success) {
                        const style = message.style;
                        console.log('Output style loaded:', style.outputStyle);
                        document.getElementById('outputStyle').value = style.outputStyle || 'default';
                        updatePreview();
                    } else {
                        console.error('Failed to load output style:', message.error);
                        // 如果加载失败，设置为默认值
                        document.getElementById('outputStyle').value = 'default';
                        updatePreview();
                    }
                    break;
                    
                case 'outputStyleSaved':
                    if (message.success) {
                        showSuccessMessage('输出样式配置已保存');
                    }
                    break;
                    
                case 'outputStyleReset':
                    if (message.success) {
                        const style = message.style;
                        document.getElementById('outputStyle').value = style.outputStyle;
                        updatePreview();
                        showSuccessMessage('输出格式配置已重置为默认值');
                    }
                    break;
            }
        });
        
        function showSuccessMessage(message) {
            const existingMessage = document.querySelector('.success-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = message;
            
            const container = document.querySelector('.container');
            container.insertBefore(successDiv, container.firstChild);
            
            setTimeout(() => {
                successDiv.remove();
            }, 3000);
        }
        
        // 页面加载时获取配置
        window.addEventListener('load', () => {
            console.log('Page loaded, requesting output style...');
            vscode.postMessage({
                command: 'loadOutputStyle'
            });
        });
        
        // 确保页面加载后立即获取配置
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, requesting output style...');
            vscode.postMessage({
                command: 'loadOutputStyle'
            });
        });
    </script>
</body>
</html>`;
    }

    public dispose() {
        OutputManagementPanel.currentPanel = undefined;
        
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
