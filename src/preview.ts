import { logTest } from "./etc";

declare var initialTopLine: number;
declare var acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();
let scrolling = false;
let scrolls = 0;
let previousScrolledLine = 0;
let shouldSyncEditorToPreview = true;
let previewInitialized = false;

window.onload = main;

function main(): void {
    logTest("preview: CREATED");
    window.addEventListener("message", handleMessage);
    window.addEventListener("scroll", handleScroll);
    syncPreviewToEditor(initialTopLine, true);
    monitorScroll();
}

function handleMessage(event: MessageEvent): void {
    const type = event.data["type"];
    logTest(`preview: got ${type} message from editor`);
    if (type === "sync") {
        syncPreviewToEditor(event.data["topLine"]);
    } else if (type === "checkPreviewInitialized") {
        if (!previewInitialized) {
            logTest("preview: sending fallback previewInitialized");
        }
        vscode.postMessage({ "type": "previewInitialized" });
    }
}

function handleScroll(event: Event): void {
    if (scrolls < 2) {
        // When undoing changes in the editor, up to 2 spurious scroll events
        // may be triggered. This check prevents erratic re-synchronization.
        scrolls += 1;
        return;
    }
    scrolling = true;
}

function monitorScroll(): void {
    if (scrolling && shouldSyncEditorToPreview) {
        syncEditorToPreview();
        scrolling = false;
    }
    shouldSyncEditorToPreview = true;
    setTimeout(monitorScroll, 50);
}

function syncPreviewToEditor(codeLine: number, initialScroll: boolean = false): void {
    const element = window.document.querySelector(`[code-line="${codeLine}"]`);
    if (element !== null) {
        shouldSyncEditorToPreview = false;
        element.scrollIntoView();
        if (initialScroll) {
            logTest(`preview: did initial scroll to ${codeLine}`);
            vscode.postMessage({ "type": "previewInitialized" });
            previewInitialized = true;
        }
    } else if (codeLine > 0) {
        syncPreviewToEditor(codeLine - 1);
    }
}

function syncEditorToPreview(): void {
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

function isVisible(element: Element): boolean {
    let rect = element.getBoundingClientRect();
    let viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}
