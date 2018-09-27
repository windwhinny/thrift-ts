import thriftTs from "../src";
import * as fs from "fs";
import * as Path from "path";

describe("thriftTs", () => {
    it("should compile to d.ts", () => {
        const filename = Path.join(__dirname, "./mock/idl/test.thrift");
        const content = fs.readFileSync(filename);
        thriftTs(
            {
                filename,
                content
            },
            {
                spaceAsTab: true
            }
        ).forEach(newFile => {
            const newFilename = Path.join(
                __dirname,
                "./mock/dist",
                newFile.filename
            );
            if (!fs.existsSync(newFilename)) throw new Error("file not exists");

            const distContent = fs.readFileSync(newFilename).toString();
            if (distContent !== newFile.content) {
                throw new Error("content does not match");
            }
        });
    });
});
