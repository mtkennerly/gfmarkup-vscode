import * as vscode from 'vscode';
import * as path from 'path';

export class Config {
    constructor(public autoScan: boolean) { }

    static load(): Config {
        const config = vscode.workspace.getConfiguration("gfmarkup");
        return new Config(
            config.get("autoScan") || false
        );
    }

    static getTextMateRules(): Array<Object> {
        return [
            {
                "name": "gfmarkup-autogenerated",
                "scope": "markup.bold.gfmarkup",
                "settings": {
                    "fontStyle": "bold"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "markup.italic.gfmarkup",
                "settings": {
                    "fontStyle": "italic"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "markup.underline.gfmarkup",
                "settings": {
                    "fontStyle": "underline"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "markup.bold-italic.gfmarkup",
                "settings": {
                    "fontStyle": "bold italic"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "markup.bold-underline.gfmarkup",
                "settings": {
                    "fontStyle": "bold underline"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "markup.italic-underline.gfmarkup",
                "settings": {
                    "fontStyle": "italic underline"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "markup.bold-italic-underline.gfmarkup",
                "settings": {
                    "fontStyle": "bold italic underline"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "markup.spoiler.gfmarkup",
                "settings": {
                    "foreground": "#FF0000"
                }
            },
        ];
    }
}

export function getMediaDir(): vscode.Uri {
    return vscode.Uri.file(path.join(__dirname, "..", "media"));
}

export function getMediaFile(resource: string): vscode.Uri {
    return vscode.Uri.file(path.join(__dirname, "..", "media", resource));
}

export function getMediaResource(resource: string): string {
    return `vscode-resource://${getMediaFile(resource).toString()}`;
}

export function fromUndefined<A, B>(value: A | undefined, fallback: B) {
    if (value === undefined) {
        return fallback;
    } else {
        return value;
    }
}
