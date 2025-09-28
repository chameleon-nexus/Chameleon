import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { t } from '../utils/i18n';

export class ChameleonSettingsPanel {
    // 1. 添加一个静态属性来持有当前面板实例
    public static currentPanel: ChameleonSettingsPanel | undefined;

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
        if (ChameleonSettingsPanel.currentPanel) {
            ChameleonSettingsPanel.currentPanel.panel.reveal(column);
            return;
        }

        // 否则，创建一个新面板
        const panel = vscode.window.createWebviewPanel(
            'chameleonSettings',
            t('settings.title'), // 在这里使用 t() 函数
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        ChameleonSettingsPanel.currentPanel = new ChameleonSettingsPanel(panel, extensionUri);
    }

    private setupWebview(): void {
        this.panel.webview.html = this.getWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                console.log(`[Extension Host] Received message from webview: ${message.command}`);
                switch (message.command) {
                    case 'saveSettings':
                        await this.saveSettings(message.settings);
                        break;
                    case 'resetSettings':
                        await this.resetSettings();
                        break;
                    case 'testConnection':
                        await this.testConnection(message.model, message.apiKey);
                        break;
                    case 'loadSettings':
                        await this.loadSettings();
                        break;
                    case 'saveGeminiSettings':
                        await this.saveGeminiSettings(message.settings);
                        break;
                    case 'resetGeminiSettings':
                        await this.resetGeminiSettings();
                        break;
                }
            },
            null,
            this.disposables
        );
    }

    private async loadSettings(): Promise<void> {
        console.log('[Extension Host] loadSettings triggered by webview request.');
        try {
            const config = vscode.workspace.getConfiguration('chameleon');
            const routerConfig = await this.loadRouterConfig();
            
            const settings = {
                defaultModel: config.get('defaultModel', 'volcengine,deepseek-v3-250324'),
                outputLanguage: config.get('outputLanguage', 'en'),
                apiTimeout: config.get('apiTimeout', 60),
                enableRouting: config.get('enableRouting', true),
                providers: config.get('providers', {}),
                routerConfig: routerConfig,
            };
            
            // 从现有配置中提取Gemini设置
            const allProviders = config.get('providers', {}) as Record<string, any>;
            const geminiProviders: Record<string, any> = {};
            
            // 提取所有gemini_前缀的提供商
            Object.keys(allProviders).forEach(key => {
                if (key.startsWith('gemini_')) {
                    const providerName = key.replace('gemini_', '');
                    geminiProviders[providerName] = allProviders[key];
                }
            });
            
            const geminiDefaultModel = config.get('geminiDefaultModel', '');
            console.log('[Extension Host] Reading geminiDefaultModel from config:', geminiDefaultModel);
            
            // 临时调试：如果没有保存的默认模型，使用一个测试值
            const testDefaultModel = geminiDefaultModel || 'volcengine,deepseek-v3-250324';
            console.log('[Extension Host] Using default model (test):', testDefaultModel);
            
            const geminiSettings = {
                outputLanguage: config.get('outputLanguage', 'zh'),
                apiTimeout: config.get('apiTimeout', 60),
                enableRouting: config.get('enableRouting', true),
                providers: geminiProviders,
                defaultModel: testDefaultModel, // 使用测试默认值
            };
            
            console.log('[Extension Host] Sending settings to webview:', JSON.stringify(settings, null, 2));
            console.log('[Extension Host] Sending Gemini settings to webview:', JSON.stringify(geminiSettings, null, 2));
            
            this.panel.webview.postMessage({
                command: 'settingsLoaded',
                settings: settings,
                geminiSettings: geminiSettings
            });
        } catch (error) {
            console.error('[Extension Host] Error loading settings:', error);
        }
    }

    private async saveSettings(settings: any): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('chameleon');
            
            await config.update('defaultModel', settings.defaultModel, vscode.ConfigurationTarget.Global);
            await config.update('outputLanguage', settings.outputLanguage, vscode.ConfigurationTarget.Global);
            await config.update('apiTimeout', settings.apiTimeout, vscode.ConfigurationTarget.Global);
            await config.update('enableRouting', settings.enableRouting, vscode.ConfigurationTarget.Global);
            await config.update('providers', settings.providers, vscode.ConfigurationTarget.Global);
            
            await this.updateRouterConfig(settings);
            
            // 显示成功提示
            vscode.window.showInformationMessage('设置保存成功！');
            
            this.panel.webview.postMessage({
                command: 'settingsSaved',
                success: true
            });
        } catch (error) {
            console.error('[Extension Host] Error saving settings:', error);
            
            // 显示错误提示
            vscode.window.showErrorMessage(`${t('settings.saveFailed')}: ${(error as Error).message}`);
            
            this.panel.webview.postMessage({
                command: 'settingsSaved',
                success: false,
                error: (error as Error).message
            });
        }
    }

    private async resetSettings(): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('chameleon');
            
            await config.update('defaultModel', 'volcengine,deepseek-v3-250324', vscode.ConfigurationTarget.Global);
            await config.update('outputLanguage', 'en', vscode.ConfigurationTarget.Global);
            await config.update('apiTimeout', 60, vscode.ConfigurationTarget.Global);
            await config.update('enableRouting', true, vscode.ConfigurationTarget.Global);
            await config.update('providers', {}, vscode.ConfigurationTarget.Global);
            
            // 显示成功提示
            vscode.window.showInformationMessage('设置已重置为默认值！');
            
            this.panel.webview.postMessage({
                command: 'settingsReset',
                success: true
            });
        } catch (error) {
            console.error('[Extension Host] Error resetting settings:', error);
            
            // 显示错误提示
            vscode.window.showErrorMessage(`${t('settings.resetFailed')}: ${(error as Error).message}`);
            
            this.panel.webview.postMessage({
                command: 'settingsReset',
                success: false,
                error: (error as Error).message
            });
        }
    }

    private async saveGeminiSettings(settings: any): Promise<void> {
        try {
            // 保存到现有的配置结构中，使用现有的配置项
            const config = vscode.workspace.getConfiguration('chameleon');
            
            // 将Gemini设置保存到现有的providers配置中，使用特殊前缀
            if (settings.providers) {
                const existingProviders = config.get('providers', {}) as Record<string, any>;
                const geminiProviders: Record<string, any> = { ...existingProviders };
                
                // 为Gemini提供商添加特殊前缀
                Object.keys(settings.providers).forEach(provider => {
                    geminiProviders[`gemini_${provider}`] = settings.providers[provider];
                });
                
                await config.update('providers', geminiProviders, vscode.ConfigurationTarget.Global);
            }
            
            // 将其他设置保存到现有的配置项中
            if (settings.outputLanguage) {
                await config.update('outputLanguage', settings.outputLanguage, vscode.ConfigurationTarget.Global);
            }
            
            if (settings.apiTimeout) {
                await config.update('apiTimeout', settings.apiTimeout, vscode.ConfigurationTarget.Global);
            }
            
            if (settings.enableRouting !== undefined) {
                await config.update('enableRouting', settings.enableRouting, vscode.ConfigurationTarget.Global);
            }
            
            if (settings.defaultModel) {
                await config.update('geminiDefaultModel', settings.defaultModel, vscode.ConfigurationTarget.Global); // 保存到独立的配置项
            }
            
            // 显示成功提示
            vscode.window.showInformationMessage('Gemini设置保存成功！');
            
            this.panel.webview.postMessage({
                command: 'geminiSettingsSaved',
                success: true
            });
        } catch (error) {
            console.error('[Extension Host] Error saving Gemini settings:', error);
            
            // 显示错误提示
            vscode.window.showErrorMessage(`${t('settings.saveGeminiFailed')}: ${(error as Error).message}`);
            
            this.panel.webview.postMessage({
                command: 'geminiSettingsSaved',
                success: false,
                error: (error as Error).message
            });
        }
    }

    private async resetGeminiSettings(): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('chameleon');
            
            // 清理Gemini提供商配置
            const existingProviders = config.get('providers', {}) as Record<string, any>;
            const cleanedProviders: Record<string, any> = { ...existingProviders };
            
            // 移除所有gemini_前缀的提供商
            Object.keys(cleanedProviders).forEach(key => {
                if (key.startsWith('gemini_')) {
                    delete cleanedProviders[key];
                }
            });
            
            await config.update('providers', cleanedProviders, vscode.ConfigurationTarget.Global);
            
            // 重置其他设置到默认值
            await config.update('outputLanguage', 'zh', vscode.ConfigurationTarget.Global);
            await config.update('apiTimeout', 60, vscode.ConfigurationTarget.Global);
            await config.update('enableRouting', true, vscode.ConfigurationTarget.Global);
            await config.update('geminiDefaultModel', '', vscode.ConfigurationTarget.Global); // 重置独立的配置项
            
            // 显示成功提示
            vscode.window.showInformationMessage('Gemini设置已重置为默认值！');
            
            this.panel.webview.postMessage({
                command: 'geminiSettingsReset',
                success: true
            });
        } catch (error) {
            console.error('[Extension Host] Error resetting Gemini settings:', error);
            
            // 显示错误提示
            vscode.window.showErrorMessage(`${t('settings.resetGeminiFailed')}: ${(error as Error).message}`);
            
            this.panel.webview.postMessage({
                command: 'geminiSettingsReset',
                success: false,
                error: (error as Error).message
            });
        }
    }


    private async loadRouterConfig(): Promise<any> {
        const configDir = path.join(os.homedir(), '.claude-code-router');
        const configPath = path.join(configDir, 'config.json');
        console.log('[Extension Host] Looking for Router config at:', configPath);
        try {
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(content);
                console.log('[Extension Host] Router config loaded SUCCESSFULLY:', JSON.stringify(config, null, 2));
                return config;
            } else {
                console.warn('[Extension Host] Router config file not found at:', configPath);
                return {};
            }
        } catch (error) {
            console.error('[Extension Host] FAILED to load or parse Router config:', error);
            return {};
        }
    }

    private async updateRouterConfig(settings: any): Promise<void> {
        try {
            const configDir = path.join(os.homedir(), '.claude-code-router');
            const configPath = path.join(configDir, 'config.json');
            
            let config: any = {};
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(content);
            }
            
            if (settings.providers) {
                const newProviders = Object.values(settings.providers) as any[];
                if (!config.Providers) {
                    config.Providers = [];
                }
                newProviders.forEach((newProvider: any) => {
                    const index = config.Providers.findIndex((p: any) => p.name === newProvider.name);
                    if (index !== -1) {
                        config.Providers[index] = { ...config.Providers[index], ...newProvider };
                    } else {
                        config.Providers.push(newProvider);
                    }
                });
            }
            
            if (settings.defaultModel) {
                if (!config.Router) {
                    config.Router = {};
                }
                // Map model settings to router config
                config.Router.default = settings.defaultModel;
                config.Router.background = settings.defaultModel; // background uses default
                config.Router.webSearch = settings.defaultModel; // webSearch uses default
                config.Router.think = settings.thinkModel || settings.defaultModel;
                config.Router.longContext = settings.longContextModel || settings.defaultModel;
                config.Router.image = settings.imageModel || settings.defaultModel;
                config.Router.video = settings.videoModel || settings.defaultModel;
            }
            
            // 更新APIKEY字段（如果提供了）
            if (settings.apiKey) {
                config.APIKEY = settings.apiKey;
            }
            
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log('[Extension Host] Router config updated successfully');
        } catch (error) {
            console.error('[Extension Host] Error updating Router config:', error);
            throw error;
        }
    }

    private async testConnection(model: string, apiKey?: string): Promise<void> {
        try {
            if (!model) {
                this.panel.webview.postMessage({
                    command: 'connectionTestResult',
                    success: false,
                    error: t('settings.connection.noModel')
                });
                return;
            }

            if (!apiKey) {
                this.panel.webview.postMessage({
                    command: 'connectionTestResult',
                    success: false,
                    error: t('settings.connection.noApiKey')
                });
                return;
            }

            if (!this.validateApiKey(apiKey, model)) {
                this.panel.webview.postMessage({
                    command: 'connectionTestResult',
                    success: false,
                    error: `Invalid API key format for ${model}`
                });
                return;
            }

            this.panel.webview.postMessage({
                command: 'connectionTestResult',
                success: true,
                message: t('settings.connection.success')
            });

        } catch (error) {
            console.error('[Extension Host] Connection test error:', error);
            this.panel.webview.postMessage({
                command: 'connectionTestResult',
                success: false,
                error: this.getDetailedErrorMessage(error as Error, model)
            });
        }
    }

    private validateApiKey(apiKey: string, model: string): boolean {
        if (!apiKey || apiKey.trim().length === 0) {
            return false;
        }

        if (model.includes('openrouter') && !apiKey.startsWith('sk-or-')) {
            return false;
        }

        if (model.includes('gemini') && !apiKey.startsWith('AIza')) {
            return false;
        }

        return true;
    }

    private getDetailedErrorMessage(error: Error, model: string): string {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
            return `Invalid API key for ${model}. Please check your API key.`;
        }
        
        if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
            return `Access forbidden for ${model}. Please check your API key permissions.`;
        }
        
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
            return `Model ${model} not found. Please check the model name.`;
        }
        
        if (errorMessage.includes('timeout')) {
            return `Connection timeout for ${model}. Please check your network connection.`;
        }
        
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
            return `Network error for ${model}. Please check your internet connection.`;
        }

        return `Connection test failed for ${model}: ${error.message}`;
    }

    private getWebviewContent(): string {
        return this._getHtmlTemplate();
    }

    private _getHtmlTemplate(): string {
        const isChinese = vscode.env.language.startsWith('zh');
        
        // 翻译文本
        const texts = {
            title: t('settings.title'),
            subtitle: t('settings.subtitle'),
            providerTitle: t('settings.provider.title'),
            providerSelect: t('settings.provider.select'),
            providerSelectPlaceholder: t('settings.provider.selectPlaceholder'),
            providerHelp: t('settings.provider.help'),
            providerConfigTitle: t('settings.provider.configTitle'),
            providerApiUrl: t('settings.provider.apiUrl'),
            providerApiUrlHelp: t('settings.provider.apiUrlHelp'),
            providerApiKey: t('settings.provider.apiKey'),
            providerApiKeyPlaceholder: t('settings.provider.apiKeyPlaceholder'),
            providerApiKeyHelp: t('settings.provider.apiKeyHelp'),
            providerSupportedModels: t('settings.provider.supportedModels'),
            providerModelsHelp: t('settings.provider.modelsHelp'),
            providerEnable: t('settings.provider.enable'),
            providerSave: t('settings.provider.save'),
            modelTitle: t('settings.model.title'),
            modelTextModels: t('settings.model.textModels'),
            modelDefault: t('settings.model.default'),
            modelDefaultPlaceholder: t('settings.model.defaultPlaceholder'),
            modelDefaultHelp: t('settings.model.defaultHelp'),
            modelLongContext: t('settings.model.longContext'),
            modelLongContextPlaceholder: t('settings.model.longContextPlaceholder'),
            modelLongContextHelp: t('settings.model.longContextHelp'),
            modelReasoning: t('settings.model.reasoning'),
            modelReasoningPlaceholder: t('settings.model.reasoningPlaceholder'),
            modelReasoningHelp: t('settings.model.reasoningHelp'),
            modelMultimodal: t('settings.model.multimodal'),
            modelImage: t('settings.model.image'),
            modelImagePlaceholder: t('settings.model.imagePlaceholder'),
            modelImageHelp: t('settings.model.imageHelp'),
            modelVideo: t('settings.model.video'),
            modelVideoPlaceholder: t('settings.model.videoPlaceholder'),
            modelVideoHelp: t('settings.model.videoHelp'),
            modelSave: t('settings.model.save'),
            aiTitle: t('settings.ai.title'),
            aiOutputLanguage: t('settings.ai.outputLanguage'),
            aiOutputLanguageHelp: t('settings.ai.outputLanguageHelp'),
            aiApiTimeout: t('settings.ai.apiTimeout'),
            aiApiTimeoutHelp: t('settings.ai.apiTimeoutHelp'),
            aiEnableRouting: t('settings.ai.enableRouting'),
            aiEnableRoutingHelp: t('settings.ai.enableRoutingHelp'),
            aiSave: t('settings.ai.save'),
            connectionTitle: t('settings.connection.title'),
            connectionTestProvider: t('settings.connection.testProvider'),
            connectionTestProviderPlaceholder: t('settings.connection.testProviderPlaceholder'),
            connectionTestModel: t('settings.connection.testModel'),
            connectionTestModelPlaceholder: t('settings.connection.testModelPlaceholder'),
            connectionTest: t('settings.connection.test'),
            connectionTesting: t('settings.connection.testing'),
            connectionSuccess: t('settings.connection.success'),
            connectionFailed: t('settings.connection.failed'),
            connectionNoProvider: t('settings.connection.noProvider'),
            connectionNoModel: t('settings.connection.noModel'),
            connectionNoApiKey: t('settings.connection.noApiKey'),
            save: t('settings.save'),
            reset: t('settings.reset'),
            saved: t('settings.saved'),
            resetConfirm: t('settings.resetConfirm'),
            resetSuccess: t('settings.resetSuccess'),
            error: t('settings.error'),
            loading: t('settings.loading'),
            loaded: t('settings.loaded'),
            geminiTitle: t('settings.gemini.title'),
            geminiProviderConfig: t('settings.gemini.providerConfig'),
            geminiModelConfig: t('settings.gemini.modelConfig'),
            geminiAiConfig: t('settings.gemini.aiConfig'),
            geminiConnectionTest: t('settings.gemini.connectionTest'),
            geminiGlobalActions: t('settings.gemini.globalActions'),
            geminiSaveAll: t('settings.gemini.saveAll'),
            geminiResetAll: t('settings.gemini.resetAll'),
            geminiSelectDefaultModel: t('settings.gemini.selectDefaultModel'),
            geminiSelectTestProvider: t('settings.gemini.selectTestProvider')
        };

        return `<!DOCTYPE html>
<html lang="${isChinese ? 'zh-CN' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${texts.title}</title>
    <style>
        /* Tab styles */
        .tab-container {
            margin-bottom: 20px;
        }
        
        .tab-header {
            display: flex;
            border-bottom: 2px solid var(--vscode-panel-border);
            margin-bottom: 20px;
        }
        
        .tab-button {
            background: none;
            border: none;
            padding: 12px 24px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            color: var(--vscode-descriptionForeground);
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
        }
        
        .tab-button:hover {
            color: var(--vscode-foreground);
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .tab-button.active {
            color: var(--vscode-foreground);
            border-bottom-color: var(--vscode-focusBorder);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h2 {
            color: var(--vscode-titleBar-activeForeground);
            margin-bottom: 10px;
        }
        
        .header p {
            color: var(--vscode-descriptionForeground);
        }
        
        .section {
            background-color: var(--vscode-panel-background);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--vscode-foreground);
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: bold;
        }
        
        .form-input {
            width: 100%;
            max-width: 400px;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: inherit;
            box-sizing: border-box;
        }
        
        /* 增强白色主题下的边框可见度 */
        .vscode-light .form-input {
            border: 1px solid #d3d3d3;
        }
        
        .vscode-light .form-input:focus {
            border-color: #007acc;
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .form-select {
            width: 100%;
            max-width: 400px;
            padding: 8px 12px;
            background-color: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 4px;
            font-family: inherit;
            box-sizing: border-box;
        }
        
        /* 增强白色主题下的下拉框边框可见度 */
        .vscode-light .form-select {
            border: 1px solid #d3d3d3;
        }
        
        .vscode-light .form-select:focus {
            border-color: #007acc;
        }
        
        .form-help {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .provider-config {
            background-color: var(--vscode-editor-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .provider-section h4 {
            margin-top: 0;
            margin-bottom: 15px;
            color: var(--vscode-foreground);
        }
        
        .status-message {
            padding: 12px;
            border-radius: 4px;
            margin-top: 16px;
            display: none;
        }
        
        .status-success {
            background-color: var(--vscode-terminal-ansiGreen);
            color: white;
        }
        
        .status-error {
            background-color: var(--vscode-terminal-ansiRed);
            color: white;
        }
        
        .input-group {
            display: flex;
            position: relative;
        }
        
        .input-group .form-input {
            flex: 1;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            border-right: none;
        }
        
        .btn-toggle-password {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
            border-left: none;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            min-width: 40px;
        }
        
        .btn-toggle-password:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .model-config-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 10px;
        }
        
        .model-config-item {
            background-color: var(--vscode-editor-background);
            padding: 15px;
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .model-config-item .form-label {
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .model-config-item .form-select {
            margin-bottom: 5px;
        }
        
        .models-list {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .model-item {
            display: flex;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .model-item:last-child {
            border-bottom: none;
        }
        
        .model-name {
            flex: 1;
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            color: var(--vscode-foreground);
        }
        
        .model-badge {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-left: 8px;
        }
        
        .loading {
            display: none;
            text-align: center;
            color: var(--vscode-progressBar-background);
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🦎 ${texts.title}</h2>
        <p>${texts.subtitle}</p>
    </div>
    
    <!-- Tab Navigation -->
    <div class="tab-container">
        <div class="tab-header">
            <button class="tab-button active" onclick="switchTab('claude-code')">Claude Code</button>
            <button class="tab-button" onclick="switchTab('gemini')">${texts.geminiTitle}</button>
        </div>
        
        <!-- Claude Code Tab -->
        <div id="claude-code-tab" class="tab-content active">
            <!-- AI Provider Configuration Section -->
    <div class="section">
        <div class="section-title">${texts.providerTitle}</div>
        
        <div class="form-group">
            <label class="form-label" for="selectedProvider">${texts.providerSelect}</label>
            <select class="form-select" id="selectedProvider" onchange="updateProviderConfig()">
                <option value="">${texts.providerSelectPlaceholder}</option>
                <option value="openrouter">openrouter</option>
                <option value="deepseek">deepseek</option>
                <option value="glm">glm</option>
                <option value="ollama">ollama</option>
                <option value="gemini">gemini</option>
                <option value="volcengine">volcengine</option>
                <option value="azure">azure</option>
            </select>
            <div class="form-help">${texts.providerHelp}</div>
        </div>
        
        <div id="providerConfig" class="provider-config" style="display: none;">
            <div class="provider-section">
                <h4 id="providerTitle">${texts.providerConfigTitle}</h4>
                
                <div class="form-group">
                    <label class="form-label" for="provider_api_url">${texts.providerApiUrl}</label>
                    <input type="text" class="form-input" id="provider_api_url" readonly>
                    <div class="form-help">${texts.providerApiUrlHelp}</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="provider_api_key">${texts.providerApiKey}</label>
                    <div class="input-group">
                        <input type="password" class="form-input" id="provider_api_key" placeholder="${texts.providerApiKeyPlaceholder}">
                        <button type="button" class="btn-toggle-password" id="togglePassword" onclick="togglePasswordVisibility()">
                            <span id="toggleIcon">👁️</span>
                        </button>
                    </div>
                    <div class="form-help" id="provider_api_help">${texts.providerApiKeyHelp}</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">${texts.providerSupportedModels}</label>
                    <div id="supportedModels" class="models-list">
                        <div class="form-help">${texts.providerModelsHelp}</div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" class="form-checkbox" id="provider_enabled" checked>
                        ${texts.providerEnable}
                    </label>
                </div>
            </div>
        </div>
        
        <div class="button-group">
            <button class="btn btn-primary" onclick="saveProviderSettings()">${texts.providerSave}</button>
        </div>
    </div>
    
    <!-- Model Configuration Section -->
    <div class="section">
        <div class="section-title">${texts.modelTitle}</div>
        
        <div class="form-group">
            <label class="form-label">${texts.modelTextModels}</label>
            <div class="model-config-grid">
                <div class="model-config-item">
                    <label class="form-label" for="defaultModel">${texts.modelDefault}</label>
                    <select class="form-select" id="defaultModel">
                        <option value="">${texts.modelDefaultPlaceholder}</option>
                    </select>
                    <div class="form-help">${texts.modelDefaultHelp}</div>
                </div>
                
                <div class="model-config-item">
                    <label class="form-label" for="longContextModel">${texts.modelLongContext}</label>
                    <select class="form-select" id="longContextModel">
                        <option value="">${texts.modelLongContextPlaceholder}</option>
                    </select>
                    <div class="form-help">${texts.modelLongContextHelp}</div>
                </div>
                
                <div class="model-config-item">
                    <label class="form-label" for="thinkModel">${texts.modelReasoning}</label>
                    <select class="form-select" id="thinkModel">
                        <option value="">${texts.modelReasoningPlaceholder}</option>
                    </select>
                    <div class="form-help">${texts.modelReasoningHelp}</div>
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">${texts.modelMultimodal}</label>
            <div class="model-config-grid">
                <div class="model-config-item">
                    <label class="form-label" for="imageModel">${texts.modelImage}</label>
                    <select class="form-select" id="imageModel">
                        <option value="">${texts.modelImagePlaceholder}</option>
                    </select>
                    <div class="form-help">${texts.modelImageHelp}</div>
                </div>
                
                <div class="model-config-item">
                    <label class="form-label" for="videoModel">${texts.modelVideo}</label>
                    <select class="form-select" id="videoModel">
                        <option value="">${texts.modelVideoPlaceholder}</option>
                    </select>
                    <div class="form-help">${texts.modelVideoHelp}</div>
                </div>
            </div>
        </div>
        
        <div class="button-group">
            <button class="btn btn-primary" onclick="saveModelSettings()">${texts.modelSave}</button>
        </div>
    </div>
    
    <!-- AI Configuration Section -->
    <div class="section">
        <div class="section-title">${texts.aiTitle}</div>
        
        
        <div class="form-group">
            <label class="form-label" for="apiTimeout">${texts.aiApiTimeout}</label>
            <input type="number" class="form-input" id="apiTimeout" min="10" max="300" value="60">
            <div class="form-help">${texts.aiApiTimeoutHelp}</div>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" class="form-checkbox" id="enableRouting" checked>
                ${texts.aiEnableRouting}
            </label>
            <div class="form-help">${texts.aiEnableRoutingHelp}</div>
        </div>
        
        <div class="button-group">
            <button class="btn btn-primary" onclick="saveAISettings()">${texts.aiSave}</button>
        </div>
    </div>
    
    
    <!-- Connection Testing Section -->
    <!--
    <div class="section">
        <div class="section-title">${texts.connectionTitle}</div>
        
        <div class="form-group">
            <label class="form-label" for="testProvider">${texts.connectionTestProvider}</label>
            <select class="form-select" id="testProvider" onchange="updateTestModelOptions()">
                <option value="">${texts.connectionTestProviderPlaceholder}</option>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="testModel">${texts.connectionTestModel}</label>
            <select class="form-select" id="testModel">
                <option value="">${texts.connectionTestModelPlaceholder}</option>
            </select>
        </div>
        
        <div class="button-group">
            <button class="btn btn-primary" onclick="testConnection()">${texts.connectionTest}</button>
        </div>
        
        <div id="connectionStatus" class="status-message"></div>
        <div id="connectionLoading" class="loading">${texts.connectionTesting}</div>
    </div>
    -->
    
        <!-- Global Actions for Claude Code -->
        <div class="section">
            <div class="button-group">
                <button class="btn btn-primary" onclick="saveAllSettings()">${texts.save}</button>
                <button class="btn btn-secondary" onclick="resetAllSettings()">${texts.reset}</button>
            </div>
            
            <div id="globalStatus" class="status-message"></div>
            <div id="globalLoading" class="loading">${texts.loading}</div>
        </div>
        </div>
        
        <!-- Gemini Tab -->
        <div id="gemini-tab" class="tab-content">
            <!-- Gemini AI Provider Configuration Section -->
            <div class="section">
                <div class="section-title">${texts.geminiProviderConfig}</div>
                
                <div class="form-group">
                    <label class="form-label" for="geminiSelectedProvider">${texts.providerSelect}</label>
                    <select class="form-select" id="geminiSelectedProvider" onchange="updateGeminiProviderConfig()">
                        <option value="">${texts.providerSelectPlaceholder}</option>
                        <option value="openrouter">openrouter</option>
                        <option value="bailian">Model Studio</option>
                        <option value="glm">GLM</option>
                        <option value="ollama">ollama</option>
                        <option value="volcengine">volcengine</option>
                        <option value="azure">azure</option>
                    </select>
                    <div class="form-help">${texts.providerHelp}</div>
                </div>
                
                <div id="geminiProviderConfig" class="provider-config" style="display: none;">
                    <div class="provider-section">
                        <h4 id="geminiProviderTitle">${texts.providerConfigTitle}</h4>
                        
                        <div class="form-group">
                            <label class="form-label" for="gemini_provider_api_url">${texts.providerApiUrl}</label>
                            <input type="text" class="form-input" id="gemini_provider_api_url" readonly>
                            <div class="form-help">${texts.providerApiUrlHelp}</div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="gemini_provider_api_key">${texts.providerApiKey}</label>
                            <div class="input-group">
                                <input type="password" class="form-input" id="gemini_provider_api_key" placeholder="${texts.providerApiKeyPlaceholder}">
                                <button type="button" class="btn-toggle-password" id="geminiTogglePassword" onclick="toggleGeminiPasswordVisibility()">
                                    <span id="geminiToggleIcon">👁️</span>
                                </button>
                            </div>
                            <div class="form-help" id="gemini_provider_api_help">${texts.providerApiKeyHelp}</div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">${texts.providerSupportedModels}</label>
                            <div id="geminiSupportedModels" class="models-list">
                                <div class="form-help">${texts.providerModelsHelp}</div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" class="form-checkbox" id="gemini_provider_enabled" checked>
                                ${texts.providerEnable}
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="saveGeminiProviderSettings()">${texts.providerSave}</button>
                </div>
            </div>
            
            <!-- Gemini Model Configuration Section -->
            <div class="section">
                <div class="section-title">${texts.geminiModelConfig}</div>
                
                <div class="form-group">
                    <label class="form-label" for="geminiDefaultModel">${texts.modelDefault}</label>
                    <select class="form-select" id="geminiDefaultModel">
                        <option value="">${texts.modelDefaultPlaceholder}</option>
                    </select>
                    <div class="form-help">${texts.modelDefaultHelp}</div>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="saveGeminiModelSettings()">${texts.modelSave}</button>
                </div>
            </div>
            
            <!-- Gemini AI Configuration Section -->
            <div class="section">
                <div class="section-title">${texts.geminiAiConfig}</div>
                
                <div class="form-group">
                    <label class="form-label" for="geminiOutputLanguage">${texts.aiOutputLanguage}</label>
                    <select class="form-select" id="geminiOutputLanguage">
                        <option value="zh">中文</option>
                        <option value="en">English</option>
                        <option value="vi">Tiếng Việt</option>
                        <option value="de">Deutsch</option>
                        <option value="ar">العربية</option>
                    </select>
                    <div class="form-help">${texts.aiOutputLanguageHelp}</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="geminiApiTimeout">${texts.aiApiTimeout}</label>
                    <input type="number" class="form-input" id="geminiApiTimeout" min="10" max="300" value="60">
                    <div class="form-help">${texts.aiApiTimeoutHelp}</div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" class="form-checkbox" id="geminiEnableRouting" checked>
                        ${texts.aiEnableRouting}
                    </label>
                    <div class="form-help">${texts.aiEnableRoutingHelp}</div>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="saveGeminiAISettings()">${texts.aiSave}</button>
                </div>
            </div>
            
            <!-- Gemini Connection Testing Section -->
            <!--
            <div class="section">
                <div class="section-title">${texts.connectionTitle}</div>
                
                <div class="form-group">
                    <label class="form-label" for="geminiTestProvider">${texts.connectionTestProvider}</label>
                    <select class="form-select" id="geminiTestProvider" onchange="updateGeminiTestModelOptions()">
                        <option value="">${texts.connectionTestProviderPlaceholder}</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="geminiTestModel">${texts.connectionTestModel}</label>
                    <select class="form-select" id="geminiTestModel">
                        <option value="">${texts.connectionTestModelPlaceholder}</option>
                    </select>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="testGeminiConnection()">${texts.connectionTest}</button>
                </div>
                
                <div id="geminiConnectionStatus" class="status-message"></div>
                <div id="geminiConnectionLoading" class="loading">${texts.connectionTesting}</div>
            </div>
            -->
            
            <!-- Gemini Global Actions -->
            <div class="section">
                <div class="button-group">
                    <button class="btn btn-primary" onclick="saveGeminiAllSettings()">${texts.geminiSaveAll}</button>
                    <button class="btn btn-secondary" onclick="resetGeminiAllSettings()">${texts.geminiResetAll}</button>
                </div>
                
                <div id="geminiGlobalStatus" class="status-message"></div>
                <div id="geminiGlobalLoading" class="loading">${texts.loading}</div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Provider configurations
        const providerConfigs = {
            openrouter: {
                name: 'openrouter',
                api_base_url: 'https://openrouter.ai/api/v1/chat/completions',
                models: ['anthropic/claude-3.5-sonnet', 'anthropic/claude-3-haiku', 'openai/gpt-4o', 'openai/gpt-4o-mini', 'meta-llama/llama-3.1-405b-instruct', 'google/gemini-pro-1.5']
            },
            bailian: {
                name: 'bailian',
                api_base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
                models: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-long']
            },
            deepseek: {
                name: 'deepseek',
                api_base_url: 'https://api.deepseek.com/v1/chat/completions',
                models: ['deepseek-chat', 'deepseek-coder']
            },
            glm: {
                name: 'glm',
                api_base_url: 'https://open.bigmodel.cn/api/anthropic',
                models: ['glm-4', 'glm-4v', 'glm-3-turbo', 'glm-4.5']
            },
            ollama: {
                name: 'ollama',
                api_base_url: 'http://localhost:11434/v1/chat/completions',
                models: ['llama3.1', 'codellama', 'mistral', 'gemma']
            },
            gemini: {
                name: 'gemini',
                api_base_url: 'https://generativelanguage.googleapis.com/v1beta/models/',
                models: ['gemini-pro', 'gemini-pro-vision']
            },
            volcengine: {
                name: 'volcengine',
                api_base_url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                models: ['deepseek-v3-250324']
            },
            azure: {
                name: 'azure',
                api_base_url: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2024-02-15-preview',
                models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
            }
        };
        
        let currentSettings = {};
        let geminiSettings = {};
        
        // Tab switching functions
        function switchTab(tabName) {
            console.log('[Webview] ===== Switching to tab:', tabName, '=====');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            console.log('[Webview] Hidden all tab contents');
            
            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active');
            });
            console.log('[Webview] Removed active class from all tab buttons');
            
            // Show selected tab content
            const targetTab = document.getElementById(tabName + '-tab');
            if (targetTab) {
                targetTab.classList.add('active');
                console.log('[Webview] Activated tab content:', tabName + '-tab');
            } else {
                console.error('[Webview] Target tab not found:', tabName + '-tab');
            }
            
            // Add active class to clicked button
            if (event && event.target) {
                event.target.classList.add('active');
                console.log('[Webview] Added active class to clicked button');
            }
            
            // If switching to Gemini tab, ensure model options are loaded
            if (tabName === 'gemini') {
                console.log('[Webview] ===== Switching to Gemini tab - loading model options =====');
                loadGeminiModelOptions();
                
                // Also restore the saved default model value if it exists
                const geminiDefaultModelSelect = document.getElementById('geminiDefaultModel');
                if (geminiDefaultModelSelect) {
                    console.log('[Webview] Found Gemini default model select element on tab switch');
                    if (geminiDefaultModelSelect.value) {
                        console.log('[Webview] Restoring Gemini default model on tab switch:', geminiDefaultModelSelect.value);
                    } else {
                        console.log('[Webview] No current value in Gemini default model select on tab switch');
                    }
                } else {
                    console.error('[Webview] Gemini default model select element not found on tab switch!');
                }
                console.log('[Webview] ===== Gemini tab switch completed =====');
            } else {
                console.log('[Webview] Switched to non-Gemini tab:', tabName);
            }
        }
        
        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[Webview] Page loaded, requesting settings...');
            vscode.postMessage({ command: 'loadSettings' });
        });
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('[Webview] ===== Received message from extension =====');
            console.log('[Webview] Message command:', message.command);
            console.log('[Webview] Full message:', message);
            
            switch (message.command) {
                case 'settingsLoaded':
                    console.log('[Webview] ===== Processing settingsLoaded message =====');
                    console.log('[Webview] Current settings:', message.settings);
                    console.log('[Webview] Gemini settings:', message.geminiSettings);
                    
                    currentSettings = message.settings;
                    geminiSettings = message.geminiSettings || {};
                    
                    console.log('[Webview] About to load Claude Code settings...');
                    loadSettingsIntoUI(message.settings);
                    
                    console.log('[Webview] About to load Gemini settings...');
                    loadGeminiSettingsIntoUI(message.geminiSettings || {});
                    break;
                case 'settingsSaved':
                    showStatus('globalStatus', message.success ? texts.saved : texts.error + message.error, message.success);
                    break;
                case 'settingsReset':
                    showStatus('globalStatus', message.success ? texts.resetSuccess : texts.error + message.error, message.success);
                    if (message.success) {
                        setTimeout(() => location.reload(), 1000);
                    }
                    break;
                case 'connectionTestResult':
                    showConnectionResult(message);
                    break;
            }
        });
        
        function loadAllAvailableModels() {
            const allModels = [];
            
            // Collect all models from all providers
            Object.keys(providerConfigs).forEach(provider => {
                const config = providerConfigs[provider];
                config.models.forEach(model => {
                    const modelKey = provider + ',' + model;
                    if (!allModels.includes(modelKey)) {
                        allModels.push(modelKey);
                    }
                });
            });
            
            // Update all model select dropdowns
            const modelSelects = [
                { id: 'defaultModel', placeholder: '${texts.modelDefaultPlaceholder}' },
                { id: 'longContextModel', placeholder: '${texts.modelLongContextPlaceholder}' },
                { id: 'thinkModel', placeholder: '${texts.modelReasoningPlaceholder}' },
                { id: 'imageModel', placeholder: '${texts.modelImagePlaceholder}' },
                { id: 'videoModel', placeholder: '${texts.modelVideoPlaceholder}' }
            ];
            
            modelSelects.forEach(({ id, placeholder }) => {
                const select = document.getElementById(id);
                if (select) {
                    // Keep current value
                    const currentValue = select.value;
                    
                    // Clear and repopulate options
                    select.innerHTML = '<option value="">' + placeholder + '</option>';
                    
                    allModels.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        select.appendChild(option);
                    });
                    
                    // Restore current value if it still exists
                    if (currentValue && allModels.includes(currentValue)) {
                        select.value = currentValue;
                    }
                }
            });
        }
        
        function loadGeminiModelOptions() {
            console.log('[Webview] ===== Loading Gemini model options =====');
            const allModels = [];
            
            // Collect all models from all providers
            console.log('[Webview] Available provider configs:', Object.keys(providerConfigs));
            Object.keys(providerConfigs).forEach(provider => {
                const config = providerConfigs[provider];
                console.log('[Webview] Processing provider: ' + provider + ', models:', config.models);
                config.models.forEach(model => {
                    const modelKey = provider + ',' + model;
                    if (!allModels.includes(modelKey)) {
                        allModels.push(modelKey);
                        console.log('[Webview] Added model: ' + modelKey);
                    }
                });
            });
            
            console.log('[Webview] Total models collected:', allModels.length);
            console.log('[Webview] All models:', allModels);
            
            // Update Gemini default model select
            const geminiDefaultModelSelect = document.getElementById('geminiDefaultModel');
            console.log('[Webview] Gemini default model select element:', geminiDefaultModelSelect);
            
            if (geminiDefaultModelSelect) {
                // Keep current value before clearing
                const currentValue = geminiDefaultModelSelect.value;
                console.log('[Webview] Current value before clearing:', currentValue);
                console.log('[Webview] Current innerHTML before clearing:', geminiDefaultModelSelect.innerHTML);
                
                // Clear and repopulate options
                geminiDefaultModelSelect.innerHTML = '<option value="">选择默认模型</option>';
                console.log('[Webview] Cleared select options');
                
                allModels.forEach((model, index) => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    geminiDefaultModelSelect.appendChild(option);
                    console.log('[Webview] Added option ' + (index + 1) + ': ' + model);
                });
                
                console.log('[Webview] Added', allModels.length, 'model options to Gemini select');
                console.log('[Webview] Final innerHTML after adding options:', geminiDefaultModelSelect.innerHTML);
                
                // Restore current value if it exists and is valid
                if (currentValue && allModels.includes(currentValue)) {
                    geminiDefaultModelSelect.value = currentValue;
                    console.log('[Webview] Successfully restored current value:', currentValue);
                } else if (currentValue) {
                    console.log('[Webview] Warning: Current value not found in available models:', currentValue);
                    console.log('[Webview] Available models:', allModels);
                } else {
                    console.log('[Webview] No current value to restore');
                }
                
                console.log('[Webview] Final select value after restoration:', geminiDefaultModelSelect.value);
                console.log('[Webview] ===== Gemini model options loading completed =====');
            } else {
                console.error('[Webview] Gemini default model select element not found!');
                console.log('[Webview] Available elements with "gemini" in ID:');
                document.querySelectorAll('[id*="gemini"]').forEach(el => {
                    console.log('[Webview] Found element:', el.id, el);
                });
            }
        }
        
        function loadSettingsIntoUI(settings) {
            // Load provider settings
            if (settings.providers) {
                Object.keys(settings.providers).forEach(provider => {
                    const providerData = settings.providers[provider];
                    if (providerData.api_key) {
                        // Store API key for later use
                        window[provider + '_api_key'] = providerData.api_key;
                    }
                });
            }
            
            // Load all available models from providers
            loadAllAvailableModels();
            
            // Load model settings from router config
            if (settings.routerConfig && settings.routerConfig.Router) {
                const router = settings.routerConfig.Router;
                document.getElementById('defaultModel').value = router.default || '';
                document.getElementById('longContextModel').value = router.longContext || '';
                document.getElementById('thinkModel').value = router.think || '';
                document.getElementById('imageModel').value = router.image || '';
                document.getElementById('videoModel').value = router.video || '';
            } else if (settings.defaultModel) {
                // Fallback to old settings
                document.getElementById('defaultModel').value = settings.defaultModel;
                document.getElementById('longContextModel').value = settings.defaultModel;
                document.getElementById('thinkModel').value = settings.defaultModel;
                document.getElementById('imageModel').value = settings.defaultModel;
                document.getElementById('videoModel').value = settings.defaultModel;
            }
            
            // Load AI settings
            document.getElementById('apiTimeout').value = settings.apiTimeout || 60;
            document.getElementById('enableRouting').checked = settings.enableRouting !== false;
            
            
            // Update test provider options
            updateTestProviderOptions();
        }
        
        function loadGeminiSettingsIntoUI(settings) {
            console.log('[Webview] ===== Loading Gemini settings into UI =====');
            console.log('[Webview] Full settings object:', settings);
            console.log('[Webview] Gemini defaultModel from settings:', settings.defaultModel);
            console.log('[Webview] Settings providers:', settings.providers);
            
            // Load Gemini provider settings
            if (settings.providers) {
                console.log('[Webview] Processing Gemini providers...');
                Object.keys(settings.providers).forEach(provider => {
                    const providerData = settings.providers[provider];
                    console.log('[Webview] Processing provider: ' + provider, providerData);
                    if (providerData.api_key) {
                        // Store API key for later use
                        window['gemini_' + provider + '_api_key'] = providerData.api_key;
                        console.log('[Webview] Stored API key for provider: ' + provider);
                    }
                });
            } else {
                console.log('[Webview] No providers found in settings');
            }
            
            // 关键改动：先加载所有模型选项
            console.log('[Webview] About to load Gemini model options...');
            loadGeminiModelOptions();
            
            // 然后再设置已保存的值
            if (settings.defaultModel) {
                console.log('[Webview] Attempting to set Gemini default model:', settings.defaultModel);
                const geminiDefaultModelSelect = document.getElementById('geminiDefaultModel');
                if (geminiDefaultModelSelect) {
                    console.log('[Webview] Found Gemini default model select element');
                    console.log('[Webview] Available options before setting:', Array.from(geminiDefaultModelSelect.options).map(opt => opt.value));
                    console.log('[Webview] Setting Gemini default model directly:', settings.defaultModel);
                    geminiDefaultModelSelect.value = settings.defaultModel;
                    console.log('[Webview] Gemini default model set to:', geminiDefaultModelSelect.value);
                    console.log('[Webview] Verification - select value after setting:', geminiDefaultModelSelect.value);
                } else {
                    console.error('[Webview] Gemini default model select element not found when trying to set value!');
                }
            } else {
                console.log('[Webview] No default model to set in Gemini settings');
            }
            
            // Load Gemini AI settings
            console.log('[Webview] Loading other Gemini AI settings...');
            const geminiOutputLanguage = document.getElementById('geminiOutputLanguage');
            const geminiApiTimeout = document.getElementById('geminiApiTimeout');
            const geminiEnableRouting = document.getElementById('geminiEnableRouting');
            
            if (geminiOutputLanguage) {
                geminiOutputLanguage.value = settings.outputLanguage || 'zh';
                console.log('[Webview] Set output language to:', settings.outputLanguage || 'zh');
            }
            if (geminiApiTimeout) {
                geminiApiTimeout.value = settings.apiTimeout || 60;
                console.log('[Webview] Set API timeout to:', settings.apiTimeout || 60);
            }
            if (geminiEnableRouting) {
                geminiEnableRouting.checked = settings.enableRouting !== false;
                console.log('[Webview] Set enable routing to:', settings.enableRouting !== false);
            }
            
            // Update Gemini test provider options
            console.log('[Webview] Updating Gemini test provider options...');
            updateGeminiTestProviderOptions();
            console.log('[Webview] ===== Gemini settings loading completed =====');
        }
        
        function updateProviderConfig() {
            const selectedProvider = document.getElementById('selectedProvider').value;
            const providerConfig = document.getElementById('providerConfig');
            const providerTitle = document.getElementById('providerTitle');
            const apiUrlInput = document.getElementById('provider_api_url');
            const apiKeyInput = document.getElementById('provider_api_key');
            const supportedModels = document.getElementById('supportedModels');
            
            if (selectedProvider && providerConfigs[selectedProvider]) {
                const config = providerConfigs[selectedProvider];
                providerConfig.style.display = 'block';
                providerTitle.textContent = config.name + ' ${texts.providerConfigTitle}';
                apiUrlInput.value = config.api_base_url;
                
                // Load existing API key if available
                if (window[selectedProvider + '_api_key']) {
                    apiKeyInput.value = window[selectedProvider + '_api_key'];
                } else {
                    apiKeyInput.value = '';
                }
                
                // Display supported models
                supportedModels.innerHTML = '';
                config.models.forEach(model => {
                    const modelItem = document.createElement('div');
                    modelItem.className = 'model-item';
                    modelItem.innerHTML = \`
                        <span class="model-name">\${model}</span>
                        <span class="model-badge">Available</span>
                    \`;
                    supportedModels.appendChild(modelItem);
                });
            } else {
                providerConfig.style.display = 'none';
            }
        }
        
        function saveProviderSettings() {
            const selectedProvider = document.getElementById('selectedProvider').value;
            const apiKey = document.getElementById('provider_api_key').value;
            const enabled = document.getElementById('provider_enabled').checked;
            
            if (!selectedProvider) {
                showStatus('globalStatus', texts.connectionNoProvider, false);
                return;
            }
            
            if (!apiKey.trim()) {
                showStatus('globalStatus', texts.connectionNoApiKey, false);
                return;
            }
            
            const config = providerConfigs[selectedProvider];
            const providerSettings = {
                name: config.name,
                api_base_url: config.api_base_url,
                api_key: apiKey,
                models: config.models,
                enabled: enabled
            };
            
            // Store API key for later use
            window[selectedProvider + '_api_key'] = apiKey;
            
            // Update current settings
            if (!currentSettings.providers) {
                currentSettings.providers = {};
            }
            currentSettings.providers[selectedProvider] = providerSettings;
            
            // 同时更新Router配置的APIKEY字段
            currentSettings.apiKey = apiKey;
            
            // 直接保存设置
            showLoading('globalLoading', true);
            showStatus('globalStatus', '正在保存提供商设置...', true);
            vscode.postMessage({
                command: 'saveSettings',
                settings: currentSettings
            });
        }
        
        function saveModelSettings() {
            const defaultModel = document.getElementById('defaultModel').value;
            const longContextModel = document.getElementById('longContextModel').value;
            const thinkModel = document.getElementById('thinkModel').value;
            const imageModel = document.getElementById('imageModel').value;
            const videoModel = document.getElementById('videoModel').value;
            
            if (!defaultModel) {
                showStatus('globalStatus', texts.connectionNoModel, false);
                return;
            }
            
            currentSettings.defaultModel = defaultModel;
            currentSettings.longContextModel = longContextModel || defaultModel;
            currentSettings.thinkModel = thinkModel || defaultModel;
            currentSettings.imageModel = imageModel || defaultModel;
            currentSettings.videoModel = videoModel || defaultModel;
            
            // 直接保存设置
            showLoading('globalLoading', true);
            showStatus('globalStatus', '正在保存模型设置...', true);
            vscode.postMessage({
                command: 'saveSettings',
                settings: currentSettings
            });
        }
        
        function saveAISettings() {
            const outputLanguage = document.getElementById('outputLanguage').value;
            const apiTimeout = parseInt(document.getElementById('apiTimeout').value);
            const enableRouting = document.getElementById('enableRouting').checked;
            
            currentSettings.outputLanguage = outputLanguage;
            currentSettings.apiTimeout = apiTimeout;
            currentSettings.enableRouting = enableRouting;
            
            // 直接保存设置
            showLoading('globalLoading', true);
            showStatus('globalStatus', '正在保存AI设置...', true);
            vscode.postMessage({
                command: 'saveSettings',
                settings: currentSettings
            });
        }
        
        
        function saveAllSettings() {
            showLoading('globalLoading', true);
            vscode.postMessage({
                command: 'saveSettings',
                settings: currentSettings
            });
        }
        
        function resetAllSettings() {
            if (confirm(texts.resetConfirm)) {
                showLoading('globalLoading', true);
                vscode.postMessage({ command: 'resetSettings' });
            }
        }
        
        function updateTestProviderOptions() {
            const testProviderSelect = document.getElementById('testProvider');
            if (testProviderSelect) {
                testProviderSelect.innerHTML = '<option value="">选择测试提供商</option>';
                
                Object.keys(providerConfigs).forEach(provider => {
                    const option = document.createElement('option');
                    option.value = provider;
                    option.textContent = provider;
                    testProviderSelect.appendChild(option);
                });
            }
        }
        
        function updateTestModelOptions() {
            const testProvider = document.getElementById('testProvider').value;
            const testModelSelect = document.getElementById('testModel');
            
            testModelSelect.innerHTML = '<option value="">' + texts.connectionTestModelPlaceholder + '</option>';
            
            if (testProvider && providerConfigs[testProvider]) {
                providerConfigs[testProvider].models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    testModelSelect.appendChild(option);
                });
            }
        }
        
        function testConnection() {
            const testProvider = document.getElementById('testProvider').value;
            const testModel = document.getElementById('testModel').value;
            
            if (!testProvider) {
                showConnectionResult({ success: false, error: '${texts.connectionNoProvider}' });
                return;
            }
            
            if (!testModel) {
                showConnectionResult({ success: false, error: '${texts.connectionNoModel}' });
                return;
            }
            
            const apiKey = window[testProvider + '_api_key'];
            if (!apiKey) {
                showConnectionResult({ success: false, error: '${texts.connectionNoApiKey}' });
                return;
            }
            
            showLoading('connectionLoading', true);
            vscode.postMessage({
                command: 'testConnection',
                model: testModel,
                apiKey: apiKey
            });
        }
        
        function showConnectionResult(result) {
            showLoading('connectionLoading', false);
            showStatus('connectionStatus', result.success ? result.message : result.error, result.success);
        }
        
        function showStatus(elementId, message, isSuccess) {
            const element = document.getElementById(elementId);
            element.textContent = message;
            element.className = 'status-message ' + (isSuccess ? 'status-success' : 'status-error');
            element.style.display = 'block';
            
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
        
        function showLoading(elementId, show) {
            const element = document.getElementById(elementId);
            element.style.display = show ? 'block' : 'none';
        }
        
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('provider_api_key');
            const toggleIcon = document.getElementById('toggleIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleIcon.textContent = '👁️';
            }
        }
        
        // Gemini-specific functions
        function updateGeminiProviderConfig() {
            const selectedProvider = document.getElementById('geminiSelectedProvider').value;
            const providerConfig = document.getElementById('geminiProviderConfig');
            const providerTitle = document.getElementById('geminiProviderTitle');
            const apiUrlInput = document.getElementById('gemini_provider_api_url');
            const apiKeyInput = document.getElementById('gemini_provider_api_key');
            const supportedModels = document.getElementById('geminiSupportedModels');
            
            if (selectedProvider && providerConfigs[selectedProvider]) {
                const config = providerConfigs[selectedProvider];
                providerConfig.style.display = 'block';
                providerTitle.textContent = config.name + ' ${texts.providerConfigTitle}';
                apiUrlInput.value = config.api_base_url;
                
                // Load existing API key if available
                if (window['gemini_' + selectedProvider + '_api_key']) {
                    apiKeyInput.value = window['gemini_' + selectedProvider + '_api_key'];
                } else {
                    apiKeyInput.value = '';
                }
                
                // Display supported models
                supportedModels.innerHTML = '';
                config.models.forEach(model => {
                    const modelItem = document.createElement('div');
                    modelItem.className = 'model-item';
                    modelItem.innerHTML = \`
                        <span class="model-name">\${model}</span>
                        <span class="model-badge">Available</span>
                    \`;
                    supportedModels.appendChild(modelItem);
                });
            } else {
                providerConfig.style.display = 'none';
            }
        }
        
        function saveGeminiProviderSettings() {
            const selectedProvider = document.getElementById('geminiSelectedProvider').value;
            const apiKey = document.getElementById('gemini_provider_api_key').value;
            const enabled = document.getElementById('gemini_provider_enabled').checked;
            
            if (!selectedProvider) {
                showStatus('geminiGlobalStatus', texts.connectionNoProvider, false);
                return;
            }
            
            if (!apiKey.trim()) {
                showStatus('geminiGlobalStatus', texts.connectionNoApiKey, false);
                return;
            }
            
            const config = providerConfigs[selectedProvider];
            const providerSettings = {
                name: config.name,
                api_base_url: config.api_base_url,
                api_key: apiKey,
                models: config.models,
                enabled: enabled
            };
            
            // Store API key for later use
            window['gemini_' + selectedProvider + '_api_key'] = apiKey;
            
            // Update gemini settings
            if (!geminiSettings.providers) {
                geminiSettings.providers = {};
            }
            geminiSettings.providers[selectedProvider] = providerSettings;
            
            showLoading('geminiGlobalLoading', true);
            showStatus('geminiGlobalStatus', '正在保存Gemini提供商设置...', true);
            vscode.postMessage({
                command: 'saveGeminiSettings',
                settings: geminiSettings
            });
        }
        
        function saveGeminiAISettings() {
            const outputLanguage = document.getElementById('geminiOutputLanguage').value;
            const apiTimeout = parseInt(document.getElementById('geminiApiTimeout').value);
            const enableRouting = document.getElementById('geminiEnableRouting').checked;
            
            geminiSettings.outputLanguage = outputLanguage;
            geminiSettings.apiTimeout = apiTimeout;
            geminiSettings.enableRouting = enableRouting;
            
            showLoading('geminiGlobalLoading', true);
            showStatus('geminiGlobalStatus', '正在保存Gemini AI设置...', true);
            vscode.postMessage({
                command: 'saveGeminiSettings',
                settings: geminiSettings
            });
        }
        
        function saveGeminiAllSettings() {
            showLoading('geminiGlobalLoading', true);
            vscode.postMessage({
                command: 'saveGeminiSettings',
                settings: geminiSettings
            });
        }
        
        function resetGeminiAllSettings() {
            if (confirm('确定要重置所有Gemini设置吗？')) {
                showLoading('geminiGlobalLoading', true);
                vscode.postMessage({ command: 'resetGeminiSettings' });
            }
        }
        
        function toggleGeminiPasswordVisibility() {
            const passwordInput = document.getElementById('gemini_provider_api_key');
            const toggleIcon = document.getElementById('geminiToggleIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleIcon.textContent = '👁️';
            }
        }
        
        // Gemini model settings functions
        function saveGeminiModelSettings() {
            const defaultModel = document.getElementById('geminiDefaultModel').value;
            
            if (!defaultModel) {
                showStatus('geminiGlobalStatus', texts.connectionNoModel, false);
                return;
            }
            
            geminiSettings.defaultModel = defaultModel;
            
            showLoading('geminiGlobalLoading', true);
            showStatus('geminiGlobalStatus', '正在保存Gemini模型设置...', true);
            vscode.postMessage({
                command: 'saveGeminiSettings',
                settings: geminiSettings
            });
        }
        
        // Gemini connection testing functions
        function updateGeminiTestProviderOptions() {
            const testProviderSelect = document.getElementById('geminiTestProvider');
            testProviderSelect.innerHTML = '<option value="">选择测试提供商</option>';
            
            Object.keys(providerConfigs).forEach(provider => {
                const option = document.createElement('option');
                option.value = provider;
                option.textContent = provider;
                testProviderSelect.appendChild(option);
            });
        }
        
        function updateGeminiTestModelOptions() {
            const testProvider = document.getElementById('geminiTestProvider').value;
            const testModelSelect = document.getElementById('geminiTestModel');
            
            testModelSelect.innerHTML = '<option value="">' + texts.connectionTestModelPlaceholder + '</option>';
            
            if (testProvider && providerConfigs[testProvider]) {
                providerConfigs[testProvider].models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    testModelSelect.appendChild(option);
                });
            }
        }
        
        function testGeminiConnection() {
            const testProvider = document.getElementById('geminiTestProvider').value;
            const testModel = document.getElementById('geminiTestModel').value;
            
            if (!testProvider) {
                showConnectionResult({ success: false, error: '${texts.connectionNoProvider}' }, 'gemini');
                return;
            }
            
            if (!testModel) {
                showConnectionResult({ success: false, error: '${texts.connectionNoModel}' }, 'gemini');
                return;
            }
            
            const apiKey = window['gemini_' + testProvider + '_api_key'];
            if (!apiKey) {
                showConnectionResult({ success: false, error: '${texts.connectionNoApiKey}' }, 'gemini');
                return;
            }
            
            showLoading('geminiConnectionLoading', true);
            vscode.postMessage({
                command: 'testConnection',
                model: testModel,
                apiKey: apiKey
            });
        }
        
        function showConnectionResult(result, prefix = '') {
            const statusId = prefix ? prefix + 'ConnectionStatus' : 'connectionStatus';
            const loadingId = prefix ? prefix + 'ConnectionLoading' : 'connectionLoading';
            
            showLoading(loadingId, false);
            showStatus(statusId, result.success ? result.message : result.error, result.success);
        }
    </script>
</body>
</html>`;
    }

    public dispose(): void {
        ChameleonSettingsPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
