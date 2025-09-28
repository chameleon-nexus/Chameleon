// src/services/agentRegistryService.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';

export interface AgentInfo {
    id: string;
    name: { en: string; zh: string };
    description: { en: string; zh: string };
    author: string;
    category: string;
    tags: string[];
    latest: string;
    versions: string[];
    downloads: number;
    rating: number;
    ratingCount: number;
    license: string;
    compatibility: {
        claudeCode: {
            minVersion: string;
            tested?: string[];
        };
    };
    createdAt: string;
    updatedAt: string;
}

export interface Registry {
    version: string;
    lastUpdated: string;
    totalAgents: number;
    agents: { [key: string]: AgentInfo };
    categories: { [key: string]: any };
    stats: any;
}

export interface SearchFilters {
    category?: string;
    tag?: string;
    author?: string;
    sortBy?: 'downloads' | 'rating' | 'name' | 'updated';
    limit?: number;
}

export class AgentRegistryService {
    private static readonly BASE_URL = 'https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master';
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * 获取注册表数据
     */
    async getRegistry(): Promise<Registry> {
        return this.fetchWithCache('registry', async () => {
            const url = `${AgentRegistryService.BASE_URL}/registry.json`;
            
            try {
                const response = await this.httpGet(url);
                return JSON.parse(response);
            } catch (error) {
                console.error('Failed to fetch registry from GitHub:', error);
                // Fallback to mock data for development
                return this.getMockRegistry();
            }
        });
    }

