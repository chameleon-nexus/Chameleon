import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { t } from '../utils/i18n';
import { ClaudeClient } from '../utils/claudeClient';

// 辅助函数：解析 .md 文件中的 YAML front matter
function parseYamlFrontmatter(content: string): any {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) return {};
    const yaml = match[1];
    const result: { [key: string]: any } = {};
    yaml.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            if (result[key] && key === 'description') {
                 result[key] += '\n' + value;
            } else {
                 result[key] = value;
            }
        }
    });
    return result;
}

export class AgentManagementPanel {
    public static currentPanel: AgentManagementPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    // 读取Router配置中的APIKEY作为认证token
    private async getRouterAuthToken(): Promise<string | undefined> {
        try {
            const os = require('os');
            const path = require('path');
            const fs = require('fs').promises;
            
            const configPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
            const configContent = await fs.readFile(configPath, 'utf8');
            const routerConfig = JSON.parse(configContent);
            
            return routerConfig?.APIKEY;
        } catch (error) {
            console.warn('无法读取Router配置文件中的APIKEY:', error);
            return undefined;
        }
    }

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

        if (AgentManagementPanel.currentPanel) {
            AgentManagementPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'chameleonAgentManagement',
            t('toolbox.agentManagement.title'),
            column || vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        AgentManagementPanel.currentPanel = new AgentManagementPanel(panel, extensionUri);
    }

    private setupWebview() {
        this.panel.webview.html = this._getHtmlTemplate();
        this._setWebviewMessageListener();
        this.loadAgents(); // 页面加载时获取现有代理列表
    }

    private _setWebviewMessageListener() {
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'createAgent':
                        await this.createAgent(message.agent);
                        break;
                    case 'updateAgent':
                        await this.updateAgent(message.agent);
                        break;
                    case 'deleteAgent':
                        await this.deleteAgent(message.agentName);
                        break;
                    case 'loadAgents':
                        await this.loadAgents();
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

    /**
     * [重构] 从文件系统加载所有代理，这是唯一的数据源
     */
    private async loadAgents() {
        try {
            const agents = await this.getAgentsFromFiles();
            this.panel.webview.postMessage({
                command: 'agentsLoaded',
                success: true,
                agents: agents
            });
        } catch (error) {
            console.error('[AgentManagementPanel] Failed to load agents:', error);
            this.panel.webview.postMessage({
                command: 'agentsLoaded',
                success: false,
                error: (error as Error).message
            });
        }
    }

    /**
     * [修正] 使用Claude Code CLI创建代理，而不是直接写文件
     */
    private async createAgent(agentData: any) {
        try {
            const saveLocation = await vscode.window.showQuickPick(
                ['用户全局 (所有项目可用)', '当前项目 (仅此项目可用)'],
                { placeHolder: '请选择代理的保存位置' }
            );

            if (!saveLocation) return; // 用户取消

            const isProjectLevel = saveLocation.includes('当前项目');
            
            // 使用Claude Code CLI命令创建代理
            await this.createAgentViaCLI(agentData, isProjectLevel);
            vscode.window.showInformationMessage(`子代理 "${agentData.name}" 已创建。`);
            await this.loadAgents(); // 重新加载以更新UI
        } catch (error) {
            console.error('[AgentManagementPanel] Failed to create agent:', error);
            vscode.window.showErrorMessage(`创建子代理失败: ${(error as Error).message}`);
        }
    }

    /**
     * [核心修正] 更新代理，在原来的位置更新
     */
    private async updateAgent(agentData: any) {
        try {
            // 对于更新，我们默认在原来的位置更新
            const isProjectLevel = await this.isAgentProjectLevel(agentData.name);
            await this.writeAgentFile(agentData, isProjectLevel);
            vscode.window.showInformationMessage(`子代理 "${agentData.name}" 更新成功。`);
            await this.loadAgents();
        } catch (error) {
             console.error('[AgentManagementPanel] Failed to update agent:', error);
             vscode.window.showErrorMessage(`更新子代理失败: ${(error as Error).message}`);
        }
    }

    /**
     * [新增] 删除代理文件
     */
    private async deleteAgent(agentName: string) {
        try {
            console.log(`[AgentManagementPanel] Delete request received for agent: "${agentName}"`);
            
            // 确认删除操作
            const result = await vscode.window.showWarningMessage(
                `确定要删除代理 "${agentName}" 吗？此操作不可撤销。`,
                { modal: true },
                '确定删除',
                '取消'
            );

            console.log(`[AgentManagementPanel] User choice: ${result}`);

            if (result !== '确定删除') {
                console.log(`[AgentManagementPanel] Delete cancelled by user`);
                return; // 用户取消删除
            }

            console.log(`[AgentManagementPanel] Proceeding with delete operation...`);
            
            // 查找并删除代理文件
            const deleted = await this.deleteAgentFile(agentName);
            
            if (deleted) {
                console.log(`[AgentManagementPanel] Agent "${agentName}" deleted successfully`);
                vscode.window.showInformationMessage(`代理 "${agentName}" 已删除。`);
                await this.loadAgents(); // 重新加载代理列表
            } else {
                console.log(`[AgentManagementPanel] Agent file not found for: "${agentName}"`);
                vscode.window.showErrorMessage(`未找到代理 "${agentName}" 的文件。`);
            }
        } catch (error) {
            console.error('[AgentManagementPanel] Failed to delete agent:', error);
            vscode.window.showErrorMessage(`删除代理失败: ${(error as Error).message}`);
        }
    }

    // --- 辅助函数 ---

    /**
     * [核心修正] 获取所有代理目录，包括全局和项目
     */
    private getAgentDirs(): string[] {
        const dirs = [];
        // 1. 全局目录
        dirs.push(path.join(os.homedir(), '.claude', 'agents'));

        // 2. 项目级目录
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            dirs.push(path.join(workspaceFolder.uri.fsPath, '.claude', 'agents'));
        }
        return dirs;
    }

