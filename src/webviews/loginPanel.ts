import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { t } from '../utils/i18n';

export class LoginPanel {
    public static currentPanel: LoginPanel | undefined;

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

        if (LoginPanel.currentPanel) {
            LoginPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'chameleonLogin',
            t('login.title'),
            column || vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        LoginPanel.currentPanel = new LoginPanel(panel, extensionUri, extensionContext);
    }

    private setupWebview() {
        this.panel.webview.html = this._getHtmlTemplate();
        this._setWebviewMessageListener();
    }

    private _setWebviewMessageListener() {
        this.disposables.push(this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'login':
                        await this.handleLogin(message.username, message.password);
                        break;
                }
            },
            undefined
        ));
    }

    private async handleLogin(username: string, password: string) {
        try {
            const loginData = JSON.stringify({ username, password });
            const url = new URL('https://www.agthub.org/api/auth/special-cli-login');
            
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(loginData),
                    'User-Agent': 'Chameleon-Extension/1.0'
                },
                timeout: 30000
            };

            const response = await this.makeHttpRequest(options, loginData);
            const data = JSON.parse(response);

            if (data.success && data.token) {
                // Save AGTHub token
                await this.extensionContext.secrets.store('chameleon.token', data.token);
                await this.extensionContext.globalState.update('agtHub.token', data.token);
                await this.extensionContext.globalState.update('agtHub.email', data.user.email);
                await this.extensionContext.globalState.update('agtHub.userName', data.user.name || data.user.username);
                await this.extensionContext.globalState.update('agtHub.username', data.user.username);
                await this.extensionContext.globalState.update('agtHub.isSpecialUser', true);
                
                this.panel.dispose();
                const { NavigationPanel } = await import('./navigationPanel');
                NavigationPanel.createOrShow(this.extensionUri, this.extensionContext);
                vscode.window.showInformationMessage(t('login.loginSuccess'));
            } else {
                this.panel.webview.postMessage({
                    command: 'loginFailed',
                    error: data.error || t('login.invalidCredentials')
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            this.panel.webview.postMessage({
                command: 'loginFailed',
                error: t('login.networkError', { error: (error as Error).message })
            });
        }
    }

    private makeHttpRequest(options: any, data: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => { responseData += chunk; });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(responseData);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });
            req.on('error', (error) => { reject(error); });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            req.write(data);
            req.end();
        });
    }

    private _getHtmlTemplate(): string {
        // 1. 收集所有 JS 需要的翻译文本
        const jsTranslations = {
            loggingIn: t('login.loggingIn'),
            login: t('login.login'),
            enterCredentials: t('login.enterCredentials')
        };
        const jsTranslationsJSON = JSON.stringify(jsTranslations);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('login.title')}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            min-width: 400px;
            max-width: 500px;
        }
        .login-header { text-align: center; margin-bottom: 30px; }
        .login-title { font-size: 28px; font-weight: 600; color: var(--vscode-textLink-foreground); margin: 0 0 8px 0; }
        .login-subtitle { font-size: 16px; color: var(--vscode-descriptionForeground); margin: 0; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 500; color: var(--vscode-foreground); }
        .form-input {
            width: 100%; padding: 12px 16px; border: 2px solid var(--vscode-input-border);
            border-radius: 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
            font-family: inherit; font-size: inherit; box-sizing: border-box; transition: border-color 0.2s;
        }
        .form-input:hover { border-color: var(--vscode-input-border); }
        .form-input:focus { outline: none; border-color: var(--vscode-focusBorder); box-shadow: 0 0 0 1px var(--vscode-focusBorder); }
        .vscode-light .form-input, .vscode-high-contrast-light .form-input { border: 2px solid #d3d3d3; background: #ffffff; color: #333333; }
        .vscode-light .form-input:focus, .vscode-high-contrast-light .form-input:focus { border-color: #007acc; box-shadow: 0 0 0 1px #007acc; }
        .vscode-light .form-input:hover, .vscode-high-contrast-light .form-input:hover { border-color: #a0a0a0; }
        .password-input { position: relative; }
        .password-toggle {
            position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
            background: none; border: none; color: var(--vscode-descriptionForeground); cursor: pointer; padding: 4px;
        }
        .password-toggle:hover { color: var(--vscode-foreground); }
        .login-button {
            width: 100%; padding: 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground);
            border: none; border-radius: 6px; font-family: inherit; font-size: inherit; font-weight: 500;
            cursor: pointer; margin-bottom: 15px; transition: background-color 0.2s;
        }
        .login-button:hover { background: var(--vscode-button-hoverBackground); }
        .login-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .error-message {
            background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground);
            border: 1px solid var(--vscode-inputValidation-errorBorder); border-radius: 4px;
            padding: 8px 12px; margin-bottom: 15px; font-size: 14px;
        }
        .loading {
            display: inline-block; width: 16px; height: 16px; border: 2px solid var(--vscode-button-foreground);
            border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite; margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .form-footer {
            text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--vscode-panel-border);
        }
        .form-footer p { margin: 0; font-size: 14px; color: var(--vscode-descriptionForeground); }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1 class="login-title">Chameleon</h1>
            <p class="login-subtitle">${t('login.subtitle')}</p>
        </div>
        <form id="loginForm">
            <div id="errorMessage" class="error-message" style="display: none;"></div>
            <div class="form-group">
                <label class="form-label" for="username">${t('login.username')}</label>
                <input type="text" id="username" name="username" class="form-input" placeholder="${t('login.usernamePlaceholder')}" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="password">${t('login.password')}</label>
                <div class="password-input">
                    <input type="password" id="password" name="password" class="form-input" placeholder="${t('login.passwordPlaceholder')}" required>
                    <button type="button" class="password-toggle" onclick="togglePassword()">
                        <span id="passwordToggleIcon">👁️</span>
                    </button>
                </div>
            </div>
            <button type="submit" class="login-button" id="loginButton">
                <span id="loginButtonText">${t('login.login')}</span>
            </button>
        </form>
        <div class="form-footer">
            <p>${t('login.loginDescription')}</p>
        </div>
    </div>
    
    <script>
        // 2. 将翻译对象注入到前端
        const vscode = acquireVsCodeApi();
        const L = JSON.parse('${jsTranslationsJSON}');
        let isLoading = false;
        
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            if (isLoading) return;
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                showError(L.enterCredentials); // 使用 L 对象
                return;
            }
            
            login(username, password);
        });
        
        async function login(username, password) {
            isLoading = true;
            setLoading(true);
            hideError();
            
            vscode.postMessage({
                command: 'login',
                username: username,
                password: password
            });
        }
        
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.getElementById('passwordToggleIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleIcon.textContent = '👁️';
            }
        }
        
        function setLoading(loading) {
            isLoading = loading;
            const loginButton = document.getElementById('loginButton');
            const loginButtonText = document.getElementById('loginButtonText');
            
            if (loading) {
                loginButton.disabled = true;
                loginButtonText.innerHTML = \`<span class="loading"></span>\${L.loggingIn}\`; // 使用 L 对象
            } else {
                loginButton.disabled = false;
                loginButtonText.textContent = L.login; // 使用 L 对象
            }
        }
        
        function showError(message) {
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        function hideError() {
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.style.display = 'none';
        }
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'loginFailed':
                    setLoading(false);
                    showError(message.error);
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    public dispose() {
        LoginPanel.currentPanel = undefined;
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}