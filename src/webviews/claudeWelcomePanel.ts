import * as vscode from 'vscode';
import { t } from '../utils/i18n';

export class ClaudeWelcomePanel {
    public static currentPanel: ClaudeWelcomePanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly extensionContext: vscode.ExtensionContext;
    private disposables: vscode.Disposable[] = [];
    private isLaunchingCLI = false; // 防重入保�?
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

        if (ClaudeWelcomePanel.currentPanel) {
            ClaudeWelcomePanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'chameleonClaudeWelcome',
            t('claudeWelcome.exclusiveMode') + ' - Chameleon',
            column || vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        ClaudeWelcomePanel.currentPanel = new ClaudeWelcomePanel(panel, extensionUri, extensionContext);
    }

    private setupWebview() {
        // --- 开始清�?---
        // 1. 销毁所有旧的监听器和可丢弃对象
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
        // --- 清理结束 ---

        // 2. 重新设置HTML内容
        this.panel.webview.html = this._getHtmlTemplate();

        // 3. 注册新的、干净的监听器
        this._setWebviewMessageListener();
    }

    private _setWebviewMessageListener() {
        // �?onDidReceiveMessage 的返回值（一�?Disposable）推入数�?        this.disposables.push(
            this.panel.webview.onDidReceiveMessage(
                async (message: any) => {
                    switch (message.command) {
                        case 'launchCLI':
                            await this.launchCLI();
                            break;
                        case 'checkDependencies':
                            await this.checkDependencies();
                            break;
                        case 'showToolbox':
                            await this.showToolbox();
                            break;
                        case 'showClaudeSettings':
                            await this.showClaudeSettings();
                            break;
                        case 'showSystemSettings':
                            await this.showSystemSettings();
                            break;
                        case 'switchMode':
                            await this.switchMode(message.mode);
                            break;
                        case 'backToNavigation':
                            await this.backToNavigation();
                            break;
                        case 'showSettings':
                            await this.showSettings();
                            break;
                        case 'showSystemSettings':
                            await this.showSystemSettings();
                            break;
                        case 'openSettings':
                            await this.showClaudeSettings();
                            break;
                        case 'openUrl':
                            await vscode.commands.executeCommand('chameleon.openUrl', message.url);
                            break;
                        case 'installDependency':
                            await this.installDependency(message.dependency);
                            break;
                    }
                },
                undefined
                // 注意：第三个参数在这里不需要了，因为我们手动管理disposables数组
            );
    }

    private async launchCLI() {
        try {
            await vscode.commands.executeCommand('chameleon.launchActiveCLI');
        } catch (error) {
            vscode.window.showErrorMessage(`${t('claudeWelcome.launchCLIFailed')}: ${(error as Error).message}`);
        }
    }

