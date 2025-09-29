import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AgentRegistryService } from './agentRegistryService';

export interface InstalledAgent {
    id: string;
    version: string;
    installedAt: string;
    target: string;
    path: string;
    name?: string;
    description?: string;
}

export interface InstallOptions {
    version?: string;
    target?: string;
    force?: boolean;
}

export class AgentInstallerService {
    private static readonly USER_INSTALL_DIR = path.join(os.homedir(), '.claude', 'agents');
    // We'll use a centralized registry file under .agents for cross-CLI compatibility
    private static readonly INSTALLED_REGISTRY = path.join(os.homedir(), '.agents', 'installed.json');
    
    private registryService: AgentRegistryService;

    constructor() {
        // Create a minimal context object for the AgentRegistryService
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
        
        this.registryService = new AgentRegistryService(mockContext);
    }

    /**
     * Install an agent locally
     */
    async installAgent(agentId: string, options: InstallOptions = {}): Promise<void> {
        try {
            // Parse agentId to get the actual agent name
            const { author, id } = this.parseAgentId(agentId);
            
            // Get agent details from registry
            const agents = await this.registryService.getAllAgents();
            const agent = agents.find(a => a.id === id && a.author === author);
            
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }

            // Ensure we have a concrete version number
            let version = options.version || agent.version || '1.0.0';
            if (version === 'latest') {
                version = '1.0.0'; // Default to 1.0.0 if version is 'latest'
            }
            const target = options.target || 'claude-code';
            
            // Check if already installed
            const installed = await this.getInstalledAgents();
            const existing = installed.find(a => a.id === agentId && a.target === target);
            
            if (existing && !options.force) {
                throw new Error(`Agent ${agentId} is already installed for ${target}. Use force option to reinstall.`);
            }

            // Download agent content
            const content = await this.registryService.downloadAgent(agentId, version);
            
            // Determine install path
            const installPath = this.getInstallPath(target, agentId, version);
            await this.ensureDir(path.dirname(installPath));
            
            // Write agent file
            await fs.promises.writeFile(installPath, content, 'utf-8');
            
            // Register installed agent
            await this.registerInstalledAgent({
                id: agentId,
                version,
                installedAt: new Date().toISOString(),
                target,
                path: installPath,
                name: typeof agent.name === 'string' ? agent.name : agent.name?.en || agentId,
                description: typeof agent.description === 'string' ? agent.description : agent.description?.en || ''
            });

            const location = target === 'claude-code' ? 'Claude Code agents directory' : target;
            vscode.window.showInformationMessage(`Successfully installed ${agentId}@${version} to ${location}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to install ${agentId}: ${message}`);
            throw error;
        }
    }

    /**
     * Uninstall an agent
     */
    async uninstallAgent(agentId: string, target: string = 'claude-code'): Promise<void> {
        try {
            const installed = await this.getInstalledAgents();
            const agent = installed.find(a => a.id === agentId && a.target === target);
            
            if (!agent) {
                throw new Error(`Agent ${agentId} is not installed for ${target}`);
            }

            // Remove file
            try {
                await fs.promises.access(agent.path);
                await fs.promises.unlink(agent.path);
            } catch (error) {
                console.warn(`Failed to remove agent file: ${error}`);
            }

            // Update registry
            const remaining = installed.filter(a => !(a.id === agentId && a.target === target));
            await this.saveInstalledAgents(remaining);

            vscode.window.showInformationMessage(`Successfully uninstalled ${agentId} from ${target}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to uninstall ${agentId}: ${message}`);
            throw error;
        }
    }

    /**
     * Get all installed agents
     */
    async getInstalledAgents(): Promise<InstalledAgent[]> {
        try {
            await fs.promises.access(AgentInstallerService.INSTALLED_REGISTRY);
            const content = await fs.promises.readFile(AgentInstallerService.INSTALLED_REGISTRY, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            // File doesn't exist or is corrupted, return empty array
            return [];
        }
    }

    /**
     * Check if an agent is installed
     */
    async isAgentInstalled(agentId: string, target: string = 'claude-code'): Promise<boolean> {
        const installed = await this.getInstalledAgents();
        return installed.some(a => a.id === agentId && a.target === target);
    }

    /**
     * Get installed agent details
     */
    async getInstalledAgent(agentId: string, target: string = 'claude-code'): Promise<InstalledAgent | undefined> {
        const installed = await this.getInstalledAgents();
        return installed.find(a => a.id === agentId && a.target === target);
    }

    /**
     * Get installation directory
     */
    getInstallDirectory(): string {
        return AgentInstallerService.USER_INSTALL_DIR;
    }

    /**
     * Open installation directory in explorer
     */
    async openInstallDirectory(): Promise<void> {
        const installDir = this.getInstallDirectory();
        await this.ensureDir(installDir);
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(installDir));
    }

    private getInstallPath(target: string, agentId: string, version: string): string {
        const homeDir = os.homedir();
        
        // Parse agentId to get author and agent name
        const { author, id } = this.parseAgentId(agentId);
        
        // Create filename with format: author_agent-name_version.md
        const filename = `${author}_${id}_v${version}.md`;
        
        switch (target) {
            case 'claude-code':
                // Install to Claude Code's user agents directory: ~/.claude/agents/
                return path.join(homeDir, '.claude', 'agents', filename);
            case 'codex':
                // Install to Codex agents directory: ~/.codex/agents/
                return path.join(homeDir, '.codex', 'agents', filename);
            case 'copilot':
                // Install to Copilot agents directory: ~/.copilot/agents/
                return path.join(homeDir, '.copilot', 'agents', filename);
            default:
                // Fallback for unknown targets
                return path.join(homeDir, `.${target}`, 'agents', filename);
        }
    }

    /**
     * 解析agent ID，支持 author/agent-name[@version] 格式
     */
    private parseAgentId(agentId: string): { author: string; id: string; version?: string } {
        // Handle author/agent-name[@version] format
        const versionMatch = agentId.match(/^(.+)@(.+)$/);
        if (versionMatch) {
            const [, idPart, version] = versionMatch;
            const authorMatch = idPart.match(/^([^/]+)\/(.+)$/);
            if (authorMatch) {
                const [, author, id] = authorMatch;
                return { author, id, version };
            }
        }
        
        // Handle author/agent-name format
        const authorMatch = agentId.match(/^([^/]+)\/(.+)$/);
        if (authorMatch) {
            const [, author, id] = authorMatch;
            return { author, id };
        }
        
        // Fallback for legacy format (agent-name only)
        return { author: 'unknown', id: agentId };
    }

    private async registerInstalledAgent(agent: InstalledAgent): Promise<void> {
        const installed = await this.getInstalledAgents();
        
        // Remove existing entry for same agent and target
        const filtered = installed.filter(a => !(a.id === agent.id && a.target === agent.target));
        filtered.push(agent);
        
        await this.saveInstalledAgents(filtered);
    }

    private async saveInstalledAgents(agents: InstalledAgent[]): Promise<void> {
        await this.ensureDir(path.dirname(AgentInstallerService.INSTALLED_REGISTRY));
        await fs.promises.writeFile(
            AgentInstallerService.INSTALLED_REGISTRY, 
            JSON.stringify(agents, null, 2),
            'utf-8'
        );
    }

    private async ensureDir(dirPath: string): Promise<void> {
        try {
            await fs.promises.access(dirPath);
        } catch {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
    }
}
