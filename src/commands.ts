import * as vscode from 'vscode';
import * as path from 'path';
import * as gfm from './gfmarkup';
import { logTest } from './etc';

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

export function scanForGfm() {
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

export function openPreview(state: Array<vscode.WebviewPanel>) {
    const editor = vscode.window.activeTextEditor;
    const okay = precheckEditorForGfm(editor);
    if (!okay || editor === undefined) { return; }
    let topLine = editor.visibleRanges[0].start.line;
    let waitingForPreviewToSpawn = false;
    let needNewPreview = false;

    const previewedUri = editor.document.uri;
    const panel = vscode.window.createWebviewPanel(
        'gfmarkupPreview',
        `Preview of ${path.parse(editor.document.fileName).base}`,
        vscode.ViewColumn.Beside,
        { retainContextWhenHidden: true }
    );
    state.push(panel);
    panel.onDidDispose(() => {
        state = state.filter(x => { return x !== panel; });
    });

    panel.webview.html = gfm.renderMarkup(editor.document, topLine);
    panel.webview.options = { enableScripts: true };
    panel.webview.onDidReceiveMessage(event => {
        const type = event["type"];
        logTest(`editor: got ${type} message from preview`);
        if (type === "sync") {
            for (let visibleEditor of vscode.window.visibleTextEditors) {
                if (visibleEditor.document.uri === previewedUri) {
                    visibleEditor.revealRange(
                        new vscode.Range(event["topLine"], 0, event["topLine"] + 1, 0),
                        vscode.TextEditorRevealType.AtTop,
                    );
                }
            }
        } else if (type === "previewInitialized") {
            waitingForPreviewToSpawn = false;
            if (needNewPreview) {
                for (let visibleEditor of vscode.window.visibleTextEditors) {
                    if (visibleEditor.document.uri === previewedUri) {
                        updatePreview(visibleEditor.document);
                        // Documents for the same URI will have the same
                        // content, so we just need the first one.
                        break;
                    }
                }
                needNewPreview = false;
            }
        }
    });

    function updatePreview(document: vscode.TextDocument) {
        if (waitingForPreviewToSpawn) {
            logTest("editor: updatePreview delaying");
            needNewPreview = true;
            return;
        }
        logTest("editor: updatePreview proceeding");
        waitingForPreviewToSpawn = true;
        panel.webview.html = gfm.renderMarkup(document, topLine);
    }

    vscode.workspace.onDidChangeTextDocument(event => {
        if (!state.includes(panel) || event.document.uri !== previewedUri || event.contentChanges.length === 0) {
            return;
        }
        logTest(`editor: changed CONTENT | ${event.contentChanges.length} | ${event.contentChanges[0].text}`);
        updatePreview(event.document);
    });
    vscode.window.onDidChangeTextEditorVisibleRanges(event => {
        if (!state.includes(panel) || event.textEditor.document.uri !== previewedUri || event.visibleRanges.length === 0) {
            return;
        }
        logTest("editor: changed VISIBLE");
        topLine = event.visibleRanges[0].start.line;
        panel.webview.postMessage({ "type": "sync", "topLine": topLine });
    });
}
