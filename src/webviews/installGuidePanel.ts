import * as vscode from 'vscode';
import { t } from '../utils/i18n';

export class InstallGuidePanel {
    // 1. 添加一个静态属性来持有当前面板实例
    public static currentPanel: InstallGuidePanel | undefined;

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
        if (InstallGuidePanel.currentPanel) {
            InstallGuidePanel.currentPanel.panel.reveal(column);
            return;
        }

        // 否则，创建一个新面板
        const panel = vscode.window.createWebviewPanel(
            'installGuide',
            t('installGuide.title'), // 在这里使用 t() 函数
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        InstallGuidePanel.currentPanel = new InstallGuidePanel(panel, extensionUri);
    }

    private setupWebview(): void {
        this.panel.webview.html = this._getHtmlForWebview(this.panel.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return this._getHtmlTemplate();
    }

    private _getHtmlTemplate(): string {
        const isChinese = vscode.env.language.startsWith('zh');
        
        
        return `<!DOCTYPE html>
<html lang="${isChinese ? 'zh-CN' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('installGuide.title')}</title>
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
        .section {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: var(--vscode-foreground);
        }
        .step {
            margin-bottom: 20px;
            padding: 15px;
            background: var(--vscode-editor-background);
            border-radius: 6px;
            border-left: 4px solid var(--vscode-focusBorder);
        }
        .step-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }
        .code-block {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            margin: 10px 0;
            overflow-x: auto;
        }
        .warning {
            background: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            border-radius: 4px;
            padding: 12px;
            margin: 10px 0;
        }
        .warning-title {
            font-weight: 600;
            margin-bottom: 5px;
            color: var(--vscode-inputValidation-warningForeground);
        }
        .info {
            background: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            border-radius: 4px;
            padding: 12px;
            margin: 10px 0;
        }
        .info-title {
            font-weight: 600;
            margin-bottom: 5px;
            color: var(--vscode-inputValidation-infoForeground);
        }
        .info-box {
            background: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            border-radius: 4px;
            padding: 12px;
            margin: 10px 0;
            color: var(--vscode-inputValidation-infoForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">📖 ${t('installGuide.title')}</div>
        <div>${t('installGuide.subtitle')}</div>
    </div>

    <div class="section">
        <div class="section-title">${t('installGuide.requirements.title')}</div>
        <ul>
            <li>${t('installGuide.requirements.item1')}</li>
            <li>${t('installGuide.requirements.item2')}</li>
            <li>${t('installGuide.requirements.item3')}</li>
            <li>${t('installGuide.requirements.item4')}</li>
        </ul>
    </div>

    <div class="section">
        <div class="section-title">${t('installGuide.step1.title')}</div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step1.download.title')}</div>
            <p>${t('installGuide.step1.download.text')}</p>
            <div class="info">
                <div class="info-title">${t('installGuide.step1.note.title')}</div>
                <p>${t('installGuide.step1.note.text')}</p>
            </div>
        </div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step1.install.title')}</div>
            <p>${t('installGuide.step1.install.text')}</p>
        </div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step1.verify.title')}</div>
            <div class="code-block">node --version
npm --version</div>
            <p>${t('installGuide.step1.verify.text')}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${t('installGuide.step2.title')}</div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step2.download.title')}</div>
            <p>${t('installGuide.step2.download.text')}</p>
        </div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step2.install.title')}</div>
            <p>${t('installGuide.step2.install.text')}</p>
        </div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step2.config.title')}</div>
            <div class="code-block">git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"</div>
        </div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step2.verify.title')}</div>
            <div class="code-block">git --version</div>
            <p>${t('installGuide.step2.verify.text')}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${t('installGuide.step3.title')}</div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step3.install.title')}</div>
            <div class="code-block">npm install -g @anthropic-ai/claude-code</div>
        </div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step3.verify.title')}</div>
            <div class="code-block">claude --version</div>
            <p>${t('installGuide.step3.verify.text')}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${t('installGuide.step4.title')}</div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step4.install.title')}</div>
            <div class="code-block">npm install -g @chameleon-nexus-tech/claude-code-router; if ($?) { ccr restart }</div>
        </div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step4.verify.title')}</div>
            <div class="code-block">ccr --version</div>
            <p>${t('installGuide.step4.verify.text')}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${t('installGuide.step5.title')}</div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step5.start.title')}</div>
            <div class="code-block">ccr restart</div>
            <p>${t('installGuide.step5.start.text')}</p>
            <div class="info-box">
                <strong>💡 提示：</strong> 如果您通过Chameleon扩展安装CCR，服务会自动启动，无需手动执行此命令。使用 <code>ccr restart</code> 可以确保服务正常运行。
            </div>
        </div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step5.verify.title')}</div>
            <div class="code-block">curl http://127.0.0.1:3456/health</div>
            <p>${t('installGuide.step5.verify.text')}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${t('installGuide.step6.title')}</div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step6.settings.title')}</div>
            <p>${t('installGuide.step6.settings.text')}</p>
        </div>
        
        <div class="step">
            <div class="step-title">${t('installGuide.step6.api.title')}</div>
            <p>${t('installGuide.step6.api.text')}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${t('installGuide.troubleshooting.title')}</div>
        
        <div class="warning">
            <div class="warning-title">${t('installGuide.troubleshooting.title2')}</div>
            <ul>
                <li><strong>${t('installGuide.troubleshooting.item1')}</strong></li>
                <li><strong>${t('installGuide.troubleshooting.item2')}</strong></li>
                <li><strong>${t('installGuide.troubleshooting.item3')}</strong></li>
                <li><strong>${t('installGuide.troubleshooting.item4')}</strong></li>
                <li><strong>${t('installGuide.troubleshooting.item5')}</strong></li>
            </ul>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${t('installGuide.nextSteps.title')}</div>
        <p>${t('installGuide.nextSteps.text')}</p>
        <ul>
            <li>${t('installGuide.nextSteps.item1')}</li>
            <li>${t('installGuide.nextSteps.item2')}</li>
            <li>${t('installGuide.nextSteps.item3')}</li>
        </ul>
    </div>
</body>
</html>`;
    }

    public dispose(): void {
        InstallGuidePanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
