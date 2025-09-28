import * as vscode from 'vscode';
import { t } from '../utils/i18n';

export class CodexWelcomePanel {
    public static currentPanel: CodexWelcomePanel | undefined;

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

        if (CodexWelcomePanel.currentPanel) {
            CodexWelcomePanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'chameleonCodexWelcome',
            t('codexWelcome.exclusiveMode') + ' - Chameleon',
            column || vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        CodexWelcomePanel.currentPanel = new CodexWelcomePanel(panel, extensionUri, extensionContext);
    }

    private setupWebview() {
        // 清理旧的监听器
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }

        // 重新设置HTML内容
        this.panel.webview.html = this._getHtmlTemplate();

        // 注册新的监听器
        this._setWebviewMessageListener();
    }

    private _setWebviewMessageListener() {
        this.disposables.push(
            this.panel.webview.onDidReceiveMessage(
                async (message: any) => {
                    switch (message.command) {
                        case 'launchCLI':
                            await this.launchCLI();
                            break;
                        case 'checkDependencies':
                            await this.checkDependencies();
                            break;
                        case 'showSettings':
                            await this.showSettings();
                            break;
                        case 'showSystemSettings':
                            await this.showSystemSettings();
                            break;
                        case 'backToNavigation':
                            await this.backToNavigation();
                            break;
                        case 'installDependency':
                            await this.installDependency(message.dependency);
                            break;
                        case 'openUrl':
                            await vscode.commands.executeCommand('chameleon.openUrl', message.url);
                            break;
                    }
                }
            )
        );
    }

    private async launchCLI() {
        try {
            // 启动Codex CLI
            const terminal = vscode.window.createTerminal({
                name: "Codex CLI",
                location: vscode.TerminalLocation.Editor
            });
            terminal.sendText("codex");
            terminal.show();
            vscode.window.showInformationMessage(t('codexWelcome.launchSuccess'));
        } catch (error) {
            vscode.window.showErrorMessage(`${t('codexWelcome.launchFailed')}: ${(error as Error).message}`);
        }
    }

    private async checkDependencies() {
        try {
            console.log('[CodexWelcomePanel] 开始依赖检测...');
            
            // 检测Codex相关依赖
            const dependencies = await Promise.all([
                checkCommand('node --version'),
                checkCommand('git --version'),
                checkCommand('npm --version'),
                checkNpmPackage('@openai/codex')
            ]);
            
            const result = {
                'node': dependencies[0],
                'git': dependencies[1],
                'npm': dependencies[2],
                '@openai/codex': dependencies[3]
            };

            this.panel.webview.postMessage({ 
                command: 'dependenciesChecked', 
                result: result, 
                mode: 'codex' 
            });
        } catch (error) {
            console.error('依赖检测失败:', error);
            vscode.window.showErrorMessage(`${t('codexWelcome.checkDepsFailed')}: ${(error as Error).message}`);
            this.panel.webview.postMessage({ 
                command: 'dependenciesChecked', 
                result: null,
                error: (error as Error).message,
                mode: 'codex'
            });
        }
    }

    private async showSettings() {
        try {
            const { ChameleonSettingsPanel } = await import('./settingsPanel');
            ChameleonSettingsPanel.createOrShow(this.extensionUri, 'codex');
        } catch (error) {
            vscode.window.showErrorMessage(`${t('codexWelcome.openSettingsFailed')}: ${(error as Error).message}`);
        }
    }

    private async showSystemSettings() {
        try {
            const { SystemSettingsPanel } = await import('./systemSettingsPanel');
            SystemSettingsPanel.createOrShow(this.extensionUri);
        } catch (error) {
            vscode.window.showErrorMessage(`${t('codexWelcome.openSystemSettingsFailed')}: ${(error as Error).message}`);
        }
    }

    private async backToNavigation() {
        try {
            this.panel.dispose();
            const { NavigationPanel } = await import('./navigationPanel');
            NavigationPanel.createOrShow(this.extensionUri, this.extensionContext);
        } catch (error) {
            vscode.window.showErrorMessage(`${t('codexWelcome.backToNavFailed')}: ${(error as Error).message}`);
        }
    }

    private async installDependency(dependency: string) {
        try {
            const { spawn } = require('child_process');
            let installCommand = '';
            
            switch (dependency) {
                case 'node':
                    installCommand = 'winget install OpenJS.NodeJS';
                    break;
                case 'git':
                    installCommand = 'winget install Git.Git';
                    break;
                case '@openai/codex':
                    installCommand = 'npm install -g @openai/codex';
                    break;
                default:
                    vscode.window.showErrorMessage(`${t('codexWelcome.unsupportedDependency')}: ${dependency}`);
                    return;
            }
            
            const terminal = vscode.window.createTerminal(`安装 ${dependency}`);
            terminal.show();
            terminal.sendText(installCommand);
            
        } catch (error) {
            vscode.window.showErrorMessage(`${t('codexWelcome.installDepsFailed')}: ${(error as Error).message}`);
        }
    }

    private _getHtmlTemplate(): string {
        // 收集所有JS需要的翻译文本
        const jsTranslations = {
            launchFailed: t('codexWelcome.launchFailed'),
            checkDepsFailed: t('codexWelcome.checkDepsFailed'),
            depsLoading: t('codexWelcome.depsLoading'),
            openSettingsFailed: t('codexWelcome.openSettingsFailed'),
            openSystemSettingsFailed: t('codexWelcome.openSystemSettingsFailed'),
            backToNavFailed: t('codexWelcome.backToNavFailed'),
            unsupportedDependency: t('codexWelcome.unsupportedDependency'),
            installDepsFailed: t('codexWelcome.installDepsFailed'),
            configured: t('codexWelcome.configured'),
            notConfigured: t('codexWelcome.notConfigured'),
            installed: t('codexWelcome.installed'),
            notInstalled: t('codexWelcome.notInstalled'),
            clickToConfigure: t('codexWelcome.clickToConfigure'),
            buttonInstall: t('welcome.button.install'),
            buttonWebsite: t('welcome.button.website')
        };
        const jsTranslationsJSON = JSON.stringify(jsTranslations);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('codexWelcome.title')}</title>
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
        .subtitle {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .feature-block {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            transition: all 0.2s ease;
        }
        .feature-block:hover {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-list-hoverBackground);
        }
        .feature-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .feature-desc {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 15px;
            font-size: 13px;
        }
        .feature-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
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
        .dependencies-status {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        .deps-title {
            font-weight: 500;
            margin-bottom: 10px;
            color: var(--vscode-foreground);
        }
        .deps-loading {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        .deps-list {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .dep-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            margin-bottom: 12px;
        }
        .dep-status {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
        }
        .dep-status.installed {
            background-color: #28a745;
        }
        .dep-status.not-installed {
            background-color: #dc3545;
        }
        .dep-name {
            color: var(--vscode-foreground);
            flex: 0 0 auto;
        }
        .install-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            flex: 0 0 auto;
        }
        .install-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .back-button {
            position: absolute;
            top: 20px;
            left: 20px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-secondaryBackground);
            border-radius: 4px;
            padding: 8px 16px;
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
        }
        .back-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
    </style>
