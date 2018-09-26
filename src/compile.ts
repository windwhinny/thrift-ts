import path = require("path");
import thriftPraser from "./thrift-parser";
import BaseCompiler from "./BaseCompiler";
import ServiceCompiler from "./ServiceCompiler";
import { File, CompileOptions } from "./types";

class Compile extends BaseCompiler {
    serviceCompilers: ServiceCompiler[] = [];

    constructor(
        file: {
            filename: string;
            content: string | Buffer;
        },
        options?: CompileOptions
    ) {
        super(options);

        this.filename = file.filename;
        this.ast = thriftPraser(file.content);
        if (this.ast.service && this.definition) {
            const services = this.ast.service;
            const basename = path.basename(this.filename, ".thrift");
            const include = Object.assign({}, this.ast.include, {
                [basename]: {
                    path: basename
                }
            });

            this.serviceCompilers = Object.keys(services).map(k => {
                return new ServiceCompiler(
                    basename,
                    String(k),
                    services[k],
                    include,
                    options
                );
            });
        }
    }

    flush(): File[] {
        this.writeCommonType();
        if (this.ast.include) {
            this.writeInclude(this.ast.include);
        }
        if (this.ast.const) {
            this.writeConst(this.ast.const);
        }
        if (this.ast.typedef) {
            this.writeTypeof(this.ast.typedef);
        }
        if (this.ast.enum) {
            this.writeEnum(this.ast.enum);
        }
        if (this.ast.struct) {
            this.writeStructs(this.ast.struct);
        }
        if (this.ast.union) {
            this.writeUnions(this.ast.union);
        }
        if (this.ast.exception) {
            this.writeExceptions(this.ast.exception);
        }

        let files: File[] = [];
        if (this.serviceCompilers.length) {
            this.serviceCompilers.forEach(s => {
                files.push(s.flush());
            });
        }

        files.push({
            filename: `${path.basename(this.filename, ".thrift")}${
                this.definition ? "_types.d.ts" : ".ts"
            }`,
            content: this.buffer.join("")
        });

        return files;
    }
}

export default (
    sourceFile: {
        filename: string;
        content: string | Buffer;
    },
    options?: CompileOptions
): File[] => {
    const compiler = new Compile(sourceFile, options);
    return compiler.flush();
};
