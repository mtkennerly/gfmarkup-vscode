import expect from "expect";
import stripIndent from "strip-indent";
import * as vscode from "vscode";
import { renderMarkupBody, renderMarkupToc } from "../../src/gfmarkup";

const uri = vscode.Uri.parse("file://tmp");
const norm = (text: string) => stripIndent(text).trim();

describe("gfmarkup", () => {
    describe("renderMarkupBody", () => {
        const sut = (text: string) => renderMarkupBody(norm(text), uri);

        it("does not render comments", () => {
            expect(sut(`
                before
                ; first
                middle; not a comment
                ;second
                after
            `)).toBe(norm(`
                <span code-line="0">before</span><br><br>
                <span code-line="2">middle; not a comment</span><br><br>
                <span code-line="4">after</span>
            `));
        });

        it("renders h2", () => {
            expect(sut(`
                ==Test==
            `)).toBe(norm(`
                <h2 code-line="0" id='640ab2bae07bedc4c163f679a746f7ab7fb5d1fa'>Test</h2>
            `));
        });

        it("renders h3", () => {
            expect(sut(`
                ===Test===
            `)).toBe(norm(`
                <h3 code-line="0" id='640ab2bae07bedc4c163f679a746f7ab7fb5d1fa'>Test</h3>
            `));
        });

        it("renders h4", () => {
            expect(sut(`
                ====Test====
            `)).toBe(norm(`
                <h4 code-line="0" id='640ab2bae07bedc4c163f679a746f7ab7fb5d1fa'><span>Test</span></h4>
            `));
        });

        it("renders h5", () => {
            expect(sut(`
                =====Test=====
            `)).toBe(norm(`
                <h5 code-line="0" id='640ab2bae07bedc4c163f679a746f7ab7fb5d1fa'><span>Test</span></h5>
            `));
        });

        it("handles headers with inner equal signs", () => {
            expect(sut(`
                ==Te = st==
            `)).toBe(norm(`
                <h2 code-line="0" id='fdc1eb51d69970757df40f6e3fc3d6ccca7ab770'>Te = st</h2>
            `));
        });

        it("renders images (small)", () => {
            expect(sut(`
                ^s1|desc
            `)).toBe(norm(`
                <img code-line="0" src="null" alt="desc" title="desc" class="image-s">
            `));
        });

        it("renders images (small/left)", () => {
            expect(sut(`
                ^sl1|desc
            `)).toBe(norm(`
                <img code-line="0" src="null" alt="desc" title="desc" class="image-sl">
            `));
        });

        it("renders images (small/right)", () => {
            expect(sut(`
                ^sr1|desc
            `)).toBe(norm(`
                <img code-line="0" src="null" alt="desc" title="desc" class="image-sr">
            `));
        });

        it("renders images (large)", () => {
            expect(sut(`
                ^l1|desc
            `)).toBe(norm(`
                <img code-line="0" src="null" alt="desc" title="desc" class="image-l">
            `));
        });

        it("renders images (large/left)", () => {
            expect(sut(`
                ^ll1|desc
            `)).toBe(norm(`
                <img code-line="0" src="null" alt="desc" title="desc" class="image-ll">
            `));
        });

        it("renders images (large/right)", () => {
            expect(sut(`
                ^lr1|desc
            `)).toBe(norm(`
                <img code-line="0" src="null" alt="desc" title="desc" class="image-lr">
            `));
        });

        it("renders videos (left)", () => {
            expect(sut(`
                @l|id
            `)).toBe(norm(`
                <div class="video-l"><a code-line="0" href="https://www.youtube.com/watch?v=id"><img src="https://img.youtube.com/vi/id/hqdefault.jpg"></a></div>
            `));
        });

        it("renders videos (right)", () => {
            expect(sut(`
                @r|id
            `)).toBe(norm(`
                <div class="video-r"><a code-line="0" href="https://www.youtube.com/watch?v=id"><img src="https://img.youtube.com/vi/id/hqdefault.jpg"></a></div>
            `));
        });

        it("renders bold/italic text", () => {
            expect(sut(`
                '''''foo'''''
            `)).toBe(norm(`
                <b code-line="0"><i>foo</i></b>
            `));
        });

        it("renders italic text", () => {
            expect(sut(`
                '''foo'''
            `)).toBe(norm(`
                <i code-line="0">foo</i>
            `));
        });

        it("renders bold text", () => {
            expect(sut(`
                ''foo''
            `)).toBe(norm(`
                <b code-line="0">foo</b>
            `));
        });

        it("renders underlined text", () => {
            expect(sut(`
                --u--foo--u--
            `)).toBe(norm(`
                <u code-line="0">foo</u>
            `));
        });

        it("renders spoiler text", () => {
            expect(sut(`
                -s-foo-s-
            `)).toBe(norm(`
                <span code-line="0" class='spoiler'>foo</span>
            `));
        });

        it("renders a link without custom text", () => {
            expect(sut(`
                [[top]]
            `)).toBe(norm(`
                <a code-line="0" href='#af2c7b4ca07ae6c74d261bc745e174df8ab3ffef'>top</a>
            `));
        });

        it("renders a link with custom text", () => {
            expect(sut(`
                [[top|title]]
            `)).toBe(norm(`
                <a code-line="0" href='#af2c7b4ca07ae6c74d261bc745e174df8ab3ffef'>title</a>
            `));
        });

        it("renders two links without custom text", () => {
            expect(sut(`
                [[foo]] [[bar]]
            `)).toBe(norm(`
                <a code-line="0" href='#0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33'>foo</a> <a href='#62cdb7020ff920e5aa642c3d4066950dd1f01f4d'>bar</a>
            `));
        });

        it("renders two links with custom text", () => {
            expect(sut(`
                [[foo|bar]] [[baz|quux]]
            `)).toBe(norm(`
                <a code-line="0" href='#0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33'>bar</a> <a href='#bbe960a25ea311d21d40669e93df2003ba9b90a2'>quux</a>
            `));
        });

        it("renders one link with custom text followed by one without", () => {
            expect(sut(`
                [[foo|title]] [[bar]]
            `)).toBe(norm(`
                <a code-line="0" href='#0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33'>title</a> <a href='#62cdb7020ff920e5aa642c3d4066950dd1f01f4d'>bar</a>
            `));
        });

        it("renders one link without custom text followed by one with", () => {
            expect(sut(`
              [[foo]] [[bar|title]]
            `)).toBe(norm(`
                <a code-line="0" href='#0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33'>foo</a> <a href='#62cdb7020ff920e5aa642c3d4066950dd1f01f4d'>title</a>
            `));
        });

        it("renders bullet lists", () => {
            expect(sut(`
                * 1
                ** 2
                * 3
                *** 4
                end
            `)).toBe(norm(`
                <ul ><li code-line="0">1</li>
                <ul ><li code-line="1">2</li>
                </ul><li code-line="2">3</li>
                <ul ><ul code-line="3" ><li>4</li></ul></ul></ul>
                <span code-line="4">end</span>
            `));
        });

        it("renders bullet lists that start at an indent", () => {
            expect(sut(`
                *****1
                end
            `)).toBe(norm(`
                <ul ><ul code-line="0" ><ul ><ul ><ul ><li>1</li></ul></ul></ul></ul></ul>
                <span code-line="1">end</span>
            `));
        });

        it("renders numbered lists", () => {
            expect(sut(`
                # 1
                ## 2
                # 3
                ### 4
                end
            `)).toBe(norm(`
                <ol ><li code-line="0">1</li>
                <ol ><li code-line="1">2</li>
                </ol><li code-line="2">3</li>
                <ol ><ol code-line="3" ><li>4</li></ol></ol></ol>
                <span code-line="4">end</span>
            `));
        });

        it("renders numbered lists that start at an indent", () => {
            expect(sut(`
                #####1
                end
            `)).toBe(norm(`
                <ol ><ol code-line="0" ><ol ><ol ><ol ><li>1</li></ol></ol></ol></ol></ol>
                <span code-line="1">end</span>
            `));
        });

        it("renders definition lists", () => {
            expect(sut(`
                : 1
                :: 2
                : 3
                ::: 4
                end
            `)).toBe(norm(`
                <dl style='text-indent: -15px;'><dd code-line="0">1</dd>
                <dl style='text-indent: 0px;'><dd code-line="1">2</dd>
                </dl><dd code-line="2">3</dd>
                <dl style='text-indent: 0px;'><dl code-line="3" style='text-indent: 15px;'><dd>4</dd></dl></dl></dl>
                <span code-line="4">end</span>
            `));
        });

        it("renders definition lists that start at an indent", () => {
            expect(sut(`
                :::::1
                end
            `)).toBe(norm(`
                <dl style='text-indent: -15px;'><dl code-line="0" style='text-indent: 0px;'><dl style='text-indent: 15px;'><dl style='text-indent: 30px;'><dl style='text-indent: 45px;'><dd>1</dd></dl></dl></dl></dl></dl>
                <span code-line="1">end</span>
            `));
        });

        it("renders 1x1 tables", () => {
            expect(sut(`
                |foo|
                end
            `)).toBe(norm(`
                <table><tr code-line="0"><td class='cell-l' >foo</td></tr></table>
                <span code-line="1">end</span>
            `));
        });

        it("renders tables with cell padding", () => {
            expect(sut(`
                |   cell 1.1 | cell 1.2   |
                | cell 2.1   |   cell 2.2 |
                end
            `)).toBe(norm(`
                <table><tr code-line="0"><td class='cell-l' >cell 1.1</td><td class='cell-l' >cell 1.2</td></tr>
                <tr code-line="1"><td class='cell-l' >cell 2.1</td><td class='cell-l' >cell 2.2</td></tr></table>
                <span code-line="2">end</span>
            `));
        });

        it("renders tables with headers", () => {
            expect(sut(`
                |* foo |
                |  bar |
                end
            `)).toBe(norm(`
                <table><tr code-line="0"><th class='cell-l' >foo</th></tr>
                <tr code-line="1"><td class='cell-l' >bar</td></tr></table>
                <span code-line="2">end</span>
            `));
        });

        it("renders tables with column span", () => {
            expect(sut(`
                |+2 foo      |
                | bar  | baz |
                end
            `)).toBe(norm(`
                <table><tr code-line="0"><td class='cell-l' colspan='2'>foo</td></tr>
                <tr code-line="1"><td class='cell-l' >bar</td><td class='cell-l' >baz</td></tr></table>
                <span code-line="2">end</span>
            `));
        });

        it("renders tables with row span", () => {
            expect(sut(`
                |-2 foo | bar |
                |         baz |
                end
            `)).toBe(norm(`
                <table><tr code-line="0"><td class='cell-l' rowspan='2'>foo</td><td class='cell-l' >bar</td></tr>
                <tr code-line="1"><td class='cell-l' >baz</td></tr></table>
                <span code-line="2">end</span>
            `));
        });

        it("renders tables with left alignment", () => {
            expect(sut(`
                |l foo |
                end
            `)).toBe(norm(`
                <table><tr code-line="0"><td class='cell-l' >foo</td></tr></table>
                <span code-line="1">end</span>
            `));
        });

        it("renders tables with center alignment", () => {
            expect(sut(`
                |c foo |
                end
            `)).toBe(norm(`
                <table><tr code-line="0"><td class='cell-c' >foo</td></tr></table>
                <span code-line="1">end</span>
            `));
        });

        it("renders tables with right alignment", () => {
            expect(sut(`
                |r foo |
                end
            `)).toBe(norm(`
                <table><tr code-line="0"><td class='cell-r' >foo</td></tr></table>
                <span code-line="1">end</span>
            `));
        });

        it("renders tables with multi-featured cells", () => {
            expect(sut(`
                |*c+f foo |
                end
            `)).toBe(norm(`
                <table><tr code-line="0"><th class='cell-c' colspan='15'>foo</th></tr></table>
                <span code-line="1">end</span>
            `));
        });

        it("renders empty boxes", () => {
            expect(sut(`
                =-----=
                =-=
            `)).toBe(norm(`
                <div class='box'><span code-line="0"></span>
                <span code-line="1"></span></div>
            `));
        });

        it("renders boxes without titles", () => {
            expect(sut(`
                =-----=
                foo
                =-=
            `)).toBe(norm(`
                <div class='box'><span code-line="0"></span>
                <span code-line="1">foo</span>
                <span code-line="2"></span></div>
            `));
        });

        it("renders boxes with titles", () => {
            expect(sut(`
                =--foo--=
                bar
                =-=
            `)).toBe(norm(`
                <div class='box'><b code-line="0">foo</b><br>
                <span code-line="1">bar</span>
                <span code-line="2"></span></div>
            `));
        });

        it("renders nested boxes", () => {
            expect(sut(`
                =-----=
                outer
                =-----=
                inner 1
                =-=

                =-----=
                inner 2
                =-=
                =-=
            `)).toBe(norm(`
                <div class='box'><span code-line="0"></span>
                <span code-line="1">outer</span>
                <div class='box'><span code-line="2"></span>
                <span code-line="3">inner 1</span>
                <span code-line="4"></span></div><br><br>
                <div class='box'><span code-line="6"></span>
                <span code-line="7">inner 2</span>
                <span code-line="8"></span></div>
                <span code-line="9"></span></div>
            `));
        });

        it("limits consecutive line breaks in prose to 2", () => {
            expect(sut(`
                1
                2

                4


                7



                11
            `)).toBe(norm(`
                <span code-line="0">1</span>
                <span code-line="1">2</span><br><br>
                <span code-line="3">4</span><br><br>
                <span code-line="6">7</span><br><br>
                <span code-line="10">11</span>
            `));
        });

        it("limits line breaks after block elements to 1", () => {
            expect(sut(`
                |foo|



                5
            `)).toBe(norm(`
                <table><tr code-line=\"0\"><td class='cell-l' >foo</td></tr></table><br>
                <span code-line=\"4\">5</span>
            `));
        });
    });

    describe("renderMarkupToc", () => {
        const sut = (text: string) => renderMarkupToc(norm(text));

        it("renders a TOC with only one h2", () => {
            expect(sut(`
                ==foo==
            `)).toBe(norm(`
                <nav><p>Table of contents</p><ol><li><a href=\"#0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33\">foo</a></li><ol></ol></ol></nav>
            `));
        });

        it("renders a TOC with only one h3", () => {
            expect(sut(`
                ===foo===
            `)).toBe(norm(`
                <nav><p>Table of contents</p><ol><li></li><ol><li><a href=\"#0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33\">foo</a></li></ol></ol></nav>
            `));
        });

        it("renders a TOC with several headers", () => {
            expect(sut(`
                ==foo==
                ===bar===
                ===baz===
                ==quux==
            `)).toBe(norm(`
                <nav><p>Table of contents</p><ol><li><a href=\"#0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33\">foo</a></li><ol><li><a href=\"#62cdb7020ff920e5aa642c3d4066950dd1f01f4d\">bar</a></li><li><a href=\"#bbe960a25ea311d21d40669e93df2003ba9b90a2\">baz</a></li></ol><li><a href=\"#ae2ad9454f3af7fcb18c83969f99b20a788eddd1\">quux</a></li><ol></ol></ol></nav>
            `));
        });

        it("renders a TOC with an h3 before the first h2", () => {
            expect(sut(`
                ===foo===
                ==bar==
            `)).toBe(norm(`
                <nav><p>Table of contents</p><ol><li></li><ol><li><a href=\"#0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33\">foo</a></li></ol><li><a href=\"#62cdb7020ff920e5aa642c3d4066950dd1f01f4d\">bar</a></li><ol></ol></ol></nav>
            `));
        });

        it("renders an empty TOC when there are no h2 or h3", () => {
            expect(sut(`
                ====foo====
                =====bar=====
            `)).toBe(norm(`
                <nav><p>Table of contents</p><ol></ol></nav>
            `));
        });
    });
});
