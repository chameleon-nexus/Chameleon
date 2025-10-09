import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { t, getCurrentLanguage } from '../utils/i18n';
import { AGTHubService, AgentInfo, SearchFilters } from '../services/agtHubService';
import { AgentInstallerService, InstalledAgent } from '../services/agentInstallerService';

export class AgentMarketplacePanel {
    public static currentPanel: AgentMarketplacePanel | undefined;
    public static readonly viewType = 'agentMarketplace';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private agtHubService: AGTHubService;
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
                get: (key: string) => {
                    // Read from VS Code's global state for AGTHub auth
                    if (key.startsWith('agtHub.')) {
                        return vscode.workspace.getConfiguration('chameleon').get(key);
                    }
                    return undefined;
                },
                update: (key: string, value: any) => {
                    // Save to VS Code's global state for AGTHub auth
                    return Promise.resolve();
                }
            }
        } as any;
        // Only use AGTHub service (disable GitHub registry)
        this.agtHubService = new AGTHubService(mockContext);
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
                    case 'publishAgent':
                        this.publishAgent(message.agentData);
                        return;
                    case 'rateAgent':
                        this.rateAgent(message.agentId, message.rating);
                        return;
                    case 'deleteRating':
                        this.deleteRating(message.agentId);
                        return;
                    case 'openExternal':
                        if (message.url) {
                            console.log('Opening external URL:', message.url);
                            vscode.env.openExternal(vscode.Uri.parse(message.url));
                        }
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
        // Get current language
        const currentLanguage = getCurrentLanguage();
        
        // Fetch data from AGTHub
        let agents: any[] = [];
        let categories: any = {};
        
        try {
            const featuredAgents = await this.agtHubService.getFeaturedAgents();
            const agtHubCategories = await this.agtHubService.getCategories();
            
            agents = featuredAgents;
            categories = agtHubCategories;
        } catch (error) {
            console.error('Failed to fetch agents from AGTHub:', error);
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
            // Categories will be populated dynamically from registry data
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
                    
                    /* Auth and Publish UI */
                    .toolbar {
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    
                    .toolbar-button {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 4px;
                        font-size: 14px;
                        cursor: pointer;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    
                    .toolbar-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    
                    .toolbar-button.secondary {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    
                    .user-info {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        color: var(--vscode-descriptionForeground);
                        font-size: 14px;
                    }
                    
                    .modal {
                        display: none;
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0, 0, 0, 0.5);
                        z-index: 1000;
                        justify-content: center;
                        align-items: center;
                    }
                    
                    .modal.show {
                        display: flex;
                    }
                    
                    .modal-content {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 24px;
                        max-width: 500px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                    }
                    
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    
                    .modal-header h2 {
                        margin: 0;
                        color: var(--vscode-foreground);
                    }
                    
                    .modal-close {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: var(--vscode-foreground);
                        padding: 0;
                        width: 30px;
                        height: 30px;
                    }
                    
                    .form-group {
                        margin-bottom: 16px;
                    }
                    
                    .form-group label {
                        display: block;
                        margin-bottom: 6px;
                        color: var(--vscode-foreground);
                        font-weight: 500;
                    }
                    
                    .form-input {
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border-radius: 4px;
                        font-size: 14px;
                        box-sizing: border-box;
                    }
                    
                    .form-textarea {
                        width: 100%;
                        min-height: 100px;
                        padding: 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border-radius: 4px;
                        font-size: 14px;
                        box-sizing: border-box;
                        font-family: inherit;
                    }
                    
                    .form-actions {
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                        margin-top: 20px;
                    }
                    
                    .rating-stars {
                        display: flex;
                        gap: 4px;
                        align-items: center;
                    }
                    
                    .star {
                        font-size: 20px;
                        cursor: pointer;
                        color: var(--vscode-descriptionForeground);
                        transition: color 0.2s;
                    }
                    
                    .star.filled {
                        color: #ffd700;
                    }
                    
                    .star:hover {
                        color: #ffd700;
                    }
                    
                    .agent-rating {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-top: 10px;
                        padding: 10px;
                        background-color: var(--vscode-editor-background);
                        border-radius: 4px;
                        border: 1px solid var(--vscode-panel-border);
                    }
                    
                    .rating-label {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <!-- Toolbar with Paid Agents button -->
                <div class="toolbar" id="toolbar">
                    <button class="toolbar-button" id="paidAgentsBtn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        💎 ${currentLanguage === 'zh' ? '付费专区' : 'Paid Agents'}
                    </button>
                </div>
                
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
                            <!-- Categories will be populated dynamically by JavaScript -->
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
                
                <!-- Publish Modal -->
                <div class="modal" id="publishModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Publish Agent</h2>
                            <button class="modal-close" onclick="closePublishModal()">&times;</button>
                        </div>
                        <div class="form-group">
                            <label for="publishAgentId">Agent ID *</label>
                            <input type="text" id="publishAgentId" class="form-input" placeholder="my-agent">
                        </div>
                        <div class="form-group">
                            <label for="publishVersion">Version *</label>
                            <input type="text" id="publishVersion" class="form-input" placeholder="1.0.0" value="1.0.0">
                        </div>
                        <div class="form-group">
                            <label for="publishCategory">Category *</label>
                            <select id="publishCategory" class="form-input">
                                <option value="web-programming">Web & Application Programming</option>
                                <option value="ui-mobile">UI/UX & Mobile</option>
                                <option value="data-science">Data Science & Analytics</option>
                                <option value="documentation">Documentation & Technical Writing</option>
                                <option value="devops-infrastructure">DevOps & Infrastructure</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="publishTags">Tags (comma-separated) *</label>
                            <input type="text" id="publishTags" class="form-input" placeholder="python, web, api">
                        </div>
                        <div class="form-group">
                            <label for="publishNameEn">Name (English) *</label>
                            <input type="text" id="publishNameEn" class="form-input" placeholder="My Agent">
                        </div>
                        <div class="form-group">
                            <label for="publishDescEn">Description (English) *</label>
                            <textarea id="publishDescEn" class="form-textarea" placeholder="Describe your agent..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="publishNameZh">Name (Chinese)</label>
                            <input type="text" id="publishNameZh" class="form-input" placeholder="我的代理">
                        </div>
                        <div class="form-group">
                            <label for="publishDescZh">Description (Chinese)</label>
                            <textarea id="publishDescZh" class="form-textarea" placeholder="描述您的代理..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="publishLicense">License *</label>
                            <input type="text" id="publishLicense" class="form-input" placeholder="MIT" value="MIT">
                        </div>
                        <div class="form-group">
                            <label for="publishHomepage">Homepage URL</label>
                            <input type="url" id="publishHomepage" class="form-input" placeholder="https://...">
                        </div>
                        <div class="form-group">
                            <label for="publishContent">Agent Content (Markdown) *</label>
                            <textarea id="publishContent" class="form-textarea" style="min-height: 200px;" placeholder="# My Agent

Description...

## Instructions
..."></textarea>
                        </div>
                        <div class="form-actions">
                            <button class="toolbar-button secondary" onclick="closePublishModal()">Cancel</button>
                            <button class="toolbar-button" id="publishSubmitBtn">Publish</button>
                        </div>
                    </div>
                </div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    
                    // Get translations from TypeScript
                    const translations = ${jsTranslationsJSON};
                    
                    // Authentication state
                    let isLoggedIn = false;
                    let currentUser = null;
                    
                    // Modal management
                    function openLoginModal() {
                        document.getElementById('loginModal').classList.add('show');
                    }
                    
                    function closeLoginModal() {
                        document.getElementById('loginModal').classList.remove('show');
                    }
                    
                    function openPublishModal() {
                        if (!isLoggedIn) {
                            alert('Please login first');
                            openLoginModal();
                            return;
                        }
                        document.getElementById('publishModal').classList.add('show');
                    }
                    
                    function closePublishModal() {
                        document.getElementById('publishModal').classList.remove('show');
                    }
                    
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
                        
                        // Categories will be populated dynamically by populateCategoryFilter()
                        
                        const searchInput = document.getElementById('searchInput');
                        if (searchInput) searchInput.placeholder = translations.filters.searchPlaceholder;
                        
                        const loadingText = document.getElementById('loadingText');
                        if (loadingText) loadingText.textContent = translations.messages.loading;
                        
                        console.log('Translations set successfully');
                    }
                    
                    // Real agent data from GitHub registry
                    let agents = ${JSON.stringify(agents)};
                    const registryCategories = ${JSON.stringify(categories)};
                    
                    // No more sample data - only use real GitHub registry data
                    
                    let filteredAgents = [...agents];
                    
                    // Filter change handler - calls VS Code to search
                    function handleFilterChange() {
                        const cliType = document.getElementById('cliTypeFilter').value || '';
                        const category = document.getElementById('categoryFilter').value || '';
                        const query = document.getElementById('searchInput').value || '';
                        
                        console.log('Filter changed:', { cliType, category, query });
                        
                        // Send search request to VS Code extension
                        vscode.postMessage({
                            command: 'searchAgents',
                            query: query,
                            cliType: cliType,
                            category: category
                        });
                    }
                    
                    // Helper functions to handle different data formats with i18n support
                    // Use the language setting passed from the backend
                    const currentLanguage = '${getCurrentLanguage()}';
                    
                    // 修复乱码的分类名称映射
                    const categoryNameFixes = {
                        'systems-programming': '系统与底层编程',
                        'database-management': '数据库管理'
                    };
                    
                    function getLocalizedText(textObj, fallback = '', categoryKey = '') {
                        if (typeof textObj === 'string') {
                            return textObj;
                        }
                        
                        if (!textObj || typeof textObj !== 'object') {
                            return fallback;
                        }
                        
                        // 如果是分类名称且有修复映射，优先使用修复的名称
                        if (currentLanguage === 'zh' && categoryKey && categoryNameFixes[categoryKey]) {
                            return categoryNameFixes[categoryKey];
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
                    
                    // 转换兼容性数据格式
                    function normalizeCompatibility(compatibility) {
                        if (!compatibility) {
                            return {
                                claudeCode: false,
                                'claude-code': false,
                                codex: false
                            };
                        }
                        
                        // 如果已经是简单格式，直接返回
                        if (typeof compatibility.claudeCode === 'boolean') {
                            return compatibility;
                        }
                        
                        // 转换复杂格式到简单格式
                        return {
                            claudeCode: !!(compatibility.claudeCode || compatibility['claude-code']),
                            'claude-code': !!(compatibility.claudeCode || compatibility['claude-code']),
                            codex: !!compatibility.codex,
                            copilot: !!compatibility.copilot
                        };
                    }
                    
                    function renderAgents() {
                        const grid = document.getElementById('agentGrid');
                        
                        console.log('Rendering agents:', {
                            totalAgents: agents.length,
                            filteredAgents: filteredAgents.length,
                            sampleAgent: agents[0],
                            translations: translations,
                            actions: translations.actions
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
                        
                        grid.innerHTML = filteredAgents.map(agent => {
                            // 标准化兼容性数据
                            const compatibility = agent.compatibility;
                            const normalizedCompat = {
                                claudeCode: !!(compatibility?.claudeCode || compatibility?.['claude-code']),
                                'claude-code': !!(compatibility?.claudeCode || compatibility?.['claude-code']),
                                codex: !!compatibility?.codex,
                                copilot: !!compatibility?.copilot
                            };
                            
                            return \`
                            <div class="agent-card">
                                <div class="agent-header">
                                    <div class="agent-icon">\${getAgentIcon(agent.category)}</div>
                                    <h3 class="agent-title">\${getAgentName(agent)}</h3>
                                </div>
                                
                                <p class="agent-description">\${getAgentDescription(agent)}</p>
                                
                                <div class="agent-meta">
                                    <span>👤 \${typeof agent.author === 'object' ? (agent.author?.name || agent.author?.author || 'Unknown') : agent.author}</span>
                                    <span>📥 \${agent.downloads || 0}</span>
                                    \${window.showRating !== false ? '<span>⭐ ' + (agent.rating || 4.0).toFixed(1) + ' (' + (agent.ratingCount || 0) + ')</span>' : ''}
                                </div>
                                
                                <div class="agent-tags">
                                    \${(agent.tags || []).map(tag => '<span class="agent-tag">' + tag + '</span>').join('')}
                                </div>
                                
                                <div class="compatibility">
                                    \${normalizedCompat.claudeCode || normalizedCompat['claude-code'] ? '<span class="compatibility-badge compatibility-claude">' + (translations.compatibility?.claudeCode || 'Claude Code') + '</span>' : ''}
                                    \${normalizedCompat.codex ? '<span class="compatibility-badge compatibility-codex">' + (translations.compatibility?.codex || 'Codex') + '</span>' : ''}
                                </div>
                                
                                \${isLoggedIn && window.showRating !== false ? 
                                    '<div class="agent-rating">' +
                                        '<span class="rating-label">Rate this agent:</span>' +
                                        '<div class="rating-stars" data-agent-id="' + agent.id + '">' +
                                            '<span class="star" data-rating="1">★</span>' +
                                            '<span class="star" data-rating="2">★</span>' +
                                            '<span class="star" data-rating="3">★</span>' +
                                            '<span class="star" data-rating="4">★</span>' +
                                            '<span class="star" data-rating="5">★</span>' +
                                        '</div>' +
                                    '</div>' 
                                    : ''}
                                
                                <div class="agent-actions">
                                    <div class="install-buttons-wrapper" id="install-buttons-\${agent.id}">
                                        \${(normalizedCompat.claudeCode || normalizedCompat['claude-code']) ? 
                                            '<button class="action-button action-button-primary install-btn-claude" data-agent-id="' + agent.id + '" data-target="claude-code">' + (translations.actions?.downloadToClaudeCode || 'Download to Claude Code') + '</button>' + 
                                            '<button class="action-button action-button-danger uninstall-btn-claude" data-agent-id="' + agent.id + '" data-target="claude-code" style="display: none;">卸载 Claude Code</button>'
                                            : ''}
                                        \${normalizedCompat.codex ? 
                                            '<button class="action-button action-button-primary install-btn-codex" data-agent-id="' + agent.id + '" data-target="codex">' + (translations.actions?.downloadToCodex || 'Download to Codex') + '</button>' + 
                                            '<button class="action-button action-button-danger uninstall-btn-codex" data-agent-id="' + agent.id + '" data-target="codex" style="display: none;">卸载 Codex</button>'
                                            : ''}
                                        \${(normalizedCompat.claudeCode || normalizedCompat['claude-code']) && normalizedCompat.codex ? '<button class="action-button action-button-secondary convert-btn" data-agent-id="' + agent.id + '" data-from="claude-code" data-to="codex">' + (translations.actions?.convertToCodex || 'Convert to Codex') + '</button>' : ''}
                                    </div>
                                </div>
                            </div>
                        \`}).join('');
                        
                        // Add rating star listeners
                        if (isLoggedIn) {
                            document.querySelectorAll('.rating-stars').forEach(container => {
                                const stars = container.querySelectorAll('.star');
                                stars.forEach(star => {
                                    star.addEventListener('click', function() {
                                        const agentId = container.getAttribute('data-agent-id');
                                        const rating = parseInt(this.getAttribute('data-rating'));
                                        
                                        vscode.postMessage({
                                            command: 'rateAgent',
                                            agentId: agentId,
                                            rating: rating
                                        });
                                        
                                        // Visual feedback
                                        stars.forEach((s, idx) => {
                                            if (idx < rating) {
                                                s.classList.add('filled');
                                            } else {
                                                s.classList.remove('filled');
                                            }
                                        });
                                    });
                                    
                                    star.addEventListener('mouseenter', function() {
                                        const rating = parseInt(this.getAttribute('data-rating'));
                                        stars.forEach((s, idx) => {
                                            if (idx < rating) {
                                                s.style.color = '#ffd700';
                                            }
                                        });
                                    });
                                    
                                    star.addEventListener('mouseleave', function() {
                                        stars.forEach(s => {
                                            s.style.color = '';
                                        });
                                    });
                                });
                            });
                        }
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
                    
                    // Open Paid Agents page in browser
                    function openPaidAgents() {
                        console.log('🔥 openPaidAgents function called!');
                        const url = 'https://www.agthub.org/paid';
                        console.log('🌐 Opening URL:', url);
                        console.log('📤 Sending openExternal message to vscode...');
                        
                        try {
                            vscode.postMessage({
                                command: 'openExternal',
                                url: url
                            });
                            console.log('✅ Message sent successfully!');
                        } catch (error) {
                            console.error('❌ Error sending message:', error);
                        }
                    }
                    
                    function handlePublish() {
                        const agentId = document.getElementById('publishAgentId').value.trim();
                        const version = document.getElementById('publishVersion').value.trim();
                        const category = document.getElementById('publishCategory').value;
                        const tags = document.getElementById('publishTags').value.split(',').map(t => t.trim()).filter(t => t);
                        const nameEn = document.getElementById('publishNameEn').value.trim();
                        const descEn = document.getElementById('publishDescEn').value.trim();
                        const nameZh = document.getElementById('publishNameZh').value.trim();
                        const descZh = document.getElementById('publishDescZh').value.trim();
                        const license = document.getElementById('publishLicense').value.trim();
                        const homepage = document.getElementById('publishHomepage').value.trim();
                        const content = document.getElementById('publishContent').value.trim();
                        
                        if (!agentId || !version || !category || tags.length === 0 || !nameEn || !descEn || !license || !content) {
                            alert('Please fill in all required fields (*)');
                            return;
                        }
                        
                        const agentData = {
                            agentId,
                            version,
                            category,
                            tags,
                            license,
                            homepage: homepage || undefined,
                            name_en: nameEn,
                            name_zh: nameZh || undefined,
                            description_en: descEn,
                            description_zh: descZh || undefined,
                            fileContent: content
                        };
                        
                        vscode.postMessage({
                            command: 'publishAgent',
                            agentData: agentData
                        });
                        
                        closePublishModal();
                    }
                    
                    function updateAuthUI(loggedIn, userName) {
                        isLoggedIn = loggedIn;
                        currentUser = userName;
                        
                        const loginBtn = document.getElementById('loginBtn');
                        const publishBtn = document.getElementById('publishBtn');
                        const logoutBtn = document.getElementById('logoutBtn');
                        const userInfo = document.getElementById('userInfo');
                        const userNameSpan = document.getElementById('userName');
                        
                        // Safely check if elements exist before accessing properties
                        if (loggedIn) {
                            if (loginBtn) loginBtn.style.display = 'none';
                            if (publishBtn) publishBtn.style.display = 'block';
                            if (logoutBtn) logoutBtn.style.display = 'block';
                            if (userInfo) userInfo.style.display = 'flex';
                            if (userNameSpan) userNameSpan.textContent = userName || 'User';
                        } else {
                            if (loginBtn) loginBtn.style.display = 'block';
                            if (publishBtn) publishBtn.style.display = 'none';
                            if (logoutBtn) logoutBtn.style.display = 'none';
                            if (userInfo) userInfo.style.display = 'none';
                        }
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
                        
                        // Add paid agents button listener
                        const paidAgentsBtn = document.getElementById('paidAgentsBtn');
                        if (paidAgentsBtn) {
                            console.log('🔘 Binding paidAgentsBtn click event...');
                            paidAgentsBtn.addEventListener('click', () => {
                                console.log('🖱️ Paid Agents button clicked!');
                                openPaidAgents();
                            });
                            console.log('✅ paidAgentsBtn event bound successfully');
                        } else {
                            console.error('❌ paidAgentsBtn not found!');
                        }
                        
                        // Add agent button event listeners
                        addAgentButtonListeners();
                        
                        // Add publish button event listener
                        document.getElementById('publishSubmitBtn').addEventListener('click', handlePublish);
                        
                        // Listen for messages from VS Code
                        window.addEventListener('message', event => {
                            const message = event.data;
                            console.log('🔔 Received message from VS Code:', message);
                            
                            switch (message.command) {
                                case 'searchResults':
                                    console.log('🔄 Updating agents with search results:', message.agents.length, 'agents');
                                    agents = message.agents;
                                    filteredAgents = agents;
                                    window.showRating = message.showRating;
                                    console.log('showRating set to:', window.showRating);
                                    console.log('📊 First agent sample:', agents[0]);
                                    // Update auth UI based on login status from search results
                                    if (message.isLoggedIn !== undefined) {
                                        updateAuthUI(message.isLoggedIn, currentUser);
                                    }
                                    console.log('🎨 Calling renderAgents()...');
                                    renderAgents();
                                    console.log('✅ renderAgents() completed');
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
                                case 'loginSuccess':
                                    console.log('Login successful:', message.userName);
                                    updateAuthUI(true, message.userName);
                                    closeLoginModal();
                                    // Clear form
                                    document.getElementById('loginEmail').value = '';
                                    document.getElementById('loginCode').value = '';
                                    break;
                                case 'loginFailed':
                                    console.error('Login failed:', message.error);
                                    alert('Login failed: ' + message.error);
                                    break;
                                case 'codeSent':
                                    console.log('Verification code sent');
                                    break;
                                case 'logoutSuccess':
                                    console.log('Logout successful');
                                    updateAuthUI(false, null);
                                    break;
                                case 'publishSuccess':
                                    console.log('Publish successful');
                                    // Refresh agent list
                                    handleFilterChange();
                                    break;
                                case 'ratingSuccess':
                                    console.log('Rating submitted:', message.agentId);
                                    // Refresh agent data
                                    handleFilterChange();
                                    break;
                                case 'ratingDeleted':
                                    console.log('Rating deleted:', message.agentId);
                                    // Refresh agent data
                                    handleFilterChange();
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
                        console.log('=== populateCategoryFilter START ===');
                        console.log('registryCategories:', registryCategories);
                        console.log('agents data:', agents);
                        
                        const categoryFilter = document.getElementById('categoryFilter');
                        if (!categoryFilter) {
                            console.log('❌ categoryFilter element not found');
                            return;
                        }
                        
                        // Clear existing options except the first "All Categories" option
                        console.log('清理现有选项，保留第一个选项');
                        while (categoryFilter.children.length > 1) {
                            categoryFilter.removeChild(categoryFilter.lastChild);
                        }
                        
                        let addedFromRegistry = 0;
                        let addedFromAgents = 0;
                        
                        // Add categories from registry data with i18n support
                        if (registryCategories && typeof registryCategories === 'object') {
                            console.log('📊 从注册表数据添加分类，总数:', Object.keys(registryCategories).length);
                            Object.keys(registryCategories).forEach(categoryKey => {
                                const category = registryCategories[categoryKey];
                                console.log('分类 ' + categoryKey + ':', category);
                                
                                const option = document.createElement('option');
                                option.value = categoryKey;
                                
                                // Use localized category name
                                const categoryName = getLocalizedText(category.name || category, categoryKey, categoryKey);
                                console.log('解析分类名称 ' + categoryKey + ': ' + categoryName);
                                
                                option.textContent = '📁 ' + categoryName;
                                categoryFilter.appendChild(option);
                                addedFromRegistry++;
                            });
                        } else {
                            console.log('❌ registryCategories为空或不是对象');
                        }
                        
                        // No longer add categories from agent data - only use registry categories
                        
                        console.log('✅ 分类添加完成: 注册表(' + addedFromRegistry + ') = 总计(' + (categoryFilter.options.length - 1) + ')');
                        console.log('=== populateCategoryFilter END ===');
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
            
            // Always use AGTHub (GitHub registry disabled)
            let results: any[] = [];
            results = await this.agtHubService.searchAgents(query, filters);
            
            console.log('Initial search results count:', results.length);
            
            // CLI类型过滤
            if (cliType && cliType !== 'all') {
                console.log('Applying CLI type filter:', cliType);
                const beforeFilterCount = results.length;
                results = results.filter(agent => {
                    // 处理兼容性数据格式
                    const compatibility = agent.compatibility;
                    if (cliType === 'claude-code') {
                        // 处理复杂格式和简单格式
                        if (typeof compatibility?.claudeCode === 'boolean') {
                            return compatibility.claudeCode || compatibility['claude-code'];
                        } else if (compatibility?.claudeCode || compatibility?.['claude-code']) {
                            return true; // 有复杂格式数据就认为支持
                        }
                        return false;
                    } else if (cliType === 'codex') {
                        return typeof compatibility?.codex === 'boolean' ? compatibility.codex : !!compatibility?.codex;
                    } else if (cliType === 'copilot') {
                        return typeof compatibility?.copilot === 'boolean' ? compatibility.copilot : !!compatibility?.copilot;
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
                showRating: showRating,
                isLoggedIn: this.agtHubService.isLoggedIn()
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
            // Extract author name - handle both string and object formats
            let authorName = 'unknown';
            if (typeof agent.author === 'string') {
                authorName = agent.author;
            } else if (agent.author && typeof agent.author === 'object') {
                authorName = agent.author.name || agent.author.email?.split('@')[0] || 'unknown';
            }
            
            // Use agentId (not id) for AGTHub agents
            const agentId = agent.agentId || agent.id;
            const fullAgentId = `${authorName}/${agentId}`;
            
            console.log('Installing agent:', { agent, fullAgentId, authorName, agentId });
            
            await this.installerService.installAgent(fullAgentId, {
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
            // Extract author name - handle both string and object formats
            let authorName = 'unknown';
            if (typeof agent.author === 'string') {
                authorName = agent.author;
            } else if (agent.author && typeof agent.author === 'object') {
                authorName = agent.author.name || agent.author.email?.split('@')[0] || 'unknown';
            }
            
            // Use agentId (not id) for AGTHub agents
            const agentId = agent.agentId || agent.id;
            const fullAgentId = `${authorName}/${agentId}`;
            
            await this.installerService.uninstallAgent(fullAgentId, targetType);
            
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
                // Extract author name - handle both string and object formats
                let authorName = 'unknown';
                if (typeof agent.author === 'string') {
                    authorName = agent.author;
                } else if (agent.author && typeof agent.author === 'object') {
                    authorName = agent.author.name || agent.author.email?.split('@')[0] || 'unknown';
                }
                
                // Use agentId (not id) for AGTHub agents
                const agentId = agent.agentId || agent.id;
                const fullAgentId = `${authorName}/${agentId}`;
                
                // Use the full ID (with db id prefix) as the key for webview
                const statusKey = agent.id;
                
                installStatus[statusKey] = {
                    'claude-code': installedAgents.some(ia => ia.id === fullAgentId && ia.target === 'claude-code'),
                    'codex': installedAgents.some(ia => ia.id === fullAgentId && ia.target === 'codex'),
                    'copilot': installedAgents.some(ia => ia.id === fullAgentId && ia.target === 'copilot')
                };
                
                console.log('Install status check:', { 
                    agentId, 
                    fullAgentId, 
                    statusKey, 
                    status: installStatus[statusKey] 
                });
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

    private async publishAgent(agentData: any) {
        if (!this.agtHubService.isLoggedIn()) {
            vscode.window.showErrorMessage('Please login to publish agents');
            return;
        }

        try {
            const result = await this.agtHubService.publishAgent(agentData);
            
            if (result.success) {
                if (result.needsReview) {
                    vscode.window.showInformationMessage(
                        result.message || 'Your agent has been submitted for review'
                    );
                } else {
                    vscode.window.showInformationMessage(
                        result.message || 'Agent published successfully!'
                    );
                }
                
                // Refresh the agent list
                this._panel.webview.postMessage({
                    command: 'publishSuccess'
                });
            } else {
                vscode.window.showErrorMessage(result.message || 'Failed to publish agent');
            }
        } catch (error) {
            console.error('Publish agent failed:', error);
            vscode.window.showErrorMessage(
                `Failed to publish agent: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async rateAgent(agentId: string, rating: number) {
        if (!this.agtHubService.isLoggedIn()) {
            vscode.window.showErrorMessage('Please login to rate agents');
            return;
        }

        try {
            await this.agtHubService.rateAgent(agentId, rating);
            vscode.window.showInformationMessage('Rating submitted successfully!');
            
            // Refresh the agent data
            this._panel.webview.postMessage({
                command: 'ratingSuccess',
                agentId: agentId
            });
        } catch (error) {
            console.error('Rate agent failed:', error);
            vscode.window.showErrorMessage(
                `Failed to rate agent: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async deleteRating(agentId: string) {
        if (!this.agtHubService.isLoggedIn()) {
            vscode.window.showErrorMessage('Please login first');
            return;
        }

        try {
            await this.agtHubService.deleteRating(agentId);
            vscode.window.showInformationMessage('Rating deleted successfully!');
            
            // Refresh the agent data
            this._panel.webview.postMessage({
                command: 'ratingDeleted',
                agentId: agentId
            });
        } catch (error) {
            console.error('Delete rating failed:', error);
            vscode.window.showErrorMessage(
                `Failed to delete rating: ${error instanceof Error ? error.message : String(error)}`
            );
        }
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
