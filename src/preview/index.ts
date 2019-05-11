import { logTest } from '../etc';

window.onload = handleLoad;

logTest("preview: CREATED");

function isVisible(element: Element) {
    var rect = element.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

declare var initialTopLine: number;
declare var acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();
let needInitialScroll = true;
let previousScrolledLine = 0;
let nextVscodeCallbackFired = true;
let shouldSyncEditorToPreview = true;
let scrolls = 0;

function handleMessage(event: MessageEvent) {
    const type = event.data["type"];
    if (type === "sync") {
        syncPreviewToEditor(event.data["topLine"]);
    }
    markNextVscodeCallbackFired();
}

function handleScroll(event: Event) {
    if (scrolls < 2) {
        // When undoing changes in the editor, up to 2 spurious scroll events
        // may be triggered. This check prevents erratic re-synchronization.
        scrolls += 1;
        return;
    }
    syncEditorToPreview();
}

function handleLoad() {
    syncPreviewToEditor(initialTopLine);
}

function syncPreviewToEditor(codeLine: number) {
    if (!needInitialScroll && !nextVscodeCallbackFired) {
        return;
    }
    const element = window.document.querySelector(`[code-line="${codeLine}"]`);
    if (element !== null) {
        shouldSyncEditorToPreview = false;
        element.scrollIntoView();
        setTimeout(() => { shouldSyncEditorToPreview = true; }, 100);
        if (needInitialScroll) {
            logTest(`preview: did initial scroll to ${codeLine}`);
            needInitialScroll = false;
            vscode.postMessage({ "type": "previewInitialized" });
        }
    } else if (codeLine > 0) {
        syncPreviewToEditor(codeLine - 1);
    }
}

function syncEditorToPreview() {
    if (!shouldSyncEditorToPreview) {
        return;
    }
    const elements = window.document.querySelectorAll("[code-line]");
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        if (isVisible(element)) {
            const codeLine = element.attributes.getNamedItem("code-line");
            if (codeLine !== null) {
                const tc = codeLine.textContent;
                if (tc !== null) {
                    const newLine = parseInt(tc);
                    if (newLine === previousScrolledLine) {
                        return;
                    }
                    logTest(`preview: syncing editor to line ${newLine}`);
                    previousScrolledLine = newLine;

                    nextVscodeCallbackFired = false;
                    vscode.postMessage({ "type": "sync", "topLine": newLine });

                    return;
                }
            }
        }
    }
}

function markNextVscodeCallbackFired() {
    nextVscodeCallbackFired = true;
}

window.addEventListener('message', handleMessage);
window.addEventListener("scroll", handleScroll);
