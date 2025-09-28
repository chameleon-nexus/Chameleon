import * as vscode from 'vscode';

export interface ChameleonNotebookData {
    cells: ChameleonCell[];
    metadata: {
        version: string;
        created: string;
        modified: string;
        chameleon_config: {
            default_model: string;
            routing_rules: any[];
            api_configs: any[];
        };
    };
}

export interface ChameleonCell {
    id: string;
    type: 'markdown' | 'code' | 'claude-prompt' | 'claude-response';
    content: string;
    language?: string;
    outputs: CellOutput[];
    metadata: {
        execution_count?: number;
        claude_model?: string;
        claude_tokens?: number;
        execution_time?: number;
    };
}

export interface CellOutput {
    type: 'text' | 'markdown' | 'json' | 'error' | 'claude-response';
    data: string;
    metadata?: Record<string, any>;
}

export class ChameleonNotebookProvider implements vscode.NotebookSerializer {
    async deserializeNotebook(data: Uint8Array): Promise<vscode.NotebookData> {
        const content = Buffer.from(data).toString('utf-8');
        try {
            const notebookData: ChameleonNotebookData = JSON.parse(content);
            return {
                cells: notebookData.cells.map(cell => ({
                    kind: this.mapCellTypeToKind(cell.type),
                    value: cell.content,
                    languageId: cell.language || 'markdown',
                    outputs: cell.outputs.map(output => ({
                        items: [{
                            mime: 'text/plain',
                            data: Buffer.from(output.data)
                        }]
                    }))
                })),
                metadata: notebookData.metadata
            };
        } catch (error) {
            // 如果解析失败，返回默认的notebook
            return {
                cells: [{
                    kind: vscode.NotebookCellKind.Markup,
                    value: '# Chameleon Notebook\n\nWelcome to Chameleon!',
                    languageId: 'markdown'
                }],
                metadata: {
                    version: '1.0.0',
                    created: new Date().toISOString(),
                    chameleon_config: {
                        default_model: 'deepseek-chat',
                        routing_rules: [],
                        api_configs: []
                    }
                }
            };
        }
    }

    async serializeNotebook(data: vscode.NotebookData): Promise<Uint8Array> {
        const notebookData: ChameleonNotebookData = {
            cells: data.cells.map(cell => ({
                id: this.generateCellId(),
                type: this.mapCellKindToType(cell.kind) as 'markdown' | 'code' | 'claude-prompt' | 'claude-response',
                content: cell.value,
                language: cell.languageId,
                outputs: cell.outputs?.map(output => ({
                    type: 'text',
                    data: output.items[0]?.data.toString() || '',
                    metadata: {}
                })) || [],
                metadata: {}
            })),
            metadata: {
                version: '1.0.0',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                chameleon_config: {
                    default_model: 'deepseek-chat',
                    routing_rules: [],
                    api_configs: []
                },
                ...data.metadata
            }
        };

        return Buffer.from(JSON.stringify(notebookData, null, 2));
    }

    private mapCellKindToType(kind: vscode.NotebookCellKind): string {
        switch (kind) {
            case vscode.NotebookCellKind.Markup:
                return 'markdown';
            case vscode.NotebookCellKind.Code:
                return 'code';
            default:
                return 'markdown';
        }
    }

    private mapCellTypeToKind(type: string): vscode.NotebookCellKind {
        switch (type) {
            case 'markdown':
                return vscode.NotebookCellKind.Markup;
            case 'code':
            case 'claude-prompt':
            case 'claude-response':
                return vscode.NotebookCellKind.Code;
            default:
                return vscode.NotebookCellKind.Markup;
        }
    }

    private generateCellId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