</head>
<body>
    <button class="back-button" onclick="backToNavigation()">${t('codexWelcome.backToNav')}</button>
    
    <div class="header">
        <div class="logo">🦎 Chameleon</div>
        <div class="subtitle">${t('codexWelcome.exclusiveMode')}</div>
    </div>

    <div class="feature-grid">
        <!-- Codex CLI Launcher -->
        <div class="feature-block">
            <div class="feature-title">${t('codexWelcome.title')}</div>
            <div class="feature-desc">${t('codexWelcome.desc')}</div>

            <div class="dependencies-status" id="dependenciesStatus">
                <div class="deps-title">${t('codexWelcome.depsTitle')}</div>
                <div class="deps-loading" id="depsLoading">${t('codexWelcome.depsLoading')}</div>
                <div class="deps-list" id="depsList" style="display: none;">
                    <!-- 依赖状态将在这里动态加载 -->
                </div>
            </div>

            <div class="feature-actions" style="margin-top: 15px;">
                 <button class="btn" onclick="launchCLI()">${t('codexWelcome.launchTerminal')}</button>
                 <button class="btn btn-secondary" onclick="checkDependencies()">${t('codexWelcome.recheckDeps')}</button>
            </div>
        </div>

        <!-- Codex Settings -->
        <div class="feature-block" onclick="showSettings()" style="cursor: pointer;">
            <div class="feature-title">${t('codexWelcome.settings')}</div>
            <div class="feature-desc">${t('codexWelcome.settingsDesc')}</div>
        </div>

        <!-- System Settings -->
        <div class="feature-block" onclick="showSystemSettings()" style="cursor: pointer;">
            <div class="feature-title">${t('codexWelcome.systemSettings')}</div>
            <div class="feature-desc">${t('codexWelcome.systemSettingsDesc')}</div>
        </div>
    </div>

    <script>
        // 注入翻译对象
        const vscode = acquireVsCodeApi();
        const L = ${jsTranslationsJSON};
        
        function launchCLI() {
            vscode.postMessage({ command: 'launchCLI' });
        }
        
        function checkDependencies() {
            showDependenciesLoading();
            vscode.postMessage({ command: 'checkDependencies' });
        }
        
        function showSettings() {
            vscode.postMessage({ command: 'showSettings' });
        }

        function showSystemSettings() {
            vscode.postMessage({ command: 'showSystemSettings' });
        }
        
        function backToNavigation() {
            vscode.postMessage({ command: 'backToNavigation' });
        }
        
        function showDependenciesLoading() {
            const loadingEl = document.getElementById('depsLoading');
            const depsListEl = document.getElementById('depsList');
            if (loadingEl) {
                loadingEl.style.display = 'block';
                loadingEl.textContent = L.depsLoading;
            }
            if (depsListEl) {
                depsListEl.style.display = 'none';
                depsListEl.innerHTML = '';
            }
        }

        function displayDependencies(result, mode, errorMessage) {
            const loadingEl = document.getElementById('depsLoading');
            const depsListEl = document.getElementById('depsList');

            if (loadingEl) {
                loadingEl.style.display = 'none';
            }

            if (!depsListEl) {
                return;
            }
            depsListEl.style.display = 'block';

            const depsData = result && typeof result === 'object' ? result : null;
            if (!depsData) {
                depsListEl.innerHTML = '<div style="color: var(--vscode-errorForeground);">' + (errorMessage || L.checkDepsFailed) + '</div>';
                return;
            }

            depsListEl.innerHTML = '';

            for (const dep in depsData) {
                if (!Object.prototype.hasOwnProperty.call(depsData, dep)) {
                    continue;
                }
                const installed = depsData[dep];

                const depItem = document.createElement('div');
                depItem.className = 'dep-item';

                const statusEl = document.createElement('span');
                statusEl.className = 'dep-status ' + (installed ? 'installed' : 'not-installed');

                const nameEl = document.createElement('span');
                nameEl.className = 'dep-name';
                nameEl.textContent = getDepDisplayName(dep) + (installed ? ' - ' + L.installed : ' - ' + L.notInstalled);

                const buttonContainer = document.createElement('div');
                buttonContainer.style.display = 'flex';
                buttonContainer.style.gap = '8px';
                buttonContainer.style.flexWrap = 'wrap';

                const installBtn = document.createElement('button');
                installBtn.className = 'install-btn';
                installBtn.textContent = L.buttonInstall;
                installBtn.onclick = () => installDependency(dep);
                buttonContainer.appendChild(installBtn);

                const websiteBtn = document.createElement('button');
                websiteBtn.className = 'install-btn';
                websiteBtn.textContent = L.buttonWebsite;
                websiteBtn.onclick = () => openInstallPage(dep);
                buttonContainer.appendChild(websiteBtn);

                depItem.appendChild(statusEl);
                depItem.appendChild(nameEl);
                depItem.appendChild(buttonContainer);
                depsListEl.appendChild(depItem);
            }
        }

        function getDepDisplayName(dep) {
            const names = {
                'node': 'Node.js',
                'git': 'Git',
                'npm': 'npm',
                '@openai/codex': 'OpenAI Codex CLI'
            };
            return names[dep] || dep;
        }
        
        function openInstallPage(dep) {
            const urls = {
                'node': 'https://nodejs.org/',
                'git': 'https://git-scm.com/downloads',
                '@openai/codex': 'https://github.com/openai/codex'
            };
            
            const url = urls[dep];
            if (url) {
                vscode.postMessage({ 
                    command: 'openUrl', 
                    url: url 
                });
            }
        }
        
        function installDependency(dep) {
            vscode.postMessage({
                command: 'installDependency',
                dependency: dep
            });
        }

        // 消息处理
        window.addEventListener('message', event => {
            const message = event.data;
            if (message && message.command === 'dependenciesChecked') {
                displayDependencies(message.result, message.mode, message.error);
            }
        });
        
        // 页面加载时自动检测依赖
        window.addEventListener('load', () => {
            checkDependencies();
        });
    </script>
