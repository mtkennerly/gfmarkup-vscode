import * as vscode from 'vscode';
import { LANG_ID } from './gfmarkup';

export function diagnoseIssues(document: vscode.TextDocument, diagnostics: vscode.DiagnosticCollection) {
    if (document.languageId !== LANG_ID) {
        return;
    }
    let problems: vscode.Diagnostic[] = [];
    let headers: { [key: string]: Array<vscode.Range> } = {};
    const documentText = document.getText();

    for (const [lineIndex, line] of documentText.split(/\r?\n/).entries()) {
        let offset = 0;
        let text = "";

        const h2Check = line.match(/^==([^=]+.*)==$/);
        const h3Check = line.match(/^===([^=]+.*)===$/);
        if (h2Check) {
            offset = 2;
            text = h2Check[1];
        } else if (h3Check) {
            offset = 3;
            text = h3Check[1];
        } else {
            continue;
        }

        if (!(text in headers)) {
            headers[text] = [];
        }
        headers[text].push(new vscode.Range(
            new vscode.Position(lineIndex, offset),
            new vscode.Position(lineIndex, offset + text.length)
        ));
    }

    for (const [header, instances] of Object.entries(headers)) {
        if (instances.length > 1) {
            for (const instance of instances) {
                problems.push({
                    code: "",
                    message: `Level 2 and 3 headers must be unique, but this header occurs ${instances.length} times: "${header}"`,
                    range: instance,
                    severity: vscode.DiagnosticSeverity.Error,
                    source: "",
                });
            }
        }
    }

    diagnostics.set(document.uri, problems);
}

export class GfmFoldingRangeProvider implements vscode.FoldingRangeProvider {
    provideFoldingRanges(
        document: vscode.TextDocument,
        context: vscode.FoldingContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.FoldingRange[]> {
        const documentText = document.getText();
        const ranges = [];
        const headers: { [key: string]: number | null } = {
            2: null,
            3: null,
            4: null,
            5: null,
        };

        for (const [lineIndex, line] of documentText.split(/\r?\n/).entries()) {
            const hCheck = line.match(/^(={2,5})([^=]+.*)={2,5}$/);
            if (hCheck) {
                const level = hCheck[1].length;
                const lastSibling = headers[level.toString()];
                if (lastSibling !== null) {
                    ranges.push(new vscode.FoldingRange(lastSibling, lineIndex - 1));
                }
                for (const [key, value] of Object.entries(headers)) {
                    if (level < parseInt(key) && value !== null) {
                        ranges.push(new vscode.FoldingRange(value, lineIndex - 1));
                        headers[key] = null;
                    }
                }
                headers[level.toString()] = lineIndex;
            }
        }

        for (const value of Object.values(headers)) {
            if (value !== null) {
                ranges.push(new vscode.FoldingRange(value, document.lineCount - 1));
            }
        }

        return ranges;
    }
}
