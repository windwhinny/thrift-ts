import BaseCompiler from "../src/BaseCompiler";
import thriftPraser from "../src/thriftParser";
import * as sinon from "sinon";
import * as chai from "chai";
import * as fs from "fs";
import { JsonAST } from "../src/ast";
import * as Path from "path";
chai.should();

describe("src/BaseCompiler", () => {
    let baseCompiler: BaseCompiler;
    const stubs = sinon.stub;

    beforeEach(() => {
        baseCompiler = new BaseCompiler();
    });

    describe("writeInclude", () => {
        it("writeInclude, should transfer include to import", () => {
            type Include = {
                [key: string]: { path: string };
            };

            const includes: Include = {
                0: { path: "test.thrift" },
                1: { path: "./test.thrift" },
                2: { path: "/test/test.thrift" },
                3: { path: "./test/test.thrift" },
                4: { path: "../test.thrift" },
                5: { path: "../test/test.thrift" }
            };
            const result: string[] = [];
            const expectResult = (key: string) =>
                `import * as ${key} from './test_types';\n`;

            stubs(baseCompiler, "write").callsFake(function() {
                result.push(Array.prototype.join.call(arguments, ""));
            });

            baseCompiler.writeInclude(includes);

            for (let key in includes) {
                result[Number(key)].should.eql(expectResult(key));
            }
        });
    });

    describe("writeTypeof", () => {
        let ast: JsonAST;
        beforeEach(() => {
            ast = thriftPraser(
                fs.readFileSync(
                    Path.join(__dirname, "./mock/idl/typeof.thrift")
                )
            );
        });

        it("should support typedefs keyword", () => {
            const typedef = ast.typedef;
            if (!typedef) throw new Error("typedef must exists");
            baseCompiler.writeTypeof(typedef);
            baseCompiler.buffer.join("").should.eq("type TList = T[];\n");
        });
    });
});
