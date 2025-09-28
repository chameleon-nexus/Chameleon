import { spawn, ChildProcess } from 'child_process';
import * as vscode from 'vscode';

export interface ClaudeResponse {
    content: string;
    model: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
    timestamp: string;
    finish_reason?: string;
    streamMessages?: any[]; // 添加流式消息数组
}

export interface StreamCallback {
    (message: any): void;
}

export interface ClaudeConfig {
    defaultModel: string;
    timeout: number;
    maxRetries: number;
    enableRouting: boolean;
}

export class ClaudeClient {
    private process: ChildProcess | null = null;
    private config: ClaudeConfig;

    constructor(config?: Partial<ClaudeConfig>) {
        this.config = {
            defaultModel: 'deepseek-v3-250324', // 默认使用Router配置的DeepSeek模型
            timeout: 600000, // 增加到10分钟超时，处理长文档
            maxRetries: 3,
            enableRouting: true, // 默认启用Router路由
            ...config
        };
    }

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

    async sendMessage(
        prompt: string,
        model?: string,
        context?: { 
            projectPath?: string; 
            sessionId?: string;
            conversationHistory?: Array<{ role: string; content: string }>;
        },
        streamCallback?: StreamCallback
    ): Promise<ClaudeResponse> {
        // 使用claude命令，通过环境变量路由到Router（保持工具链功能）
        return await this.sendMessageViaCommand(prompt, model, context, streamCallback);
    }


    // 检查是否为GLM模型
    private isGlmModel(model: string): boolean {
        return model.toLowerCase().includes('glm') || 
               model.includes('glm-4') || 
               model.includes('glm-3') || 
               model.includes('glm-4v') ||
               model.includes('glm-4.5');
    }

    // 获取GLM配置的API密钥
    private async getGlmApiKey(): Promise<string | undefined> {
        try {
            const vscode = require('vscode');
            const config = vscode.workspace.getConfiguration('chameleon');
            const providers = config.get('providers', {});
            
            // 查找GLM提供商的API密钥
            if (providers.glm && providers.glm.api_key) {
                return providers.glm.api_key;
            }
            
            // 也检查gemini_前缀的GLM配置
            if (providers.gemini_glm && providers.gemini_glm.api_key) {
                return providers.gemini_glm.api_key;
            }
            
            return undefined;
        } catch (error) {
            console.warn('无法读取GLM API密钥:', error);
            return undefined;
        }
    }

    // 通过命令行发送消息（备用方法）
    private async sendMessageViaCommand(
        prompt: string,
        model?: string,
        context?: { projectPath?: string; sessionId?: string },
        streamCallback?: StreamCallback
    ): Promise<ClaudeResponse> {
        const targetModel = model || this.config.defaultModel;
        
        // 检查是否为GLM模型
        const isGlm = this.isGlmModel(targetModel);
        
        // 根据模型类型设置不同的环境变量
        let authToken: string | undefined;
        let baseUrl: string;
        
        if (isGlm) {
            // GLM模型使用GLM配置
            authToken = await this.getGlmApiKey();
            baseUrl = 'https://open.bigmodel.cn/api/anthropic';
            console.log('Using GLM configuration for model:', targetModel);
        } else {
            // 其他模型使用Router配置
            authToken = await this.getRouterAuthToken();
            baseUrl = 'http://127.0.0.1:3456';
            console.log('Using Router configuration for model:', targetModel);
        }
        
        return new Promise((resolve, reject) => {
            const command = this.getClaudeCommand();
            const args = this.getClaudeArgs(prompt, targetModel, context);
            
            console.log('Executing Claude command with spawn:', command, args);
            console.log('Working directory:', context?.projectPath || process.cwd());
            console.log('Current process platform:', process.platform);
            console.log('Current process shell:', process.env.ComSpec);
            console.log('Current process user:', process.env.USERNAME);

            // 确保PATH被正确传递
            const currentPath = process.env.PATH || '';
            const env: NodeJS.ProcessEnv = {
                ...process.env, // 关键：继承当前进程的所有环境变量，包括PATH
                PATH: currentPath, // 明确设置PATH
                ANTHROPIC_API_KEY: '', // 清空API密钥，让特定配置处理
                ANTHROPIC_BASE_URL: baseUrl, // 根据模型类型设置URL
                NO_PROXY: isGlm ? '' : '127.0.0.1', // GLM不需要代理设置
                DISABLE_TELEMETRY: 'true',
                DISABLE_COST_WARNINGS: 'true',
                API_TIMEOUT_MS: '600000' // 10分钟超时
            };

            // 设置认证token（如果存在）
            if (authToken) {
                env['ANTHROPIC_AUTH_TOKEN'] = authToken;
            }

            console.log('Environment variables set:', {
                MODEL_TYPE: isGlm ? 'GLM' : 'Router',
                ANTHROPIC_AUTH_TOKEN: env.ANTHROPIC_AUTH_TOKEN ? '***' : 'not set',
                ANTHROPIC_BASE_URL: env.ANTHROPIC_BASE_URL,
                ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY
            });

            // 直接使用spawn作为主要方法
            console.log('Using spawn method (primary)...');
            this.trySpawnMethod(command, args, env, context, resolve, reject, streamCallback);
        });
    }