    private async checkDependencies() {
        try {
            console.log('[ClaudeWelcomePanel] 开始依赖检测...');
            const config = vscode.workspace.getConfiguration('chameleon');
            const activeMode = config.get<string>('activeCliMode', 'claude-router');
            console.log('[ClaudeWelcomePanel] 当前活动模式:', activeMode);
            
            // 添加超时机制
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('依赖检测超时，请检查网络连接或重试')), 30000);
            });
            
            console.log('[ClaudeWelcomePanel] 执行依赖检测命令...');
            const start = Date.now();
            const checkPromise = vscode.commands.executeCommand('chameleon.checkDependencies', activeMode);
            
            const result = await Promise.race([checkPromise, timeoutPromise]);
            const duration = Date.now() - start;
            console.log('[ClaudeWelcomePanel] 依赖检测结果:', result);
            console.log('[ClaudeWelcomePanel] 依赖检测耗时(ms):', duration);

            this.panel.webview.postMessage({ command: 'dependenciesChecked', result: result, mode: activeMode });
            console.log('[ClaudeWelcomePanel] 已发送依赖检测结果到前端');
        } catch (error) {
            console.error('依赖检测失败:', error);
            vscode.window.showErrorMessage(`${t('claudeWelcome.checkDepsFailed')}: ${(error as Error).message}`);
            // 发送错误结果到前端
            console.log('[ClaudeWelcomePanel] 向前端发送错误信息');
            this.panel.webview.postMessage({ 
                command: 'dependenciesChecked', 
                result: null,
                error: (error as Error).message,
                mode: vscode.workspace.getConfiguration('chameleon').get<string>('activeCliMode', 'claude-router')
            });
        }
    }

    private async showToolbox() {
        try {
            const { ToolboxPanel } = await import('./toolboxPanel');
            ToolboxPanel.createOrShow(this.extensionUri);
        } catch (error) {
            vscode.window.showErrorMessage(`${t('claudeWelcome.openToolboxFailed')}: ${(error as Error).message}`);
        }
    }

    private async showClaudeSettings() {
        try {
            await vscode.commands.executeCommand('chameleon.settings');
        } catch (error) {
            vscode.window.showErrorMessage(`${t('claudeWelcome.openSettingsFailed')}: ${(error as Error).message}`);
        }
    }

    private async switchMode(mode: string) {
        try {
            await vscode.commands.executeCommand('chameleon.setActiveCliMode', mode);
            // 不重新加载整个页面，而是通知前端更新依赖检测
            this.panel.webview.postMessage({ 
                command: 'modeChanged', 
                mode: mode 
            });
        } catch (error) {
            vscode.window.showErrorMessage(`${t('claudeWelcome.switchModeFailed')}: ${(error as Error).message}`);
        }
    }

    private async backToNavigation() {
        try {
            // 关闭当前面板
            this.panel.dispose();
            // 显示导航面板
            const { NavigationPanel } = await import('./navigationPanel');
            NavigationPanel.createOrShow(this.extensionUri, this.extensionContext);
        } catch (error) {
            vscode.window.showErrorMessage(`${t('claudeWelcome.backToNavFailed')}: ${(error as Error).message}`);
        }
    }

    private async showSettings() {
        try {
            const { ChameleonSettingsPanel } = await import('./settingsPanel');
            ChameleonSettingsPanel.createOrShow(this.extensionUri, 'claude');
        } catch (error) {
            vscode.window.showErrorMessage(`${t('claudeWelcome.openSettingsFailed')}: ${(error as Error).message}`);
        }
    }

    private async showSystemSettings() {
        try {
            const { SystemSettingsPanel } = await import('./systemSettingsPanel');
            SystemSettingsPanel.createOrShow(this.extensionUri);
        } catch (error) {
            vscode.window.showErrorMessage(`${t('claudeWelcome.openSystemSettingsFailed')}: ${(error as Error).message}`);
        }
    }


    private async installDependency(dependency: string) {
        try {
            // 直接调用原始代码中的安装函数
            const { spawn } = await import('child_process');
            let installCommand = '';
            
            switch (dependency) {
                case 'node':
                    installCommand = 'winget install OpenJS.NodeJS';
                    break;
                case 'git':
                    installCommand = 'winget install Git.Git';
                    break;
                case '@anthropic-ai/claude-code':
                    installCommand = 'npm install -g @anthropic-ai/claude-code';
                    break;
                case '@chameleon-nexus-tech/claude-code-router':
                    installCommand = 'npm install -g @chameleon-nexus-tech/claude-code-router';
                    break;
                default:
                    vscode.window.showErrorMessage(`${t('claudeWelcome.unsupportedDependency')}: ${dependency}`);
                    return;
            }
            
            const terminal = vscode.window.createTerminal(`安装 ${dependency}`);
            terminal.show();
            terminal.sendText(installCommand);
            
        } catch (error) {
            vscode.window.showErrorMessage(`${t('claudeWelcome.installDepsFailed')}: ${(error as Error).message}`);
        }
    }

    private _getHtmlTemplate(): string {
        const config = vscode.workspace.getConfiguration('chameleon');
        const activeMode = config.get<string>('activeCliMode', 'claude-router');

        // 收集所�?JS 需要的翻译文本
        const jsTranslations = {
            launchCLIFailed: t('claudeWelcome.launchCLIFailed'),
            checkDepsFailed: t('claudeWelcome.checkDepsFailed'),
            depsLoading: t('claudeWelcome.depsLoading'),
            openToolboxFailed: t('claudeWelcome.openToolboxFailed'),
            openSettingsFailed: t('claudeWelcome.openSettingsFailed'),
            switchModeFailed: t('claudeWelcome.switchModeFailed'),
            unsupportedDependency: t('claudeWelcome.unsupportedDependency'),
            installDepsFailed: t('claudeWelcome.installDepsFailed'),
            openSystemSettingsFailed: t('claudeWelcome.openSystemSettingsFailed'),
            restartRecommendation: t('claudeWelcome.restartRecommendation'),
            configured: t('claudeWelcome.configured'),
            notConfigured: t('claudeWelcome.notConfigured'),
            installed: t('claudeWelcome.installed'),
            notInstalled: t('claudeWelcome.notInstalled'),
            clickToConfigure: t('claudeWelcome.clickToConfigure'),
            buttonInstall: t('welcome.button.install'),
            buttonWebsite: t('welcome.button.website')
        };
        const jsTranslationsJSON = JSON.stringify(jsTranslations);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('welcome.title')}</title>
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
            .cli-launcher {
                padding-top: 15px;
                border-top: 1px solid var(--vscode-panel-border);
                margin-top: 15px;
            }
            .cli-launcher label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--vscode-foreground);
            }
            .cli-launcher select {
                width: 100%;
                padding: 8px 12px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid #000000;
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
            }
            .cli-launcher select:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
            }
            .cli-launcher select option {
                background: var(--vscode-dropdown-background);
                color: var(--vscode-dropdown-foreground);
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
        <button class="back-button" onclick="backToNavigation()">${t('claudeWelcome.backToNav')}</button>
        
        <div class="header">
            <div class="logo">🦎 Chameleon</div>
            <div class="subtitle">${t('claudeWelcome.exclusiveMode')}</div>
        </div>

        <div class="feature-grid">
            <!-- Claude Code Launcher -->
            <div class="feature-block">
                <div class="feature-title">${t('claudeWelcome.title')}</div>
                <div class="feature-desc">${t('claudeWelcome.desc')}</div>
                
                <div class="cli-launcher">
                    <label for="claudeModeSelector">${t('claudeWelcome.mode')}</label>
                    <select id="claudeModeSelector" onchange="switchMode()">
                        <option value="claude-native" ${activeMode === 'claude-native' ? 'selected' : ''}>${t('claudeWelcome.official')}</option>
                        <option value="claude-router" ${activeMode === 'claude-router' ? 'selected' : ''}>${t('claudeWelcome.thirdParty')}</option>
                    </select>
                </div>

                <div class="dependencies-status" id="dependenciesStatus">
                    <div class="deps-title">${t('claudeWelcome.depsTitle')}</div>
                    <div class="deps-loading" id="depsLoading">${t('claudeWelcome.depsLoading')}</div>
                    <div class="deps-list" id="depsList" style="display: none;">
                        <!-- ${t('claudeWelcome.depsLoadingComment')} -->
                    </div>
                    <div class="restart-notice" style="margin-top: 15px; padding: 10px; background-color: var(--vscode-editor-inactiveSelectionBackground); border-radius: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">
                        ${t('claudeWelcome.restartRecommendation')}
                    </div>
                </div>

                <div class="feature-actions" style="margin-top: 15px;">
                     <button class="btn" onclick="launchCLI()">${t('claudeWelcome.launchTerminal')}</button>
                     <button class="btn btn-secondary" onclick="checkDependencies()">${t('claudeWelcome.recheckDeps')}</button>
                </div>
            </div>

            <!-- Claude Toolbox -->
            <div class="feature-block" onclick="showToolbox()" style="cursor: pointer;">
                <div class="feature-title">${t('claudeWelcome.toolbox')}</div>
                <div class="feature-desc">${t('claudeWelcome.toolboxDesc')}</div>
            </div>

            <!-- Claude Settings -->
            <div class="feature-block" onclick="showSettings()" style="cursor: pointer;">
                <div class="feature-title">${t('claudeWelcome.settings')}</div>
                <div class="feature-desc">${t('claudeWelcome.settingsDesc')}</div>
            </div>

            <!-- System Settings -->
            <div class="feature-block" onclick="showSystemSettings()" style="cursor: pointer;">
                <div class="feature-title">${t('claudeWelcome.systemSettings')}</div>
                <div class="feature-desc">${t('claudeWelcome.systemSettingsDesc')}</div>
            </div>

            <!-- Claude Settings - Hidden -->
            <!-- <div class="feature-block" onclick="showClaudeSettings()" style="cursor: pointer;">
                <div class="feature-title">${t('claudeWelcome.settings')}</div>
                <div class="feature-desc">${t('claudeWelcome.settingsDesc')}</div>
            </div> -->

            <!-- System Settings - Hidden -->
            <!-- <div class="feature-block" onclick="showSystemSettings()" style="cursor: pointer;">
                <div class="feature-title">⚙️ 系统设置</div>
                <div class="feature-desc">配置欢迎面板模式和其他系统选项</div>
            </div> -->
        </div>
    
    <script>
        // 注入翻译对象
        const vscode = acquireVsCodeApi();
        const L = ${jsTranslationsJSON};
        console.log('Claude: Translation object loaded:', L);
        console.log('Claude: Translation keys count:', Object.keys(L || {}).length);
        
        function launchCLI() {
            vscode.postMessage({ command: 'launchCLI' });
        }
        
        function checkDependencies() {
            console.log('[ClaudeFrontend] checkDependencies 被调用，准备向扩展请求检测');
            showDependenciesLoading();
            vscode.postMessage({ command: 'checkDependencies' });
        }
        
        function showToolbox() {
            vscode.postMessage({ command: 'showToolbox' });
        }
        
        function showClaudeSettings() {
            vscode.postMessage({ command: 'showClaudeSettings' });
        }

        function showSystemSettings() {
            vscode.postMessage({ command: 'showSystemSettings' });
        }
        
        function switchMode() {
            const selector = document.getElementById('claudeModeSelector');
            if (selector) {
                vscode.postMessage({ command: 'switchMode', mode: selector.value });
            }
        }
        
        function backToNavigation() {
            vscode.postMessage({ command: 'backToNavigation' });
        }
        
        function showSettings() {
            vscode.postMessage({ command: 'showSettings' });
        }
        
        function showSystemSettings() {
            vscode.postMessage({ command: 'showSystemSettings' });
        }
        
        function showDependenciesLoading() {
            const loadingEl = document.getElementById('depsLoading');
            const depsListEl = document.getElementById('depsList');
            console.log('[ClaudeFrontend] showDependenciesLoading', { loadingEl: !!loadingEl, depsListEl: !!depsListEl });
            if (loadingEl) {
                loadingEl.style.display = 'block';
                loadingEl.textContent = L.depsLoading || 'Loading dependencies...';
            }
            if (depsListEl) {
                depsListEl.style.display = 'none';
                depsListEl.innerHTML = '';
            }
        }

        function getCurrentMode() {
            const selector = document.getElementById('claudeModeSelector');
            return selector ? selector.value : '${activeMode}';
        }

        function getModeDependencies(mode) {
            if (mode === 'claude-native') {
                return ['@anthropic-ai/claude-code'];
            }
            if (mode === 'claude-router') {
                return ['@chameleon-nexus-tech/claude-code-router', 'claude-code-router-config'];
            }
            return [];
        }

        function displayDependencies(result, mode, errorMessage) {
            console.log('[ClaudeFrontend] displayDependencies 被调用', {
                result,
                mode,
                errorMessage,
                keys: result ? Object.keys(result) : null
            });

            const loadingEl = document.getElementById('depsLoading');
            const depsListEl = document.getElementById('depsList');
            console.log('[ClaudeFrontend] loadingEl/depsListEl presence:', !!loadingEl, !!depsListEl);

            if (loadingEl) {
                loadingEl.style.display = 'none';
            }

            if (!depsListEl) {
                console.warn('[ClaudeFrontend] 找不到依赖列表节点');
                return;
            }
            depsListEl.style.display = 'block';

            const currentMode = mode || getCurrentMode();
            console.log('[ClaudeFrontend] 当前模式:', currentMode);

            const depsData = result && typeof result === 'object' ? result : null;
            if (!depsData) {
                depsListEl.innerHTML = '<div style="color: var(--vscode-errorForeground);">' + (errorMessage || L.checkDepsFailed || 'Dependency check failed. Please retry.') + '</div>';
                return;
            }

            const mergedDeps = { ...depsData };
            getModeDependencies(currentMode).forEach(dep => {
                mergedDeps[dep] = mergedDeps[dep] ?? false;
            });
            ['node', 'git', 'npm'].forEach(dep => {
                mergedDeps[dep] = mergedDeps[dep] ?? false;
            });

            console.log('[ClaudeFrontend] 渲染依赖列表，数量:', Object.keys(mergedDeps).length, mergedDeps);
            depsListEl.innerHTML = '';

            for (const dep in mergedDeps) {
                if (!Object.prototype.hasOwnProperty.call(mergedDeps, dep)) {
                    continue;
                }
                const installed = mergedDeps[dep];
                console.log('[ClaudeFrontend] 处理依赖项:', dep, installed);

                const depItem = document.createElement('div');
                depItem.className = 'dep-item';

                const statusEl = document.createElement('span');
                statusEl.className = 'dep-status ' + (installed ? 'installed' : 'not-installed');

                const nameEl = document.createElement('span');
                nameEl.className = 'dep-name';

                let statusText = '';
                if (dep === 'claude-code-router-config') {
                    statusText = installed ? ' - ' + (L.configured || 'Configured') : ' - ' + (L.notConfigured || 'Not configured');
                } else {
                    statusText = installed ? ' - ' + (L.installed || 'Installed') : ' - ' + (L.notInstalled || 'Not installed');
                }

                nameEl.textContent = getDepDisplayName(dep) + statusText;

                const buttonContainer = document.createElement('div');
                buttonContainer.style.display = 'flex';
                buttonContainer.style.gap = '8px';
                buttonContainer.style.flexWrap = 'wrap';

                if (dep === 'claude-code-router-config') {
                    const configBtn = document.createElement('button');
                    configBtn.className = 'install-btn';
                    configBtn.textContent = L.clickToConfigure;
                    configBtn.onclick = () => openInstallPage(dep);
                    buttonContainer.appendChild(configBtn);
                } else {
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
                }

                depItem.appendChild(statusEl);
                depItem.appendChild(nameEl);
                depItem.appendChild(buttonContainer);
                depsListEl.appendChild(depItem);
            }
        }

        // 消息处理
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('[ClaudeFrontend] 收到消息:', message);
            
            if (message && message.command === 'dependenciesChecked') {
                console.log('[ClaudeFrontend] 即将处理依赖检测结果');
                displayDependencies(message.result, message.mode, message.error);
            } else if (message && message.command === 'modeChanged') {
                console.log('[ClaudeFrontend] 模式已切换，重新检测依赖:', message.mode);
                // 重新检测依赖而不是重新加载整个页面
                checkDependencies();
            } else {
                console.log('[ClaudeFrontend] 忽略消息命令:', message && message.command);
            }
        });
        
        function getDepDisplayName(dep) {
            const names = {
                'node': 'Node.js',
                'git': 'Git',
                '@anthropic-ai/claude-code': 'Claude Code (Official)',
                '@chameleon-nexus-tech/claude-code-router': 'Claude Code Router (Chameleon Nexus Fork)',
                'claude-code-router-config': 'Claude Code Router Configuration'
            };
            return names[dep] || dep;
        }
        
        function openInstallPage(dep) {
            console.log('[ClaudeFrontend] openInstallPage called for:', dep);
            
            // When config item, open settings directly instead of external link.
            if (dep === 'claude-code-router-config') {
                vscode.postMessage({ 
                    command: 'openSettings' 
                });
                return;
            }
            
            const urls = {
                'node': 'https://nodejs.org/',
                'git': 'https://git-scm.com/downloads',
                'npm': 'https://www.npmjs.com/',
                '@anthropic-ai/claude-code': 'https://github.com/anthropics/claude-code',
                '@chameleon-nexus-tech/claude-code-router': 'https://github.com/chameleon-nexus/claude-code-router'
            };
            
            const url = urls[dep];
            if (url) {
                console.log('[ClaudeFrontend] Opening URL:', url);
                vscode.postMessage({ 
                    command: 'openUrl', 
                    url: url 
                });
            } else {
                console.warn('[ClaudeFrontend] No URL found for dependency:', dep);
            }
        }
        
        function installDependency(dep) {
            vscode.postMessage({
                command: 'installDependency',
                dependency: dep
            });
        }
        
        // 页面加载时自动检测依赖
        window.addEventListener('load', () => {
            console.log('[ClaudeFrontend] 页面加载完成，开始检测依赖');
            checkDependencies();
        });
    </script>
</body>
</html>`;
    }

    public dispose() {
        ClaudeWelcomePanel.currentPanel = undefined;
        
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}

