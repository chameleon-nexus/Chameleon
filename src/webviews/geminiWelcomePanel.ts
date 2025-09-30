import * as vscode from 'vscode';
import { t } from '../utils/i18n';

export class GeminiWelcomePanel {
    public static currentPanel: GeminiWelcomePanel | undefined;
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
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (GeminiWelcomePanel.currentPanel) {
            GeminiWelcomePanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'geminiWelcomePanel',
            t('geminiWelcome.mode') + ' - Chameleon',
            column || vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        GeminiWelcomePanel.currentPanel = new GeminiWelcomePanel(panel, extensionUri, extensionContext);
    }

    private setupWebview() {
        this.panel.webview.html = this._getHtmlTemplate();
        this._setWebviewMessageListener();
    }

    private _setWebviewMessageListener() {
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                console.log('[GeminiWelcomePanel] 收到来自前端的消息:', message);
                switch (message.command) {
                    case 'launchCLI':
                        await this.launchCLI();
                        break;
                    case 'checkDependencies':
                        await this.checkDependencies();
                        break;
                    case 'startAITool':
                        await this.startAITool();
                        break;
                    case 'showSettings':
                        await this.showSettings();
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
                    case 'installDependency':
                        await this.installDependency(message.dependency);
                        break;
                }
            },
            undefined,
            this.disposables
        );
    }

    private async launchCLI() {
        try {
            await vscode.commands.executeCommand('chameleon.launchActiveCLI');
        } catch (error) {
            vscode.window.showErrorMessage(`${t('geminiWelcome.launchTerminalFailed')}: ${(error as Error).message}`);
        }
    }

    private async checkDependencies() {
        try {
            console.log('[GeminiWelcomePanel] 开始依赖检测...');
            
            // 获取当前配置中的活动模式
            const config = vscode.workspace.getConfiguration('chameleon');
            const activeMode = config.get<string>('activeCliMode', 'gemini-router');
            console.log('[GeminiWelcomePanel] 当前活动模式:', activeMode);
            
            // 添加超时机制
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('依赖检测超时，请检查网络连接或重试')), 30000);
            });
            
            console.log('[GeminiWelcomePanel] 执行依赖检测命令...');
            const start = Date.now();
            const checkPromise = vscode.commands.executeCommand('chameleon.checkDependencies', activeMode);
            
            const dependencies = await Promise.race([checkPromise, timeoutPromise]);
            const duration = Date.now() - start;
            console.log('[GeminiWelcomePanel] 依赖检测结果:', dependencies);
            console.log('[GeminiWelcomePanel] 依赖检测耗时(ms):', duration);
            
            this.panel.webview.postMessage({
                command: 'dependenciesResult',
                dependencies: dependencies,
                mode: activeMode
            });
            console.log('[GeminiWelcomePanel] postMessage dependenciesResult 完成');
        } catch (error) {
            console.error('[GeminiWelcomePanel] 依赖检测失败:', error);
            vscode.window.showErrorMessage(`${t('geminiWelcome.checkDepsFailed')}: ${(error as Error).message}`);
            // 发送错误结果到前端
            console.log('[GeminiWelcomePanel] 向前端发送错误信息');
            this.panel.webview.postMessage({
                command: 'dependenciesResult',
                dependencies: null,
                error: (error as Error).message,
                mode: vscode.workspace.getConfiguration('chameleon').get<string>('activeCliMode', 'gemini-router')
            });
            console.log('[GeminiWelcomePanel] 已发送错误结果到前端');
        }
    }

    private async startAITool() {
        try {
            await vscode.commands.executeCommand('chameleon.chat.open');
        } catch (error) {
            vscode.window.showErrorMessage(`${t('geminiWelcome.launchAIToolsFailed')}: ${(error as Error).message}`);
        }
    }



    private async switchMode(mode: string) {
        try {
            await vscode.commands.executeCommand('chameleon.setActiveCliMode', mode);
            setTimeout(() => this.checkDependencies(), 100);
        } catch (error) {
            vscode.window.showErrorMessage(`${t('geminiWelcome.switchModeFailed')}: ${(error as Error).message}`);
        }
    }

    private async backToNavigation() {
        try {
            this.panel.dispose();
            const { NavigationPanel } = await import('./navigationPanel');
            NavigationPanel.createOrShow(this.extensionUri, this.extensionContext);
        } catch (error) {
            vscode.window.showErrorMessage(`${t('geminiWelcome.backToNavFailed')}: ${(error as Error).message}`);
        }
    }

    private async showSettings() {
        try {
            const { ChameleonSettingsPanel } = await import('./settingsPanel');
            ChameleonSettingsPanel.createOrShow(this.extensionUri, 'gemini');
        } catch (error) {
            vscode.window.showErrorMessage(`${t('geminiWelcome.openSettingsFailed')}: ${(error as Error).message}`);
        }
    }

    private async showSystemSettings() {
        try {
            const { SystemSettingsPanel } = await import('./systemSettingsPanel');
            SystemSettingsPanel.createOrShow(this.extensionUri);
        } catch (error) {
            vscode.window.showErrorMessage(`${t('geminiWelcome.openSystemSettingsFailed')}: ${(error as Error).message}`);
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
                case '@google/gemini-cli':
                    // 官方模式：先完全清理所有相关包，再安装官方包
                    installCommand = 'npm uninstall -g @google/gemini-cli; npm uninstall -g @chameleon-nexus-tech/gemini-cli; npm uninstall -g @chameleon-nexus-tech/gemini-cli-openrouter; npm install -g @google/gemini-cli';
                    break;
                case '@chameleon-nexus-tech/gemini-cli-openrouter':
                    // 三方模式：先完全清理所有相关包，再安装三方包
                    installCommand = 'npm uninstall -g @google/gemini-cli; npm uninstall -g @chameleon-nexus-tech/gemini-cli; npm uninstall -g @chameleon-nexus-tech/gemini-cli-openrouter; npm install -g @chameleon-nexus-tech/gemini-cli-openrouter';
                    break;
                case 'gemini-cli-openrouter-config':
                    // 配置项：直接打开设置页面
                    await vscode.commands.executeCommand('chameleon.settings');
                    vscode.window.showInformationMessage(t('geminiWelcome.configureInSettings'));
                    return;
                default:
                    vscode.window.showErrorMessage(`${t('geminiWelcome.unsupportedDependency')}: ${dependency}`);
                    return;
            }
            
            const terminal = vscode.window.createTerminal(`安装 ${dependency}`);
            terminal.show();
            terminal.sendText(installCommand);
            
        } catch (error) {
            vscode.window.showErrorMessage(`${t('geminiWelcome.installDepsFailed')}: ${(error as Error).message}`);
        }
    }

    private _getHtmlTemplate(): string {
        const config = vscode.workspace.getConfiguration('chameleon');
        const activeMode = config.get<string>('activeCliMode', 'gemini-router');

        // 收集所�?JS 需要的翻译文本
        const jsTranslations = {
            checkDepsFailed: t('geminiWelcome.checkDepsFailed'),
            depsLoading: t('geminiWelcome.depsLoading'),
            launchAIToolsFailed: t('geminiWelcome.launchAIToolsFailed'),
            openSettingsFailed: t('geminiWelcome.openSettingsFailed'),
            switchModeFailed: t('geminiWelcome.switchModeFailed'),
            unsupportedDependency: t('geminiWelcome.unsupportedDependency'),
            installDepsFailed: t('geminiWelcome.installDepsFailed'),
            configured: t('geminiWelcome.configured'),
            notConfigured: t('geminiWelcome.notConfigured'),
            installed: t('geminiWelcome.installed'),
            notInstalled: t('geminiWelcome.notInstalled'),
            cliOfficialDep: t('geminiWelcome.cliOfficialDep'),
            cliThirdPartyDep: t('geminiWelcome.cliThirdPartyDep'),
            configRouter: t('geminiWelcome.configRouter'),
            clickToConfigure: t('geminiWelcome.clickToConfigure'),
            configureInSettings: t('geminiWelcome.configureInSettings'),
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
</head>
<body>
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
            .ai-tools-selector {
                margin-top: 15px;
                border-top: 1px solid var(--vscode-panel-border);
                padding-top: 15px;
            }
            .ai-tools-selector label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--vscode-foreground);
            }
            .ai-tools-selector select {
                width: 100%;
                padding: 8px 12px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid #000000;
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
            }
            .ai-tools-selector select:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
            }
            .ai-tools-selector select option {
                background: var(--vscode-dropdown-background);
                color: var(--vscode-dropdown-foreground);
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
        <button class="back-button" onclick="backToNavigation()">${t('geminiWelcome.backToNav')}</button>
        
        <div class="header">
            <div class="logo">🦎 Chameleon</div>
            <div class="subtitle">${t('geminiWelcome.mode')}</div>
        </div>

        <div class="feature-grid">
            <!-- CLI Launcher -->
            <div class="feature-block">
                <div class="feature-title">
                    ${t('geminiWelcome.cliLauncher')}
                </div>
                <div class="feature-desc">
                    ${t('geminiWelcome.cliDesc')}
                </div>
                
                <div class="cli-launcher">
                    <label for="cliModeSelector">${t('geminiWelcome.selectCLIMode')}</label>
                    <select id="cliModeSelector" onchange="switchMode()">
                        <option value="gemini-native" ${activeMode === 'gemini-native' ? 'selected' : ''}>${t('geminiWelcome.cliOfficial')}</option>
                        <option value="gemini-router" ${activeMode === 'gemini-router' ? 'selected' : ''}>${t('geminiWelcome.cliThirdParty')}</option>
                    </select>
                </div>

                <div class="dependencies-status" id="dependenciesStatus">
                    <div class="deps-title">${t('geminiWelcome.depsTitle')}</div>
                    <div class="deps-loading" id="depsLoading">${t('geminiWelcome.depsLoading')}</div>
                    <div class="deps-list" id="depsList" style="display: none;">
                        <!-- 依赖状态将在这里动态加�?-->
                    </div>
                </div>

                <div class="feature-actions" style="margin-top: 15px;">
                    <button class="btn" onclick="launchCLI()">${t('geminiWelcome.launchTerminal')}</button>
                    <button class="btn btn-secondary" onclick="checkDependencies()">${t('geminiWelcome.recheckDeps')}</button>
                </div>
            </div>

            <!-- Gemini Settings -->
            <div class="feature-block" onclick="showSettings()" style="cursor: pointer;">
                <div class="feature-title">${t('geminiWelcome.settings')}</div>
                <div class="feature-desc">${t('geminiWelcome.settingsDesc')}</div>
            </div>

            <!-- System Settings -->
            <div class="feature-block" onclick="showSystemSettings()" style="cursor: pointer;">
                <div class="feature-title">${t('geminiWelcome.systemSettings')}</div>
                <div class="feature-desc">${t('geminiWelcome.systemSettingsDesc')}</div>
            </div>

            <!-- AI Tools Launcher - Hidden -->
            <!-- <div class="feature-block">
                <div class="feature-title">
                    🤖 AI 工具启动�?                </div>
                <div class="feature-desc">
                    快速启动各种AI编程助手
                </div>
                
                <div class="ai-tools-selector">
                    <label for="aiToolSelector">选择AI工具</label>
                    <select id="aiToolSelector" onchange="startAITool()">
                        <option value="">选择AI工具...</option>
                        <option value="claude">Claude 聊天</option>
                        <option value="gemini">Gemini 聊天</option>
                        <option value="cursor">Cursor 聊天</option>
                    </select>
                </div>

                <div class="feature-actions" style="margin-top: 15px;">
                    <button class="btn" onclick="startAITool()">启动AI工具</button>
                </div>
            </div> -->

            <!-- AI Settings - Hidden -->
            <!-- <div class="feature-block" onclick="showSettings()" style="cursor: pointer;">
                <div class="feature-title">⚙️ AI 设置</div>
                <div class="feature-desc">${t('geminiWelcome.aiSettingsDesc')}</div>
            </div> -->

            <!-- System Settings - Hidden -->
            <!-- <div class="feature-block" onclick="showSystemSettings()" style="cursor: pointer;">
                <div class="feature-title">${t('welcome.systemSettingsTitle')}</div>
                <div class="feature-desc">${t('geminiWelcome.systemSettingsDesc')}</div>
            </div> -->
        </div>
    
    <script>
        // 注入翻译对象
        const vscode = acquireVsCodeApi();
        const L = ${jsTranslationsJSON};
        console.log('Gemini: Translation object loaded:', L);
        console.log('Gemini: Translation keys count:', Object.keys(L || {}).length);
        
        function launchCLI() {
            vscode.postMessage({ command: 'launchCLI' });
        }

        function checkDependencies() {
            console.log('[GeminiFrontend] checkDependencies 被调用，准备向扩展请求检测');
            showDependenciesLoading();
            vscode.postMessage({ command: 'checkDependencies' });
        }

        function startAITool() {
            vscode.postMessage({ command: 'startAITool' });
        }

        function showSettings() {
            vscode.postMessage({ command: 'showSettings' });
        }

        function showSystemSettings() {
            vscode.postMessage({ command: 'showSystemSettings' });
        }

        function switchMode() {
            let selector = document.getElementById('cliModeSelector');
            if (!selector) {
                console.error('找不到模式选择器');
                return;
            }
            
            const selectedMode = selector.value;
            vscode.postMessage({ command: 'switchMode', mode: selectedMode });
            setTimeout(checkDependencies, 100);
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

        function installDependency(dep) {
            vscode.postMessage({
                command: 'installDependency',
                dependency: dep
            });
        }

        function openInstallPage(dep) {
            const urls = {
                'node': 'https://nodejs.org/',
                'git': 'https://git-scm.com/downloads',
                'npm': 'https://www.npmjs.com/',
                '@google/gemini-cli': 'https://www.npmjs.com/package/@google/gemini-cli',
                '@chameleon-nexus-tech/gemini-cli-openrouter': 'https://www.npmjs.com/package/@chameleon-nexus-tech/gemini-cli-openrouter'
            };
            
            const url = urls[dep];
            if (url) {
                vscode.postMessage({ 
                    command: 'openUrl', 
                    url: url 
                });
            }
        }

        function getDepDisplayName(dep) {
            const names = {
                'node': 'Node.js',
                'git': 'Git',
                'npm': 'npm',
                '@google/gemini-cli': L.cliOfficialDep,
                '@chameleon-nexus-tech/gemini-cli-openrouter': L.cliThirdPartyDep,
                'gemini-cli-openrouter-config': L.configRouter,
                'claude-code-router-config': L.configRouter
            };
            return names[dep] || dep;
        }

        function getCurrentMode() {
            const selector = document.getElementById('cliModeSelector');
            return selector ? selector.value : '${activeMode}';
        }

        function getModeDependencies(mode) {
            if (mode === 'gemini-native') {
                return ['@google/gemini-cli'];
            }
            if (mode === 'gemini-router') {
                return ['@chameleon-nexus-tech/gemini-cli-openrouter', 'gemini-cli-openrouter-config'];
            }
            return [];
        }

        function showDependenciesLoading() {
            const loadingEl = document.getElementById('depsLoading');
            const depsListEl = document.getElementById('depsList');
            console.log('[GeminiFrontend] showDependenciesLoading', { loadingEl: !!loadingEl, depsListEl: !!depsListEl });
            if (loadingEl) {
                loadingEl.style.display = 'block';
                loadingEl.textContent = L.depsLoading;
            }
            if (depsListEl) {
                depsListEl.style.display = 'none';
                depsListEl.innerHTML = '';
            }
        }

        function displayDependencies(deps, mode, errorMessage) {
            console.log('[GeminiFrontend] displayDependencies 被调用，参数:', {
                deps,
                mode,
                errorMessage,
                depsKeys: deps ? Object.keys(deps) : null
            });
            
            const loadingEl = document.getElementById('depsLoading');
            const depsListEl = document.getElementById('depsList');
            
            console.log('[GeminiFrontend] loadingEl/ depsListEl 存在性:', !!loadingEl, !!depsListEl);
            
            if (loadingEl) {
                loadingEl.style.display = 'none';
                console.log('[GeminiFrontend] 隐藏加载提示');
            }
            
            if (!depsListEl) {
                console.warn('[GeminiFrontend] 找不到依赖列表结点');
                return;
            }
            depsListEl.style.display = 'block';
            
            const currentMode = mode || getCurrentMode();
            console.log('[GeminiFrontend] 当前模式:', currentMode);
            const depsData = deps && typeof deps === 'object' ? deps : null;
            if (!depsData) {
                console.log('[GeminiFrontend] 依赖数据为空或无效，显示错误信息');
                depsListEl.innerHTML = '<div style="color: var(--vscode-errorForeground);">' + (errorMessage || L.checkDepsFailed) + '</div>';
                return;
            }

            const mergedDeps = { ...depsData };
            const modeDeps = getModeDependencies(currentMode);
            modeDeps.forEach((dep) => {
                mergedDeps[dep] = mergedDeps[dep] ?? false;
            });

            // 确保基础依赖也被显示
            ['node', 'git', 'npm'].forEach((dep) => {
                mergedDeps[dep] = mergedDeps[dep] ?? false;
            });
            
            console.log('[GeminiFrontend] 开始渲染依赖列表，合并后依赖数量:', Object.keys(mergedDeps).length, mergedDeps);
            depsListEl.innerHTML = '';
            
            for (const dep in mergedDeps) {
                if (!Object.prototype.hasOwnProperty.call(mergedDeps, dep)) {
                    continue;
                }
                const installed = mergedDeps[dep];

                console.log('[GeminiFrontend] 处理依赖:', dep, '状态:', installed);
                const depItem = document.createElement('div');
                depItem.className = 'dep-item';
                
                const statusEl = document.createElement('span');
                statusEl.className = 'dep-status ' + (installed ? 'installed' : 'not-installed');
                
                const nameEl = document.createElement('span');
                nameEl.className = 'dep-name';
                
                let statusText = '';
                if (dep === 'claude-code-router-config' || dep === 'gemini-cli-openrouter-config') {
                    statusText = installed ? ' - ' + L.configured : ' - ' + L.notConfigured;
                } else {
                    statusText = installed ? ' - ' + L.installed : ' - ' + L.notInstalled;
                }
                
                nameEl.textContent = getDepDisplayName(dep) + statusText;
                
                const buttonContainer = document.createElement('div');
                buttonContainer.style.display = 'flex';
                buttonContainer.style.gap = '8px';
                buttonContainer.style.flexWrap = 'wrap';
                
                if (dep === 'claude-code-router-config' || dep === 'gemini-cli-openrouter-config') {
                    const configBtn = document.createElement('button');
                    configBtn.className = 'install-btn';
                    configBtn.textContent = L.clickToConfigure;
                    configBtn.onclick = () => showSettings();
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

        // 页面加载时自动检测依赖
        window.addEventListener('load', function() {
            setTimeout(async () => {
                try {
                    console.log('[GeminiFrontend] 调用 checkDependencies 函数');
                    await checkDependencies();
                } catch (error) {
                    console.error('页面加载时依赖检测失败', error);
                    const loadingEl = document.getElementById('depsLoading');
                    if (loadingEl) {
                        loadingEl.textContent = L.checkDepsFailed;
                    }
                }
            }, 500);
        });

        // 监听依赖检测结果
        window.addEventListener('message', function handler(event) {
            console.log('[GeminiFrontend] 收到消息:', event.data);
            if (event.data && event.data.command === 'dependenciesResult') {
                console.log('[GeminiFrontend] 即将处理依赖检测结果');
                displayDependencies(event.data.dependencies, event.data.mode, event.data.error);
            } else {
                console.log('[GeminiFrontend] 忽略消息命令:', event.data.command);
            }
        });
    </script>
    </body>
    </html>
    `;
    }

    public dispose() {
        GeminiWelcomePanel.currentPanel = undefined;
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
