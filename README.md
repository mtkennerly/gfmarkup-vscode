# gfmarkup-vscode

This VSCode extension provides support for the
[GameFAQs Markup](https://gamefaqs.gamespot.com/help/53-formatted-faqs-markup)
text file format.

## Features

* Syntax highlighting.
* HTML preview of the final document, including:
  * Live updates as you type.
  * Table of contents.
  * Synchronized scrolling.
  * Clickable links.
  * Images and video.
* Collapsible sections/headers in the editor.
* Linting for duplicate header errors.

![Extension demo](demo.gif)

## Usage

The extension will automatically recognize any file whose name ends with
`.gfm.txt` or whose content begins with `;format:gf-markup`.

See the next section for how to use the HTML preview.

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
  * The default is `true`, meaning the extension will automatically start
    scanning for markup files (`;format:gf-markup`) without you having to
    run the scan command. You can set this to `false` to require either manual
    scanning or a matching file extension (`.gfm.txt`).
* `gfmarkup.imageDirectory`
  * This is the location to find image files used in the markup.

    The following variables are supported:
    * `${workspaceFolder}` is the full path where you have opened VSCode.
    * `${documentFolder}` is the full path of the folder containing the
      current markup file.
    * `${documentName}` is the name of the current markup file,
      including its extension.

    The default image location is `${documentFolder}`, meaning you would put
    the images in the same folder as the markup file.

    If you wanted to group images by document, for example, then you could
    change the location to something like
    `${workspaceFolder}/images-for-${documentName}`.

    If you wanted to use a totally different folder, then you could set this
    option to something like `C:/Users/your_name/Pictures`.
* `gfmarkup.imageFiles`
  * This setting defines how your image files are named. This should only be
    the base of the file name, not including its extension.

    The following variables are supported:
    * `${id}` is the image's numeric ID used in the markup file.
    * `${documentName}` is the name of the current markup file,
      including its extension.

    The default naming style is `${documentName}.${id}`. For example, if your
    markup file is called `my_guide.txt`, then the images would have names
    like `my_guide.txt.1.jpg`.

    If your images have names like `my-image-1.jpg`, for example, then you
    would set this option to `my-image-${id}` instead.
