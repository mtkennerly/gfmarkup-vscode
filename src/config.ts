import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export class Config {
    constructor(public autoScan: boolean, public imageDirectory: string, public imageFiles: string) { }

    static load(): Config {
        const config = vscode.workspace.getConfiguration("gfmarkup");
        return new Config(
            config.get("autoScan") || true,
            config.get("imageDirectory") || "${documentFolder}",
            config.get("imageFiles") || "${documentName}.${id}",
        );
    }

    getImageDirectory(uri: vscode.Uri): string {
        const wf = vscode.workspace.getWorkspaceFolder(uri);
        const workspaceFolder = wf === undefined ? "" : wf.uri.fsPath;
        const documentFolder = path.dirname(uri.fsPath);
        const documentName = path.basename(uri.fsPath);
        let value = this.imageDirectory
            .replace(/\$\{workspaceFolder\}/g, workspaceFolder)
            .replace(/\$\{documentFolder\}/g, documentFolder)
            .replace(/\$\{documentName\}/g, documentName);
        return value;
    }

    getImageFiles(id: number, uri: vscode.Uri): string {
        const documentName = path.basename(uri.fsPath);
        let value = this.imageFiles
            .replace(/\$\{id\}/g, id.toString())
            .replace(/\$\{documentName\}/g, documentName);
        return value;
    }

    static getTextMateRules(): Array<object> {
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
            {
                "name": "gfmarkup-autogenerated",
                "scope": "punctuation.definition.list.begin.gfmarkup",
                "settings": {
                    "foreground": "#6796e6ff"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "punctuation.definition.block.gfmarkup",
                "settings": {
                    "foreground": "#4ec9b0ff"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "punctuation.definition.table.separator.gfmarkup",
                "settings": {
                    "foreground": "#6796e6ff"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "meta.image.gfmarkup",
                "settings": {
                    "foreground": "#c586c0ff"
                }
            },
            {
                "name": "gfmarkup-autogenerated",
                "scope": "meta.video.gfmarkup",
                "settings": {
                    "foreground": "#c586c0ff"
                }
            },
        ];
    }
}

export function getExtensionUri(): vscode.Uri {
    return vscode.Uri.file(path.join(__dirname, "..", ".."));
}

export function getMediaDir(): vscode.Uri {
    return vscode.Uri.file(path.join(__dirname, "..", "..", "media"));
}

export function getMediaFile(resource: string): vscode.Uri {
    return vscode.Uri.file(path.join(__dirname, "..", "..", "media", resource));
}

export function getMediaResource(resource: string): string {
    return getVscodeResourceUri(getMediaFile(resource)).toString();
}

export function getVscodeResourceUri(resource: vscode.Uri | string): vscode.Uri {
    if (typeof resource === "string") {
        resource = vscode.Uri.file(resource);
    }
    return resource.with({ scheme: "vscode-resource" });
}

export function getVscodeResource(resource: string): string {
    return vscode.Uri.file(resource).with({ scheme: "vscode-resource" }).toString();
}

export function getMarkupImage(id: number, uri: vscode.Uri): string | null {
    const config = Config.load();
    const imageDirectory = config.getImageDirectory(uri);
    const imageFiles = config.getImageFiles(id, uri);
    const extensions = ["jpg", "png", "bmp", "gif"];

    for (const extension of extensions) {
        const resource = `${imageDirectory}/${imageFiles}.${extension}`;
        if (fs.existsSync(resource)) {
            return getVscodeResource(resource);
        }
    }
    return null;
}
