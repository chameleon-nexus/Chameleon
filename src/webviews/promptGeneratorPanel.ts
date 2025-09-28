import * as vscode from 'vscode';
import { t } from '../utils/i18n';

export class PromptGeneratorPanel {
    public static currentPanel: PromptGeneratorPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

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

        if (PromptGeneratorPanel.currentPanel) {
            PromptGeneratorPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'chameleonPromptGenerator',
            t('toolbox.promptGenerator.title'),
            column || vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        PromptGeneratorPanel.currentPanel = new PromptGeneratorPanel(panel, extensionUri);
    }

    private setupWebview() {
        this.panel.webview.html = this._getHtmlTemplate();
        this._setWebviewMessageListener();
    }

    private _setWebviewMessageListener() {
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'generatePrompt':
                        await this.generatePrompt(message.params);
                        break;
                    case 'improvePrompt':
                        await this.improvePrompt(message.prompt);
                        break;
                    case 'templatizePrompt':
                        await this.templatizePrompt(message.prompt);
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

    private async generatePrompt(params: any) {
        try {
            console.log('[PromptGeneratorPanel] Generating prompt with params:', params);
            
            let generatedPrompt = '';
            
            switch (params.purpose) {
                case 'coding':
                    generatedPrompt = this.generateCodingPrompt(params);
                    break;
                case 'debugging':
                    generatedPrompt = this.generateDebuggingPrompt(params);
                    break;
                case 'documentation':
                    generatedPrompt = this.generateDocumentationPrompt(params);
                    break;
                case 'testing':
                    generatedPrompt = this.generateTestingPrompt(params);
                    break;
                case 'refactoring':
                    generatedPrompt = this.generateRefactoringPrompt(params);
                    break;
                default:
                    generatedPrompt = this.generateGenericPrompt(params);
            }
            
            const vscodeConfig = vscode.workspace.getConfiguration('chameleon');
            const existingPrompts = vscodeConfig.get('generatedPrompts', []);
            const newPrompt = {
                id: Date.now().toString(),
                ...params,
                prompt: generatedPrompt,
                createdAt: new Date().toISOString()
            };
            
            await vscodeConfig.update('generatedPrompts', [...existingPrompts, newPrompt], vscode.ConfigurationTarget.Global);
            
            this.panel.webview.postMessage({
                command: 'promptGenerated',
                success: true,
                prompt: generatedPrompt,
                metadata: newPrompt
            });
            
            vscode.window.showInformationMessage('提示词生成成功');
        } catch (error) {
            console.error('[PromptGeneratorPanel] Failed to generate prompt:', error);
            this.panel.webview.postMessage({
                command: 'promptGenerated',
                success: false,
                error: (error as Error).message
            });
            vscode.window.showErrorMessage(`生成提示词失败: ${(error as Error).message}`);
        }
    }

    private async improvePrompt(prompt: string) {
        try {
            console.log('[PromptGeneratorPanel] Improving prompt:', prompt);
            
            const analysis = this.analyzePromptQuality(prompt);
            const improvements = this.generateImprovementSuggestions(analysis);
            const improvedPrompt = this.applyImprovements(prompt, improvements);
            
            const vscodeConfig = vscode.workspace.getConfiguration('chameleon');
            const existingImprovements = vscodeConfig.get('promptImprovements', []);
            const newImprovement = {
                id: Date.now().toString(),
                originalPrompt: prompt,
                improvedPrompt: improvedPrompt,
                analysis: analysis,
                improvements: improvements,
                createdAt: new Date().toISOString()
            };
            
            await vscodeConfig.update('promptImprovements', [...existingImprovements, newImprovement], vscode.ConfigurationTarget.Global);
            
            this.panel.webview.postMessage({
                command: 'promptImproved',
                success: true,
                improvedPrompt: improvedPrompt,
                analysis: analysis,
                improvements: improvements
            });
            
            vscode.window.showInformationMessage('提示词优化完成');
        } catch (error) {
            console.error('[PromptGeneratorPanel] Failed to improve prompt:', error);
            this.panel.webview.postMessage({
                command: 'promptImproved',
                success: false,
                error: (error as Error).message
            });
            vscode.window.showErrorMessage(`优化提示词失败: ${(error as Error).message}`);
        }
    }

    private async templatizePrompt(prompt: string) {
        try {
            console.log('[PromptGeneratorPanel] Templatizing prompt:', prompt);
            
            const variables = this.extractVariables(prompt);
            const template = this.generateTemplate(prompt, variables);
            const templateInfo = this.generateTemplateInfo(variables);
            
            const vscodeConfig = vscode.workspace.getConfiguration('chameleon');
            const existingTemplates = vscodeConfig.get('promptTemplates', []);
            const newTemplate = {
                id: Date.now().toString(),
                name: this.generateTemplateName(prompt),
                originalPrompt: prompt,
                template: template,
                variables: variables,
                info: templateInfo,
                createdAt: new Date().toISOString()
            };
            
            await vscodeConfig.update('promptTemplates', [...existingTemplates, newTemplate], vscode.ConfigurationTarget.Global);
            
            this.panel.webview.postMessage({
                command: 'promptTemplated',
                success: true,
                template: template,
                variables: variables,
                info: templateInfo,
                metadata: newTemplate
            });
            
            vscode.window.showInformationMessage('提示词模板创建成功');
        } catch (error) {
            console.error('[PromptGeneratorPanel] Failed to templatize prompt:', error);
            this.panel.webview.postMessage({
                command: 'promptTemplated',
                success: false,
                error: (error as Error).message
            });
            vscode.window.showErrorMessage(`创建提示词模板失败: ${(error as Error).message}`);
        }
    }

    // 提示词生成辅助方法
    private generateCodingPrompt(params: any): string {
        return `请使用${params.language}编写代码，${params.requirements}。请确保代码清晰、高效，并包含适当的注释。`;
    }

    private generateDebuggingPrompt(params: any): string {
        return `请帮助调试这段${params.language}代码。请分析问题并提供解决方案。代码：${params.requirements}`;
    }

    private generateDocumentationPrompt(params: any): string {
        return `请为这段${params.language}代码生成详细的文档，包括函数说明、参数描述和使用示例。`;
    }

    private generateTestingPrompt(params: any): string {
        return `请为这段${params.language}代码编写全面的测试用例，包括单元测试和边界条件测试。`;
    }

    private generateRefactoringPrompt(params: any): string {
        return `请重构这段${params.language}代码，提高代码质量、可读性和性能。`;
    }

    private generateGenericPrompt(params: any): string {
        return `请根据以下要求生成${params.language}代码：${params.requirements}`;
    }

    // 提示词优化辅助方法
    private analyzePromptQuality(prompt: string): any {
        const clarity = prompt.length > 50 ? 'high' : 'medium';
        const specificity = prompt.includes('请') && prompt.includes('代码') ? 'high' : 'medium';
        const completeness = prompt.length > 100 ? 'high' : 'medium';
        
        return {
            clarity,
            specificity,
            completeness,
            overall: 'good'
        };
    }

    private generateImprovementSuggestions(analysis: any): string[] {
        const suggestions = [];
        
        if (analysis.clarity === 'medium') {
            suggestions.push('增加更多细节描述');
        }
        if (analysis.specificity === 'medium') {
            suggestions.push('明确指定编程语言和框架');
        }
        if (analysis.completeness === 'medium') {
            suggestions.push('添加更多上下文信息');
        }
        
        return suggestions;
    }

    private applyImprovements(prompt: string, improvements: string[]): string {
        let improvedPrompt = prompt;
        
        improvements.forEach(suggestion => {
            if (suggestion.includes('细节描述')) {
                improvedPrompt += '\n\n请提供详细的实现步骤和注意事项。';
            }
            if (suggestion.includes('编程语言')) {
                improvedPrompt += '\n\n请明确指定使用的编程语言和版本。';
            }
            if (suggestion.includes('上下文信息')) {
                improvedPrompt += '\n\n请考虑相关的业务场景和技术约束。';
            }
        });
        
        return improvedPrompt;
    }

    // 模板化辅助方法
    private extractVariables(prompt: string): string[] {
        const variables: string[] = [];
        const regex = /\{(\w+)\}/g;
        let match;
        
        while ((match = regex.exec(prompt)) !== null) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        
        return variables;
    }

    private generateTemplate(prompt: string, variables: string[]): string {
        let template = prompt;
        
        template = template.replace(/请使用(\w+)编写代码/g, '请使用{language}编写代码');
        template = template.replace(/这段(\w+)代码/g, '这段{language}代码');
        template = template.replace(/(\w+)语言/g, '{language}语言');
        
        return template;
    }

    private generateTemplateInfo(variables: string[]): any {
        const info: any = {};
        
        variables.forEach(variable => {
            switch (variable) {
                case 'language':
                    info[variable] = '编程语言（如：JavaScript, Python, Java等）';
                    break;
                case 'framework':
                    info[variable] = '框架名称（如：React, Vue, Django等）';
                    break;
                case 'purpose':
                    info[variable] = '代码用途描述';
                    break;
                default:
                    info[variable] = `${variable}的具体值`;
            }
        });
        
        return info;
    }

    private generateTemplateName(prompt: string): string {
        if (prompt.includes('编写代码')) {
            return '代码编写模板';
        } else if (prompt.includes('调试')) {
            return '代码调试模板';
        } else if (prompt.includes('文档')) {
            return '文档生成模板';
        } else if (prompt.includes('测试')) {
            return '测试用例模板';
        } else if (prompt.includes('重构')) {
            return '代码重构模板';
        } else {
            return '通用代码模板';
        }
    }

    private _getHtmlTemplate(): string {
        const title = t('toolbox.promptGenerator.title');
        const description = t('toolbox.promptGenerator.description');
        const generatePrompt = t('toolbox.promptGenerator.generatePrompt');
        const improvePrompt = t('toolbox.promptGenerator.improvePrompt');
        const templatizePrompt = t('toolbox.promptGenerator.templatizePrompt');
        const purpose = t('toolbox.promptGenerator.purpose');
        const language = t('toolbox.promptGenerator.language');
        const complexity = t('toolbox.promptGenerator.complexity');
        const requirements = t('toolbox.promptGenerator.requirements');
        const prompt = t('toolbox.promptGenerator.prompt');
        const backToMain = t('toolbox.backToMain');

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
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .header h1 {
            color: var(--vscode-textLink-foreground);
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        
        .header p {
            color: var(--vscode-descriptionForeground);
            margin: 0;
            font-size: 16px;
        }
        
        .back-btn {
            position: absolute;
            top: 20px;
            left: 20px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .back-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .section {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 25px;
        }
        
        .section h3 {
            color: var(--vscode-textLink-foreground);
            margin: 0 0 20px 0;
            font-size: 18px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: inherit;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }
        
        .form-group textarea {
            resize: vertical;
            min-height: 120px;
        }
        
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: inherit;
            margin-right: 10px;
            margin-bottom: 10px;
            transition: all 0.3s ease;
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
        
        .result-area {
            background: var(--vscode-textBlockQuote-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
            white-space: pre-wrap;
            font-family: var(--vscode-editor-font-family);
            font-size: 14px;
            line-height: 1.6;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 15px;
        }
        
        .result-area.hidden {
            display: none;
        }
        
        .success-message {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 20px;
            color: var(--vscode-textLink-foreground);
        }
        
        .analysis-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .analysis-item {
            margin-bottom: 10px;
            padding: 8px 12px;
            background: var(--vscode-editor-background);
            border-radius: 4px;
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        
        @media (max-width: 768px) {
            .content {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .container {
                padding: 0 10px;
            }
            
            .section {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <button class="back-btn" onclick="backToToolbox()">${backToMain}</button>
    
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>${description}</p>
        </div>
        
        <div class="content">
            <!-- 提示词生成 -->
            <div class="section">
                <h3>${generatePrompt}</h3>
                <form id="generateForm">
                    <div class="form-group">
                        <label>${purpose}</label>
                        <select id="promptPurpose">
                            <option value="coding">代码编写</option>
                            <option value="debugging">代码调试</option>
                            <option value="documentation">文档生成</option>
                            <option value="testing">测试用例</option>
                            <option value="refactoring">代码重构</option>
                            <option value="analysis">代码分析</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>${language}</label>
                        <input type="text" id="promptLanguage" placeholder="如：JavaScript, Python, Java">
                    </div>
                    
                    <div class="form-group">
                        <label>${complexity}</label>
                        <select id="promptComplexity">
                            <option value="simple">简单</option>
                            <option value="medium">中等</option>
                            <option value="complex">复杂</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>${requirements}</label>
                        <textarea id="promptRequirements" placeholder="描述具体需求"></textarea>
                    </div>
                    
                    <button type="submit" class="btn">${generatePrompt}</button>
                </form>
                
                <div id="generatedResult" class="result-area hidden"></div>
            </div>
            
            <!-- 提示词优化和模板化 -->
            <div class="section">
                <h3>${improvePrompt} / ${templatizePrompt}</h3>
                
                <div class="form-group">
                    <label>${prompt}</label>
                    <textarea id="promptToProcess" placeholder="输入要处理的提示词"></textarea>
                </div>
                
                <button class="btn btn-secondary" onclick="improvePrompt()">${improvePrompt}</button>
                <button class="btn btn-secondary" onclick="templatizePrompt()">${templatizePrompt}</button>
                
                <div id="improvedResult" class="result-area hidden"></div>
                <div id="templateResult" class="result-area hidden"></div>
                <div id="analysisResult" class="analysis-section hidden"></div>
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // 提示词生成表单提交
        document.getElementById('generateForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const params = {
                purpose: document.getElementById('promptPurpose').value,
                language: document.getElementById('promptLanguage').value,
                complexity: document.getElementById('promptComplexity').value,
                requirements: document.getElementById('promptRequirements').value
            };
            
            if (!params.language) {
                alert('请输入编程语言');
                return;
            }
            
            vscode.postMessage({
                command: 'generatePrompt',
                params: params
            });
        });
        
        function improvePrompt() {
            const prompt = document.getElementById('promptToProcess').value;
            
            if (!prompt) {
                alert('请输入要优化的提示词');
                return;
            }
            
            vscode.postMessage({
                command: 'improvePrompt',
                prompt: prompt
            });
        }
        
        function templatizePrompt() {
            const prompt = document.getElementById('promptToProcess').value;
            
            if (!prompt) {
                alert('请输入要模板化的提示词');
                return;
            }
            
            vscode.postMessage({
                command: 'templatizePrompt',
                prompt: prompt
            });
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
                case 'promptGenerated':
                    if (message.success) {
                        showResult('generatedResult', message.prompt);
                    }
                    break;
                    
                case 'promptImproved':
                    if (message.success) {
                        showResult('improvedResult', message.improvedPrompt);
                        showAnalysis(message.analysis, message.improvements);
                    }
                    break;
                    
                case 'promptTemplated':
                    if (message.success) {
                        showResult('templateResult', message.template);
                        showTemplateInfo(message.variables, message.info);
                    }
                    break;
            }
        });
        
        function showResult(elementId, content) {
            const element = document.getElementById(elementId);
            element.textContent = content;
            element.classList.remove('hidden');
            element.scrollIntoView({ behavior: 'smooth' });
        }
        
        function showAnalysis(analysis, improvements) {
            const analysisResult = document.getElementById('analysisResult');
            
            let analysisHtml = '<h4>质量分析:</h4>';
            analysisHtml += \`<div class="analysis-item"><strong>清晰度:</strong> \${analysis.clarity}</div>\`;
            analysisHtml += \`<div class="analysis-item"><strong>具体性:</strong> \${analysis.specificity}</div>\`;
            analysisHtml += \`<div class="analysis-item"><strong>完整性:</strong> \${analysis.completeness}</div>\`;
            
            if (improvements.length > 0) {
                analysisHtml += '<h4>改进建议:</h4>';
                improvements.forEach(improvement => {
                    analysisHtml += \`<div class="analysis-item">• \${improvement}</div>\`;
                });
            }
            
            analysisResult.innerHTML = analysisHtml;
            analysisResult.classList.remove('hidden');
        }
        
        function showTemplateInfo(variables, info) {
            const templateResult = document.getElementById('templateResult');
            const currentContent = templateResult.textContent;
            
            let templateInfoHtml = currentContent + '\n\n=== 模板变量说明 ===\n';
            variables.forEach(variable => {
                templateInfoHtml += \`{\${variable}}: \${info[variable]}\n\`;
            });
            
            templateResult.textContent = templateInfoHtml;
        }
        
        function showSuccessMessage(message) {
            const existingMessage = document.querySelector('.success-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = message;
            
            const container = document.querySelector('.container');
            container.insertBefore(successDiv, container.firstChild);
            
            setTimeout(() => {
                successDiv.remove();
            }, 3000);
        }
    </script>
</body>
</html>`;
    }

    public dispose() {
        PromptGeneratorPanel.currentPanel = undefined;
        
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
