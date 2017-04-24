"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCompiler_1 = require("./BaseCompiler");
const path = require("path");
class ServiceCompiler extends BaseCompiler_1.default {
    constructor(name, methods, includes, options) {
        super(options);
        this.name = name;
        this.methods = methods;
        this.includes = includes;
    }
    flush() {
        this.writeCommon();
        if (this.includes) {
            this.writeInclude(this.includes);
        }
        this.wExport(() => this.wService(this.methods));
        return {
            filename: `${path.basename(this.name, '.thrift')}.d.ts`,
            content: this.buffer.join(''),
        };
    }
}
exports.default = ServiceCompiler;
