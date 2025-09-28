import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// 使用一个对象来存储不同模块的翻译
let translations: { [namespace: string]: { [key: string]: string } } = {};
let language = 'en';

export function loadTranslations(context: vscode.ExtensionContext) {
    // 支持多种语言，默认为英文
    if (vscode.env.language.startsWith('zh')) {
        language = 'zh';
    } else if (vscode.env.language.startsWith('ja')) {
        language = 'ja';
    } else if (vscode.env.language.startsWith('de')) {
        language = 'de';
    } else if (vscode.env.language.startsWith('fr')) {
        language = 'fr';
    } else if (vscode.env.language.startsWith('es')) {
        language = 'es';
    } else if (vscode.env.language.startsWith('pt')) {
        language = 'pt';
    } else if (vscode.env.language.startsWith('vi')) {
        language = 'vi';
    } else if (vscode.env.language.startsWith('hi')) {
        language = 'hi';
    } else if (vscode.env.language.startsWith('ko')) {
        language = 'ko';
    } else if (vscode.env.language.startsWith('ru')) {
        language = 'ru';
    } else if (vscode.env.language.startsWith('ar')) {
        language = 'ar';
    } else {
        language = 'en';
    }
    const langDir = path.join(context.extensionPath, 'l10n', language);

    console.log(`[i18n] Loading translations for language: ${language}`);
    console.log(`[i18n] Language directory: ${langDir}`);

    if (!fs.existsSync(langDir)) {
        console.error(`[i18n] Language directory not found: ${langDir}`);
        // 尝试加载备用语言（英语）
        const fallbackDir = path.join(context.extensionPath, 'l10n', 'en');
        if (fs.existsSync(fallbackDir)) {
            console.log(`[i18n] Loading fallback language from: ${fallbackDir}`);
            fs.readdirSync(fallbackDir).forEach(file => loadFile(fallbackDir, file));
        }
        return;
    }
    
    fs.readdirSync(langDir).forEach(file => loadFile(langDir, file));
    console.log(`[i18n] Loaded ${Object.keys(translations).length} translation namespaces:`, Object.keys(translations));
}

function loadFile(dir: string, file: string) {
    if (file.endsWith('.json')) {
        const namespace = path.basename(file, '.json');
        const filePath = path.join(dir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            translations[namespace] = JSON.parse(content);
            console.log(`[i18n] Loaded namespace: ${namespace} with ${Object.keys(JSON.parse(content)).length} keys`);
        } catch (error) {
            console.error(`[i18n] Failed to load ${namespace} translations:`, error);
        }
    }
}

// 获取翻译时，需要指定是哪个模块的哪个 key
export function t(key: string, ...args: any[]): string {
    const parts = key.split('.');
    if (parts.length < 2) {
        console.warn(`[i18n] Invalid key format: ${key}.`);
        return key;
    }

    const namespace = parts[0];
    const translationKey = parts.slice(1).join('.'); // 从第二个元素开始，将剩余部分用'.'重新连接

    let message = translations[namespace]?.[translationKey] || key;

    if (message === key) {
        console.warn(`[i18n] Translation not found for key: ${key}.`);
    }

    if (args.length > 0) {
        message = message.replace(/\{(\d+)\}/g, (match, number) => {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    }
    
    return message;
}
