function isVisible(element: Element) {
    var rect = element.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

declare var acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();
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

function syncPreviewToEditor(codeLine: number) {
    if (!nextVscodeCallbackFired) {
        return;
    }
    const element = window.document.querySelector(`[code-line="${codeLine}"]`);
    if (element !== null) {
        shouldSyncEditorToPreview = false;
        element.scrollIntoView();
        setTimeout(() => { shouldSyncEditorToPreview = true; }, 100);
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
