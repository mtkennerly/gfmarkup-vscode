import * as vscode from 'vscode';
import * as path from 'path';
import * as gfm from './gfmarkup';

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

    panel.webview.html = gfm.renderMarkup(editor.document);
    panel.webview.options = { enableScripts: true };
    panel.webview.onDidReceiveMessage(event => {
        for (let visibleEditor of vscode.window.visibleTextEditors) {
            if (visibleEditor.document.uri === previewedUri) {
                visibleEditor.revealRange(
                    new vscode.Range(event["topLine"], 0, event["topLine"] + 1, 0),
                    vscode.TextEditorRevealType.AtTop,
                );
            }
        }
    });

    vscode.workspace.onDidChangeTextDocument(event => {
        if (!state.includes(panel) || event.document.uri !== previewedUri) {
            return;
        }
        panel.webview.html = gfm.renderMarkup(event.document);
    });
    vscode.window.onDidChangeTextEditorVisibleRanges(event => {
        if (!state.includes(panel) || event.textEditor.document.uri !== previewedUri) {
            return;
        }
        panel.webview.postMessage({ "topLine": event.visibleRanges[0].start.line });
    });
}
