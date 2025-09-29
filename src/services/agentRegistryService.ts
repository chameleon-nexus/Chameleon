// src/services/agentRegistryService.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';

export interface AgentInfo {
    id: string;
    name: { en: string; zh: string; ja: string };
    description: { en: string; zh: string; ja: string };
    author: string;
    category: string;
    tags: string[];
    version: string;
    versions: Record<string, any>;
    downloads: number;
    rating: number;
    ratingCount?: number;
    license: string;
    compatibility: {
        claudeCode?: {
            minVersion: string;
            tested?: string[];
        };
        'claude-code'?: boolean | {
            minVersion: string;
            tested?: string[];
        };
        codex?: {
            minVersion: string;
            tested?: string[];
        };
        copilot?: {
            minVersion: string;
            tested?: string[];
        };
    };
    createdAt: string;
    updatedAt: string;
    files?: {
        latest: string;
    };
}

export interface Registry {
    version: string;
    lastUpdated: string;
    totalAgents: number;
    languages: string[];
    categories: { [key: string]: CategoryInfo };
    featured: {
        count: number;
        url: string;
        description: {
            en: string;
            zh: string;
            ja: string;
        };
    };
    stats: any;
}

export interface CategoryInfo {
    count: number;
    url: string;
    name: {
        en: string;
        zh: string;
        ja: string;
    };
    description: {
        en: string;
        zh: string;
        ja: string;
    };
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
            const url = `${AgentRegistryService.BASE_URL}/index/main.json`;
            
