import * as path from "path";
import * as vscode from "vscode";
import { Config, getExtensionUri, getVscodeResourceUri } from "./config";
import { logTest } from "./etc";
import * as gfm from "./gfmarkup";

function precheckDocumentForGfm(document: vscode.TextDocument, silent: boolean = false): boolean {
    if (!gfm.isDocumentGfm(document)) {
        if (!silent) {
            vscode.window.showErrorMessage(`Not a valid GameFAQs Markup file; missing '${gfm.SHEBANG}'`);
        }
        return false;
    }
    return true;
}

function precheckEditorForGfm(editor: vscode.TextEditor | undefined, silent: boolean = false): boolean {
    if (editor === undefined) {
        if (!silent) {
            vscode.window.showErrorMessage("A file must be active first");
        }
        return false;
    }
    return precheckDocumentForGfm(editor.document, silent);
}

export function scanForGfm(): void {
    for (const editor of vscode.window.visibleTextEditors) {
        const okay = precheckEditorForGfm(editor, true);
        if (!okay) { continue; }
        vscode.languages.setTextDocumentLanguage(editor.document, gfm.LANG_ID);
    }
    vscode.window.onDidChangeActiveTextEditor(event => {
        if (event === undefined) { return; }
        const okay = precheckDocumentForGfm(event.document, true);
        if (!okay) { return; }
        vscode.languages.setTextDocumentLanguage(event.document, gfm.LANG_ID);
    });
    vscode.workspace.onDidChangeTextDocument(event => {
        const okay = precheckDocumentForGfm(event.document, true);
        if (!okay) { return; }
        vscode.languages.setTextDocumentLanguage(event.document, gfm.LANG_ID);
    });
}

export function openPreview(state: Array<vscode.WebviewPanel>, extensionPath: string): void {
    const editor = vscode.window.activeTextEditor;
    const okay = precheckEditorForGfm(editor);
    if (!okay || editor === undefined) { return; }
    let topLine = editor.visibleRanges[0].start.line;
    let waitingForPreviewToSpawn = false;
    let needNewPreview = false;
    let ignoreScrollEventFromSync = false;

    const previewedUri = editor.document.uri;
    const panel = vscode.window.createWebviewPanel(
        "gfmarkupPreview",
        `Preview of ${path.parse(editor.document.fileName).base}`,
        vscode.ViewColumn.Beside,
        { enableFindWidget: true, retainContextWhenHidden: true }
    );
    state.push(panel);
    panel.onDidDispose(() => {
        state = state.filter(x => { return x !== panel; });
    });

    const config = Config.load();
    const roots: Array<vscode.Uri> = [
        ...(vscode.workspace.workspaceFolders || []).map(x => x.uri),
        vscode.Uri.file(extensionPath),
        vscode.Uri.file(config.getImageDirectory(previewedUri)),
    ];
    panel.webview.options = { enableScripts: true, localResourceRoots: roots };
    panel.webview.html = gfm.renderMarkup(editor.document, panel.webview, topLine);
    panel.webview.onDidReceiveMessage(event => {
        const type = event["type"];
        logTest(`editor: got ${type} message from preview`);
        if (type === "sync") {
            for (let visibleEditor of vscode.window.visibleTextEditors) {
                if (visibleEditor.document.uri === previewedUri) {
                    ignoreScrollEventFromSync = true;
                    visibleEditor.revealRange(
                        new vscode.Range(event["topLine"], 0, event["topLine"] + 1, 0),
                        vscode.TextEditorRevealType.AtTop,
                    );
                }
            }
        } else if (type === "previewInitialized") {
            waitingForPreviewToSpawn = false;
        }
    });

    function updatePreview(document: vscode.TextDocument): void {
        logTest("editor: updating preview");
        waitingForPreviewToSpawn = true;
        panel.webview.html = gfm.renderMarkup(document, panel.webview, topLine);
    }

    function monitorChanges(): void {
        if (waitingForPreviewToSpawn) {
            // Sometimes the preview never actually sends the initialized
            // alert, but it still responds to messages, so we can ask it
            // whether it's ready.
            panel.webview.postMessage({ "type": "checkPreviewInitialized" });
        } else if (needNewPreview) {
            for (let visibleEditor of vscode.window.visibleTextEditors) {
                if (visibleEditor.document.uri === previewedUri) {
                    updatePreview(visibleEditor.document);
                    // Documents for the same URI will have the same
                    // content, so we just need the first one.
                    needNewPreview = false;
                    break;
                }
            }
        }
        setTimeout(monitorChanges, 50);
    }
    monitorChanges();

    vscode.workspace.onDidChangeTextDocument(event => {
        if (!state.includes(panel) || event.document.uri !== previewedUri || event.contentChanges.length === 0) {
            return;
        }
        logTest(`editor: changed CONTENT | ${event.contentChanges.length} | ${event.contentChanges[0].text}`);
        needNewPreview = true;
    });
    vscode.window.onDidChangeTextEditorVisibleRanges(event => {
        if (!state.includes(panel) || event.textEditor.document.uri !== previewedUri || event.visibleRanges.length === 0) {
            return;
        }
        if (ignoreScrollEventFromSync) {
            logTest("editor: changed VISIBLE, but ignoring because of sync");
            ignoreScrollEventFromSync = false;
            return;
        }
        logTest("editor: changed VISIBLE");
        topLine = event.visibleRanges[0].start.line;
        panel.webview.postMessage({ "type": "sync", "topLine": topLine });
    });
}
