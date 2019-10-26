import decache from "decache";
import fs from "fs";
import glob from "glob";
import Mocha from "mocha";
import path from "path";

const istanbul = require("istanbul");
const remapIstanbul = require("remap-istanbul");
const sourceMapSupport = require("source-map-support");

export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: "bdd",
    });
    mocha.useColors(true);

    const testsRoot = path.resolve(__dirname);
    const repoRoot = path.join(testsRoot, "..", "..");

    sourceMapSupport.install();
    const coverageRunner = new CoverageRunner(repoRoot);
    coverageRunner.setupCoverage();

    return new Promise((resolve, reject) => {
        glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
            if (err) {
                return reject(err);
            }

            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                mocha.run(failures => {
                    if (failures > 0) {
                        coverageRunner.reportCoverage();
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        coverageRunner.reportCoverage();
                        resolve();
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    });
}



// ------------------------------------------------------------------
// The following code is based on:
// https://github.com/codecov/example-typescript-vscode-extension

// Linux: prevent a weird NPE when mocha on Linux requires the window size from the TTY
// Since we are not running in a tty environment, we just implement the method statically
const tty = require("tty");
if (!tty.getWindowSize) {
    tty.getWindowSize = (): number[] => {
        return [80, 75];
    };
}

class CoverageRunner {
    private coverageVar: string = "$$cov_" + new Date().getTime() + "$$";
    private transformer: any = undefined;
    private matchFn: any = undefined;
    private instrumenter: any = undefined;

    constructor(private repoRoot: string) { }

    public setupCoverage(): void {
        // Set up Code Coverage, hooking require so that instrumented code is returned
        this.instrumenter = new istanbul.Instrumenter({ coverageVariable: this.coverageVar });
        const sourceRoot = path.join(this.repoRoot, "out/src");

        // Glob source files
        const srcFiles = glob.sync("**/**.js", {
            cwd: sourceRoot,
            ignore: ["node_modules"],
        });

        // Create a match function - taken from the run-with-cover.js in istanbul.
        const fileMap: { [key: string]: boolean } = {};
        srcFiles.forEach( (file) => {
            const fullPath = path.join(sourceRoot, file);
            fileMap[fullPath] = true;

            // On Windows, extension is loaded pre-test hooks and this mean we lose
            // our chance to hook the Require call. In order to instrument the code
            // we have to decache the JS file so on next load it gets instrumented.
            // This doesn"t impact tests, but is a concern if we had some integration
            // tests that relied on VSCode accessing our module since there could be
            // some shared global state that we lose.
            decache(fullPath);
        });

        // @ts-ignore
        this.matchFn = (file): boolean => { return fileMap[file]; };
        this.matchFn.files = Object.keys(fileMap);

        // Hook up to the Require function so that when this is called, if any of our source files
        // are required, the instrumented version is pulled in instead. These instrumented versions
        // write to a global coverage variable with hit counts whenever they are accessed
        this.transformer = this.instrumenter.instrumentSync.bind(this.instrumenter);
        const hookOpts = { verbose: false, extensions: [".js"]};
        istanbul.hook.hookRequire(this.matchFn, this.transformer, hookOpts);

        // initialize the global variable to stop mocha from complaining about leaks
        // @ts-ignore
        global[this.coverageVar] = {};
    }

    /**
     * Writes a coverage report.
     *
     * @returns {void}
     *
     * @memberOf CoverageRunner
     */
    public reportCoverage(): void {
        istanbul.hook.unhookRequire();
        let cov: any;
        // @ts-ignore
        if (typeof global[this.coverageVar] === "undefined" || Object.keys(global[this.coverageVar]).length === 0) {
            console.error("No coverage information was collected, exit without writing coverage information");
            return;
        } else {
            // @ts-ignore
            cov = global[this.coverageVar];
        }

        // TODO consider putting this under a conditional flag
        // Files that are not touched by code ran by the test runner is manually instrumented, to
        // illustrate the missing coverage.
        // @ts-ignore
        this.matchFn.files.forEach( (file) => {
            if (!cov[file]) {
                this.transformer(fs.readFileSync(file, "utf-8"), file);

                // When instrumenting the code, istanbul will give each FunctionDeclaration a value of 1 in coverState.s,
                // presumably to compensate for function hoisting. We need to reset this, as the function was not hoisted,
                // as it was never loaded.
                Object.keys(this.instrumenter.coverState.s).forEach( (key) => {
                    this.instrumenter.coverState.s[key] = 0;
                });

                cov[file] = this.instrumenter.coverState;
            }
        });

        // TODO Allow config of reporting directory with
        const reportingDir = path.join(this.repoRoot, "coverage");
        const coverageFile = path.resolve(reportingDir, "coverage.json");

        if (!fs.existsSync(reportingDir)) {
            fs.mkdirSync(reportingDir);
        }
        fs.writeFileSync(coverageFile, JSON.stringify(cov), "utf8");

        // @ts-ignore
        const remappedCollector = remapIstanbul.remap(cov, {warn: warning => {
            console.warn(warning);
        }});

        const reporter = new istanbul.Reporter(undefined, reportingDir);
        reporter.addAll(["html", "text"]);
        reporter.write(remappedCollector, true, () => {
            console.log(`reports written to ${reportingDir}`);
        });
    }
}
