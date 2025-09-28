import * as vscode from 'vscode';
import * as path from 'path';
import { ClaudeClient } from './utils/claudeClient';
import { ChameleonSettingsPanel } from './webviews/settingsPanel';
import { InstallGuidePanel } from './webviews/installGuidePanel';
import { ChatPanel } from './webviews/chatPanel';
import { SystemSettingsPanel } from './webviews/systemSettingsPanel';
import { LoginPanel } from './webviews/loginPanel';
import { NavigationPanel } from './webviews/navigationPanel';
import { loadTranslations, t } from './utils/i18n';

// 插件激活
export async function activate(context: vscode.ExtensionContext) {
    // 首先加载翻译
    loadTranslations(context);
    
    console.log('=== Chameleon 智能文档助手已启动! ===');
    console.log('Extension context:', context.extensionPath);

    // 隐藏默认的Chat面板和Welcome页面
    vscode.commands.executeCommand('setContext', 'chat.enabled', false);

    // 注册命令
    const disposables = [
        vscode.commands.registerCommand('chameleon.welcome', () => showChameleonWelcomePage(context)),
        vscode.commands.registerCommand('chameleon.installDeps', () => runInstallScript()),
        vscode.commands.registerCommand('chameleon.chat.open', () => showChatPanel(context)),
        vscode.commands.registerCommand('chameleon.chat.send', handleChatSend),
        vscode.commands.registerCommand('chameleon.chat.clear', handleChatClear),
        vscode.commands.registerCommand('chameleon.summarize', () => handleDocumentActionFromRightClick('summarize')),
        vscode.commands.registerCommand('chameleon.optimize', () => handleDocumentActionFromRightClick('optimize')),
        vscode.commands.registerCommand('chameleon.translate', () => handleDocumentActionFromRightClick('translate')),
        vscode.commands.registerCommand('chameleon.settings', () => showSettingsPanel(context)),
        vscode.commands.registerCommand('chameleon.launchActiveCLI', () => launchActiveCLI()),
        vscode.commands.registerCommand('chameleon.setActiveCliMode', async (mode: string) => {
            if (['claude-native', 'claude-router', 'gemini-native', 'gemini-router'].includes(mode)) {
                const config = vscode.workspace.getConfiguration('chameleon');
                await config.update('activeCliMode', mode, vscode.ConfigurationTarget.Global);
                
                // 获取模式的中文描述
                const modeDescription = t(`cli.modes.${mode}`);
                vscode.window.showInformationMessage(t('cli.modeSwitched', modeDescription));
            }
        }),
        vscode.commands.registerCommand('chameleon.checkDependencies', async (mode: string) => {
            console.log('[Extension] 收到依赖检测命令，模式:', mode);
            const result = await checkModeDependencies(mode);
            console.log('[Extension] 依赖检测完成，结果:', result);
            return result;
        }),
        vscode.commands.registerCommand('chameleon.openUrl', async (url: string) => {
            vscode.env.openExternal(vscode.Uri.parse(url));
        }),
        vscode.commands.registerCommand('chameleon.systemSettings', () => showSystemSettingsPanel(context)),
        vscode.commands.registerCommand('chameleon.login', () => showLoginPanel(context)),
        vscode.commands.registerCommand('chameleon.navigation', () => showNavigationPanel(context)),
        vscode.commands.registerCommand('chameleon.toolbox', () => showToolboxPanel(context)),
    ];

    // 注册到上下文
    context.subscriptions.push(...disposables);

    // 确保Chameleon布局
    console.log('Extension activated, calling ensureChameleonLayout...');
    ensureChameleonLayout(context);
}

