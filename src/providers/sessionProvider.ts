import * as vscode from 'vscode';

export interface ClaudeSession {
    id: string;
    name: string;
    created: Date;
    modified: Date;
    messages: ClaudeMessage[];
    model: string;
    status: 'active' | 'archived' | 'deleted';
}

export interface ClaudeMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    model?: string;
    tokens?: number;
}

export class ChameleonSessionProvider implements vscode.TreeDataProvider<SessionItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SessionItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private sessions: ClaudeSession[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.loadSessions();
    }

    getTreeItem(element: SessionItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SessionItem): Thenable<SessionItem[]> {
        if (!element) {
            // 过滤出活跃的会话
            const activeSessions = this.sessions.filter(s => s.status === 'active');
            
            return Promise.resolve(
                activeSessions.map(session => new SessionItem(
                    session.name,
                    session.id,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'chameleon.session.open',
                        title: 'Open Session',
                        arguments: [session.id]
                    },
                    session.messages.length,
                    session.modified
                ))
            );
        }
        return Promise.resolve([]);
    }

    async refresh(): Promise<void> {
        await this.loadSessions();
        this._onDidChangeTreeData.fire();
    }

    async createSession(name: string, model: string = 'deepseek-chat'): Promise<string> {
        const session: ClaudeSession = {
            id: this.generateId(),
            name,
            created: new Date(),
            modified: new Date(),
            messages: [],
            model,
            status: 'active'
        };

        this.sessions.push(session);
        await this.saveSessions();
        this._onDidChangeTreeData.fire();

        return session.id;
    }

    async getSession(sessionId: string): Promise<ClaudeSession | undefined> {
        return this.sessions.find(s => s.id === sessionId);
    }

    async addMessage(sessionId: string, message: Omit<ClaudeMessage, 'id' | 'timestamp'>): Promise<void> {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            const newMessage: ClaudeMessage = {
                ...message,
                id: this.generateId(),
                timestamp: new Date()
            };
            
            session.messages.push(newMessage);
            session.modified = new Date();
            await this.saveSessions();
            this._onDidChangeTreeData.fire();
        }
    }

    async deleteSession(sessionId: string): Promise<void> {
        const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            this.sessions[sessionIndex].status = 'deleted';
            await this.saveSessions();
            this._onDidChangeTreeData.fire();
        }
    }

    async archiveSession(sessionId: string): Promise<void> {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            session.status = 'archived';
            session.modified = new Date();
            await this.saveSessions();
            this._onDidChangeTreeData.fire();
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    private async loadSessions(): Promise<void> {
        try {
            const sessionsData = await this.context.globalState.get('chameleon.sessions', '[]');
            const parsedSessions = JSON.parse(sessionsData);
            
            // 转换日期字符串回Date对象
            this.sessions = parsedSessions.map((session: any) => ({
                ...session,
                created: new Date(session.created),
                modified: new Date(session.modified),
                messages: session.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }))
            }));
        } catch (error) {
            console.error('Failed to load sessions:', error);
            this.sessions = [];
        }
    }

    private async saveSessions(): Promise<void> {
        await this.context.globalState.update('chameleon.sessions', JSON.stringify(this.sessions));
    }
}

export class SessionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly sessionId: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly messageCount: number = 0,
        public readonly lastModified?: Date
    ) {
        super(label, collapsibleState);
        this.tooltip = `Session: ${label}\nMessages: ${messageCount}\nLast Modified: ${lastModified?.toLocaleString() || 'Never'}`;
        this.iconPath = new vscode.ThemeIcon('comment-discussion');
        
        // 显示消息数量
        if (messageCount > 0) {
            this.description = `${messageCount} messages`;
        }
        
        // 根据最后修改时间显示状态
        if (lastModified) {
            const now = new Date();
            const diffHours = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60);
            
            if (diffHours < 1) {
                this.contextValue = 'recent';
            } else if (diffHours < 24) {
                this.contextValue = 'today';
            } else {
                this.contextValue = 'older';
            }
        }
    }
}