    private httpGet(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            }).on('error', reject);
        });
    }

    private getMockRegistry(): Registry {
        return {
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
            totalAgents: 5,
            agents: {
                "python-pro": {
                    id: "python-pro",
                    name: { en: "Python Pro", zh: "Python 专家" },
                    description: { en: "Expert Python developer for all your coding needs", zh: "专业的 Python 开发专家" },
                    author: "wshobson",
                    category: "development",
                    tags: ["python", "development", "coding"],
                    latest: "1.0.0",
                    versions: ["1.0.0"],
                    downloads: 1250,
                    rating: 4.8,
                    ratingCount: 45,
                    license: "MIT",
                    compatibility: {
                        claudeCode: {
                            minVersion: "1.0.0",
                            tested: ["1.0.0"]
                        }
                    },
                    createdAt: "2024-01-15T00:00:00Z",
                    updatedAt: "2024-01-15T00:00:00Z"
                },
                "code-reviewer": {
                    id: "code-reviewer",
                    name: { en: "Code Reviewer", zh: "代码审查专家" },
                    description: { en: "Professional code review expert specializing in security and quality", zh: "专业的代码审查专家，专注于安全和质量" },
                    author: "wshobson",
                    category: "development",
                    tags: ["review", "security", "quality"],
                    latest: "1.0.0",
                    versions: ["1.0.0"],
                    downloads: 890,
                    rating: 4.9,
                    ratingCount: 32,
                    license: "MIT",
                    compatibility: {
                        claudeCode: {
                            minVersion: "1.0.0",
                            tested: ["1.0.0"]
                        }
                    },
                    createdAt: "2024-01-15T00:00:00Z",
                    updatedAt: "2024-01-15T00:00:00Z"
                },
                "debugger": {
                    id: "debugger",
                    name: { en: "Debugger", zh: "调试专家" },
                    description: { en: "Expert at finding and fixing bugs in your code", zh: "专业的代码调试和错误修复专家" },
                    author: "wshobson",
                    category: "debugging",
                    tags: ["debug", "troubleshoot", "fix"],
                    latest: "1.0.0",
                    versions: ["1.0.0"],
                    downloads: 675,
                    rating: 4.7,
                    ratingCount: 28,
                    license: "MIT",
                    compatibility: {
                        claudeCode: {
                            minVersion: "1.0.0",
                            tested: ["1.0.0"]
                        }
                    },
                    createdAt: "2024-01-15T00:00:00Z",
                    updatedAt: "2024-01-15T00:00:00Z"
                },
                "data-scientist": {
                    id: "data-scientist",
                    name: { en: "Data Scientist", zh: "数据科学家" },
                    description: { en: "Advanced data analysis and machine learning expert", zh: "高级数据分析和机器学习专家" },
                    author: "wshobson",
                    category: "data",
                    tags: ["data", "analysis", "ml", "statistics"],
                    latest: "1.0.0",
                    versions: ["1.0.0"],
                    downloads: 1100,
                    rating: 4.6,
                    ratingCount: 38,
                    license: "MIT",
                    compatibility: {
                        claudeCode: {
                            minVersion: "1.0.0",
                            tested: ["1.0.0"]
                        }
                    },
                    createdAt: "2024-01-15T00:00:00Z",
                    updatedAt: "2024-01-15T00:00:00Z"
                },
                "docs-architect": {
                    id: "docs-architect",
                    name: { en: "Documentation Architect", zh: "文档架构师" },
                    description: { en: "Creates comprehensive and well-structured documentation", zh: "创建全面且结构良好的文档" },
                    author: "wshobson",
                    category: "documentation",
                    tags: ["documentation", "writing", "structure"],
                    latest: "1.0.0",
                    versions: ["1.0.0"],
                    downloads: 520,
                    rating: 4.5,
                    ratingCount: 22,
                    license: "MIT",
                    compatibility: {
                        claudeCode: {
                            minVersion: "1.0.0",
                            tested: ["1.0.0"]
                        }
                    },
                    createdAt: "2024-01-15T00:00:00Z",
                    updatedAt: "2024-01-15T00:00:00Z"
                }
            },
            categories: {
                "development": {
                    en: "Code Development",
                    zh: "代码开发",
                    description: {
                        en: "Agents for coding, refactoring, and code quality",
                        zh: "用于编码、重构和代码质量的代理"
                    },
                    icon: "💻"
                },
                "debugging": {
                    en: "Problem Solving",
                    zh: "问题排查",
                    description: {
                        en: "Agents for debugging and troubleshooting",
                        zh: "用于调试和故障排除的代理"
                    },
                    icon: "🐛"
                },
                "data": {
                    en: "Data & Analytics",
                    zh: "数据分析",
                    description: {
                        en: "Agents for data analysis and processing",
                        zh: "用于数据分析和处理的代理"
                    },
                    icon: "📊"
                },
                "documentation": {
                    en: "Documentation",
                    zh: "文档编写",
                    description: {
                        en: "Agents for writing and maintaining documentation",
                        zh: "用于编写和维护文档的代理"
                    },
                    icon: "📝"
                }
            },
            stats: {
                totalDownloads: 4435,
                activeUsers: 150,
                topAgents: ["python-pro", "data-scientist", "code-reviewer"],
                recentUpdates: []
            }
        };
    }

    /**
     * 搜索 Agents
     */
    async searchAgents(query: string, filters: SearchFilters = {}): Promise<AgentInfo[]> {
        const registry = await this.getRegistry();
        let results = Object.values(registry.agents);

        // 文本搜索
        if (query) {
            const lowerQuery = query.toLowerCase();
            results = results.filter(agent => 
                agent.name.en.toLowerCase().includes(lowerQuery) ||
                agent.name.zh.toLowerCase().includes(lowerQuery) ||
                agent.description.en.toLowerCase().includes(lowerQuery) ||
                agent.description.zh.toLowerCase().includes(lowerQuery) ||
                agent.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }

        // 分类过滤
        if (filters.category) {
            results = results.filter(agent => agent.category === filters.category);
        }

        // 标签过滤
        if (filters.tag) {
            const tagFilter = filters.tag;
            results = results.filter(agent => agent.tags.includes(tagFilter));
        }

        // 作者过滤
        if (filters.author) {
            const authorFilter = filters.author;
            results = results.filter(agent => 
                agent.author.toLowerCase().includes(authorFilter.toLowerCase())
            );
        }

        // 排序
        const sortBy = filters.sortBy || 'downloads';
        results.sort((a, b) => {
            switch (sortBy) {
                case 'downloads':
                    return b.downloads - a.downloads;
                case 'rating':
                    return b.rating - a.rating;
                case 'name':
                    return a.name.en.localeCompare(b.name.en);
                case 'updated':
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                default:
                    return 0;
            }
        });

        // 限制结果数量
        if (filters.limit) {
            results = results.slice(0, filters.limit);
        }

        return results;
    }

    /**
     * 获取 Agent 详细信息
     */
    async getAgentDetails(agentId: string): Promise<any> {
        return this.fetchWithCache(`agent-${agentId}`, async () => {
            // Parse author and name from agentId
            const [author, name] = this.parseAgentId(agentId);
            const url = `${AgentRegistryService.BASE_URL}/agents/${author}/${name}/metadata.json`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch agent details: ${response.statusText}`);
            }
            return await response.json();
        });
    }

    /**
     * 下载 Agent 内容
     */
    async downloadAgent(agentId: string, version?: string): Promise<string> {
        const details = await this.getAgentDetails(agentId);
        const targetVersion = version || details.latest;
        const versionInfo = details.versions[targetVersion];
        
        if (!versionInfo) {
            throw new Error(`Version ${targetVersion} not found for agent ${agentId}`);
        }

        // Parse author and name from agentId
        const [author, name] = this.parseAgentId(agentId);
        const agentUrl = `${AgentRegistryService.BASE_URL}/agents/${author}/${name}/agent.md`;
        const response = await fetch(agentUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to download agent: ${response.statusText}`);
        }
        
        return await response.text();
    }

    /**
     * 安装 Agent 到本地
     */
    async installAgent(agentId: string, content: string): Promise<void> {
        const claudeDir = path.join(os.homedir(), '.claude', 'agents');
        
        // 确保目录存在
        try {
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(claudeDir));
        } catch (error) {
            // 目录可能已存在
        }

        // 写入 Agent 文件
        const agentFile = vscode.Uri.file(path.join(claudeDir, `${agentId.replace('/', '_')}.md`));
        await vscode.workspace.fs.writeFile(agentFile, Buffer.from(content, 'utf8'));
    }

    /**
     * 获取已安装的 Agents
     */
    async getInstalledAgents(): Promise<string[]> {
        const claudeDir = path.join(os.homedir(), '.claude', 'agents');
        
        try {
            const claudeDirUri = vscode.Uri.file(claudeDir);
            const files = await vscode.workspace.fs.readDirectory(claudeDirUri);
            
            return files
                .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.md'))
                .map(([name]) => path.basename(name, '.md').replace('_', '/'));
        } catch (error) {
            return [];
        }
    }

    /**
     * 检查 Agent 更新
     */
    async checkForUpdates(installedAgents: string[]): Promise<Array<{id: string; currentVersion: string; latestVersion: string}>> {
        const registry = await this.getRegistry();
        const updates = [];

        for (const agentId of installedAgents) {
            const agent = registry.agents[agentId];
            if (agent) {
                // 这里简化处理，实际应该读取本地文件的版本信息
                const currentVersion = "1.0.0"; // 从本地文件解析
                if (agent.latest !== currentVersion) {
                    updates.push({
                        id: agentId,
                        currentVersion,
                        latestVersion: agent.latest
                    });
                }
            }
        }

        return updates;
    }

    /**
     * 获取分类列表
     */
    async getCategories(): Promise<{ [key: string]: any }> {
        const registry = await this.getRegistry();
        return registry.categories;
    }

    /**
     * 获取热门 Agents
     */
    async getFeaturedAgents(limit: number = 10): Promise<AgentInfo[]> {
        return this.searchAgents('', { sortBy: 'downloads', limit });
    }

    /**
     * 解析 Agent ID
     */
    private parseAgentId(agentId: string): [string, string] {
        const parts = agentId.split('/');
        if (parts.length === 2) {
            return [parts[0], parts[1]];
        }
        // Default to community if no author specified
        return ['community', agentId];
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
