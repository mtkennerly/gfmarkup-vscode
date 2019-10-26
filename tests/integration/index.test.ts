// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import expect from "expect";
import * as vscode from "vscode";
import * as myExtension from "../../src/extension";

describe("Extension", () => {
	vscode.window.showInformationMessage("Start all tests.");

	it("works with normalized layout", () => {
		expect([1, 2, 3].indexOf(5)).toBe(-1);
		expect([1, 2, 3].indexOf(1)).toBe(0);
	});
});