            const response = await this.httpGet(url);
            return JSON.parse(response);
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
            version: "2.0.0",
            lastUpdated: new Date().toISOString(),
            totalAgents: 5,
            languages: ["en", "zh", "ja"],
            featured: {
                count: 5,
                url: "index/featured.json",
                description: {
                    en: "Top featured agents",
                    zh: "热门代理",
                    ja: "おすすめエージェント"
                }
            },
            categories: {
                "ui-mobile": {
                    count: 2,
                    url: "index/categories/ui-mobile.json",
                    name: {
                        en: "UI/UX & Mobile",
                        zh: "UI/UX与移动端",
                        ja: "UI/UX・モバイル"
                    },
                    description: {
                        en: "User interface design, mobile development, and visual validation",
                        zh: "用户界面设计、移动开发和视觉验证",
                        ja: "ユーザーインターフェース設計、モバイル開発、ビジュアル検証"
                    }
                },
                "web-programming": {
                    count: 2,
                    url: "index/categories/web-programming.json",
                    name: {
                        en: "Web & Application Programming",
                        zh: "Web与应用程序编程",
                        ja: "Web・アプリケーションプログラミング"
                    },
                    description: {
                        en: "Modern web development with JavaScript, Python, and other dynamic languages",
                        zh: "使用JavaScript、Python等动态语言进行现代Web开发",
                        ja: "JavaScript、Pythonなどの動的言語によるモダンWeb開発"
                    }
                },
                "documentation": {
                    count: 1,
                    url: "index/categories/documentation.json",
                    name: {
                        en: "Documentation & Technical Writing",
                        zh: "文档与技术写作",
                        ja: "ドキュメント・技術文書"
                    },
                    description: {
                        en: "Technical documentation, API specs, and content creation",
                        zh: "技术文档、API规范和内容创建",
                        ja: "技術文書、API仕様、コンテンツ作成"
                    }
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

    private getMockAgents(): AgentInfo[] {
        return [
            {
                id: "python-pro",
                name: { en: "Python Pro", zh: "Python 专家", ja: "Python プロ" },
                description: { en: "Expert Python developer for all your coding needs", zh: "专业的 Python 开发专家", ja: "すべてのコーディングニーズに対応する専門的なPython開発者" },
                author: "wshobson",
                category: "web-programming",
                tags: ["python", "development", "coding"],
                version: "1.0.0",
                versions: { "1.0.0": {} },
                downloads: 1250,
                rating: 4.8,
                ratingCount: 45,
                license: "MIT",
                compatibility: {
                    claudeCode: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    },
                    codex: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    }
                },
                createdAt: "2024-01-15T00:00:00Z",
                updatedAt: "2024-01-15T00:00:00Z"
            },
            {
                id: "code-reviewer",
                name: { en: "Code Reviewer", zh: "代码审查专家", ja: "コードレビューア" },
                description: { en: "Professional code review expert specializing in security and quality", zh: "专业的代码审查专家，专注于安全和质量", ja: "セキュリティと品質に特化したプロのコードレビュー専門家" },
                author: "wshobson",
                category: "web-programming",
                tags: ["review", "security", "quality"],
                version: "1.0.0",
                versions: { "1.0.0": {} },
                downloads: 890,
                rating: 4.9,
                ratingCount: 32,
                license: "MIT",
                compatibility: {
                    claudeCode: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    },
                    codex: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    }
                },
                createdAt: "2024-01-15T00:00:00Z",
                updatedAt: "2024-01-15T00:00:00Z"
            },
            {
                id: "ui-ux-designer",
                name: { en: "UI/UX Designer", zh: "UI/UX设计师", ja: "UI/UXデザイナー" },
                description: { en: "Interface design, wireframes, design systems", zh: "界面设计、线框图、设计系统", ja: "インターフェース設計、ワイヤーフレーム、デザインシステム" },
                author: "wshobson",
                category: "ui-mobile",
                tags: ["ui", "ux", "design"],
                version: "1.0.0",
                versions: { "1.0.0": {} },
                downloads: 675,
                rating: 4.7,
                ratingCount: 28,
                license: "MIT",
                compatibility: {
                    claudeCode: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    },
                    codex: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    }
                },
                createdAt: "2024-01-15T00:00:00Z",
                updatedAt: "2024-01-15T00:00:00Z"
            },
            {
                id: "mobile-developer",
                name: { en: "Mobile Developer", zh: "移动开发者", ja: "モバイル開発者" },
                description: { en: "React Native and Flutter application development", zh: "React Native和Flutter应用开发", ja: "React NativeとFlutterアプリケーション開発" },
                author: "wshobson",
                category: "ui-mobile",
                tags: ["mobile", "react-native", "flutter"],
                version: "1.0.0",
                versions: { "1.0.0": {} },
                downloads: 1100,
                rating: 4.6,
                ratingCount: 38,
                license: "MIT",
                compatibility: {
                    claudeCode: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    },
                    codex: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    }
                },
                createdAt: "2024-01-15T00:00:00Z",
                updatedAt: "2024-01-15T00:00:00Z"
            },
            {
                id: "docs-architect",
                name: { en: "Documentation Architect", zh: "文档架构师", ja: "ドキュメントアーキテクト" },
                description: { en: "Creates comprehensive and well-structured documentation", zh: "创建全面且结构良好的文档", ja: "包括的で構造化されたドキュメントを作成" },
                author: "wshobson",
                category: "documentation",
                tags: ["documentation", "writing", "structure"],
                version: "1.0.0",
                versions: { "1.0.0": {} },
                downloads: 520,
                rating: 4.5,
                ratingCount: 22,
                license: "MIT",
                compatibility: {
                    claudeCode: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    },
                    codex: {
                        minVersion: "1.0.0",
                        tested: ["1.0.0"]
                    }
                },
                createdAt: "2024-01-15T00:00:00Z",
                updatedAt: "2024-01-15T00:00:00Z"
            }
        ];
    }

    /**
     * 获取热门 Agents
     */
    async getFeaturedAgents(): Promise<AgentInfo[]> {
        return this.fetchWithCache('featured', async () => {
            const url = `${AgentRegistryService.BASE_URL}/index/featured.json`;
            
            const response = await this.httpGet(url);
            const featuredData = JSON.parse(response);
            return featuredData.agents || [];
        });
    }

    /**
     * 获取分类 Agents
     */
    async getCategoryAgents(category: string): Promise<AgentInfo[]> {
        return this.fetchWithCache(`category-${category}`, async () => {
            const url = `${AgentRegistryService.BASE_URL}/index/categories/${category}.json`;
            console.log(`Fetching category agents for: ${category} from ${url}`);
            
            const response = await this.httpGet(url);
            const categoryData = JSON.parse(response);
            console.log(`Successfully fetched data for category ${category}:`, categoryData);
            console.log(`Agents array:`, categoryData.agents);
            console.log(`Agents count: ${categoryData.agents?.length || 0}`);
            const agents = categoryData.agents || [];
            console.log(`About to return ${agents.length} agents from getCategoryAgents`);
            return agents;
        });
    }

    /**
     * 获取所有 Agents (用于搜索)
     */
    async getAllAgents(): Promise<AgentInfo[]> {
        const registry = await this.getRegistry();
        const categories = Object.keys(registry.categories);
        
        // 并行获取所有分类的agents
        const categoryPromises = categories.map(category => 
            this.getCategoryAgents(category).catch(() => [])
        );
        
        const categoryResults = await Promise.all(categoryPromises);
        const allAgents = categoryResults.flat();
        
        // 去重 (按agent ID)
        const uniqueAgents = allAgents.filter((agent, index, self) => 
            index === self.findIndex(a => a.id === agent.id)
        );
        
        return uniqueAgents;
    }

    /**
     * 搜索 Agents
     */
    async searchAgents(query: string, filters: SearchFilters = {}): Promise<AgentInfo[]> {
        let results: AgentInfo[] = [];

        if (filters.category) {
            // 如果选择了分类，获取分类agents
            console.log(`Getting category agents for: ${filters.category}`);
            results = await this.getCategoryAgents(filters.category);
            console.log(`Got ${results.length} agents from getCategoryAgents`);
            console.log(`First agent:`, results[0]);
        } else {
            // 没有选择分类，获取热门agents
            console.log('Getting featured agents');
            results = await this.getFeaturedAgents();
            console.log(`Got ${results.length} featured agents`);
        }

        // 文本搜索
        if (query) {
            const lowerQuery = query.toLowerCase();
            results = results.filter(agent => 
                agent.name.en.toLowerCase().includes(lowerQuery) ||
                agent.name.zh.toLowerCase().includes(lowerQuery) ||
                agent.name.ja.toLowerCase().includes(lowerQuery) ||
                agent.description.en.toLowerCase().includes(lowerQuery) ||
                agent.description.zh.toLowerCase().includes(lowerQuery) ||
                agent.description.ja.toLowerCase().includes(lowerQuery) ||
                agent.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }

        // 分类过滤已经在getCategoryAgents中完成，无需重复过滤

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
            
            try {
                const response = await this.httpGet(url);
                return JSON.parse(response);
            } catch (error) {
                throw new Error(`Failed to fetch agent details: ${error}`);
            }
        });
    }

    /**
     * 下载 Agent 内容
     */
    async downloadAgent(agentId: string, version?: string): Promise<string> {
        // Parse author and name from agentId
        const [author, name] = this.parseAgentId(agentId);
        const targetVersion = version || '1.0.0'; // Default to 1.0.0 if no version specified
        
        const filename = `${name}_v${targetVersion}.md`;
        const agentUrl = `${AgentRegistryService.BASE_URL}/agents/${author}/${name}/${filename}`;
        
        return this.fetchWithCache(`agent_${agentId}_${targetVersion}`, async () => {
            const response = await this.httpGet(agentUrl);
            return response;
        });
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
        const allAgents = await this.getAllAgents();
        const updates = [];

        for (const agentId of installedAgents) {
            const agent = allAgents.find(a => a.id === agentId);
            if (agent) {
                // 这里简化处理，实际应该读取本地文件的版本信息
                const currentVersion = "1.0.0"; // 从本地文件解析
                if (agent.version !== currentVersion) {
                    updates.push({
                        id: agentId,
                        currentVersion,
                        latestVersion: agent.version
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
     * 解析 Agent ID
     */
    private parseAgentId(agentId: string): [string, string] {
        const parts = agentId.split('/');
        if (parts.length === 2) {
            return [parts[0], parts[1]];
        }
        // Default to wshobson if no author specified
        return ['wshobson', agentId];
    }

    /**
     * 缓存辅助方法
     */
    private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            console.log(`Returning cached data for ${key}:`, cached.data);
            return cached.data;
        }

        console.log(`Fetching fresh data for ${key}`);
        const data = await fetcher();
        console.log(`Caching and returning data for ${key}:`, data);
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