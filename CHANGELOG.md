## Unreleased

* Fixed parsing/preview of table header cells with an alignment.

## v0.5.1 (2019-10-05)

* Updated extension for VSCode 1.38.1. This resolved several issues
  that occurred when using newer VSCode versions:
  * Fixed preview styling and synchronized scrolling. This was broken because
    of changes in VSCode's security requirements for webviews to load local
    files (e.g., CSS and JavaScript).
  * Fixed "unrecognized format" error with preview video embedding. VSCode did
    not officially support video in webviews, and although it happened to work
    when this extension was initially released, it is no longer possible
    (https://github.com/microsoft/vscode/issues/82012).
    Instead of true video embedding, the preview now includes a plain thumbnail
    of the video, which can be clicked to open the video host in your browser.
* Fixed bold and italic display in the preview.

## v0.5.0 (2019-05-28)

* Added support for images and videos.
* Added syntax highlighting for boxes and table cells.

## v0.4.0 (2019-05-15)

* Added support for nested boxes.
* Enabled the find feature in the preview.
* Improved performance of synchronized scrolling.
* Fixed syntax highlighting for items immediately after a table.
* Fixed syntax highlighting for comments inside of boxes.
* Fixed syntax and preview so that table rows cannot be indented.
* Fixed issue where the preview would occasionally stop synchronizing.

## v0.3.0 (2019-05-12)

* Added linting for duplicate level 2 and 3 headers.
* Added the ability to collapse sections/headers in the editor.

## v0.2.2 (2019-05-11)

* Fixed issue where headers with HTML special characters were not properly
  clickable in the table of contents.
* Improved performance for large files where typing rapidly would make the
  preview take longer to refresh.

## v0.2.1 (2019-05-11)

* Fixed issue where headers with multiple spaces were not properly clickable
  in the table of contents.
* Fixed issue where headers with HTML special characters in the name were not
  displayed correctly in the table of contents.

## v0.2.0 (2019-05-10)

* Changed the default of `gfmarkup.autoScan` to `true` to make it as easy as
  possible for new users to get started.

## v0.1.1 (2019-05-10)

* Fixed issue where the `Open Preview` command was not available after
  installation.

## v0.1.0 (2019-05-10)

* Initial release.