// 确保Chameleon布局
function ensureChameleonLayout(context: vscode.ExtensionContext) {
    // 延迟执行，确保VS Code完全启动
    setTimeout(() => {
        try {
            // 检查是否有Chameleon相关的标签页
            const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
            const hasChameleonTab = allTabs.some(tab => 
                tab.label.includes('Chameleon') || 
                tab.label.includes('chameleon')
            );
            
            // 如果没有Chameleon标签页，显示登录页面
            if (!hasChameleonTab) {
                console.log('没有找到Chameleon标签页，显示登录页面');
                showLoginPanel(context);
            } else {
                console.log('Chameleon标签页已存在');
            }
        } catch (error) {
            console.log('确保布局时出错:', error);
        }
    }, 1000);
}

// 显示聊天面板
function showChatPanel(context: vscode.ExtensionContext) {
    // 创建新的聊天面板
    ChatPanel.createOrShow(context.extensionUri);
}

// 显示设置面板
async function showSettingsPanel(context: vscode.ExtensionContext) {
    try {
        ChameleonSettingsPanel.createOrShow(context.extensionUri);
    } catch (error) {
        vscode.window.showErrorMessage('Failed to open settings panel: ' + (error as Error).message);
    }
}

// 显示系统设置面板
async function showSystemSettingsPanel(context: vscode.ExtensionContext) {
    try {
        SystemSettingsPanel.createOrShow(context.extensionUri);
    } catch (error) {
        vscode.window.showErrorMessage('Failed to open system settings panel: ' + (error as Error).message);
    }
}

// 显示登录面板
async function showLoginPanel(context: vscode.ExtensionContext) {
    try {
        console.log('[Extension.ts] showLoginPanel called. Creating LoginPanel...');
        console.log('[Extension.ts] Extension URI:', context.extensionUri);
        console.log('[Extension.ts] Context:', context);
        LoginPanel.createOrShow(context.extensionUri, context);
        console.log('[Extension.ts] LoginPanel created successfully.');
    } catch (error) {
        console.error('[Extension.ts] Failed to create LoginPanel:', error);
        vscode.window.showErrorMessage('Failed to open login panel: ' + (error as Error).message);
    }
}

// 显示导航面板
async function showNavigationPanel(context: vscode.ExtensionContext) {
    try {
        NavigationPanel.createOrShow(context.extensionUri, context);
    } catch (error) {
        vscode.window.showErrorMessage('Failed to open navigation panel: ' + (error as Error).message);
    }
}

// 处理聊天发送命令
function handleChatSend() {
    // 打开聊天面板
    vscode.commands.executeCommand('chameleon.chat.open');
}

// 处理聊天清除命令
function handleChatClear() {
    // 这里可以添加清除聊天历史的逻辑
}

// 处理来自右键菜单的文档操作
async function handleDocumentActionFromRightClick(action: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文档');
        return;
    }

    const document = editor.document;
    const content = document.getText();
    const fileName = document.uri.fsPath.split(/[/\\]/).pop() || 'document.txt';
    await processDocumentWithAI(content, action, fileName);
}

// 使用AI处理文档
async function processDocumentWithAI(content: string, action: string, fileName: string) {
    try {
        const claudeClient = new ClaudeClient();
        
        let prompt = '';
        switch (action) {
            case 'summarize':
                prompt = `请总结以下文档内容：\n\n${content}`;
                break;
            case 'optimize':
                prompt = `请优化以下文档内容：\n\n${content}`;
                break;
            case 'translate':
                prompt = `请将以下文档翻译成中文：\n\n${content}`;
                break;
            default:
                prompt = `请处理以下文档内容：\n\n${content}`;
        }

        const response = await claudeClient.sendMessage(prompt);
        
        // 创建新文档显示结果
        const responseContent = typeof response === 'string' ? response : response.content || '';
        const doc = await vscode.workspace.openTextDocument({
            content: responseContent,
            language: 'markdown'
        });
        
        await vscode.window.showTextDocument(doc);
        
    } catch (error) {
        vscode.window.showErrorMessage(`AI处理失败: ${(error as Error).message}`);
    }
}

