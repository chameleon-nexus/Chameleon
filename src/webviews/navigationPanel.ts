import * as vscode from 'vscode';
import { t } from '../utils/i18n';

export class NavigationPanel {
    public static currentPanel: NavigationPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly extensionContext: vscode.ExtensionContext;
    private disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, extensionContext: vscode.ExtensionContext) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.extensionContext = extensionContext;
        this.setupWebview();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri, extensionContext: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (NavigationPanel.currentPanel) {
            NavigationPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'chameleonNavigation',
            t('navigation.title'),
            column || vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        NavigationPanel.currentPanel = new NavigationPanel(panel, extensionUri, extensionContext);
    }

    private setupWebview() {
        this.panel.webview.html = this._getHtmlTemplate();
        this._setWebviewMessageListener();
    }

    private _setWebviewMessageListener() {
        this.panel.webview.onDidReceiveMessage(
            async (message: any) => {
                switch (message.command) {
                    case 'launchClaude':
                        await this.launchClaudeCLI();
                        break;
                    case 'launchGemini':
                        await this.launchGeminiCLI();
                        break;
                    case 'launchCodex':
                        await this.launchCodexCLI();
                        break;
                    case 'launchCopilot':
                        await this.launchCopilotCLI();
                        break;
                    case 'logout':
                        await this.logout();
                        break;
                    case 'showEngineSettings':
                        await this.showEngineSettings();
                        break;
                    case 'showSystemSettings':
                        await this.showSystemSettings();
                        break;
                }
            },
            undefined,
            this.disposables
        );
    }

    private async launchClaudeCLI() {
        try {
            // 设置Claude专属模式
            await vscode.commands.executeCommand('chameleon.setActiveCliMode', 'claude-router');
            
            // 显示Claude专属欢迎页面（不关闭导航面板）
            const { ClaudeWelcomePanel } = await import('./claudeWelcomePanel');
            ClaudeWelcomePanel.createOrShow(this.extensionUri, this.extensionContext);
            
            vscode.window.showInformationMessage(t('navigation.claudeModeEntered'));
        } catch (error) {
            vscode.window.showErrorMessage(`${t('navigation.claudeModeFailed')}: ${(error as Error).message}`);
        }
    }

    private async launchGeminiCLI() {
        try {
            // 设置Gemini模式
            await vscode.commands.executeCommand('chameleon.setActiveCliMode', 'gemini-router');
            
            // 显示Gemini欢迎页面（不关闭导航面板）
            const { GeminiWelcomePanel } = await import('./geminiWelcomePanel');
            GeminiWelcomePanel.createOrShow(this.extensionUri, this.extensionContext);
            
            vscode.window.showInformationMessage(t('navigation.geminiModeEntered'));
        } catch (error) {
            vscode.window.showErrorMessage(`${t('navigation.geminiModeFailed')}: ${(error as Error).message}`);
        }
    }

    private async launchCodexCLI() {
        try {
            // 显示Codex专属页面（不关闭导航面板）
            const { CodexWelcomePanel } = await import('./codexWelcomePanel');
            CodexWelcomePanel.createOrShow(this.extensionUri, this.extensionContext);
            
            vscode.window.showInformationMessage(t('navigation.codexModeEntered'));
        } catch (error) {
            vscode.window.showErrorMessage(`${t('navigation.codexFailed')}: ${(error as Error).message}`);
        }
    }


    private async launchCopilotCLI() {
        try {
            // 显示Copilot专属页面（不关闭导航面板）
            const { CopilotWelcomePanel } = await import('./copilotWelcomePanel');
            CopilotWelcomePanel.createOrShow(this.extensionUri, this.extensionContext);
            
            vscode.window.showInformationMessage(t('navigation.copilotModeEntered'));
        } catch (error) {
            vscode.window.showErrorMessage(`${t('navigation.copilotFailed')}: ${(error as Error).message}`);
        }
    }

    private async logout() {
        try {
            // 清除保存的token
            await this.extensionContext.secrets.delete('chameleon.token');
            
            // 关闭导航面板
            this.panel.dispose();
            
            // 重新显示登录页面
            const { LoginPanel } = await import('./loginPanel');
            LoginPanel.createOrShow(this.extensionUri, this.extensionContext);
            
            vscode.window.showInformationMessage(t('navigation.logoutSuccess'));
        } catch (error) {
            vscode.window.showErrorMessage(`${t('navigation.logoutFailed')}: ${(error as Error).message}`);
        }
    }

    private async showEngineSettings() {
        try {
            // 调用Claude设置命令，与claude专属页保持一致
            await vscode.commands.executeCommand('chameleon.settings');
        } catch (error) {
            vscode.window.showErrorMessage(`${t('navigation.openEngineSettingsFailed')}: ${(error as Error).message}`);
        }
    }

    private async showSystemSettings() {
        try {
            // 直接导入系统设置面板，与claude专属页保持一致
            const { SystemSettingsPanel } = await import('./systemSettingsPanel');
            SystemSettingsPanel.createOrShow(this.extensionUri);
        } catch (error) {
            // console.error('导入系统设置面板失败:', error);
            vscode.window.showErrorMessage(`${t('navigation.openSystemSettingsFailed')}: ${(error as Error).message}`);
        }
    }

    private _getHtmlTemplate(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('navigation.title')}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        
        .navigation-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
            margin: 0 0 10px 0;
        }
        
        .header p {
            font-size: 16px;
            color: var(--vscode-descriptionForeground);
            margin: 0;
        }
        
        .logout-section {
            text-align: right;
            margin-bottom: 20px;
        }
        
        .logout-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-secondaryBackground);
            border-radius: 6px;
            padding: 8px 16px;
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .logout-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .tools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-bottom: 40px;
        }
        
        .tool-card {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .tool-card:hover {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
        
        .tool-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .tool-title {
            font-size: 20px;
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
            margin: 0 0 8px 0;
        }
        
        .tool-description {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin: 0 0 20px 0;
            line-height: 1.5;
        }
        
        .tool-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 6px;
            padding: 10px 20px;
            font-family: inherit;
            font-size: inherit;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s;
        }
        
        .tool-button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .tool-button:disabled {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .tool-card.disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .tool-card.disabled:hover {
            border-color: var(--vscode-panel-border);
            box-shadow: none;
            transform: none;
        }
        
        .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            margin-top: 40px;
        }
        
        .setting-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .setting-card:hover {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
        }
        
        .setting-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }
        
        .setting-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
            margin: 0 0 4px 0;
        }
        
        .setting-desc {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin: 0;
            line-height: 1.4;
        }
        
        @media (max-width: 768px) {
            .tools-grid {
                grid-template-columns: 1fr;
            }
            
            .settings-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="navigation-container">
        <div class="header">
            <h1>${t('navigation.pageTitle')}</h1>
            <p>${t('navigation.subtitle')}</p>
        </div>
        
        <div class="logout-section">
            <button class="logout-button" onclick="logout()">${t('navigation.logout')}</button>
        </div>
        
        <div class="tools-grid">
            <div class="tool-card" onclick="launchClaude()">
                <div class="tool-icon">🤖</div>
                <h3 class="tool-title">${t('navigation.claudeCode')}</h3>
                <p class="tool-description">
                    ${t('navigation.claudeCodeDesc')}
                </p>
                <button class="tool-button">${t('navigation.claudeCodeButton')}</button>
            </div>
            
            <div class="tool-card" onclick="launchGemini()">
                <div class="tool-icon">💎</div>
                <h3 class="tool-title">${t('navigation.gemini')}</h3>
                <p class="tool-description">
                    ${t('navigation.geminiDesc')}
                </p>
                <button class="tool-button">${t('navigation.geminiButton')}</button>
            </div>
            
            <div class="tool-card" onclick="launchCodex()">
                <div class="tool-icon">⚡</div>
                <h3 class="tool-title">${t('navigation.codex')}</h3>
                <p class="tool-description">
                    ${t('navigation.codexDesc')}
                </p>
                <button class="tool-button">${t('navigation.codexButton')}</button>
            </div>
            
            
            <div class="tool-card" onclick="launchCopilot()">
                <div class="tool-icon">🤖</div>
                <h3 class="tool-title">${t('navigation.copilot')}</h3>
                <p class="tool-description">
                    ${t('navigation.copilotDesc')}
                </p>
                <button class="tool-button">${t('navigation.copilotButton')}</button>
            </div>
        </div>
        
        <div class="settings-grid">
            <div class="setting-card" onclick="showEngineSettings()">
                <div class="setting-icon">🔧</div>
                <div class="setting-title">${t('navigation.engineSettings')}</div>
                <div class="setting-desc">${t('navigation.engineSettingsDesc')}</div>
            </div>
            <div class="setting-card" onclick="showSystemSettings()">
                <div class="setting-icon">⚙️</div>
                <div class="setting-title">${t('navigation.systemSettings')}</div>
                <div class="setting-desc">${t('navigation.systemSettingsDesc')}</div>
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function launchClaude() {
            vscode.postMessage({
                command: 'launchClaude'
            });
        }
        
        function launchGemini() {
            vscode.postMessage({
                command: 'launchGemini'
            });
        }
        
        function launchCodex() {
            vscode.postMessage({
                command: 'launchCodex'
            });
        }
        
        
        function launchCopilot() {
            vscode.postMessage({
                command: 'launchCopilot'
            });
        }
        
        function logout() {
            vscode.postMessage({
                command: 'logout'
            });
        }
        
        function showEngineSettings() {
            vscode.postMessage({
                command: 'showEngineSettings'
            });
        }
        
        function showSystemSettings() {
            vscode.postMessage({
                command: 'showSystemSettings'
            });
        }
    </script>
</body>
</html>`;
    }

    public dispose() {
        NavigationPanel.currentPanel = undefined;
        
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