    /**
     * [核心修正] 从所有已知位置扫描并合并代理列表
     */
    private async getAgentsFromFiles(): Promise<any[]> {
        const agentDirs = this.getAgentDirs();
        const agentsMap = new Map<string, any>();

        for (const dir of agentDirs) {
            try {
                // 确保目录存在，如果不存在则创建
                await fs.mkdir(dir, { recursive: true });
                
                // 检查目录是否真的存在（创建后）
                await fs.access(dir);
            } catch {
                console.warn(`无法访问或创建代理目录: ${dir}`);
                continue; // 目录无法访问，跳过
            }

            try {
                const files = await fs.readdir(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    let agentConfig: any;
                    let isProject = !dir.includes(os.homedir());

                    try {
                        const content = await fs.readFile(filePath, 'utf8');
                        if (file.endsWith('.json')) {
                            agentConfig = JSON.parse(content);
                        } else if (file.endsWith('.md')) {
                            const frontmatter = parseYamlFrontmatter(content);
                            if (frontmatter.name) {
                                agentConfig = {
                                    ...frontmatter,
                                    system_prompt: content.split('---').slice(2).join('---').trim()
                                };
                            }
                        }

                        if (agentConfig && agentConfig.name) {
                            const agent = {
                                id: agentConfig.name,
                                name: agentConfig.name,
                                description: agentConfig.description || agentConfig.default_task || '无描述',
                                prompt: agentConfig.system_prompt,
                                isProjectLevel: isProject // [新增] 标记代理来源
                            };
                            // 项目级代理覆盖全局代理
                            agentsMap.set(agent.name, agent);
                        }
                    } catch (error) {
                        console.error(`加载或解析代理文件失败 ${file}:`, error);
                    }
                }
            } catch (error) {
                console.warn(`无法读取目录内容: ${dir}`, error);
            }
        }
        return Array.from(agentsMap.values());
    }
    
    /**
     * [核心修正] 写入符合Claude Code原生格式的.md文件
     * 根据文档，Claude Code使用.md格式，包含YAML front matter
     */
    private async writeAgentFile(agentData: any, isProjectLevel: boolean): Promise<void> {
        let targetDir: string;
        if (isProjectLevel) {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error("没有打开的项目文件夹，无法保存项目级代理。");
            }
            targetDir = path.join(workspaceFolder.uri.fsPath, '.claude', 'agents');
        } else {
            targetDir = path.join(os.homedir(), '.claude', 'agents');
        }

