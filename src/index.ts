import path = require('path');
import thriftPraser = require('../lib/thriftParser');
import BaseCompiler from './BaseCompiler';
import ServiceCompiler from './ServiceCompiler';
import {
  Services,
} from '../lib/ast';
import {
  File,
  CompileOptions,
} from './types';

class Compiler extends BaseCompiler {
  serviceCompilers: ServiceCompiler[] = [];

  constructor(
    file: {
      filename: string,
      content: string | Buffer,
    },
    options?: CompileOptions
  ) {
    super(options);

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

      this.serviceCompilers = Object.keys(this.ast.service).map((k: keyof Services) => {
        return new ServiceCompiler(k, service[k], include, options);
      });
    }
  }

  flush(): File[] {
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
    if (this.ast.exception) {
      this.writeExceptions(this.ast.exception);
    }

    let files: File[] = [];
    if (this.serviceCompilers.length) {
      this.serviceCompilers.forEach(s => {
        files.push(s.flush());
      })
    }

    files.push({
      filename: `${path.basename(this.filename, '.thrift')}_types.d.ts`,
      content: this.buffer.join(''),
    });

    return files;
  }
}

export default (sourceFile: {
  filename: string,
  content: string | Buffer,
}, options?: {
  tabSize?: number,
  spaceAsTab?: boolean,
}): File[] => {
  const compiler = new Compiler(sourceFile, options);
  return compiler.flush();
}
