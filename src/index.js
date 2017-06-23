"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const thriftPraser = require("../lib/thriftParser");
const BaseCompiler_1 = require("./BaseCompiler");
const ServiceCompiler_1 = require("./ServiceCompiler");
class Compiler extends BaseCompiler_1.default {
    constructor(file, options) {
        super(options);
        this.serviceCompilers = [];
        this.filename = file.filename;
        this.ast = thriftPraser(file.content);
        if (this.ast.service) {
            const service = this.ast.service;
            const basename = path.basename(this.filename, '.thrift');
            const include = Object.assign({}, this.ast.include, {
                [basename]: {
                    path: basename,
                },
            });
            this.serviceCompilers = Object.keys(this.ast.service).map((k) => {
                return new ServiceCompiler_1.default(k, service[k], include, options);
            });
        }
    }
    flush() {
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
        let files = [];
        if (this.serviceCompilers.length) {
            this.serviceCompilers.forEach(s => {
                files.push(s.flush());
            });
        }
        files.push({
            filename: `${path.basename(this.filename, '.thrift')}_types.d.ts`,
            content: this.buffer.join(''),
        });
        return files;
    }
}
exports.default = (sourceFile, options) => {
    const compiler = new Compiler(sourceFile, options);
    return compiler.flush();
};
