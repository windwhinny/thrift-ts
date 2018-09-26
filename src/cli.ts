import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import * as yargs from "yargs";
import * as prettier from "prettier";

import compile from "./compile";

export default () => {
    const argv = yargs
        .usage("Usage: $0 [options] files")
        .option("s", {
            alias: "spaceAsTab",
            describe: "use space as tab",
            default: true,
            type: "number"
        })
        .options("t", {
            alias: "tabSize",
            describe: "tab size",
            default: 2,
            type: "boolean"
        })
        .options("o", {
            alias: "out",
            describe: "out put dir",
            type: "string"
        })
        .options("i", {
            alias: "int64AsString",
            describe: "treat type int64 as type string",
            default: false,
            type: "boolean"
        })
        .options("d", {
            alias: "definition",
            describe: "generate definition type",
            default: true,
            type: "boolean"
        })
        .options("c", {
            alias: "camelCase",
            describe: "camel case",
            default: false,
            type: "boolean"
        })
        .options("v", {
            alias: "version",
            describe: "current version"
        })
        .help("h")
        .alias("h", "help").argv;

    if (argv.version) {
        const pkg = fs.readFileSync(path.join(__dirname, "../package.json"), {
            encoding: "utf-8"
        });
        console.log("V" + JSON.parse(pkg).version);
        return;
    }

    if (!argv._.length) {
        throw new Error("must specify a file");
    }

    function getBasePath(files: any[]) {
        let i = 0;
        if (files.length <= 1) return "";
        while (i < files[0].length) {
            let char = "";
            const equal = files.every((file: any[], index: number) => {
                if (index === 0) {
                    char = file[i];
                    return true;
                } else if (file[i] === char) {
                    return true;
                }
                return false;
            });
            if (!equal) {
                break;
            }
            i++;
        }

        return files[0].slice(0, i);
    }

    /**
     * If you enter the folder directly, you need to switch to similar ./**\/*.thrift
     * @param {string} folder
     * @return {string} folder
     */
    function getFolderPath(folder: string) {
        const isFolder = !(folder && folder.match(/.thrift$/));
        if (isFolder) {
            if (folder.match(/\/$/)) {
                return folder + "**/*.thrift";
            }
            return folder + "/**/*.thrift";
        }
        return folder;
    }

    let basePath: string | null = null;
    if (argv._.length > 1) {
        basePath = getBasePath(argv._);
    }

    argv._.forEach(p => {
        let out: string;
        if (argv.out) {
            out = argv.out;
        } else {
            out = "./";
        }
        // if you enter the folder path directly, you need to do the conversion
        p = getFolderPath(p);
        glob(p, (err, files) => {
            if (err) throw err;
            if (!basePath) {
                basePath = getBasePath(files);
            }
            console.log("basePath:", basePath);
            files.forEach(file => {
                const files = compile(
                    {
                        filename: file,
                        content: fs.readFileSync(file)
                    },
                    {
                        tabSize: argv.tabSize,
                        spaceAsTab: argv.spaceAsTab,
                        int64AsString: argv.int64AsString,
                        definition: argv.definition,
                        camelCase: argv.camelCase
                    }
                );
                if (!fs.existsSync(out)) {
                    fs.mkdirSync(out);
                }
                files.forEach(newFile => {
                    const outfile = path.join(out, newFile.filename);
                    console.log("outfile:", outfile);
                    fs.writeFileSync(
                        outfile,
                        prettier.format(
                            "// tslint:disable\n" + newFile.content,
                            { parser: "typescript" }
                        )
                    );
                });
            });
        });
    });
};
