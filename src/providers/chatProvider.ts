import * as vscode from 'vscode';
import { ClaudeClient } from '../utils/claudeClient';

export class ChatProvider implements vscode.TreeDataProvider<ChatItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ChatItem | undefined | null | void> = new vscode.EventEmitter<ChatItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ChatItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private chatHistory: ChatItem[] = [];
    private claudeClient: ClaudeClient;

    constructor() {
        this.claudeClient = new ClaudeClient();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ChatItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ChatItem): Thenable<ChatItem[]> {
        if (!element) {
            return Promise.resolve(this.chatHistory);
        }
        return Promise.resolve([]);
    }

    async sendMessage(message: string): Promise<string> {
        try {
            const response = await this.claudeClient.sendMessage(message);
            
            // 添加到聊天历史
            const userItem = new ChatItem(`👤 用户`, message, vscode.TreeItemCollapsibleState.None);
            const aiItem = new ChatItem(`🤖 Chameleon`, response.content, vscode.TreeItemCollapsibleState.None);
            
            this.chatHistory.push(userItem, aiItem);
            this.refresh();
            
            return response.content;
        } catch (error) {
            const errorItem = new ChatItem(`❌ 错误`, `发送消息失败: ${error}`, vscode.TreeItemCollapsibleState.None);
            this.chatHistory.push(errorItem);
            this.refresh();
            throw error;
        }
    }

    clearHistory(): void {
        this.chatHistory = [];
        this.refresh();
    }
}

export class ChatItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly content: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = content;
        this.description = content.length > 50 ? content.substring(0, 50) + '...' : content;
    }

    contextValue = 'chatItem';
}
