import * as crypto from "crypto";
import escape = require("lodash.escape");
import * as vscode from "vscode";
import { getMarkupImage, getMediaResource } from "./config";
import { fromUndefined } from "./etc";

export const LANG_ID = "gfmarkup";
export const SHEBANG = ";format:gf-markup";

function normalizeId(raw: string): string {
    return crypto.createHash("sha1").update(raw).digest("hex");
}

function handleList(input: string, prefix: string, container: string, item: string): string {
    let out = "";
    let leader = new RegExp(`^${prefix}+`);
    let previousLevel = 0;
    let thisLevel = 0;
    const lines = input.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        thisLevel = (line.match(leader) || [[]])[0].length;
        if (thisLevel > previousLevel) {
            for (let j = previousLevel; j < thisLevel; j++) {
                let style = container === "dl" ? `style='text-indent: ${15 * (j - 1)}px;'` : "";
                out += `<${container} ${style}>`;
            }
        } else if (thisLevel < previousLevel) {
            for (let j = thisLevel + 1; j < previousLevel; j++) {
                out += `</${container}>`;
            }
            out += `</${container}>`;
            if (i === lines.length - 1) {
                out += "\n";
            }
        }
        if (thisLevel > 0) {
            out += `<${item}>${line.replace(leader, "").trimLeft()}</${item}>`;
            if (i < lines.length - 2) {
                out += "\n";
            }
        }
        previousLevel = thisLevel;
    }
    return out;
}

function handleTable(input: string): string {
    let outLines = [];
    for (let line of input.split(/\r?\n/)) {
        if (line.trim() === "") {
            continue;
        }
        let outLine = "<tr>";
        for (let cell of line.split("|").slice(1, -1)) {
            const mods = cell.match(/^(\*)?([lcr])?(([+-])([0-9a-fA-F]))?(.*?)$/);
            if (mods === null) {
                return input;
            }

            const isHeader = mods[1] === "*";
            const alignment = mods[2] || "l";
            const spanType = mods[4];
            let spanCount = mods[5] || "1";
            const content = mods[6];

            const container = isHeader ? "th" : "td";
            let span = "";
            if (spanType === "+") {
                span = `colspan='${parseInt(spanCount, 16)}'`;
            } else if (spanType === "-") {
                span = `rowspan='${parseInt(spanCount, 16)}'`;
            }

            outLine += `<${container} class='cell-${alignment}' ${span}>${content.trim()}</${container}>`;
        }
        outLine += "</tr>";
        outLines.push(outLine);
    }
    return `<table>${outLines.join("\n")}</table>\n`;
}

