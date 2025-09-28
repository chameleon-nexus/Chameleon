import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { t } from '../utils/i18n';
import { AgentRegistryService, AgentInfo, SearchFilters } from '../services/agentRegistryService';

export class AgentMarketplacePanel {
    public static currentPanel: AgentMarketplacePanel | undefined;
    public static readonly viewType = 'agentMarketplace';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private agentService: AgentRegistryService;

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (AgentMarketplacePanel.currentPanel) {
            AgentMarketplacePanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            AgentMarketplacePanel.viewType,
            t('agentMarketplace.title'),
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ]
            }
        );

        AgentMarketplacePanel.currentPanel = new AgentMarketplacePanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.agentService = new AgentRegistryService(vscode.extensions.getExtension('chameleon.chameleon')?.extensionContext!);

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message: any) => {
                switch (message.command) {
                    case 'searchAgents':
                        this.searchAgents(message.query, message.cliType, message.category);
                        return;
                    case 'downloadAgent':
                        this.downloadAgent(message.agent, message.targetType);
                        return;
                    case 'convertAgent':
                        this.convertAgent(message.agent, message.fromType, message.toType);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webviews', 'agentMarketplacePanel.js')
        );

        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );

        // Collect all translations needed for JavaScript
        const jsTranslations = {
            title: t('agentMarketplace.title'),
            subtitle: t('agentMarketplace.subtitle'),
            filters: {
                cliType: t('agentMarketplace.filtersCliType'),
                category: t('agentMarketplace.filtersCategory'),
                search: t('agentMarketplace.filtersSearch'),
                allCliTypes: t('agentMarketplace.filtersAllCliTypes'),
                allCategories: t('agentMarketplace.filtersAllCategories'),
                searchPlaceholder: t('agentMarketplace.filtersSearchPlaceholder')
            },
            categories: {
                architecture: t('agentMarketplace.categoriesArchitecture'),
                programming: t('agentMarketplace.categoriesProgramming'),
                infrastructure: t('agentMarketplace.categoriesInfrastructure'),
                quality: t('agentMarketplace.categoriesQuality'),
                data: t('agentMarketplace.categoriesData'),
                documentation: t('agentMarketplace.categoriesDocumentation'),
                business: t('agentMarketplace.categoriesBusiness')
            },
            actions: {
                downloadToClaudeCode: t('agentMarketplace.actionsDownloadToClaudeCode'),
                downloadToCodex: t('agentMarketplace.actionsDownloadToCodex'),
                convertToCodex: t('agentMarketplace.actionsConvertToCodex')
            },
            messages: {
                loading: t('agentMarketplace.messagesLoading'),
                noResults: t('agentMarketplace.messagesNoResults')
            },
            compatibility: {
                claudeCode: t('agentMarketplace.compatibilityClaudeCode'),
                codex: t('agentMarketplace.compatibilityCodex')
            }
        };
        const jsTranslationsJSON = JSON.stringify(jsTranslations);

        // Use a nonce to only allow a specific script to be run.
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <!--
                    Use a content security policy to only allow loading images from https or from our extension directory,
                    and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <title>Agent Marketplace</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-weight: var(--vscode-font-weight);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                    }
                    
                    .header {
                        margin-bottom: 30px;
                    }
                    
                    .header h1 {
                        margin: 0 0 10px 0;
                        color: var(--vscode-foreground);
                    }
                    
                    .header p {
                        margin: 0;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .filters {
                        display: flex;
                        gap: 15px;
                        margin-bottom: 30px;
                        flex-wrap: wrap;
                    }
                    
                    .filter-group {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                    }
                    
                    .filter-group label {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        font-weight: 600;
                    }
                    
                    .filter-select {
                        padding: 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border-radius: 4px;
                        font-size: 14px;
                        min-width: 150px;
                    }
                    
                    .search-input {
                        padding: 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border-radius: 4px;
                        font-size: 14px;
                        min-width: 200px;
                    }
                    
                    .agent-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                        gap: 20px;
                        margin-top: 20px;
                    }
                    
                    .agent-card {
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        transition: border-color 0.2s;
                    }
                    
                    .agent-card:hover {
                        border-color: var(--vscode-focusBorder);
                    }
                    
                    .agent-header {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 15px;
                    }
                    
                    .agent-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        background-color: var(--vscode-button-background);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                    }
                    
                    .agent-title {
                        font-size: 16px;
                        font-weight: 600;
                        margin: 0;
                        color: var(--vscode-foreground);
                    }
                    
                    .agent-description {
                        color: var(--vscode-descriptionForeground);
                        margin: 0 0 15px 0;
                        line-height: 1.5;
                    }
                    
                    .agent-tags {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                        margin-bottom: 15px;
                    }
                    
                    .agent-tag {
                        background-color: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                    }
                    
                    .compatibility {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 15px;
                    }
                    
                    .compatibility-badge {
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    
                    .compatibility-claude {
                        background-color: var(--vscode-charts-orange);
                        color: white;
                    }
                    
                    .compatibility-codex {
                        background-color: var(--vscode-charts-blue);
                        color: white;
                    }
                    
                    .agent-actions {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    
                    .action-button {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 4px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                        flex: 1;
                        min-width: 120px;
                    }
                    
                    .action-button-primary {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    
                    .action-button-primary:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    
                    .action-button-secondary {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    
                    .action-button-secondary:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }
                    
                    .loading {
                        text-align: center;
                        padding: 40px;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .no-results {
                        text-align: center;
                        padding: 40px;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 id="pageTitle"></h1>
                    <p id="pageSubtitle"></p>
                </div>
                
                <div class="filters">
                    <div class="filter-group">
                        <label id="cliTypeLabel"></label>
                        <select class="filter-select" id="cliTypeFilter">
                            <option value="" id="allCliTypesOption"></option>
                            <option value="claude-code" id="claudeCodeOption"></option>
                            <option value="codex" id="codexOption"></option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label id="categoryLabel"></label>
                        <select class="filter-select" id="categoryFilter">
                            <option value="" id="allCategoriesOption"></option>
                            <option value="architecture" id="architectureOption"></option>
                            <option value="programming" id="programmingOption"></option>
                            <option value="infrastructure" id="infrastructureOption"></option>
                            <option value="quality" id="qualityOption"></option>
                            <option value="data" id="dataOption"></option>
                            <option value="documentation" id="documentationOption"></option>
                            <option value="business" id="businessOption"></option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label id="searchLabel"></label>
                        <input type="text" class="search-input" id="searchInput" placeholder="">
                    </div>
                </div>
                
                <div id="agentGrid" class="agent-grid">
                    <div class="loading" id="loadingText"></div>
                </div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    
                    // Get translations from TypeScript
                    const translations = ${jsTranslationsJSON};
                    
                    // Initialize UI with translations when DOM is ready
                    function initializeTranslations() {
                        console.log('Setting translations...');
                        console.log('CLI Type translation:', translations.filters.cliType);
                        console.log('Claude Code translation:', translations.compatibility.claudeCode);
                        
                        const pageTitle = document.getElementById('pageTitle');
                        if (pageTitle) pageTitle.textContent = translations.title;
                        
                        const pageSubtitle = document.getElementById('pageSubtitle');
                        if (pageSubtitle) pageSubtitle.textContent = translations.subtitle;
                        
                        const cliTypeLabel = document.getElementById('cliTypeLabel');
                        if (cliTypeLabel) cliTypeLabel.textContent = translations.filters.cliType;
                        
                        const categoryLabel = document.getElementById('categoryLabel');
                        if (categoryLabel) categoryLabel.textContent = translations.filters.category;
                        
                        const searchLabel = document.getElementById('searchLabel');
                        if (searchLabel) searchLabel.textContent = translations.filters.search;
                        
                        const allCliTypesOption = document.getElementById('allCliTypesOption');
                        if (allCliTypesOption) allCliTypesOption.textContent = translations.filters.allCliTypes;
                        
                        const claudeCodeOption = document.getElementById('claudeCodeOption');
                        if (claudeCodeOption) claudeCodeOption.textContent = translations.compatibility.claudeCode;
                        
                        const codexOption = document.getElementById('codexOption');
                        if (codexOption) codexOption.textContent = translations.compatibility.codex;
                        
                        const allCategoriesOption = document.getElementById('allCategoriesOption');
                        if (allCategoriesOption) allCategoriesOption.textContent = translations.filters.allCategories;
                        
                        const architectureOption = document.getElementById('architectureOption');
                        if (architectureOption) architectureOption.textContent = translations.categories.architecture;
                        
                        const programmingOption = document.getElementById('programmingOption');
                        if (programmingOption) programmingOption.textContent = translations.categories.programming;
                        
                        const infrastructureOption = document.getElementById('infrastructureOption');
                        if (infrastructureOption) infrastructureOption.textContent = translations.categories.infrastructure;
                        
                        const qualityOption = document.getElementById('qualityOption');
                        if (qualityOption) qualityOption.textContent = translations.categories.quality;
                        
                        const dataOption = document.getElementById('dataOption');
                        if (dataOption) dataOption.textContent = translations.categories.data;
                        
                        const documentationOption = document.getElementById('documentationOption');
                        if (documentationOption) documentationOption.textContent = translations.categories.documentation;
                        
                        const businessOption = document.getElementById('businessOption');
                        if (businessOption) businessOption.textContent = translations.categories.business;
                        
                        const searchInput = document.getElementById('searchInput');
                        if (searchInput) searchInput.placeholder = translations.filters.searchPlaceholder;
                        
                        const loadingText = document.getElementById('loadingText');
                        if (loadingText) loadingText.textContent = translations.messages.loading;
                        
                        console.log('Translations set successfully');
                    }
                    
                    // Sample agent data
                    const agents = [
                        {
                            id: 'code-reviewer',
                            name: 'Code Reviewer',
                            description: 'Elite code review expert specializing in security vulnerabilities and performance optimization',
                            icon: '🔍',
                            category: 'quality',
                            tags: ['security', 'quality', 'review'],
                            compatibility: {
                                'claude-code': true,
                                'codex': true
                            },
                            model: 'opus',
                            tools: ['Read', 'Grep', 'Bash', 'Edit']
                        },
                        {
                            id: 'backend-architect',
                            name: 'Backend Architect',
                            description: 'RESTful API design, microservice boundaries, and database schemas expert',
                            icon: '🏗️',
                            category: 'architecture',
                            tags: ['api', 'microservices', 'database'],
                            compatibility: {
                                'claude-code': true,
                                'codex': true
                            },
                            model: 'opus',
                            tools: ['Read', 'Write', 'Bash']
                        },
                        {
                            id: 'security-auditor',
                            name: 'Security Auditor',
                            description: 'Vulnerability assessment and OWASP compliance specialist',
                            icon: '🛡️',
                            category: 'quality',
                            tags: ['security', 'audit', 'owasp'],
                            compatibility: {
                                'claude-code': true,
                                'codex': false
                            },
                            model: 'opus',
                            tools: ['Read', 'Grep', 'Bash']
                        },
                        {
                            id: 'python-pro',
                            name: 'Python Pro',
                            description: 'Advanced Python development with optimization and best practices',
                            icon: '🐍',
                            category: 'programming',
                            tags: ['python', 'optimization', 'best-practices'],
                            compatibility: {
                                'claude-code': true,
                                'codex': true
                            },
                            model: 'sonnet',
                            tools: ['Read', 'Write', 'Bash']
                        },
                        {
                            id: 'devops-troubleshooter',
                            name: 'DevOps Troubleshooter',
                            description: 'Production debugging, log analysis, and deployment troubleshooting',
                            icon: '🔧',
                            category: 'infrastructure',
                            tags: ['devops', 'debugging', 'production'],
                            compatibility: {
                                'claude-code': true,
                                'codex': true
                            },
                            model: 'sonnet',
                            tools: ['Read', 'Bash', 'Grep']
                        },
                        {
                            id: 'data-scientist',
                            name: 'Data Scientist',
                            description: 'Data analysis, SQL queries, and BigQuery operations expert',
                            icon: '📊',
                            category: 'data',
                            tags: ['data', 'sql', 'analysis'],
                            compatibility: {
                                'claude-code': true,
                                'codex': true
                            },
                            model: 'opus',
                            tools: ['Read', 'Bash']
                        }
                    ];
                    
                    let filteredAgents = [...agents];
                    
                    function renderAgents() {
                        const grid = document.getElementById('agentGrid');
                        
                        if (filteredAgents.length === 0) {
                            grid.innerHTML = '<div class="no-results">' + translations.messages.noResults + '</div>';
                            return;
                        }
                        
                        grid.innerHTML = filteredAgents.map(agent => \`
                            <div class="agent-card">
                                <div class="agent-header">
                                    <div class="agent-icon">\${agent.icon}</div>
                                    <h3 class="agent-title">\${agent.name}</h3>
                                </div>
                                
                                <p class="agent-description">\${agent.description}</p>
                                
                                <div class="agent-tags">
                                    \${agent.tags.map(tag => \`<span class="agent-tag">\${tag}</span>\`).join('')}
                                </div>
                                
                                <div class="compatibility">
                                    \${agent.compatibility['claude-code'] ? '<span class="compatibility-badge compatibility-claude">' + translations.compatibility.claudeCode + '</span>' : ''}
                                    \${agent.compatibility['codex'] ? '<span class="compatibility-badge compatibility-codex">' + translations.compatibility.codex + '</span>' : ''}
                                </div>
                                
                                <div class="agent-actions">
                                    \${agent.compatibility['claude-code'] ? '<button class="action-button action-button-primary" onclick="downloadAgent(\\'' + agent.id + '\\', \\'claude-code\\')">' + translations.actions.downloadToClaudeCode + '</button>' : ''}
                                    \${agent.compatibility['codex'] ? '<button class="action-button action-button-primary" onclick="downloadAgent(\\'' + agent.id + '\\', \\'codex\\')">' + translations.actions.downloadToCodex + '</button>' : ''}
                                    \${agent.compatibility['claude-code'] && agent.compatibility['codex'] ? '<button class="action-button action-button-secondary" onclick="convertAgent(\\'' + agent.id + '\\', \\'claude-code\\', \\'codex\\')">' + translations.actions.convertToCodex + '</button>' : ''}
                                </div>
                            </div>
                        \`).join('');
                    }
                    
                    function filterAgents() {
                        const cliType = document.getElementById('cliTypeFilter').value;
                        const category = document.getElementById('categoryFilter').value;
                        const search = document.getElementById('searchInput').value.toLowerCase();
                        
                        filteredAgents = agents.filter(agent => {
                            const matchesCliType = !cliType || agent.compatibility[cliType];
                            const matchesCategory = !category || agent.category === category;
                            const matchesSearch = !search || 
                                agent.name.toLowerCase().includes(search) ||
                                agent.description.toLowerCase().includes(search) ||
                                agent.tags.some(tag => tag.toLowerCase().includes(search));
                            
                            return matchesCliType && matchesCategory && matchesSearch;
                        });
                        
                        renderAgents();
                    }
                    
                    function downloadAgent(agentId, targetType) {
                        const agent = agents.find(a => a.id === agentId);
                        vscode.postMessage({
                            command: 'downloadAgent',
                            agent: agent,
                            targetType: targetType
                        });
                    }
                    
                    function convertAgent(agentId, fromType, toType) {
                        const agent = agents.find(a => a.id === agentId);
                        vscode.postMessage({
                            command: 'convertAgent',
                            agent: agent,
                            fromType: fromType,
                            toType: toType
                        });
                    }
                    
                    // Initialize everything when DOM is ready
                    function initializeApp() {
                        console.log('Initializing Agent Marketplace...');
                        console.log('Translations:', translations);
                        
                        // Initialize translations
                        initializeTranslations();
                        
                        // Render agents
                        renderAgents();
                        
                        // Add event listeners
                        document.getElementById('cliTypeFilter').addEventListener('change', filterAgents);
                        document.getElementById('categoryFilter').addEventListener('change', filterAgents);
                        document.getElementById('searchInput').addEventListener('input', filterAgents);
                        
                        console.log('Agent Marketplace initialized successfully');
                    }
                    
                    // Check if DOM is ready
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', initializeApp);
                    } else {
                        initializeApp();
                    }
                </script>
            </body>
            </html>`;
    }

    private async searchAgents(query: string, cliType: string, category: string) {
        // This would typically search a database or API
        // For now, we'll just return the filtered results from the frontend
        console.log('Searching agents:', { query, cliType, category });
    }

    private async downloadAgent(agent: any, targetType: string) {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage(t('agentMarketplace.messagesWorkspaceRequired'));
                return;
            }

            if (targetType === 'claude-code') {
                await this.downloadToClaudeCode(agent, workspaceFolder.uri);
            } else if (targetType === 'codex') {
                await this.downloadToCodex(agent, workspaceFolder.uri);
            }

            vscode.window.showInformationMessage(t('agentMarketplace.messagesDownloadSuccess', { name: agent.name }));
        } catch (error) {
            vscode.window.showErrorMessage(t('agentMarketplace.messagesDownloadFailed', { error: error }));
        }
    }

    private async convertAgent(agent: any, fromType: string, toType: string) {
        if (fromType === 'claude-code' && toType === 'codex') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage(t('agentMarketplace.messagesWorkspaceRequired'));
                    return;
                }

                await this.convertClaudeToCodex(agent, workspaceFolder.uri);
                vscode.window.showInformationMessage(t('agentMarketplace.messagesConvertSuccess', { name: agent.name }));
            } catch (error) {
                vscode.window.showErrorMessage(t('agentMarketplace.messagesConvertFailed', { error: error }));
            }
        }
    }

    private async downloadToClaudeCode(agent: any, workspaceUri: vscode.Uri) {
        const claudeDir = vscode.Uri.joinPath(workspaceUri, '.claude', 'agents');
        
        // Ensure directory exists
        try {
            await vscode.workspace.fs.createDirectory(claudeDir);
        } catch (error) {
            // Directory might already exist
        }

        // Create agent file
        const agentContent = `---
name: ${agent.id}
description: ${agent.description}
model: ${agent.model}
tools: ${agent.tools.join(', ')}
---

You are ${agent.name}, ${agent.description}.

## Key Capabilities
- ${agent.tags.map((tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1)).join('\n- ')}

## Usage
This agent specializes in ${agent.category} tasks and follows industry best practices for ${agent.tags.join(', ')}.

When invoked, focus on:
1. ${agent.description}
2. Following modern development practices
3. Ensuring code quality and security
4. Providing actionable recommendations

Always maintain high standards and provide detailed, professional guidance.
`;

        const agentFile = vscode.Uri.joinPath(claudeDir, `${agent.id}.md`);
        await vscode.workspace.fs.writeFile(agentFile, Buffer.from(agentContent, 'utf8'));
    }

    private async downloadToCodex(agent: any, workspaceUri: vscode.Uri) {
        const agentsMdFile = vscode.Uri.joinPath(workspaceUri, 'AGENTS.md');
        
        // Read existing AGENTS.md or create new content
        let existingContent = '';
        try {
            const fileContent = await vscode.workspace.fs.readFile(agentsMdFile);
            existingContent = Buffer.from(fileContent).toString('utf8');
        } catch (error) {
            // File doesn't exist, start with header
            existingContent = '# AGENTS.md\n\nThis file contains guidelines for AI coding agents working on this project.\n\n';
        }

        // Add new agent section
        const newSection = `
## ${agent.name} - ${agent.description}

${agent.description}

### Key Capabilities
- ${agent.tags.map((tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1)).join('\n- ')}

### Usage Guidelines
When working on ${agent.category} tasks:
1. ${agent.description}
2. Follow modern development practices
3. Ensure code quality and security
4. Provide actionable recommendations

### Best Practices
- Focus on ${agent.tags.join(', ')}
- Maintain high standards
- Provide detailed, professional guidance
`;

        const updatedContent = existingContent + newSection;
        await vscode.workspace.fs.writeFile(agentsMdFile, Buffer.from(updatedContent, 'utf8'));
    }

    private async convertClaudeToCodex(agent: any, workspaceUri: vscode.Uri) {
        // First download to Codex format
        await this.downloadToCodex(agent, workspaceUri);
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose() {
        AgentMarketplacePanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