// 运行安装脚本
async function runInstallScript() {
    try {
        const terminal = vscode.window.createTerminal('Chameleon 安装');
        terminal.show();
        
        // 检查操作系统
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            // Windows安装脚本
            terminal.sendText('powershell -ExecutionPolicy Bypass -File install.ps1');
        } else {
            // Linux/Mac安装脚本
            terminal.sendText('chmod +x install.sh && ./install.sh');
        }
        
        vscode.window.showInformationMessage('安装脚本已启动，请查看终端输出');
        
    } catch (error) {
        vscode.window.showErrorMessage(`安装失败: ${error}`);
    }
}

// 检测依赖是否安装
async function checkModeDependencies(mode: string): Promise<{ [key: string]: boolean }> {
    console.log('[Extension] checkModeDependencies 开始，模式:', mode);
    
    const dependencies = await Promise.all([
        checkCommand('node --version'),
        checkCommand('git --version'),
        checkCommand('npm --version'),
    ]);
    
    console.log('[Extension] 基础依赖检测结果:', dependencies);

    const baseDeps = {
        'node': dependencies[0],
        'git': dependencies[1],
        'npm': dependencies[2],
    };

    // 根据模式添加特定依赖
    console.log('[Extension] 开始检测模式特定依赖，模式:', mode);
    let result: { [key: string]: boolean };
    switch (mode) {
        case 'claude-native':
            console.log('[Extension] 检测 claude-native 模式依赖');
            result = {
                ...baseDeps,
                '@anthropic-ai/claude-code': await checkCommand('claude --version'),
            };
            break;
        case 'claude-router':
            console.log('[Extension] 检测 claude-router 模式依赖');
            result = {
                ...baseDeps,
                '@chameleon-nexus-tech/claude-code-router': await checkNpmPackage('@chameleon-nexus-tech/claude-code-router'),
                'claude-code-router-config': await checkCCRConfig(),
            };
            break;
        case 'gemini-native':
            console.log('[Extension] 检测 gemini-native 模式依赖');
            result = {
                ...baseDeps,
                '@google/gemini-cli': await checkNpmPackage('@google/gemini-cli'),
            };
            break;
        case 'gemini-router':
            console.log('[Extension] 检测 gemini-router 模式依赖');
            result = {
                ...baseDeps,
                '@chameleon-nexus-tech/gemini-cli': await checkNpmPackage('@chameleon-nexus-tech/gemini-cli'),
            };
            break;
        default:
            console.log('[Extension] 使用默认依赖检测');
            result = baseDeps;
    }
    console.log('[Extension] 模式依赖检测完成:', result);
    return result;
}

// 执行命令检测
function checkCommand(command: string): Promise<boolean> {
    return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd' : 'sh';
        const args = isWindows ? ['/c', command] : ['-c', command];
        
        let resolved = false;
        
        const child = spawn(shell, args, { 
            stdio: 'pipe',
            timeout: 10000 // 10秒超时
        });
        
        child.on('error', (error: Error) => {
            if (!resolved) {
                resolved = true;
                console.log(`Command error for ${command}:`, error.message);
                resolve(false);
            }
        });
        
        child.on('close', (code: number) => {
            if (!resolved) {
                resolved = true;
                resolve(code === 0);
            }
        });
        
        // 10秒超时
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                console.log(`Command timeout for ${command}`);
                child.kill('SIGKILL');
                resolve(false);
            }
        }, 10000);
    });
}

// 检查npm包是否已安装
function checkNpmPackage(packageName: string): Promise<boolean> {
    return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd' : 'sh';
        const args = isWindows ? ['/c', `npm list -g ${packageName}`] : ['-c', `npm list -g ${packageName}`];
        
        let resolved = false;
        
        const child = spawn(shell, args, { 
            stdio: 'pipe',
            timeout: 15000 // npm命令可能需要更长时间
        });
        
        child.on('error', (error: Error) => {
            if (!resolved) {
                resolved = true;
                console.log(`NPM package check error for ${packageName}:`, error.message);
                resolve(false);
            }
        });
        
        child.on('close', (code: number) => {
            if (!resolved) {
                resolved = true;
                resolve(code === 0);
            }
        });
        
        // 15秒超时（npm命令通常比较慢）
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                console.log(`NPM package check timeout for ${packageName}`);
                child.kill('SIGKILL');
                resolve(false);
            }
        }, 15000);
    });
}

