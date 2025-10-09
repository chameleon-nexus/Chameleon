// src/services/agtHubService.ts
import * as vscode from 'vscode';
import axios from 'axios';
import * as https from 'https';
import * as http from 'http';

export interface AgentInfo {
    id: string;
    name: string | { en: string; zh: string; ja: string; vi: string };
    description: string | { en: string; zh: string; ja: string; vi: string };
    author: string;
    category: string;
    tags: string[];
    version: string;
    downloads: number;
    rating: number;
    ratingCount?: number;
    license: string;
    compatibility: {
        claudeCode?: boolean;
        'claude-code'?: boolean;
        codex?: boolean;
        copilot?: boolean;
    };
    createdAt: string;
    updatedAt: string;
    fileUrl?: string;
    homepage?: string;
}

export interface SearchFilters {
    category?: string;
    tag?: string;
    author?: string;
    sortBy?: 'downloads' | 'rating' | 'name' | 'updated';
    limit?: number;
}

export class AGTHubService {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
    private apiUrl: string;

    constructor(private context: vscode.ExtensionContext) {
        // Get API URL from configuration or use default
        this.apiUrl = this.getConfiguredApiUrl();
    }

    /**
     * 获取配置的API URL
     */
    private getConfiguredApiUrl(): string {
        const config = vscode.workspace.getConfiguration('chameleon');
        return config.get<string>('agtHubApiUrl') || 'https://www.agthub.org';
    }

    /**
     * 更新API URL
     */
    updateApiUrl(url: string): void {
        this.apiUrl = url;
        this.clearCache(); // Clear cache when changing URL
    }

