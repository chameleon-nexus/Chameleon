import * as vscode from 'vscode';
import { t } from '../utils/i18n';

export class SystemSettingsPanel {
    // 1. 添加一个静态属性来持有当前面板实例
    public static currentPanel: SystemSettingsPanel | undefined;

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
        if (SystemSettingsPanel.currentPanel) {
            SystemSettingsPanel.currentPanel.panel.reveal(column);
            return;
        }

        // 否则，创建一个新面板
        const panel = vscode.window.createWebviewPanel(
            'systemSettings',
            t('systemSettings.title'), // 在这里使用 t() 函数
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        SystemSettingsPanel.currentPanel = new SystemSettingsPanel(panel, extensionUri);
    }

    private setupWebview(): void {
        this.panel.webview.html = this.getWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'changeLanguage':
                        // 不再需要 await，因为我们只是触发一个命令
                        this.changeLanguage();
                        break;
                    case 'changeTheme':
                        await this.changeTheme();
                        break;
                    // 欢迎面板设置相关消息处理已移除
                }
            },
            null,
            this.disposables
        );
    }

    // --- 这是主要的修改 ---
    private changeLanguage(): void {
        try {
            // 执行 VS Code 内置的"配置显示语言"命令
            vscode.commands.executeCommand('workbench.action.configureLocale');
        } catch (error) {
            console.error('Failed to open language picker:', error);
            vscode.window.showErrorMessage(t('systemSettings.language.changeFailed'));
        }
    }
    // ----------------------

    private async changeTheme(): Promise<void> {
        try {
            const currentTheme = vscode.workspace.getConfiguration().get('workbench.colorTheme');
            const newTheme = currentTheme === 'Default Dark+' ? 'Default Light+' : 'Default Dark+';
            
            await vscode.workspace.getConfiguration().update(
                'workbench.colorTheme', 
                newTheme, 
                vscode.ConfigurationTarget.Global
            );
            
            vscode.window.showInformationMessage(t('systemSettings.themeChanged'));
        } catch (error) {
            vscode.window.showErrorMessage(t('systemSettings.themeChangeFailed'));
        }
    }

    // 欢迎面板设置相关函数已移除

    private getWebviewContent(): string {
        const isChinese = vscode.env.language.startsWith('zh');
        
        return `<!DOCTYPE html>
<html lang="${isChinese ? 'zh-CN' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('systemSettings.title')}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-size: 14px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--vscode-panel-background);
            border-radius: 8px;
            border: 1px solid var(--vscode-panel-border);
        }
        .logo {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .section {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: var(--vscode-foreground);
        }
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .setting-item:last-child {
            border-bottom: none;
        }
        .setting-label {
            font-weight: 500;
        }
        .setting-controls {
            display: flex;
            gap: 10px;
        }
        .btn {
            padding: 8px 16px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }
        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .language-selector {
            display: flex;
            gap: 8px;
        }
        .language-btn {
            padding: 6px 12px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        .language-btn.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .language-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">⚙️ ${t('systemSettings.title')}</div>
        <div>${t('systemSettings.subtitle')}</div>
    </div>

    <div class="section">
        <div class="section-title">${t('systemSettings.language.title')}</div>
        <div class="setting-item">
            <div class="setting-label">${t('systemSettings.language.current')}</div>
            <div class="setting-controls">
                <button class="btn btn-primary" onclick="changeLanguage()">
                    ${t('systemSettings.language.switch')}
                </button>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${t('systemSettings.theme.title')}</div>
        <div class="setting-item">
            <div class="setting-label">${t('systemSettings.theme.current')}</div>
            <div class="setting-controls">
                <button class="btn btn-primary" onclick="changeTheme()">
                    ${t('systemSettings.theme.switch')}
                </button>
            </div>
        </div>
    </div>

    <!-- 欢迎面板设置 - 已隐藏 -->
    <!-- <div class="section">
        <div class="section-title">欢迎面板设置</div>
        <div class="setting-item">
            <div class="setting-label">面板显示模式</div>
            <div class="setting-controls">
                <select id="welcomePanelMode" onchange="updateWelcomePanelMode()" class="btn" style="padding: 8px 12px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
                    <option value="full">${t('systemSettings.mode.fullOption')}</option>
                    <option value="claude-only">${t('systemSettings.mode.claudeOnlyOption')}</option>
                </select>
            </div>
        </div>
        <div style="padding: 10px 0; color: var(--vscode-descriptionForeground); font-size: 12px;">
            <p><strong>${t('systemSettings.mode.full')}</strong>：${t('systemSettings.mode.fullDesc')}</p>
            <p><strong>${t('systemSettings.mode.claudeOnly')}</strong>：${t('systemSettings.mode.claudeOnlyDesc')}</p>
        </div>
    </div> -->

    <script>
        const vscode = acquireVsCodeApi();

        // 页面加载时初始化设置
        document.addEventListener('DOMContentLoaded', function() {
            // 欢迎面板设置已移除，无需初始化
        });

        // JavaScript 部分的修改
        function changeLanguage() {
            // 不再需要传递语言参数
            vscode.postMessage({
                command: 'changeLanguage'
            });
        }

        function changeTheme() {
            vscode.postMessage({
                command: 'changeTheme'
            });
        }

        // 欢迎面板设置相关函数已移除
    </script>
</body>
</html>`;
    }

    public dispose(): void {
        SystemSettingsPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
