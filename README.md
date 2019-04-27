# gfmarkup-vscode

This VSCode extension provides support for the
[GameFAQs Markup](https://gamefaqs.gamespot.com/help/53-formatted-faqs-markup)
text file format.

## Features

* Syntax highlighting.
* HTML preview of the final document, including table of contents,
  clickable links, and synchronized scrolling.

## Usage

The extension will automatically recognize any file whose name ends with
`.gfm.txt`. If your files don't match that pattern, you can either enable
the `gfmarkup.autoScan` setting or issue the `Scan files for markup flag`
command. See the following sections for more info.

## Commands

You can run these commands by opening the command pallette with
`ctrl+shift+P` (or `cmd+shift+P` on Mac). The command names are prefixed
with `GameFAQs Markup: `.

* `Open preview`
  * Open an HTML preview of the current document.
* `Scan files for markup flag`
  * Start checking files for the `;format:gf-markup` flag and, if found,
    activate the extension's features for them.

## Settings

* `gfmarkup.autoScan`
  * The default is `false`, but you can set this to `true` to make the
    extension automatically start scanning for markup files without running
    the scan command.
