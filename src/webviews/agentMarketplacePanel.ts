import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { t, getCurrentLanguage } from '../utils/i18n';
import { AgentRegistryService, AgentInfo, SearchFilters } from '../services/agentRegistryService';
import { AgentInstallerService, InstalledAgent } from '../services/agentInstallerService';

export class AgentMarketplacePanel {
    public static currentPanel: AgentMarketplacePanel | undefined;
    public static readonly viewType = 'agentMarketplace';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private agentService: AgentRegistryService;
    private installerService: AgentInstallerService;

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
        // Create a minimal context object for the service
        const mockContext = {
            subscriptions: [],
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
            }
        } as any;
        this.agentService = new AgentRegistryService(mockContext);
        this.installerService = new AgentInstallerService();

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
                    case 'installAgent':
                        this.installAgent(message.agent, message.targetType);
                        return;
                    case 'uninstallAgent':
                        this.uninstallAgent(message.agent, message.targetType);
                        return;
                    case 'checkInstallStatus':
                        this.checkInstallStatus(message.agents);
                        return;
                    case 'openInstallDirectory':
                        this.openInstallDirectory();
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
        this._panel.webview.html = await this._getHtmlForWebview(webview);
    }

    private async _getHtmlForWebview(webview: vscode.Webview) {
        // Fetch real data from GitHub registry
        let agents: any[] = [];
        let categories: any = {};
        
        try {
            const featuredAgents = await this.agentService.getFeaturedAgents();
            const registryCategories = await this.agentService.getCategories();
            
            agents = featuredAgents;
            categories = registryCategories;
        } catch (error) {
            console.error('Failed to fetch agents from registry:', error);
            // Fallback to empty data
            agents = [];
            categories = {};
        }

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
                    
                    .agent-meta {
                        display: flex;
                        gap: 15px;
                        margin: 10px 0;
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .agent-meta span {
                        display: flex;
                        align-items: center;
                        gap: 4px;
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
                    
                    .action-button-danger {
                        background-color: #d73a49;
                        color: white;
                    }
                    
                    .action-button-danger:hover {
                        background-color: #b52636;
                    }
                    
                    .install-buttons-wrapper {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
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
                    
                    // Real agent data from GitHub registry
                    let agents = ${JSON.stringify(agents)};
                    const registryCategories = ${JSON.stringify(categories)};
                    
                    // Legacy sample data (kept for fallback)
                    const sampleAgents = [
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
                    
                    // Helper functions to handle different data formats with i18n support
                    // Use the language setting passed from the backend
                    const currentLanguage = '${getCurrentLanguage()}';
                    
                    function getLocalizedText(textObj, fallback = '') {
                        if (typeof textObj === 'string') {
                            return textObj;
                        }
                        
                        if (!textObj || typeof textObj !== 'object') {
                            return fallback;
                        }
                        
                        // Priority: current language -> English -> Chinese -> Japanese -> any available -> fallback
                        return textObj[currentLanguage] || 
                               textObj.en || 
                               textObj.zh || 
                               textObj.ja || 
                               Object.values(textObj)[0] || 
                               fallback;
                    }
                    
                    function getAgentName(agent) {
                        return getLocalizedText(agent.name, agent.id);
                    }
                    
                    function getAgentDescription(agent) {
                        // Debug logging
                        console.log('Agent description data:', agent.description);
                        console.log('Current language:', currentLanguage);
                        
                        if (typeof agent.description === 'string') {
                            return agent.description;
                        }
                        
                        if (!agent.description || typeof agent.description !== 'object') {
                            return 'No description available';
                        }
                        
                        // Use getLocalizedText to get the best available description
                        return getLocalizedText(agent.description, 'No description available');
                    }
                    
                    function getAgentIcon(category) {
                        const icons = {
                            'development': '💻',
                            'debugging': '🐛',
                            'data': '📊',
                            'documentation': '📝',
                            'quality': '🔍',
                            'architecture': '🏗️',
                            'infrastructure': '⚙️',
                            'business': '💼'
                        };
                        return icons[category] || '🤖';
                    }
                    
                    function renderAgents() {
                        const grid = document.getElementById('agentGrid');
                        
                        console.log('Rendering agents:', {
                            totalAgents: agents.length,
                            filteredAgents: filteredAgents.length,
                            sampleAgent: agents[0]
                        });
                        
                        if (filteredAgents.length === 0) {
                            console.log('No filtered agents to display');
                            console.log('Total agents available:', agents.length);
                            if (agents.length > 0) {
                                console.log('Sample agent structure:', agents[0]);
                            }
                            grid.innerHTML = '<div class="no-results">' + translations.messages.noResults + '</div>';
                            return;
                        }
                        
                        grid.innerHTML = filteredAgents.map(agent => \`
                            <div class="agent-card">
                                <div class="agent-header">
                                    <div class="agent-icon">\${getAgentIcon(agent.category)}</div>
                                    <h3 class="agent-title">\${getAgentName(agent)}</h3>
                                </div>
                                
                                <p class="agent-description">\${getAgentDescription(agent)}</p>
                                
                                <div class="agent-meta">
                                    <span>👤 \${agent.author}</span>
                                    <span>📥 \${agent.downloads || 0}</span>
                                    \${window.showRating !== false ? \`<span>⭐ \${(agent.rating || 0).toFixed(1)}</span>\` : ''}
                                </div>
                                
                                <div class="agent-tags">
                                    \${(agent.tags || []).map(tag => \`<span class="agent-tag">\${tag}</span>\`).join('')}
                                </div>
                                
                                <div class="compatibility">
                                    \${(agent.compatibility?.claudeCode || agent.compatibility?.['claude-code']) ? '<span class="compatibility-badge compatibility-claude">' + translations.compatibility.claudeCode + '</span>' : ''}
                                    \${(agent.compatibility?.codex) ? '<span class="compatibility-badge compatibility-codex">' + translations.compatibility.codex + '</span>' : ''}
                                </div>
                                
                                <div class="agent-actions">
                                    <div class="install-buttons-wrapper" id="install-buttons-\${agent.id}">
                                        \${(agent.compatibility?.claudeCode || agent.compatibility?.['claude-code']) ? 
                                            '<button class="action-button action-button-primary install-btn-claude" data-agent-id="' + agent.id + '" data-target="claude-code">' + translations.actions.downloadToClaudeCode + '</button>' + 
                                            '<button class="action-button action-button-danger uninstall-btn-claude" data-agent-id="' + agent.id + '" data-target="claude-code" style="display: none;">卸载 Claude Code</button>'
                                            : ''}
                                        \${(agent.compatibility?.codex) ? 
                                            '<button class="action-button action-button-primary install-btn-codex" data-agent-id="' + agent.id + '" data-target="codex">' + translations.actions.downloadToCodex + '</button>' + 
                                            '<button class="action-button action-button-danger uninstall-btn-codex" data-agent-id="' + agent.id + '" data-target="codex" style="display: none;">卸载 Codex</button>'
                                            : ''}
                                        \${((agent.compatibility?.claudeCode || agent.compatibility?.['claude-code']) && agent.compatibility?.codex) ? '<button class="action-button action-button-secondary convert-btn" data-agent-id="' + agent.id + '" data-from="claude-code" data-to="codex">' + translations.actions.convertToCodex + '</button>' : ''}
                                    </div>
                                </div>
                            </div>
                        \`).join('');
                    }
                    
                    
                    function handleFilterChange() {
                        console.log('handleFilterChange called');
                        
                        const cliType = document.getElementById('cliTypeFilter').value;
                        const category = document.getElementById('categoryFilter').value;
                        const search = document.getElementById('searchInput').value;
                        
                        console.log('Filter values:', { cliType, category, search });
                        
                        // 发送搜索请求到VS Code扩展
                        const message = {
                            command: 'searchAgents',
                            query: search,
                            cliType: cliType,
                            category: category
                        };
                        
                        console.log('Sending message to VS Code:', message);
                        vscode.postMessage(message);
                    }
                    
                    function installAgent(agentId, targetType) {
                        const agent = agents.find(a => a.id === agentId);
                        vscode.postMessage({
                            command: 'installAgent',
                            agent: agent,
                            targetType: targetType
                        });
                    }
                    
                    function uninstallAgent(agentId, targetType) {
                        const agent = agents.find(a => a.id === agentId);
                        vscode.postMessage({
                            command: 'uninstallAgent',
                            agent: agent,
                            targetType: targetType
                        });
                    }
                    
                    function updateInstallButtons() {
                        if (!window.installStatus) {
                            return;
                        }
                        
                        for (const agentId in window.installStatus) {
                            const status = window.installStatus[agentId];
                            
                            // Update Claude Code buttons
                            const installBtnClaude = document.querySelector(\`.install-btn-claude[data-agent-id="\${agentId}"]\`);
                            const uninstallBtnClaude = document.querySelector(\`.uninstall-btn-claude[data-agent-id="\${agentId}"]\`);
                            
                            if (installBtnClaude && uninstallBtnClaude) {
                                if (status['claude-code']) {
                                    installBtnClaude.style.display = 'none';
                                    uninstallBtnClaude.style.display = 'inline-block';
                                } else {
                                    installBtnClaude.style.display = 'inline-block';
                                    uninstallBtnClaude.style.display = 'none';
                                }
                            }
                            
                            // Update Codex buttons
                            const installBtnCodex = document.querySelector(\`.install-btn-codex[data-agent-id="\${agentId}"]\`);
                            const uninstallBtnCodex = document.querySelector(\`.uninstall-btn-codex[data-agent-id="\${agentId}"]\`);
                            
                            if (installBtnCodex && uninstallBtnCodex) {
                                if (status['codex']) {
                                    installBtnCodex.style.display = 'none';
                                    uninstallBtnCodex.style.display = 'inline-block';
                                } else {
                                    installBtnCodex.style.display = 'inline-block';
                                    uninstallBtnCodex.style.display = 'none';
                                }
                            }
                        }
                    }
                    
                    function addAgentButtonListeners() {
                        // Remove existing listeners to avoid duplicates
                        document.removeEventListener('click', handleAgentButtonClick);
                        
                        // Add event delegation for all agent buttons
                        document.addEventListener('click', handleAgentButtonClick);
                    }
                    
                    function handleAgentButtonClick(event) {
                        const target = event.target;
                        
                        if (target.classList.contains('install-btn-claude') || target.classList.contains('install-btn-codex')) {
                            const agentId = target.getAttribute('data-agent-id');
                            const targetType = target.getAttribute('data-target');
                            installAgent(agentId, targetType);
                        } else if (target.classList.contains('uninstall-btn-claude') || target.classList.contains('uninstall-btn-codex')) {
                            const agentId = target.getAttribute('data-agent-id');
                            const targetType = target.getAttribute('data-target');
                            uninstallAgent(agentId, targetType);
                        } else if (target.classList.contains('convert-btn')) {
                            const agentId = target.getAttribute('data-agent-id');
                            const fromType = target.getAttribute('data-from');
                            const toType = target.getAttribute('data-to');
                            convertAgent(agentId, fromType, toType);
                        }
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
                        console.log('Registry categories:', registryCategories);
                        console.log('Agents data:', agents);
                        
                        // Initialize translations
                        initializeTranslations();
                        
                        // Populate category filter with real data from registry
                        populateCategoryFilter();
                        
                        // Initialize showRating flag - show rating for featured agents by default
                        window.showRating = true;
                        
                        // Render initial agents (from server data)
                        console.log('Rendering initial agents...');
                        renderAgents();
                        
                        // Check install status for all agents
                        if (agents.length > 0) {
                            vscode.postMessage({
                                command: 'checkInstallStatus',
                                agents: agents
                            });
                        }
                        
                        // Add event listeners
                        document.getElementById('cliTypeFilter').addEventListener('change', handleFilterChange);
                        document.getElementById('categoryFilter').addEventListener('change', handleFilterChange);
                        document.getElementById('searchInput').addEventListener('input', handleFilterChange);
                        
                        // Add agent button event listeners
                        addAgentButtonListeners();
                        
                        // Listen for messages from VS Code
                        window.addEventListener('message', event => {
                            const message = event.data;
                            console.log('Received message from VS Code:', message);
                            
                            switch (message.command) {
                                case 'searchResults':
                                    console.log('Updating agents with search results:', message.agents.length, 'agents');
                                    agents = message.agents;
                                    filteredAgents = agents;
                                    window.showRating = message.showRating;
                                    console.log('showRating set to:', window.showRating);
                                    renderAgents();
                                    // Re-add button listeners after rendering
                                    addAgentButtonListeners();
                                    // Check install status for new agents
                                    if (agents.length > 0) {
                                        vscode.postMessage({
                                            command: 'checkInstallStatus',
                                            agents: agents
                                        });
                                    }
                                    break;
                                case 'searchError':
                                    console.error('Search error:', message.error);
                                    document.getElementById('agentGrid').innerHTML = \`<div class="no-results">搜索失败: \${message.error}</div>\`;
                                    break;
                                case 'installStatus':
                                    console.log('Received install status:', message.status);
                                    window.installStatus = message.status;
                                    updateInstallButtons();
                                    break;
                            }
                        });
                        
                        // Trigger initial search after everything is set up
                        console.log('Triggering initial search...');
                        setTimeout(() => {
                            handleFilterChange();
                        }, 100);
                        
                        console.log('Agent Marketplace initialized successfully');
                    }
                    
                    function populateCategoryFilter() {
                        const categoryFilter = document.getElementById('categoryFilter');
                        if (!categoryFilter) return;
                        
                        // Clear existing options except the first "All Categories" option
                        while (categoryFilter.children.length > 1) {
                            categoryFilter.removeChild(categoryFilter.lastChild);
                        }
                        
                        // Add categories from registry data with i18n support
                        if (registryCategories && typeof registryCategories === 'object') {
                            Object.keys(registryCategories).forEach(categoryKey => {
                                const category = registryCategories[categoryKey];
                                const option = document.createElement('option');
                                option.value = categoryKey;
                                
                                // Debug category data
                                console.log('Category data for', categoryKey, ':', category);
                                
                                // Use localized category name
                                const categoryName = getLocalizedText(category.name || category, categoryKey);
                                console.log('Resolved category name:', categoryName);
                                
                                option.textContent = \`📁 \${categoryName}\`;
                                
                                categoryFilter.appendChild(option);
                            });
                        }
                        
                        // Also add categories found in agents data as fallback
                        const agentCategories = new Set();
                        agents.forEach(agent => {
                            if (agent.category) {
                                agentCategories.add(agent.category);
                            }
                        });
                        
                        agentCategories.forEach(category => {
                            // Check if this category is not already added from registry
                            const existingOption = Array.from(categoryFilter.options).find(opt => opt.value === category);
                            if (!existingOption) {
                                const option = document.createElement('option');
                                option.value = category;
                                option.textContent = \`📁 \${category.charAt(0).toUpperCase() + category.slice(1)}\`;
                                categoryFilter.appendChild(option);
                            }
                        });
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
        console.log('VS Code searchAgents called with:', { query, cliType, category });
        
        try {
            const filters: SearchFilters = {};
            if (category && category !== 'all') {
                filters.category = category;
            }
            
            console.log('Using filters:', filters);
            let results = await this.agentService.searchAgents(query, filters);
            console.log('Initial search results count:', results.length);
            
            // CLI类型过滤
            if (cliType && cliType !== 'all') {
                console.log('Applying CLI type filter:', cliType);
                const beforeFilterCount = results.length;
                results = results.filter(agent => {
                    if (cliType === 'claude-code') {
                        // 处理两种格式：新格式 {claudeCode: {...}} 和 GitHub格式 {"claude-code": true}
                        return agent.compatibility?.claudeCode || agent.compatibility?.['claude-code'];
                    } else if (cliType === 'codex') {
                        return agent.compatibility?.codex;
                    } else if (cliType === 'copilot') {
                        return agent.compatibility?.copilot;
                    }
                    return false;
                });
                console.log(`CLI filter applied: ${beforeFilterCount} -> ${results.length}`);
            }
            
            const showRating = !category || category === 'all'; // 只有在查看热门时显示评分
            console.log('Final results:', { count: results.length, showRating });
            
            // 发送搜索结果回webview
            this._panel.webview.postMessage({
                command: 'searchResults',
                agents: results,
                showRating: showRating
            });
            
        } catch (error) {
            console.error('Search failed:', error);
            this._panel.webview.postMessage({
                command: 'searchError',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    private async installAgent(agent: any, targetType: string = 'claude-code') {
        try {
            await this.installerService.installAgent(agent.id, {
                target: targetType,
                version: agent.version,
                force: false
            });
            
            // Refresh install status in UI
            this.checkInstallStatus([agent]);
        } catch (error) {
            console.error('Install agent failed:', error);
        }
    }

    private async uninstallAgent(agent: any, targetType: string = 'claude-code') {
        try {
            await this.installerService.uninstallAgent(agent.id, targetType);
            
            // Refresh install status in UI
            this.checkInstallStatus([agent]);
        } catch (error) {
            console.error('Uninstall agent failed:', error);
        }
    }

    private async checkInstallStatus(agents: any[]) {
        try {
            const installedAgents = await this.installerService.getInstalledAgents();
            
            // Create a map of installed status for each agent
            const installStatus: { [key: string]: { [target: string]: boolean } } = {};
            
            for (const agent of agents) {
                installStatus[agent.id] = {
                    'claude-code': installedAgents.some(ia => ia.id === agent.id && ia.target === 'claude-code'),
                    'codex': installedAgents.some(ia => ia.id === agent.id && ia.target === 'codex'),
                    'copilot': installedAgents.some(ia => ia.id === agent.id && ia.target === 'copilot')
                };
            }

            // Send install status back to webview
            this._panel.webview.postMessage({
                command: 'installStatus',
                status: installStatus
            });
        } catch (error) {
            console.error('Check install status failed:', error);
        }
    }

    private async openInstallDirectory() {
        try {
            await this.installerService.openInstallDirectory();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open install directory: ${error instanceof Error ? error.message : String(error)}`);
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