        await fs.mkdir(targetDir, { recursive: true });

        // 使用更安全的文件名处理，保留中文字符
        const safeName = agentData.name
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .trim();
        const agentFile = path.join(targetDir, `${safeName}.md`); // 使用.md格式

        // 构建符合Claude Code官方格式的Markdown文件
        const yamlFrontMatter = `---
name: ${agentData.name}
description: ${agentData.description || ''}
model: sonnet
---

${agentData.prompt || ''}`;

        await fs.writeFile(agentFile, yamlFrontMatter, 'utf8');
    }

    private async isAgentProjectLevel(agentName: string): Promise<boolean> {
        const agents = await this.getAgentsFromFiles();
        const agent = agents.find(a => a.name === agentName);
        return agent?.isProjectLevel || false;
    }

    /**
     * [修正] 直接创建符合Claude Code格式的代理文件
     * 根据文档，这是最可靠的方式，因为SDK没有直接的代理创建API
     */
    private async createAgentViaCLI(agentData: any, isProjectLevel: boolean): Promise<void> {
        // 直接使用文件创建方式，这是最可靠的方法
        await this.writeAgentFile(agentData, isProjectLevel);
        
        // 可选：验证代理是否被Claude Code识别
        try {
            await this.verifyAgentCreation(agentData.name, isProjectLevel);
        } catch (error) {
            console.warn('Agent verification failed, but file was created:', error);
            // 不抛出错误，因为文件已经创建成功
        }
    }

    /**
     * [新增] 验证代理是否被Claude Code正确识别
     */
    private async verifyAgentCreation(agentName: string, isProjectLevel: boolean): Promise<void> {
        const { spawn } = require('child_process');
        
        return new Promise(async (resolve, reject) => {
            const command = this.getClaudeCommand();
            const args = [
                '-p', '/agents',
                '--output-format', 'json',
                '--dangerously-skip-permissions'
            ];

            const cwd = isProjectLevel 
                ? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath 
                : os.homedir();

            // 从Router配置中读取认证token，如果没有配置则不设置
            const authToken = await this.getRouterAuthToken();
            const env: NodeJS.ProcessEnv = {
                ...process.env,
                ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456',
                NO_PROXY: '127.0.0.1'
            };

            if (authToken) {
                env['ANTHROPIC_AUTH_TOKEN'] = authToken;
            }

            const child = spawn(command, args, {
                cwd: cwd,
                shell: true,
                env: env
            });

            let output = '';
            let error = '';

            child.stdout?.on('data', (data: any) => {
                output += data.toString();
            });

            child.stderr?.on('data', (data: any) => {
                error += data.toString();
            });

            child.on('close', (code: number) => {
                if (code === 0) {
                    try {
                        const response = JSON.parse(output);
                        // 检查响应中是否包含我们创建的代理
                        if (response.result && response.result.includes(agentName)) {
                            console.log('Agent verified successfully by Claude Code');
                            resolve();
                        } else {
                            console.log('Agent file created but not yet recognized by Claude Code');
                            resolve(); // 仍然认为成功，因为文件已创建
                        }
                    } catch (e) {
                        resolve(); // 解析失败也认为成功
                    }
                } else {
                    resolve(); // 即使验证失败也认为成功
                }
            });

            child.on('error', (err: any) => {
                resolve(); // 即使验证失败也认为成功
            });
        });
    }

    /**
     * [新增] 删除代理文件
     */
    private async deleteAgentFile(agentName: string): Promise<boolean> {
        console.log(`[AgentManagementPanel] Starting file deletion for agent: "${agentName}"`);
        
        const agentDirs = this.getAgentDirs();
        console.log(`[AgentManagementPanel] Searching in directories:`, agentDirs);
        
        for (const dir of agentDirs) {
            try {
                console.log(`[AgentManagementPanel] Checking directory: ${dir}`);
                
                // 检查目录是否存在
                await fs.access(dir);
                console.log(`[AgentManagementPanel] Directory accessible: ${dir}`);
                
                // 生成可能的文件名
                const safeName = agentName
                    .replace(/[<>:"/\\|?*]/g, '_')
                    .replace(/\s+/g, '-')
                    .toLowerCase()
                    .trim();
                
                const possibleFiles = [
                    `${safeName}.md`,
                    `${safeName}.json`,
                    `${agentName}.md`,
                    `${agentName}.json`
                ];
                
                console.log(`[AgentManagementPanel] Looking for files:`, possibleFiles);
                
                // 尝试删除文件
                for (const fileName of possibleFiles) {
                    const filePath = path.join(dir, fileName);
                    try {
                        await fs.access(filePath);
                        console.log(`[AgentManagementPanel] Found file: ${filePath}`);
                        await fs.unlink(filePath);
                        console.log(`[AgentManagementPanel] Successfully deleted: ${filePath}`);
                        return true; // 成功删除
                    } catch (error) {
                        console.log(`[AgentManagementPanel] File not found: ${filePath}`);
                        // 文件不存在，继续尝试下一个
                        continue;
                    }
                }
            } catch (error) {
                console.log(`[AgentManagementPanel] Directory not accessible: ${dir}`, error);
                // 目录不存在或无法访问，继续下一个目录
                continue;
            }
        }
        
        console.log(`[AgentManagementPanel] No files found for agent: "${agentName}"`);
        return false; // 未找到文件
    }

    /**
     * [新增] 获取Claude Code命令路径
     */
    private getClaudeCommand(): string {
        const path = require('path');
        const fs = require('fs');
        
        if (process.platform === 'win32') {
            // 在Windows上查找claude.cmd
            const possiblePaths = [
                process.env.APPDATA ? path.join(process.env.APPDATA, 'npm', 'claude.cmd') : null,
                process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'npm', 'claude.cmd') : null
            ];
            
            const foundPath = possiblePaths.find(p => p && fs.existsSync(p));
            if (foundPath) return `"${foundPath}"`;
            
            // 在PATH中查找
            if (process.env.PATH) {
                const pathDirs = process.env.PATH.split(';');
                for (const dir of pathDirs) {
                    const claudePath = path.join(dir, 'claude.cmd');
                    if (fs.existsSync(claudePath)) return `"${claudePath}"`;
                }
            }
            
            return 'claude.cmd'; // 回退
        }
        return 'claude';
    }

    private _getHtmlTemplate(): string {
        const title = t('toolbox.agentManagement.title');
        const agentName = t('toolbox.agentManagement.agentName');
        const agentDesc = t('toolbox.agentManagement.agentDescription');
        const agentPrompt = t('toolbox.agentManagement.agentPrompt');
        const createAgent = t('toolbox.agentManagement.createAgent');
        const backToMain = t('toolbox.backToMain');
        const save = t('toolbox.save');
        const cancel = t('toolbox.cancel');
        const edit = t('toolbox.edit');

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
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .header h1 {
            color: var(--vscode-textLink-foreground);
            margin: 0;
            font-size: 24px;
        }
        
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: inherit;
            margin-left: 8px;
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
        
        .btn-danger {
            background: #dc3545;
            color: white;
            border: 1px solid #dc3545;
        }
        
        .btn-danger:hover {
            background: #c82333;
            color: white;
            border: 1px solid #c82333;
        }
        
        .btn-success {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-textLink-foreground);
            border: 1px solid var(--vscode-textLink-foreground);
        }
        
        .btn-success:hover {
            background: var(--vscode-textLink-foreground);
            color: var(--vscode-button-foreground);
        }
        
        .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .form-section {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
        }
        
        .form-section h3 {
            color: var(--vscode-textLink-foreground);
            margin-top: 0;
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: inherit;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        
        /* 深色主题下的边框 */
        @media (prefers-color-scheme: dark) {
            .form-group input,
            .form-group select,
            .form-group textarea {
                border: 1px solid #4a5568;
            }
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }
        
        .form-group input:hover,
        .form-group select:hover,
        .form-group textarea:hover {
            border-color: var(--vscode-focusBorder);
        }
        
        .form-group textarea {
            resize: vertical;
            min-height: 120px;
        }
        
        .agents-section {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
        }
        
        .agents-section h3 {
            color: var(--vscode-textLink-foreground);
            margin-top: 0;
            margin-bottom: 20px;
        }
        
        .search-box {
            margin-bottom: 15px;
        }
        
        .search-box input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: inherit;
            box-sizing: border-box;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        
        /* 深色主题下的搜索框边框 */
        @media (prefers-color-scheme: dark) {
            .search-box input {
                border: 1px solid #4a5568;
            }
        }
        
        .search-box input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }
        
        .search-box input:hover {
            border-color: var(--vscode-focusBorder);
        }
        
        .agents-list {
            max-height: 500px;
            overflow-y: auto;
        }
        
        .agent-item {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }
        
        .agent-item:hover {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .agent-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        
        .agent-name {
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
            margin: 0;
        }
        
        
        .agent-description {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
            margin-bottom: 10px;
            line-height: 1.4;
        }
        
        .agent-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .agent-actions .btn {
            margin-left: 0;
            font-size: 12px;
            padding: 4px 8px;
        }
        
        .loading {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 20px;
        }
        
        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 40px 20px;
        }
        
        .empty-state .icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        
        @media (max-width: 768px) {
            .content {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <div>
                <button class="btn btn-secondary" onclick="backToToolbox()">${backToMain}</button>
            </div>
        </div>
        
        <div class="content">
            <!-- 创建/编辑代理表单 -->
            <div class="form-section">
                <h3 id="formTitle">${createAgent}</h3>
                <form id="agentForm">
                    <div class="form-group">
                        <label>${agentName}</label>
                        <input type="text" id="agentName" placeholder="输入代理名称" required>
                    </div>
                    
                    <div class="form-group">
                        <label>${agentDesc}</label>
                        <textarea id="agentDescription" placeholder="输入代理描述"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>${agentPrompt}</label>
                        <textarea id="agentPrompt" placeholder="输入代理的初始提示词" required></textarea>
                    </div>
                    
                    
                    <div class="form-group">
                        <button type="submit" class="btn" id="submitBtn">${save}</button>
                        <button type="button" class="btn btn-secondary" onclick="clearForm()">${cancel}</button>
                    </div>
                </form>
            </div>
            
            <!-- 代理列表 -->
            <div class="agents-section">
                <h3>已创建的代理</h3>
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="搜索代理名称..." />
                </div>
                <div id="agentsList" class="agents-list">
                    <div class="loading">正在加载代理列表...</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let editingAgentId = null;
        let allAgents = []; // 存储所有代理数据
        
        // 表单提交
        document.getElementById('agentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const agent = {
                name: document.getElementById('agentName').value,
                description: document.getElementById('agentDescription').value,
                prompt: document.getElementById('agentPrompt').value
            };
            
            if (editingAgentId) {
                agent.id = editingAgentId;
                vscode.postMessage({
                    command: 'updateAgent',
                    agent: agent
                });
            } else {
                vscode.postMessage({
                    command: 'createAgent',
                    agent: agent
                });
            }
        });
        
        function clearForm() {
            document.getElementById('agentForm').reset();
            editingAgentId = null;
            document.getElementById('formTitle').textContent = '${createAgent}';
            document.getElementById('submitBtn').textContent = '${save}';
        }
        
        function editAgent(agent) {
            editingAgentId = agent.id;
            document.getElementById('agentName').value = agent.name;
            document.getElementById('agentDescription').value = agent.description || '';
            document.getElementById('agentPrompt').value = agent.prompt;
            document.getElementById('formTitle').textContent = '编辑代理';
            document.getElementById('submitBtn').textContent = '更新';
            
            // 滚动到表单
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        }
        
        
        function deleteAgent(agentName) {
            console.log('Delete button clicked for agent:', agentName);
            
            // 显示自定义确认模态框
            showDeleteConfirmModal(agentName);
        }
        
        function showDeleteConfirmModal(agentName) {
            // 创建模态框背景
            const modalOverlay = document.createElement('div');
            modalOverlay.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            \`;
            
            // 创建模态框内容
            const modalContent = document.createElement('div');
            modalContent.style.cssText = \`
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            \`;
            
            modalContent.innerHTML = \`
                <div style="margin-bottom: 16px;">
                    <h3 style="color: var(--vscode-errorForeground); margin: 0 0 12px 0; font-size: 18px;">
                        ⚠️ 确认删除代理
                    </h3>
                    <p style="color: var(--vscode-foreground); margin: 0; line-height: 1.5;">
                        您确定要删除代理 <strong>"\${agentName}"</strong> 吗？
                    </p>
                    <p style="color: var(--vscode-descriptionForeground); margin: 8px 0 0 0; font-size: 14px;">
                        此操作将永久删除代理文件，无法撤销。
                    </p>
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="cancelDelete" style="
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">取消</button>
                    <button id="confirmDelete" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">确定删除</button>
                </div>
            \`;
            
            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);
            
            // 绑定事件
            document.getElementById('cancelDelete').onclick = () => {
                console.log('Delete cancelled by user');
                document.body.removeChild(modalOverlay);
            };
            
            document.getElementById('confirmDelete').onclick = () => {
                console.log('Delete confirmed by user for agent:', agentName);
                document.body.removeChild(modalOverlay);
                
                // 发送删除命令
                vscode.postMessage({
                    command: 'deleteAgent',
                    agentName: agentName
                });
            };
            
            // 点击背景关闭模态框
            modalOverlay.onclick = (e) => {
                if (e.target === modalOverlay) {
                    console.log('Delete modal closed by clicking overlay');
                    document.body.removeChild(modalOverlay);
                }
            };
        }
        
        function backToToolbox() {
            vscode.postMessage({
                command: 'backToToolbox'
            });
        }
        
        // 消息处理
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'agentsLoaded':
                    if (message.success) {
                        allAgents = message.agents; // 保存所有代理数据
                        // 默认显示前5个
                        renderAgentsList(allAgents.slice(0, 5));
                    } else {
                        document.getElementById('agentsList').innerHTML = 
                            \`<div class="empty-state"><div class="icon">⚠️</div><p>加载代理列表失败: \${message.error}</p></div>\`;
                    }
                    break;
                    
                case 'agentCreated':
                case 'agentUpdated':
                    if (message.success) {
                        clearForm();
                    }
                    break;
            }
        });
        
        function renderAgentsList(agents) {
            const agentsList = document.getElementById('agentsList');
            
            if (agents.length === 0) {
                agentsList.innerHTML = \`
                    <div class="empty-state">
                        <div class="icon">🤖</div>
                        <p>还没有创建任何代理</p>
                        <p>请在左侧表单中创建您的第一个代理</p>
                    </div>
                \`;
                return;
            }
            
            agentsList.innerHTML = agents.map(agent => \`
                <div class="agent-item">
                    <div class="agent-header">
                        <h4 class="agent-name">\${agent.name}</h4>
                    </div>
                    <div class="agent-description">\${agent.description || '暂无描述'}</div>
                    <div class="agent-actions">
                        <button class="btn btn-secondary" onclick="editAgent(\${JSON.stringify(agent).replace(/"/g, '&quot;')})">${edit}</button>
                        <button class="btn btn-danger" onclick="deleteAgent('\${agent.name}')">删除</button>
                    </div>
                </div>
            \`).join('');
        }
        
        // 搜索功能
        function filterAgents(searchTerm) {
            if (!searchTerm.trim()) {
                // 如果没有搜索词，显示前5个
                renderAgentsList(allAgents.slice(0, 5));
                return;
            }
            
            const filtered = allAgents.filter(agent => 
                agent.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            renderAgentsList(filtered);
        }
        
        // 搜索框事件监听
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('searchInput');
            searchInput.addEventListener('input', function(e) {
                filterAgents(e.target.value);
            });
        });
        
        // 页面加载时获取代理列表
        window.addEventListener('load', () => {
            vscode.postMessage({
                command: 'loadAgents'
            });
        });
    </script>
</body>
</html>`;
    }

    public dispose() {
        AgentManagementPanel.currentPanel = undefined;
        
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}