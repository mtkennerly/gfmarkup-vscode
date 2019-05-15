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
let scrolling = false;
let scrolls = 0;
let needInitialScroll = true;
let previousScrolledLine = 0;
let shouldSyncEditorToPreview = true;

function handleMessage(event: MessageEvent) {
    const type = event.data["type"];
    if (type === "sync") {
        syncPreviewToEditor(event.data["topLine"]);
    }
}

function handleScroll(event: Event) {
    if (scrolls < 2) {
        // When undoing changes in the editor, up to 2 spurious scroll events
        // may be triggered. This check prevents erratic re-synchronization.
        scrolls += 1;
        return;
    }
    scrolling = true;
}

function monitorScroll() {
    if (scrolling && shouldSyncEditorToPreview) {
        syncEditorToPreview();
        scrolling = false;
    }
    shouldSyncEditorToPreview = true;
    setTimeout(monitorScroll, 50);
}

function handleLoad() {
    syncPreviewToEditor(initialTopLine);
    monitorScroll();
}

function syncPreviewToEditor(codeLine: number) {
    const element = window.document.querySelector(`[code-line="${codeLine}"]`);
    if (element !== null) {
        shouldSyncEditorToPreview = false;
        element.scrollIntoView();
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
    const elements = window.document.querySelectorAll("[code-line]");
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];

        if (!isVisible(element)) {
            continue;
        }
        const codeLine = element.attributes.getNamedItem("code-line");
        if (codeLine === null) {
            continue;
        }
        const tc = codeLine.textContent;
        if (tc === null) {
            continue;
        }
        const newLine = parseInt(tc);
        if (newLine === previousScrolledLine) {
            return;
        }

        logTest(`preview: syncing editor to line ${newLine}`);
        previousScrolledLine = newLine;
        vscode.postMessage({ "type": "sync", "topLine": newLine });
        return;
    }
}

window.addEventListener('message', handleMessage);
window.addEventListener("scroll", handleScroll);
