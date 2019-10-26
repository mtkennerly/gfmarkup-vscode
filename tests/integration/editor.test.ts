import expect from "expect";
import fs from "fs";
import path from "path";
import stripIndent from "strip-indent";
import * as vscode from "vscode";
import { findDiagnosticIssues, findFoldingRanges } from "../../src/editor";

const root = path.join(__dirname, "..", "..", "..");
const foldingExample = fs.readFileSync(path.join(root, "examples", "doc2.gfm.txt"), "utf-8");

describe("editor", () => {
    describe("findDiagnosticIssues", () => {
        const sut = (text: string) => findDiagnosticIssues(stripIndent(text).trim());

        it("does not report any issues for a document without h2/h3 header conflicts", () => {
            expect(sut(`
                ==foo==
                bar
            `)).toEqual([]);
        });

        it("reports an issue when an h2 conflicts with another h2", () => {
            expect(sut(`
                ==foo==
                ==foo==
            `)).toEqual([
                {
                    code: "",
                    message: 'Level 2 and 3 headers must be unique, but this header occurs 2 times: "foo"',
                    range: new vscode.Range(new vscode.Position(0, 2), new vscode.Position(0, 5)),
                    severity: vscode.DiagnosticSeverity.Error,
                    source: "",
                },
                {
                    code: "",
                    message: 'Level 2 and 3 headers must be unique, but this header occurs 2 times: "foo"',
                    range: new vscode.Range(new vscode.Position(1, 2), new vscode.Position(1, 5)),
                    severity: vscode.DiagnosticSeverity.Error,
                    source: "",
                },
            ]);
        });

        it("reports an issue when an h2 and h3 conflict with each other", () => {
            expect(sut(`
                ==foo==
                ===foo===
            `)).toEqual([
                {
                    code: "",
                    message: 'Level 2 and 3 headers must be unique, but this header occurs 2 times: "foo"',
                    range: new vscode.Range(new vscode.Position(0, 2), new vscode.Position(0, 5)),
                    severity: vscode.DiagnosticSeverity.Error,
                    source: "",
                },
                {
                    code: "",
                    message: 'Level 2 and 3 headers must be unique, but this header occurs 2 times: "foo"',
                    range: new vscode.Range(new vscode.Position(1, 3), new vscode.Position(1, 6)),
                    severity: vscode.DiagnosticSeverity.Error,
                    source: "",
                },
            ]);
        });

        it("does not report any issues for a document with duplicate h4/h5", () => {
            expect(sut(`
                ==foo==
                ===bar===
                ====foo====
                ====bar====
                =====foo=====
                =====bar=====
            `)).toEqual([]);
        });
    });

    describe("findFoldingRanges", () => {
        const sut = (text: string) => findFoldingRanges(stripIndent(text).trim(), text.trim().split(/\r?\n/).length);

        it("extends the range of an h2 to the end of the document if there is only one header", () => {
            expect(sut(`
                ==foo==

                bar
            `)).toEqual([
                { start: 0, end: 2, kind: undefined },
            ]);
        });

        it("extends the range of an h3 to the end of the document if there is only one header", () => {
            expect(sut(`
                ===foo===

                bar
            `)).toEqual([
                { start: 0, end: 2, kind: undefined },
            ]);
        });

        it("extends the range of an h4 to the end of the document if there is only one header", () => {
            expect(sut(`
                ====foo====

                bar
            `)).toEqual([
                { start: 0, end: 2, kind: undefined },
            ]);
        });

        it("extends the range of an h5 to the end of the document if there is only one header", () => {
            expect(sut(`
                =====foo=====

                bar
            `)).toEqual([
                { start: 0, end: 2, kind: undefined },
            ]);
        });

        it("stops the range of a header when it encounters an equal header", () => {
            expect(sut(`
                ==foo==
                .
                ==bar==
                .
            `)).toEqual([
                { start: 0, end: 1, kind: undefined },
                { start: 2, end: 3, kind: undefined },
            ]);
        });

        it("continues the range of a header when it encounters a lesser header", () => {
            expect(sut(`
                ===foo===
                .
                =====bar=====
                .
            `)).toEqual([
                { start: 0, end: 3, kind: undefined },
                { start: 2, end: 3, kind: undefined },
            ]);
        });

        it("stops the range of a header when it encounters a greater header", () => {
            expect(sut(`
                ====foo====
                .
                ==bar==
                .
            `)).toEqual([
                { start: 0, end: 1, kind: undefined },
                { start: 2, end: 3, kind: undefined },
            ]);
        });

        it("finds an empty range for a header at the end of the document", () => {
            expect(sut("==foo==")).toEqual([
                { start: 0, end: 0, kind: undefined },
            ]);
        });

        it("finds an empty range for a header immediately before an equal header", () => {
            expect(sut(`
                ==foo==
                ==bar==
            `)).toEqual([
                { start: 0, end: 0, kind: undefined },
                { start: 1, end: 1, kind: undefined },
            ]);
        });

        it("finds all ranges in examples/doc2.gfm.txt", () => {
            const ranges = findFoldingRanges(foldingExample, foldingExample.split(/\r?\n/).length);
            expect(ranges).toEqual([
                { start: 4, end: 4, kind: undefined },
                { start: 5, end: 6, kind: undefined },
                { start: 9, end: 10, kind: undefined },
                { start: 13, end: 14, kind: undefined },
                { start: 17, end: 18, kind: undefined },
                { start: 7, end: 20, kind: undefined },
                { start: 11, end: 20, kind: undefined },
                { start: 15, end: 20, kind: undefined },
                { start: 19, end: 20, kind: undefined },
                { start: 21, end: 28, kind: undefined },
                { start: 23, end: 28, kind: undefined },
                { start: 25, end: 28, kind: undefined },
                { start: 27, end: 28, kind: undefined },
            ]);
        });
    });
});