export function renderMarkupBody(documentText: string, documentUri: vscode.Uri): string {
    return escape(documentText)
        .replace(/^;.*$/gm, "")
        .replace(/^%$/gm, "<hr>")
        .replace(/^==([^=]+.*)==$/gm, (match, p1) => {
            return `<h2 id='${normalizeId(p1)}'>${p1}</h2>`;
        })
        .replace(/^===([^=]+.*)===$/gm, (match, p1) => {
            return `<h3 id='${normalizeId(p1)}'>${p1}</h3>`;
        })
        .replace(/^====([^=]+.*)====$/gm, (match, p1) => {
            return `<h4 id='${normalizeId(p1)}'><span>${p1}</span></h4>`;
        })
        .replace(/^=====([^=]+.*)=====$/gm, (match, p1) => {
            return `<h5 id='${normalizeId(p1)}'><span>${p1}</span></h5>`;
        })
        .replace(/^\^(s|l)(l|r)?(\d+)\|(.+)$/gm, (match, p1, p2, p3, p4) => {
            return `<img src="${getMarkupImage(p3, documentUri)}" alt="${p4}" title="${p4}" class="image-${p1}${p2 || ""}">`;
        })
        .replace(/^\@(l|r)\|(.+)$/gm, (match, p1, p2) => {
            return `<div class="video-${p1}"><a href="https://www.youtube.com/watch?v=${p2}"><img src="https://img.youtube.com/vi/${p2}/hqdefault.jpg"></a></div>`;
        })
        .replace(/&#39;&#39;&#39;&#39;&#39;(.+?)&#39;&#39;&#39;&#39;&#39;/gms, "<b><i>$1</i></b>")
        .replace(/&#39;&#39;&#39;(.+?)&#39;&#39;&#39;/gms, "<i>$1</i>")
        .replace(/&#39;&#39;(.+?)&#39;&#39;/gms, "<b>$1</b>")
        .replace(/\-\-u\-\-(.+?)\-\-u\-\-/gms, "<u>$1</u>")
        .replace(/-s-(.+?)-s-/gm, "<span class='spoiler'>$1</span>")
        .replace(/\[\[(.+?)(\|(.+?))?\]\]/gm, (match, p1, p2, p3) => {
            if (p3 === undefined) {
                return `<a href='#${normalizeId(p1)}'>${p1}</a>`;
            } else {
                return `<a href='#${normalizeId(p1)}'>${p3}</a>`;
            }
        })
        .replace(/^\*.+?\r?\n(?=[^*]|$)/gms, match => {
            return handleList(match, "\\*", "ul", "li");
        })
        .replace(/^\#.+?\r?\n(?=[^#]|$)/gms, match => {
            return handleList(match, "\\#", "ol", "li");
        })
        .replace(/^\:.+?\r?\n(?=[^:]|$)/gms, match => {
            return handleList(match, "\\:", "dl", "dd");
        })
        .replace(/^\|.+?\r?\n(?=[^|]|$)/gms, match => {
            return handleTable(match);
        })
        .replace(/^=-----=$/gm, "<div class='box'><span></span>")
        .replace(/^=--(.+?)--=$/gm, "<div class='box'><b>$1</b><br>")
        .replace(/^=-=$/gm, "<span></span></div>")
        .split(/\r?\n/).map((x, i) => {
            const firstTag = /<([^ >/]+)(.*)/;
            // Add the source line to the first tag on this line.
            return x.replace(firstTag, (match, p1, p2) => {
                if (["ul", "ol", "dl", "div", "table"].includes(p1)) {
                    return `<${p1}${p2.replace(firstTag, `<$1 code-line="${i}"$2`)}`;
                } else {
                    return `<${p1} code-line="${i}"${p2}`;
                }
            });
        }).join("\n")
        .split(/\r?\n/).map((x, i) => {
            if (x.trim() !== "" && !x.includes("code-line=")) {
                // The line did not contain any other tags in which to set
                // the code line, which means it's part of a regular paragraph
                // and we can just wrap it in a new tag for this purpose.
                return `<span code-line="${i}">${x}</span>`;
            } else {
                return x;
            }
        }).join("\n")
        .replace(/(\r?\n){2,}/gms, "<br><br>\n")
        .replace(/<\/(table|ul|ol|dl)>\r?\n?<br><br>/gm, "</$1><br>");
}

export function renderMarkupToc(documentText: string): string {
    const headers: Array<[string, Array<string>]> = [];
    let h2 = null;
    let h3s = [];
    for (let line of documentText.split(/\r?\n/)) {
        let headerCheck = line.match(/^==([^=]+.*)==$/);
        if (headerCheck) {
            if (h2 !== null) {
                headers.push([h2, h3s]);
                h3s = [];
            } else if (h3s.length > 0) {
                headers.push(["", h3s]);
                h3s = [];
            }
            const text = headerCheck[1];
            h2 = text;
        } else {
            headerCheck = line.match(/^===([^=]+.*)===$/);
            if (headerCheck) {
                const text = headerCheck[1];
                h3s.push(text);
            }
        }
    }
    if (h2 !== null) {
        headers.push([h2, h3s]);
    } else if (h3s.length > 0) {
        headers.push(["", h3s]);
    }

    let out = "";
    for (const [h2, h3s] of headers) {
        const escapedH2 = escape(h2);
        if (escapedH2 !== "") {
            out += `<li><a href="#${normalizeId(escapedH2)}">${escapedH2}</a></li>`;
        } else {
            out += "<li></li>";
        }
        if (h3s) {
            out += "<ol>";
            for (const h3 of h3s) {
                const escapedH3 = escape(h3);
                out += `<li><a href="#${normalizeId(escapedH3)}">${escapedH3}</a></li>`;
            }
            out += "</ol>";
        }
    }

    return `<nav><p>Table of contents</p><ol>${out}</ol></nav>`;
}

export function renderMarkup(document: vscode.TextDocument, webview: vscode.Webview, topLine: number): string {
    const toc = renderMarkupToc(document.getText());
    const body = renderMarkupBody(document.getText(), document.uri);
    const scrollBeyond = fromUndefined(
        vscode.workspace.getConfiguration("editor", document.uri).get<boolean>("scrollBeyondLastLine"),
        true
    );
    return `
        <!DOCTYPE html>
        <head>
            <script>const initialTopLine = ${topLine};</script>
            <script async src="${getMediaResource("index.js")}"></script>
            <link rel="stylesheet" type="text/css" href="${getMediaResource("index.css")}" />
            <meta
                http-equiv="Content-Security-Policy"
                content="default-src 'none'; img-src ${webview.cspSource} https: file: vscode-resource:; script-src ${webview.cspSource} file: vscode-resource:; style-src ${webview.cspSource} file: vscode-resource: 'unsafe-inline'; frame-src https://www.youtube.com;"
            />
        </head>
        <html>
            <body class="${scrollBeyond ? "scrollBeyond" : ""}">${toc}\n${body}</body>
        </html>
    `;
}

export function isDocumentGfm(document: vscode.TextDocument): boolean {
    return (
        document.getText(
            new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 17))
        ) === SHEBANG
    );
}