</body>
</html>`;
    }

    public dispose() {
        CodexWelcomePanel.currentPanel = undefined;
        
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}

// 辅助函数
function checkCommand(command: string): Promise<boolean> {
    return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd' : 'sh';
        const args = isWindows ? ['/c', command] : ['-c', command];
        
        let resolved = false;
        
        const child = spawn(shell, args, { 
            stdio: 'pipe',
            timeout: 10000
        });
        
        child.on('error', (error: Error) => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
        });
        
        child.on('close', (code: number) => {
            if (!resolved) {
                resolved = true;
                resolve(code === 0);
            }
        });
        
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                child.kill('SIGKILL');
                resolve(false);
            }
        }, 10000);
    });
}

function checkNpmPackage(packageName: string): Promise<boolean> {
    return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd' : 'sh';
        const args = isWindows ? ['/c', `npm list -g ${packageName}`] : ['-c', `npm list -g ${packageName}`];
        
        let resolved = false;
        
        const child = spawn(shell, args, { 
            stdio: 'pipe',
            timeout: 15000
        });
        
        child.on('error', (error: Error) => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
        });
        
        child.on('close', (code: number) => {
            if (!resolved) {
                resolved = true;
                resolve(code === 0);
            }
        });
        
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                child.kill('SIGKILL');
                resolve(false);
            }
        }, 15000);
    });
}