// 检查CCR配置文件是否存在
async function checkCCRConfig(): Promise<boolean> {
    try {
        const os = require('os');
        const fs = require('fs');
        const configPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
        
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return config && config.APIKEY && config.APIKEY.trim() !== '';
        }
        
        return false;
    } catch (error) {
        return false;
    }
}

// 读取Router配置文件
async function readRouterConfig(): Promise<any> {
    try {
        const os = require('os');
        const fs = require('fs');
        const configPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
        
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// 启动活动CLI模式
async function launchActiveCLI() {
    // 1. 从VS Code配置中读取当前活动的CLI模式
    const config = vscode.workspace.getConfiguration('chameleon');
    const activeMode = config.get<string>('activeCliMode', 'claude-router');

    let terminalName = "AI CLI";
    let commandToSend = "";
    let terminalEnv: { [key: string]: string | undefined } = { ...process.env };

    // ==================== 修正后的逻辑分支 ====================
    // 使用清晰的 if-else if 结构确保只有一个分支被执行

    if (activeMode === 'claude-native') {
        terminalName = "Claude Code (Official)";
        commandToSend = "claude";
        
        // 创建 Claude 原生模式的终端
        const terminal = vscode.window.createTerminal({
            name: terminalName,
            env: terminalEnv,
            location: vscode.TerminalLocation.Editor
        });
        terminal.sendText(commandToSend);
        terminal.show();

    } else if (activeMode === 'claude-router') {
        terminalName = "Claude Code (Third-party AI)";
        
        const routerConfig = await readRouterConfig();
        const defaultRoute = routerConfig?.Router?.default || 'volcengine,deepseek-v3-250324';
        const [providerName, modelName] = defaultRoute.split(',');
        
        commandToSend = `claude --model "${modelName}"`;
        
        // 检查是否为GLM模型
        const isGlmModel = modelName.toLowerCase().includes('glm') || 
                          modelName.includes('glm-4') || 
                          modelName.includes('glm-3') || 
                          modelName.includes('glm-4v') ||
                          modelName.includes('glm-4.5');
        
        if (isGlmModel) {
            // GLM模型使用GLM配置
            terminalEnv['ANTHROPIC_BASE_URL'] = 'https://open.bigmodel.cn/api/anthropic';
            terminalEnv['NO_PROXY'] = ''; // GLM不需要代理
            
            // 从chameleon配置中获取GLM API密钥
            const chameleonConfig = vscode.workspace.getConfiguration('chameleon');
            const providers = chameleonConfig.get('providers', {}) as Record<string, any>;
            
            if (providers.glm && providers.glm.api_key) {
                terminalEnv['ANTHROPIC_AUTH_TOKEN'] = providers.glm.api_key;
            } else if (providers.gemini_glm && providers.gemini_glm.api_key) {
                terminalEnv['ANTHROPIC_AUTH_TOKEN'] = providers.gemini_glm.api_key;
            }
            
            console.log('Using GLM configuration for model:', modelName);
        } else {
            // 其他模型使用Router配置
            terminalEnv['ANTHROPIC_BASE_URL'] = 'http://127.0.0.1:3456';
            terminalEnv['NO_PROXY'] = '127.0.0.1';
            
            // 根据Router的default配置动态获取对应Provider的api_key
            if (routerConfig?.Providers) {
                const provider = routerConfig.Providers.find((p: any) => p.name === providerName);
                if (provider?.api_key) {
                    terminalEnv['ANTHROPIC_AUTH_TOKEN'] = provider.api_key;
                }
            }
            
            console.log('Using Router configuration for model:', modelName);
        }
        
        terminalEnv['ANTHROPIC_API_KEY'] = '';
        terminalEnv['DISABLE_TELEMETRY'] = 'true';
        terminalEnv['DISABLE_COST_WARNINGS'] = 'true';
        terminalEnv['API_TIMEOUT_MS'] = '600000';

        // 创建 Claude Router 模式的终端
        const terminal = vscode.window.createTerminal({
            name: terminalName,
            env: terminalEnv,
            location: vscode.TerminalLocation.Editor
        });
        terminal.sendText('ccr restart'); // 先重启router
        terminal.sendText(commandToSend);
        terminal.show();

    } else if (activeMode.startsWith('gemini')) {
        // Gemini 的两种模式都使用右侧弹新窗口
        if (activeMode === 'gemini-native') {
            terminalName = "Gemini CLI (Official)";
            if (process.env['GEMINI_API_KEY']) {
                terminalEnv['GEMINI_API_KEY'] = process.env['GEMINI_API_KEY'];
                vscode.window.showInformationMessage('使用系统环境变量中的GEMINI_API_KEY');
            } else {
                vscode.window.showWarningMessage('请设置GEMINI_API_KEY环境变量');
            }
            commandToSend = "gemini";
            
            // 创建 Gemini 原生模式的终端
            const terminal = vscode.window.createTerminal({
                name: terminalName,
                env: terminalEnv,
                location: vscode.TerminalLocation.Editor
            });
            
            // 先打印所有必要的环境变量进行确认
            terminal.sendText('echo "=== Gemini CLI 环境变量检查 ==="');
            terminal.sendText('echo "GEMINI_API_KEY: $env:GEMINI_API_KEY"');
            terminal.sendText('echo "GOOGLE_API_KEY: $env:GOOGLE_API_KEY"');
            terminal.sendText('echo "================================"');
            
            terminal.sendText(commandToSend);
            terminal.show();

        } else if (activeMode === 'gemini-router') {
            terminalName = "Gemini CLI (Third-party AI)";
            
            // 从Gemini选项卡的配置中读取设置
            const config = vscode.workspace.getConfiguration('chameleon');
            const geminiDefaultModel = config.get<string>('geminiDefaultModel', ''); // 从独立的配置项读取
            const geminiOutputLanguage = config.get<string>('outputLanguage', 'zh');
            
            if (geminiDefaultModel) {
                const [providerName, modelName] = geminiDefaultModel.split(',');
                
                // 从Gemini配置的providers中查找对应的提供商配置
                const geminiProviders = config.get<any>('providers', {});
                let provider = null;
                
                // 查找gemini_前缀的提供商配置
                for (const [key, value] of Object.entries(geminiProviders)) {
                    if (key.startsWith('gemini_') && (value as any).name === providerName) {
                        provider = value;
                        break;
                    }
                }
                
                if (provider) {
                    // 设置环境变量到terminalEnv对象中
                    terminalEnv['AI_ENGINE'] = providerName;
                    terminalEnv['AI_MODEL'] = modelName;
                    terminalEnv['AI_API_KEY'] = (provider as any).api_key;
                    terminalEnv['GEMINI_API_KEY'] = (provider as any).api_key;
                    
                    // 只有Azure引擎需要设置AI_BASE_URL
                    if (providerName === 'azure' && (provider as any).api_base_url) {
                        terminalEnv['AI_BASE_URL'] = (provider as any).api_base_url;
                    }
                    
                    // 添加CLI界面语言环境变量
                    terminalEnv['AI_LANG'] = geminiOutputLanguage;
                    
                    vscode.window.showInformationMessage(`Gemini配置: ${providerName} - ${modelName} (语言: ${geminiOutputLanguage})`);
                } else {
                    vscode.window.showWarningMessage(`未找到Gemini Provider配置: ${providerName}`);
                }
            } else {
                vscode.window.showWarningMessage('未设置Gemini默认模型');
            }
            commandToSend = "gemini";
            
            // 创建 Gemini Router 模式的终端
            const terminal = vscode.window.createTerminal({
                name: terminalName,
                env: terminalEnv,
                location: vscode.TerminalLocation.Editor
            });
            
            // 先打印所有必要的环境变量进行确认
            terminal.sendText('echo "=== Gemini CLI 环境变量检查 ==="');
            terminal.sendText('echo "AI_LANG: $env:AI_LANG"');
            terminal.sendText('echo "AI_ENGINE: $env:AI_ENGINE"');
            terminal.sendText('echo "AI_MODEL: $env:AI_MODEL"');
            terminal.sendText('echo "AI_API_KEY: $env:AI_API_KEY"');
            terminal.sendText('echo "GEMINI_API_KEY: $env:GEMINI_API_KEY"');
            terminal.sendText('echo "AI_BASE_URL: $env:AI_BASE_URL"');
            terminal.sendText('echo "================================"');
            
            terminal.sendText(commandToSend);
            terminal.show();
        }
    }

    // 显示环境变量设置信息 (可选，可以根据需要保留或删除)
    const envVarNames = Object.keys(terminalEnv).filter(key => 
        key.startsWith('GEMINI_') || key.startsWith('VOLCENGINE_') || key.startsWith('OPENROUTER_') || key.startsWith('ANTHROPIC_')
    );
    if (envVarNames.length > 0) {
        // vscode.window.showInformationMessage(`已设置环境变量: ${envVarNames.join(', ')}`);
    } else {
        // vscode.window.showWarningMessage('未设置任何附加环境变量');
    }
}

// 根据欢迎面板模式生成不同的内容
function getWelcomePanelContent(mode: string, activeMode: string): string {
    if (mode === 'claude-only') {
        return getClaudeOnlyContent(activeMode);
    } else {
        return getFullModeContent(activeMode);
    }
}

// 完整模式内容（包含CLI启动器和所有AI工具）
function getFullModeContent(activeMode: string): string {
    return `
        <!-- CLI Launcher -->
        <div class="feature-block">
            <div class="feature-title">
                ${t('welcome.cliTitle')}
            </div>
            <div class="feature-desc">
                ${t('welcome.cliDesc')}
            </div>
            
            <div class="cli-launcher">
                <label for="cliModeSelector">${t('welcome.cliModeTitle')}</label>
                <select id="cliModeSelector" onchange="switchMode()">
                    <option value="claude-native" ${activeMode === 'claude-native' ? 'selected' : ''}>Claude Code (官方)</option>
                    <option value="claude-router" ${activeMode === 'claude-router' ? 'selected' : ''}>Claude Code (三方AI)</option>
                    <option value="gemini-native" ${activeMode === 'gemini-native' ? 'selected' : ''}>Gemini CLI (官方)</option>
                    <option value="gemini-router" ${activeMode === 'gemini-router' ? 'selected' : ''}>Gemini CLI (三方AI)</option>
                </select>
            </div>

            <div class="dependencies-status" id="dependenciesStatus">
                <div class="deps-title">依赖状态检测</div>
                <div class="deps-loading" id="depsLoading">正在检测依赖...</div>
                <div class="deps-list" id="depsList" style="display: none;">
                    <!-- 依赖状态将在这里动态加载 -->
                </div>
            </div>

            <div class="feature-actions" style="margin-top: 15px;">
                 <button class="btn" onclick="launchCLI()">启动终端</button>
                 <button class="btn btn-secondary" onclick="checkDependencies()">重新检测依赖</button>
            </div>
        </div>

        <!-- AI Tools Launcher -->
        <div class="feature-block">
            <div class="feature-title">🖥️ 图形用户界面</div>
            <div class="feature-desc">开始您的AI编程之旅</div>

            <div class="feature-actions" style="margin-top: 15px;">
                <button class="btn" onclick="startAITool()">打开AI聊天</button>
            </div>
        </div>

        <!-- AI Settings -->
        <div class="feature-block" onclick="showSettings()" style="cursor: pointer;">
            <div class="feature-title">
                ${t('welcome.aiSettingsTitle')}
            </div>
            <div class="feature-desc">
                ${t('welcome.aiSettingsDesc')}
            </div>
        </div>

        <!-- System Settings -->
        <div class="feature-block" onclick="showSystemSettings()" style="cursor: pointer;">
            <div class="feature-title">
                ${t('welcome.systemSettingsTitle')}
            </div>
            <div class="feature-desc">
                ${t('welcome.systemSettingsDesc')}
            </div>
        </div>
    `;
}

// Claude专用模式内容（仅显示Claude Code相关功能）
function getClaudeOnlyContent(activeMode: string): string {
    return `
        <!-- Claude Code Launcher -->
        <div class="feature-block">
            <div class="feature-title">
                🤖 Claude Code
            </div>
            <div class="feature-desc">
                专业的AI编程助手，支持代码生成、调试和优化
            </div>
            
            <div class="cli-launcher">
                <label for="claudeModeSelector">Claude Code 模式</label>
                <select id="claudeModeSelector" onchange="switchMode()">
                    <option value="claude-native" ${activeMode === 'claude-native' ? 'selected' : ''}>Claude Code (官方)</option>
                    <option value="claude-router" ${activeMode === 'claude-router' ? 'selected' : ''}>Claude Code (三方AI)</option>
                </select>
            </div>

            <div class="dependencies-status" id="dependenciesStatus">
                <div class="deps-title">依赖状态检测</div>
                <div class="deps-loading" id="depsLoading">正在检测依赖...</div>
                <div class="deps-list" id="depsList" style="display: none;">
                    <!-- 依赖状态将在这里动态加载 -->
                </div>
            </div>

            <div class="feature-actions" style="margin-top: 15px;">
                 <button class="btn" onclick="launchCLI()">启动终端</button>
                 <button class="btn btn-secondary" onclick="checkDependencies()">重新检测依赖</button>
            </div>
        </div>

        <!-- Claude Toolbox -->
        <div class="feature-block" onclick="showToolbox()" style="cursor: pointer;">
            <div class="feature-title">
                🧰 Claude 工具箱
            </div>
            <div class="feature-desc">
                代理管理、输出样式、提示词生成器等专业工具
            </div>
        </div>

        <!-- Claude Settings -->
        <div class="feature-block" onclick="showClaudeSettings()" style="cursor: pointer;">
            <div class="feature-title">
                ⚙️ Claude 设置
            </div>
            <div class="feature-desc">
                配置Claude Code的模型和参数
            </div>
        </div>

        <!-- System Settings -->
        <div class="feature-block" onclick="showSystemSettings()" style="cursor: pointer;">
            <div class="feature-title">
                ⚙️ 系统设置
            </div>
            <div class="feature-desc">
                配置欢迎面板模式和其他系统选项
            </div>
        </div>
    `;
}

// 显示工具箱面板
async function showToolboxPanel(context: vscode.ExtensionContext) {
    try {
        const { ToolboxPanel } = await import('./webviews/toolboxPanel');
        ToolboxPanel.createOrShow(context.extensionUri);
    } catch (error) {
        vscode.window.showErrorMessage('Failed to open toolbox panel: ' + (error as Error).message);
    }
}

// 显示Chameleon欢迎页面
function showChameleonWelcomePage(context: vscode.ExtensionContext) {
    // 检查是否已经存在欢迎页面
    const existingTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
    const welcomeTab = existingTabs.find(tab => 
        tab.label.includes('Chameleon') && 
        !tab.label.includes('Chat')
    );
    
    if (welcomeTab) {
        console.log('Chameleon欢迎页面已存在，不重复创建');
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'chameleonWelcome',
        'Chameleon Assistant',
        vscode.ViewColumn.Active,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getChameleonWelcomeHtml();

    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'executeCommand':
                await vscode.commands.executeCommand(message.commandId);
                break;
            case 'showSettings':
                await showSettingsPanel(context);
                break;
            case 'showSystemSettings':
                await showSystemSettingsPanel(context);
                break;
            case 'showManualInstall':
                InstallGuidePanel.createOrShow(vscode.Uri.file(__dirname));
                break;
            case 'setActiveCliMode':
                await vscode.commands.executeCommand('chameleon.setActiveCliMode', message.mode);
                break;
            case 'checkDependencies':
                try {
                    const dependencies = await vscode.commands.executeCommand('chameleon.checkDependencies', message.mode);
                    panel.webview.postMessage({ 
                        command: 'dependenciesResult', 
                        dependencies: dependencies 
                    });
                } catch (error) {
                    console.error('依赖检测失败:', error);
                }
                break;
            case 'openUrl':
                await vscode.commands.executeCommand('chameleon.openUrl', message.url);
                break;
            case 'openSettings':
                await vscode.commands.executeCommand('chameleon.settings');
                break;
            case 'showMessage':
                vscode.window.showInformationMessage(message.message);
                break;
            case 'refreshWelcomePanel':
                panel.webview.html = getChameleonWelcomeHtml();
                break;
            case 'installDependency':
                await installSingleDependency(message.dependency);
                break;
            case 'selectAIModel':
                await handleAIModelSelection(message.model);
                break;
            case 'showToolbox':
                await showToolboxPanel(context);
                break;
        }
    });

    // 监听设置变化，自动刷新欢迎面板
    const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('chameleon.welcomePanel.mode')) {
            panel.webview.html = getChameleonWelcomeHtml();
        }
    });

    // 当面板关闭时清理监听器
    panel.onDidDispose(() => {
        configChangeListener.dispose();
    });
}

