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

function syncPreviewToEditor(event: MessageEvent) {
    if (!nextVscodeCallbackFired) {
        return;
    }
    const codeLine = event.data["topLine"];
    const element = window.document.querySelector(`[code-line="${codeLine}"]`);
    if (element !== null) {
        shouldSyncEditorToPreview = false;
        element.scrollIntoView();
        setTimeout(() => { shouldSyncEditorToPreview = true; }, 100);
    }
}

function syncEditorToPreview(event: Event) {
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
                    vscode.postMessage({ "topLine": newLine });

                    return;
                }
            }
        }
    }
}

function markNextVscodeCallbackFired(event: MessageEvent) {
    nextVscodeCallbackFired = true;
}

window.addEventListener('message', syncPreviewToEditor);
window.addEventListener('message', markNextVscodeCallbackFired);
window.addEventListener("scroll", syncEditorToPreview);
