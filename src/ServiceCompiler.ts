import BaseCompiler from "./BaseCompiler";
import path = require("path");
import { File, CompileOptions } from "./types";
import { Includes, Service } from "./thrift-parser";

export default class ServiceCompiler extends BaseCompiler {
    constructor(
        public basename: string,
        public name: string,
        public service: Service,
        public includes?: Includes,
        options?: CompileOptions
    ) {
        super(options);
    }

    flush(): File {
        if (this.includes) {
            this.writeInclude(this.includes);
        }
        this.writeCallbackTypeDeclare();
        this.writeCommonType();
        this.wExport(() => this.wService(this.service, this.basename));

        return {
            filename: `${path.basename(this.name, ".thrift")}.d.ts`,
            content: this.buffer.join("")
        };
    }
}