// 获取欢迎页面HTML
function getChameleonWelcomeHtml(): string {
    const config = vscode.workspace.getConfiguration('chameleon');
    const activeMode = config.get<string>('activeCliMode', 'claude-router');
    const welcomePanelMode = config.get<string>('welcomePanel.mode', 'full');
    
    return `
    <!DOCTYPE html>
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
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🦎 Chameleon</div>
            <div class="subtitle">智能文档助手</div>
        </div>

        <div class="feature-grid">
            <div class="feature-block">
                <div class="feature-title">🚀 开始使用</div>
                <div class="feature-desc">选择您想要使用的AI工具</div>
                <div class="feature-actions">
                    <button class="btn" onclick="openChat()">打开AI聊天</button>
                    <button class="btn btn-secondary" onclick="showManualInstall()">安装指南</button>
                </div>
            </div>
        </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function openChat() {
            vscode.postMessage({ command: 'executeCommand', commandId: 'chameleon.chat.open' });
        }

        function showManualInstall() {
            vscode.postMessage({ command: 'showManualInstall' });
        }
    </script>
    </body>
    </html>
    `;
}

// 安装单个依赖
async function installSingleDependency(dependency: string): Promise<void> {
    try {
        const terminal = vscode.window.createTerminal(`${getDepDisplayName(dependency)} 安装`);
        terminal.show();
        
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
            case '@musistudio/claude-code-router':
                installCommand = 'npm install -g @musistudio/claude-code-router';
                break;
            default:
                vscode.window.showErrorMessage(`不支持的依赖: ${dependency}`);
                return;
        }
        
        terminal.sendText(installCommand);
        
    } catch (error) {
        vscode.window.showErrorMessage(`安装 ${getDepDisplayName(dependency)} 失败: ${error}`);
    }
}

// 获取依赖显示名称
function getDepDisplayName(dep: string): string {
    const names = {
        'node': 'Node.js',
        'git': 'Git',
        '@anthropic-ai/claude-code': 'Claude Code (官方)',
        '@musistudio/claude-code-router': 'Claude Code Router'
    };
    return names[dep as keyof typeof names] || dep;
}

// 处理AI模型选择
async function handleAIModelSelection(model: string) {
    try {
        const config = vscode.workspace.getConfiguration('chameleon');
        await config.update('activeCliMode', model, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`AI模型已切换为: ${model}`);
    } catch (error) {
        vscode.window.showErrorMessage(`AI模型切换失败: ${error}`);
    }
}

export function deactivate() {}