    /**
     * HTTP请求辅助方法 (使用 axios)
     */
    private async httpRequest(url: string, method: string = 'GET', body?: any): Promise<any> {
        console.log(`[HTTP ${method}] ${url}`);
        if (body) console.log('[HTTP Body]', body);
        
        try {
            const response = await axios({
                method: method,
                url: url,
                data: body,
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log(`[HTTP ${method}] Success: ${response.status}`);
            return response.data;
        } catch (error: any) {
            console.error(`[HTTP ${method}] Error:`, error.message);
            if (error.response) {
                console.error('[HTTP Response]', error.response.status, error.response.data);
                throw new Error(`HTTP ${error.response.status}: ${error.response.statusText} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * 搜索Agents
     */
    async searchAgents(query: string, filters: SearchFilters = {}): Promise<AgentInfo[]> {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (filters.category) params.append('category', filters.category);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        
        const url = `${this.apiUrl}/api/agents/search?${params.toString()}`;
        
        console.log('=== AGTHub Search Debug ===');
        console.log('API URL:', this.apiUrl);
        console.log('Full URL:', url);
        console.log('Query:', query);
        console.log('Filters:', filters);
        
        return this.fetchWithCache(`search-${params.toString()}`, async () => {
            const data = await this.httpRequest(url);
            console.log('Response received, agents count:', data.agents?.length || 0);
            
            // Transform agents to ensure id is in author/agent-id format
            const agents = (data.agents || []).map((agent: any) => {
                const authorName = agent.author?.name || 'unknown';
                const agentId = agent.agentId || agent.id;
                
                // Create full ID in format "author/agentId"
                const fullId = `${authorName}/${agentId}`;
                
                return {
                    ...agent,
                    id: fullId,
                    agentId: agentId,
                    author: authorName
                };
            });
            
            console.log('Transformed agents:', agents.map((a: any) => ({ id: a.id, agentId: a.agentId, author: a.author })));
            
            return agents;
        });
    }

    /**
     * 获取特色Agents
     */
    async getFeaturedAgents(): Promise<AgentInfo[]> {
        return this.searchAgents('', { sortBy: 'downloads', limit: 100 });
    }

    /**
     * 获取分类列表 (与 AGTHub 完全一致的分类结构和顺序)
     */
    async getCategories(): Promise<any> {
        // AGTHub's category structure - must match exactly
        const CATEGORY_TEMPLATE = {
            'core-architecture': { en: 'Core Architecture', zh: '核心架构', group: 'development', order: 1 },
            'web-programming': { en: 'Web & Application', zh: 'Web与应用', group: 'development', order: 2 },
            'systems-programming': { en: 'Systems & Low-Level', zh: '系统底层', group: 'development', order: 3 },
            'enterprise-programming': { en: 'Enterprise & JVM', zh: '企业与JVM', group: 'development', order: 4 },
            'ui-mobile': { en: 'UI/UX & Mobile', zh: 'UI/UX与移动端', group: 'development', order: 5 },
            'specialized-platforms': { en: 'Specialized Platforms', zh: '专业平台', group: 'development', order: 6 },
            'devops-deployment': { en: 'DevOps & Deployment', zh: '运维部署', group: 'operations', order: 7 },
            'database-management': { en: 'Database Management', zh: '数据库管理', group: 'operations', order: 8 },
            'incident-network': { en: 'Incident & Network', zh: '故障网络', group: 'operations', order: 9 },
            'code-quality': { en: 'Code Quality & Review', zh: '代码质量', group: 'quality', order: 10 },
            'testing-debugging': { en: 'Testing & Debugging', zh: '测试调试', group: 'quality', order: 11 },
            'performance-observability': { en: 'Performance', zh: '性能监控', group: 'quality', order: 12 },
            'machine-learning': { en: 'Machine Learning & AI', zh: '机器学习', group: 'data', order: 13 },
            'data-analytics': { en: 'Data Engineering', zh: '数据工程', group: 'data', order: 14 },
            'seo-content': { en: 'SEO & Content', zh: 'SEO内容', group: 'content', order: 15 },
            'documentation': { en: 'Documentation', zh: '文档', group: 'content', order: 16 },
            'business-finance': { en: 'Business & Finance', zh: '商业财务', group: 'business', order: 17 },
            'marketing-sales': { en: 'Marketing & Sales', zh: '营销销售', group: 'business', order: 18 },
            'support-legal': { en: 'Support & Legal', zh: '支持法务', group: 'business', order: 19 },
            'specialized-domains': { en: 'Specialized Domains', zh: '专业领域', group: 'specialized', order: 20 }
        };
        
        // Fetch all agents to calculate counts
        const agents = await this.searchAgents('', { limit: 1000 });
        
        const categoryMap: { [key: string]: number } = {};
        agents.forEach((agent: any) => {
            if (agent.category) {
                categoryMap[agent.category] = (categoryMap[agent.category] || 0) + 1;
            }
        });
        
        // Build categories in the exact order as AGTHub
        const sortedCategories = Object.keys(CATEGORY_TEMPLATE)
            .sort((a, b) => CATEGORY_TEMPLATE[a as keyof typeof CATEGORY_TEMPLATE].order - CATEGORY_TEMPLATE[b as keyof typeof CATEGORY_TEMPLATE].order);
        
        const result: any = {};
        sortedCategories.forEach(key => {
            const template = CATEGORY_TEMPLATE[key as keyof typeof CATEGORY_TEMPLATE];
            result[key] = {
                name: { en: template.en, zh: template.zh },
                count: categoryMap[key] || 0,
                group: template.group
            };
        });
        
        return result;
    }

    /**
     * 获取Agent详情
     */
    async getAgentDetails(agentId: string): Promise<AgentInfo | null> {
        const url = `${this.apiUrl}/api/agents/${agentId}`;
        
        try {
            return await this.httpRequest(url);
        } catch (error) {
            console.error(`Failed to fetch agent details for ${agentId}:`, error);
            return null;
        }
    }

    /**
     * 下载Agent内容
     */
    async downloadAgentContent(agentId: string): Promise<string> {
        const url = `${this.apiUrl}/api/agents/${agentId}/download`;
        
        try {
            const data = await this.httpRequest(url);
            return data.content || '';
        } catch (error) {
            console.error(`Failed to download agent ${agentId}:`, error);
            throw error;
        }
    }

    /**
     * 提交评分
     */
    async rateAgent(agentId: string, rating: number): Promise<void> {
        const token = this.context.globalState.get<string>('agtHub.token');
        
        if (!token) {
            throw new Error('Please login to AGTHub first');
        }

        const url = `${this.apiUrl}/api/agents/${agentId}/rate`;

        try {
            await this.httpRequest(url, 'POST', { rating });
            this.clearCache(); // Clear cache to refresh agent data
        } catch (error) {
            console.error(`Failed to rate agent ${agentId}:`, error);
            throw error;
        }
    }

    /**
     * 删除评分
     */
    async deleteRating(agentId: string): Promise<void> {
        const token = this.context.globalState.get<string>('agtHub.token');
        
        if (!token) {
            throw new Error('Please login to AGTHub first');
        }

        const url = `${this.apiUrl}/api/agents/${agentId}/rate`;

        try {
            await this.httpRequest(url, 'DELETE');
            this.clearCache(); // Clear cache to refresh agent data
        } catch (error) {
            console.error(`Failed to delete rating for agent ${agentId}:`, error);
            throw error;
        }
    }

    /**
     * 发布Agent
     */
    async publishAgent(agentData: {
        agentId: string;
        version: string;
        category: string;
        tags: string[];
        license: string;
        homepage?: string;
        name_en?: string;
        name_zh?: string;
        name_ja?: string;
        name_vi?: string;
        description_en?: string;
        description_zh?: string;
        description_ja?: string;
        description_vi?: string;
        fileContent: string;
    }): Promise<{ success: boolean; message?: string; needsReview?: boolean }> {
        const token = this.context.globalState.get<string>('agtHub.token');
        
        if (!token) {
            throw new Error('Please login to AGTHub first');
        }

        const url = `${this.apiUrl}/api/agents/publish`;
        
        // Create FormData-like structure
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        let body = '';

        const appendField = (name: string, value: string) => {
            body += `--${boundary}\r\n`;
            body += `Content-Disposition: form-data; name="${name}"\r\n\r\n`;
            body += `${value}\r\n`;
        };

        const appendFile = (name: string, filename: string, content: string) => {
            body += `--${boundary}\r\n`;
            body += `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`;
            body += `Content-Type: text/markdown\r\n\r\n`;
            body += `${content}\r\n`;
        };

        // Append all fields
        appendField('agentId', agentData.agentId);
        appendField('version', agentData.version);
        appendField('category', agentData.category);
        appendField('tags', agentData.tags.join(','));
        appendField('license', agentData.license);
        if (agentData.homepage) appendField('homepage', agentData.homepage);
        if (agentData.name_en) appendField('name_en', agentData.name_en);
        if (agentData.name_zh) appendField('name_zh', agentData.name_zh);
        if (agentData.name_ja) appendField('name_ja', agentData.name_ja);
        if (agentData.name_vi) appendField('name_vi', agentData.name_vi);
        if (agentData.description_en) appendField('description_en', agentData.description_en);
        if (agentData.description_zh) appendField('description_zh', agentData.description_zh);
        if (agentData.description_ja) appendField('description_ja', agentData.description_ja);
        if (agentData.description_vi) appendField('description_vi', agentData.description_vi);

        // Append file
        const filename = `${agentData.agentId}_v${agentData.version}.md`;
        appendFile('file', filename, agentData.fileContent);

        body += `--${boundary}--\r\n`;

        try {
            return new Promise((resolve, reject) => {
                const urlObj = new URL(url);
                const isHttps = urlObj.protocol === 'https:';
                const httpClient = isHttps ? https : http;

                const options: http.RequestOptions = {
                    hostname: urlObj.hostname,
                    port: urlObj.port || (isHttps ? 443 : 80),
                    path: urlObj.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${boundary}`,
                        'Content-Length': Buffer.byteLength(body),
                        'Authorization': `Bearer ${token}`
                    }
                };

                const req = httpClient.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            const result = JSON.parse(data);
                            resolve(result);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage} - ${data}`));
                        }
                    });
                });

                req.on('error', reject);
                req.write(body);
                req.end();
            });
        } catch (error) {
            console.error('Failed to publish agent:', error);
            throw error;
        }
    }

    /**
     * 特殊用户登录（用户名+密码）
     */
    async loginWithCredentials(username: string, password: string): Promise<{ token: string; user: any }> {
        const url = `${this.apiUrl}/api/auth/special-cli-login`;

        try {
            const data = await this.httpRequest(url, 'POST', { username, password });
            
            if (data.token) {
                // Save token to global state
                await this.context.globalState.update('agtHub.token', data.token);
                await this.context.globalState.update('agtHub.email', data.user.email);
                await this.context.globalState.update('agtHub.userName', data.user.name || data.user.username);
                await this.context.globalState.update('agtHub.username', data.user.username);
                await this.context.globalState.update('agtHub.isSpecialUser', true);
            }

            return data;
        } catch (error) {
            console.error('Special login failed:', error);
            throw error;
        }
    }

    /**
     * 登录AGTHub（邮箱验证码方式 - 保留兼容性）
     */
    async login(email: string, code: string): Promise<{ token: string; userName: string }> {
        const url = `${this.apiUrl}/api/cli/login`;

        try {
            const data = await this.httpRequest(url, 'POST', { email, code });
            
            if (data.token) {
                // Save token to global state
                await this.context.globalState.update('agtHub.token', data.token);
                await this.context.globalState.update('agtHub.email', email);
                await this.context.globalState.update('agtHub.userName', data.userName);
            }

            return data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    /**
     * 请求验证码
     */
    async requestVerificationCode(email: string): Promise<void> {
        const url = `${this.apiUrl}/api/auth/send-code`;
        const body = JSON.stringify({ email, type: 'login' });

        try {
            await this.httpRequest(url, 'POST', body);
        } catch (error) {
            console.error('Failed to request verification code:', error);
            throw error;
        }
    }

    /**
     * 登出
     */
    async logout(): Promise<void> {
        await this.context.globalState.update('agtHub.token', undefined);
        await this.context.globalState.update('agtHub.email', undefined);
        await this.context.globalState.update('agtHub.userName', undefined);
        this.clearCache();
    }

    /**
     * 检查登录状态
     */
    isLoggedIn(): boolean {
        return !!this.context.globalState.get<string>('agtHub.token');
    }

    /**
     * 获取当前用户信息
     */
    getCurrentUser(): { email?: string; userName?: string } {
        return {
            email: this.context.globalState.get<string>('agtHub.email'),
            userName: this.context.globalState.get<string>('agtHub.userName')
        };
    }

    /**
     * 缓存辅助方法
     */
    private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        const data = await fetcher();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear();
    }
}