    // 主要方法：使用spawn
    private trySpawnMethod(
        command: string, 
        args: string[], 
        env: any, 
        context: any, 
        resolve: (value: any) => void, 
        reject: (reason?: any) => void,
        streamCallback?: StreamCallback
    ) {
        const { spawn } = require('child_process');
        
        console.log('Using spawn method with args:', args);
        
        const child = spawn(command, args, {
            cwd: context?.projectPath || process.cwd(),
            env: env,
            shell: true // 在Windows上调用.cmd文件时，这个选项几乎是必须的
        });

        // 关键修复：显式地关闭子进程的stdin流
        // 这会打破潜在的死锁，让子进程知道可以开始处理任务了
        if (child.stdin) {
            child.stdin.end();
            console.log('Stdin stream closed to prevent deadlock');
        }

        let output = '';
        let error = '';
        let isResolved = false;

        // 设置超时
        const timeout = setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                console.log('Spawn request timed out, killing process...');
                child.kill('SIGKILL');
                reject(new Error(`Spawn request timed out after ${this.config.timeout}ms`));
            }
        }, this.config.timeout);

        child.stdout.on('data', (data: any) => {
            const chunk = data.toString();
            console.log(`stdout: ${chunk}`);
            output += chunk;
            
            // 实时处理流式输出
            if (streamCallback) {
                const lines = chunk.split('\n').filter((line: string) => line.trim());
                for (const line of lines) {
                    try {
                        const message = JSON.parse(line);
                        streamCallback(message);
                    } catch (e) {
                        // 跳过非JSON行
                    }
                }
            }
        });

        child.stderr.on('data', (data: any) => {
            const chunk = data.toString();
            console.error(`stderr: ${chunk}`);
            error += chunk;
        });

        child.on('error', (err: any) => {
            clearTimeout(timeout);
            if (!isResolved) {
                isResolved = true;
                console.error(`执行时发生错误: ${err.message}`);
                reject(new Error(`Failed to start Claude: ${err.message}`));
            }
        });

        child.on('close', (code: number) => {
            clearTimeout(timeout);
            if (!isResolved) {
                isResolved = true;
                console.log(`子进程退出，退出码 ${code}`);
                console.log('完整输出:', output);
                
                if (code === 0) {
                    try {
                        const response = this.parseResponse(output);
                        resolve(response);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse Claude response: ${parseError}`));
                    }
                } else {
                    reject(new Error(`Claude command failed (code ${code}): ${error}`));
                }
            }
        });
    }

    async streamMessage(
        prompt: string,
        model?: string,
        context?: { projectPath?: string; sessionId?: string },
        onChunk?: (chunk: string) => void
    ): Promise<ClaudeResponse> {
        const targetModel = model || this.config.defaultModel;
        
        return new Promise(async (resolve, reject) => {
            const command = this.getClaudeCommand();
            const args = this.getClaudeArgs(prompt, targetModel, context);
            
            console.log('Executing streaming Claude command:', command, args.join(' '));

            // 从Router配置中读取认证token，如果没有配置则不设置
            const authToken = await this.getRouterAuthToken();
            const env: NodeJS.ProcessEnv = {
                ...process.env,
                ANTHROPIC_API_KEY: '', // 清空API密钥，让Router处理
                ANTHROPIC_BASE_URL: 'http://127.0.0.1:3456', // Router地址
                NO_PROXY: '127.0.0.1',
                DISABLE_TELEMETRY: 'true',
                DISABLE_COST_WARNINGS: 'true',
                API_TIMEOUT_MS: '600000' // 10分钟超时
            };

            if (authToken) {
                env['ANTHROPIC_AUTH_TOKEN'] = authToken;
            }

            this.process = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: context?.projectPath || process.cwd(),
                shell: true, // 使用shell来确保命令能正确执行
                env: env
            });

            let fullOutput = '';
            let error = '';
            let isResolved = false;

            // 设置超时
            const timeout = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    console.log('Claude request timed out, killing process...');
                    this.process?.kill('SIGKILL');
                    this.process = null;
                    reject(new Error(`Claude request timed out after ${this.config.timeout}ms`));
                }
            }, this.config.timeout);

            this.process.stdout?.on('data', (data) => {
                const chunk = data.toString();
                fullOutput += chunk;
                
                // 实时处理流式输出
                const lines = chunk.split('\n').filter((line: string) => line.trim());
                for (const line of lines) {
                    try {
                        const message = JSON.parse(line);
                        // 这里不需要流式回调，因为这是streamMessage方法
                    } catch (e) {
                        // 跳过非JSON行
                    }
                }
            });

            this.process.stderr?.on('data', (data) => {
                error += data.toString();
            });

            this.process.on('close', (code) => {
                clearTimeout(timeout);
                
                if (isResolved) return;
                isResolved = true;

                if (code === 0) {
                    try {
                        const response = this.parseResponse(fullOutput);
                        resolve(response);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse Claude response: ${parseError}`));
                    }
                } else {
                    reject(new Error(`Claude command failed (code ${code}): ${error}`));
                }
            });

            this.process.on('error', (err) => {
                clearTimeout(timeout);
                
                if (isResolved) return;
                isResolved = true;
                
                console.error('Claude process error:', err);
                this.process = null;

                reject(new Error(`Failed to start Claude: ${err.message}`));
            });
        });
    }

    private buildClaudeArgs(
        prompt: string,
        model: string,
        context?: { projectPath?: string; sessionId?: string }
    ): string[] {
        // 清理提示词，移除换行符和多余空格
        const cleanPrompt = prompt.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
        
        // 使用Router时，不需要指定具体模型，Router会自动路由
        // 但我们可以指定模型名称让Router知道要使用哪个模型
        const args = [
            '-p', cleanPrompt,
            '--model', model, // 这里Router会解析并使用对应的三方API
            '--output-format', 'stream-json',
            '--verbose'
        ];

        if (context?.projectPath) {
            args.push('--project-path', context.projectPath);
        }

        if (context?.sessionId) {
            args.push('--session-id', context.sessionId);
        }

        return args;
    }

    private getClaudeCommand(): string {
        // 在Windows上，智能查找claude.cmd的位置
        if (process.platform === 'win32') {
            const path = require('path');
            const fs = require('fs');
            
            // 方法1：尝试从npm全局目录找到claude.cmd
            if (process.env.APPDATA) {
                const npmGlobalPath = path.join(process.env.APPDATA, 'npm', 'claude.cmd');
                if (fs.existsSync(npmGlobalPath)) {
                    console.log(`Found claude.cmd at npm global path: ${npmGlobalPath}`);
                    return `"${npmGlobalPath}"`; // 使用引号防止路径中有空格
                }
            }
            
            // 方法2：尝试从用户目录的npm全局目录找到
            if (process.env.USERPROFILE) {
                const userNpmPath = path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'npm', 'claude.cmd');
                if (fs.existsSync(userNpmPath)) {
                    console.log(`Found claude.cmd at user npm path: ${userNpmPath}`);
                    return `"${userNpmPath}"`; // 使用引号防止路径中有空格
                }
            }
            
            // 方法3：尝试从PATH环境变量中的npm目录查找
            if (process.env.PATH) {
                const pathDirectories = process.env.PATH.split(';');
                for (const dir of pathDirectories) {
                    if (dir.includes('npm') || dir.includes('node_modules')) {
                        const claudePath = path.join(dir, 'claude.cmd');
                        if (fs.existsSync(claudePath)) {
                            console.log(`Found claude.cmd in PATH directory: ${claudePath}`);
                            return `"${claudePath}"`;
                        }
                    }
                }
            }
            
            console.log('Could not find claude.cmd absolute path, falling back to relative command');
            return 'claude.cmd'; // 回退到相对路径
        }
        return 'claude'; // 非Windows系统
    }

    private getClaudeArgs(prompt: string, model: string, context?: { projectPath?: string; sessionId?: string }): string[] {
        // The model name is passed to the router via the --model flag.
        // e.g., "volcengine,deepseek-v3-250324"
        const routerModel = model;
        
        // Using a temporary file for the prompt is a robust way to handle long and complex prompts.
        const fs = require('fs');
        const path = require('path');
        const tempDir = context?.projectPath || process.cwd();
        const tempFile = path.join(tempDir, `claude_prompt_${Date.now()}.txt`);
        
        try {
            fs.writeFileSync(tempFile, prompt, 'utf8');
            return [
                '-p', `@${tempFile}`,
                '--model', routerModel,
                '--output-format', 'stream-json',
                '--verbose',
                '--dangerously-skip-permissions'
            ];
        } catch (error) {
            console.error('Could not write temp prompt file, falling back to direct argument:', error);
            return [ // Fallback for shorter prompts
                '-p', prompt,
                '--model', routerModel,
                '--output-format', 'stream-json',
                '--verbose',
                '--dangerously-skip-permissions'
            ];
        }
    }

    private extractModelFromUsage(modelUsage: any): string | null {
        if (!modelUsage) return null;
        const keys = Object.keys(modelUsage);
        return keys.length > 0 ? keys[0] : null;
    }

    private extractInputTokens(usage: any, modelUsage: any): number {
        if (usage?.input_tokens !== undefined) return usage.input_tokens;
        if (modelUsage) {
            const keys = Object.keys(modelUsage);
            if (keys.length > 0) {
                return modelUsage[keys[0]]?.inputTokens || 0;
            }
        }
        return 0;
    }

    private extractOutputTokens(usage: any, modelUsage: any): number {
        if (usage?.output_tokens !== undefined) return usage.output_tokens;
        if (modelUsage) {
            const keys = Object.keys(modelUsage);
            if (keys.length > 0) {
                return modelUsage[keys[0]]?.outputTokens || 0;
            }
        }
        return 0;
    }

    private parseResponse(output: string): ClaudeResponse {
        // 首先尝试解析JSONL流式输出
        const lines = output.split('\n').filter(line => line.trim());
        const messages: any[] = [];

        for (const line of lines) {
            try {
                const message = JSON.parse(line);
                messages.push(message);
            } catch (e) {
                // 跳过非JSON行
            }
        }

        // 提取关键信息用于返回值
        let model = 'unknown';
        let usage = { input_tokens: 0, output_tokens: 0 };
        let finish_reason = 'unknown';

        // 查找系统初始化信息
        const initMessage = messages.find(m => m.type === 'system' && m.subtype === 'init');
        if (initMessage) {
            model = initMessage.model;
        }

        // 查找最终结果
        const finalResult = messages.find(m => m.type === 'result' && m.subtype === 'success');
        if (finalResult) {
            if (finalResult.usage) {
                usage = {
                    input_tokens: finalResult.usage.input_tokens || 0,
                    output_tokens: finalResult.usage.output_tokens || 0
                };
            }
            finish_reason = 'stop';
            
            // 直接返回最终结果，用于简化显示
            return {
                content: finalResult.result || '处理完成',
                model: model,
                usage: usage,
                timestamp: new Date().toISOString(),
                finish_reason: finish_reason,
                // 添加流式消息供后续处理
                streamMessages: messages
            };
        }

        // 如果没有找到任何有用信息，回退到原始逻辑
        try {
            // 尝试直接解析JSON
            const response = JSON.parse(output.trim());
            
            return {
                content: response.result || response.content || response.message?.content || output,
                model: response.model || this.extractModelFromUsage(response.modelUsage) || 'unknown',
                usage: {
                    input_tokens: this.extractInputTokens(response.usage, response.modelUsage) || 0,
                    output_tokens: this.extractOutputTokens(response.usage, response.modelUsage) || 0
                },
                timestamp: new Date().toISOString(),
                finish_reason: response.finish_reason
            };
        } catch (parseError) {
            return {
                content: output,
                model: 'unknown',
                usage: {
                    input_tokens: 0,
                    output_tokens: 0
                },
                timestamp: new Date().toISOString(),
                finish_reason: 'unknown'
            };
        }
    }

    cancel(): void {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }

    updateConfig(newConfig: Partial<ClaudeConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}
