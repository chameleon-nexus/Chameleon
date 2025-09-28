import * as vscode from 'vscode';
import { t } from '../utils/i18n';
import { AgentManagementPanel } from './agentManagementPanel';
import { OutputManagementPanel } from './outputManagementPanel';

export class ToolboxPanel {
    public static currentPanel: ToolboxPanel | undefined;

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

        if (ToolboxPanel.currentPanel) {
            ToolboxPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'chameleonToolbox',
            t('toolbox.title'),
            column || vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        ToolboxPanel.currentPanel = new ToolboxPanel(panel, extensionUri);
    }

    private setupWebview() {
        this.panel.webview.html = this._getHtmlTemplate();
        this._setWebviewMessageListener();
    }

    private _setWebviewMessageListener() {
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'openAgentManagement':
                        await this.openAgentManagement();
                        break;
                    case 'openOutputManagement':
                        await this.openOutputManagement();
                        break;
                    case 'openPromptGenerator':
                        await this.openPromptGenerator();
                        break;
                    case 'backToMain':
                        this.panel.dispose();
                        break;
                }
            },
            undefined,
            this.disposables
        );
    }

    private async openAgentManagement() {
        try {
            console.log('[ToolboxPanel] Opening Agent Management...');
            AgentManagementPanel.createOrShow(this.extensionUri);
        } catch (error) {
            console.error('[ToolboxPanel] Failed to open Agent Management:', error);
            vscode.window.showErrorMessage('打开代理管理失败: ' + (error as Error).message);
        }
    }

    private async openOutputManagement() {
        try {
            console.log('[ToolboxPanel] Opening Output Management...');
            OutputManagementPanel.createOrShow(this.extensionUri);
        } catch (error) {
            console.error('[ToolboxPanel] Failed to open Output Management:', error);
            vscode.window.showErrorMessage('打开输出管理失败: ' + (error as Error).message);
        }
    }

    private async openPromptGenerator() {
        vscode.window.showInformationMessage(t('toolbox.comingSoon.message'));
    }


    private _getHtmlTemplate(): string {
        // 获取翻译文本
        const title = t('toolbox.title');
        const subtitle = t('toolbox.subtitle');
        const agentTitle = t('toolbox.agentManagement.title');
        const agentDesc = t('toolbox.agentManagement.description');
        const outputTitle = t('toolbox.outputStyle.title');
        const outputDesc = t('toolbox.outputStyle.description');
        const promptTitle = t('toolbox.promptGenerator.title');
        const promptDesc = t('toolbox.promptGenerator.description');
        const backToMain = t('toolbox.backToMain');

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
            margin-bottom: 40px;
        }
        
        .header h1 {
            color: var(--vscode-textLink-foreground);
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        .header p {
            color: var(--vscode-descriptionForeground);
            font-size: 16px;
        }
        
        .toolbox-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .tool-card {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            min-height: 180px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .tool-card:hover {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .tool-icon {
            font-size: 48px;
            margin-bottom: 16px;
            display: block;
        }
        
        .tool-card h3 {
            color: var(--vscode-textLink-foreground);
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
        }
        
        .tool-card p {
            color: var(--vscode-descriptionForeground);
            margin: 0;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .empty-grid {
            background: var(--vscode-panel-background);
            border: 2px dashed var(--vscode-panel-border);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            min-height: 180px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .back-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .back-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        @media (max-width: 768px) {
            .toolbox-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
            
            .tool-card {
                min-height: 160px;
                padding: 20px;
            }
            
            .tool-icon {
                font-size: 40px;
            }
        }
        
        @media (max-width: 480px) {
            .toolbox-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>${subtitle}</p>
        </div>
        
        <div class="toolbox-grid">
            <!-- 子代理管理 -->
            <div class="tool-card" onclick="openAgentManagement()">
                <span class="tool-icon">🤖</span>
                <h3>${agentTitle}</h3>
                <p>${agentDesc}</p>
            </div>
            
            <!-- 输出样式管理 -->
            <div class="tool-card" onclick="openOutputManagement()">
                <span class="tool-icon">🎨</span>
                <h3>${outputTitle}</h3>
                <p>${outputDesc}</p>
            </div>
            
            <!-- 提示词生成器 -->
            <div class="tool-card" onclick="openPromptGenerator()">
                <span class="tool-icon">✨</span>
                <h3>${promptTitle}</h3>
                <p>${promptDesc}</p>
            </div>
            
            <!-- 占位符 - 未来扩展 -->
            <div class="empty-grid">
                <span class="tool-icon">🚧</span>
                <h3>${t('toolbox.comingSoon.title')}</h3>
                <p>${t('toolbox.comingSoon.desc')}</p>
            </div>
            
            <div class="empty-grid">
                <span class="tool-icon">🚧</span>
                <h3>${t('toolbox.comingSoon.title')}</h3>
                <p>${t('toolbox.comingSoon.desc')}</p>
            </div>
            
            <div class="empty-grid">
                <span class="tool-icon">🚧</span>
                <h3>${t('toolbox.comingSoon.title')}</h3>
                <p>${t('toolbox.comingSoon.desc')}</p>
            </div>
            
            <div class="empty-grid">
                <span class="tool-icon">🚧</span>
                <h3>${t('toolbox.comingSoon.title')}</h3>
                <p>${t('toolbox.comingSoon.desc')}</p>
            </div>
            
            <div class="empty-grid">
                <span class="tool-icon">🚧</span>
                <h3>${t('toolbox.comingSoon.title')}</h3>
                <p>${t('toolbox.comingSoon.desc')}</p>
            </div>
        </div>
    </div>
    
    <button class="back-btn" onclick="backToMain()">${backToMain}</button>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function openAgentManagement() {
            vscode.postMessage({
                command: 'openAgentManagement'
            });
        }
        
        function openOutputManagement() {
            vscode.postMessage({
                command: 'openOutputManagement'
            });
        }
        
        function openPromptGenerator() {
            vscode.postMessage({
                command: 'openPromptGenerator'
            });
        }
        
        function backToMain() {
            vscode.postMessage({
                command: 'backToMain'
            });
        }
    </script>
</body>
</html>`;
    }

    public dispose() {
        ToolboxPanel.currentPanel = undefined;
        
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
