/// <reference path="../declarations/thriftParser.d.ts" />

import thriftPraser = require('thrift-parser');
import fs = require('fs');
import stream = require('stream');

// tslint:disable-next-line:no-any
const unwrap = (fn: Function): any => {
  const result = fn();
  if (typeof result === 'function') {
    return unwrap(result);
  } else if (Array.isArray(result)) {
    result.forEach(r => {
      if (typeof r === 'function') {
        unwrap(r);
      }
    })
  }
  return;
};

const SPACE = ' ';
const TAB = ' '
enum INTEND_MODE {
  TAB,
  SPACE,
}
class Compiler {
  intends: number = 0;
  intendMode: INTEND_MODE = INTEND_MODE.TAB;
  tabSize: number = 2;

  constructor(
    public out: stream.Writable,
    public ast: JsonAST
  ) { }

  write(...chunks: (string | Buffer)[]) {
    chunks.forEach(chunk => {
      this.out.write(chunk);
    })
  }

  wExport(next: Function) {
    this.wIntend();
    this.write('export', SPACE);
    return next();
  }

  wBlock(inline: boolean = false, next: Function) {
    if (!inline) this.wIntend();
    this.write('{');
    next();
    this.wIntend();
    this.write('}');
    if (!inline) this.write('\n');
  };

  getThriftTypeName(t: ThriftType) {
    switch (t) {
      case 'int': return 'number';
      case 'bool': return 'boolean';
      case 'i32':
      case 'i16':
        return 'number';
      case 'i64':
        return 'string';
      case 'string':
        return 'string';
      default:
        return null;
    }
  }

  getTypeName(str: string) {
    const t = this.getThriftTypeName(str as ThriftType);
    if (t === null) return str;
    return t;
  }

  wField(f: Field) {
    this.wIntend();
    this.write(f.name);
    if (f.option === 'optional') this.write('?');
    this.write(':', SPACE);
    const t = this.getTypeName(f.type)
    this.write(t, ';', '\n');
  }

  wNewline() {
    return () => {
      this.write('\n');
      this.write('\n');
    }
  }

  wIntend() {
    for (let j = 0; j < this.intends; j++) {
      if (this.intendMode === INTEND_MODE.SPACE) {
        for (let i = 0; i < this.tabSize; i++) {
          this.write(SPACE);
        }
      } else {
        this.write(TAB);
      }
    }
  }

  wReturn() {
    this.write('\n');
    this.wIntend();
  }

  increaseIntend() {
    this.write('\n');
    this.intends += this.tabSize;
  }

  decreaseIntend(newline: boolean = true) {
    if (newline) {
      this.write('\n');
    }
    this.intends -= this.tabSize;
  }

  wBrackets(next: Function) {
    this.write('(');
    next();
    this.write(')');
  }

  wStructBody(ast: Field[], next?: Function) {
    this.wBlock(false, () => {
      this.increaseIntend();
      ast.forEach(this.wField.bind(this));
      next && next();
      this.decreaseIntend(false);
    });
  }

  wClass(name: string, ast: Field[]) {
    this.wIntend();
    this.write('class', SPACE, name, SPACE);
    this.wStructBody(ast, () => {
      this.write('\n');
      this.wIntend();
      this.write('constructor');
      this.wBrackets(() => {
        this.write('arg?', ':', SPACE);
        this.wBlock(true, () => {
          this.increaseIntend();
          ast.forEach(this.wField.bind(this));
          this.decreaseIntend(false);
        });
      });
      this.write('\n');
    });
    this.write('\n');
  }

  wException(name: string, ast: Field[]) {
    this.wIntend();
    this.write('type', SPACE, name, SPACE, '=', SPACE);
    this.wStructBody(ast);
    this.write('\n');
  }

  wMethodArgs(args: ArgOrExecption[], callback?: {
    returnType: ThriftType | ReturnType,
    expections: ArgOrExecption[]
  }) {
    let left = callback ? args.length + 1 : args.length;
    args.forEach((arg) => {
      this.write(arg.name);
      this.write(':', SPACE);
      const t = this.getTypeName(arg.type as ThriftType);
      this.write(t);
      if (--left !== 0) {
        this.write(',', SPACE);
      }
    });

    if (callback) {
      this.write('callback', ':', SPACE, 'Callback', '<');
      if (typeof callback.returnType === 'string') {
        const t = this.getTypeName(callback.returnType as ThriftType);
        this.write(t, ',', SPACE);
      } else if (callback.returnType.name === 'list') {
        this.write(callback.returnType.valueType, '[]', ',', SPACE);
      }
      if (callback.expections.length) {
        const str = callback
          .expections
          .map(e => this.getTypeName(e.type))
          .concat(['Error'])
          .join(' | ');
        this.write(str, '>');
      } else {
        this.write('Error', '>');
      }
    }
  }

  wPromise(type: ThriftType | ReturnType, err: ArgOrExecption[]) {
    this.write('Promise', '<');
    if (typeof type === 'string') {
      const t = this.getTypeName(type);
      this.write(t);
    } else if (type.name === 'list') {
      this.write(type.valueType, '[]');
    }
    if (err.length) {
      this.write(',', SPACE);
      this.write(err.map(e => e.type).join(' | '));
    }
    this.write('Promise', '>');
  }

  wMethod(method: Method) {
    this.wIntend();
    this.write(method.name);
    this.wBrackets(() => {
      const args = method.args;
      this.wMethodArgs(args, {
        returnType: method.type,
        expections: method.throws,
      });
    });
    this.write(':', SPACE, 'void')
    this.write(';'); this.write('\n');

    this.wIntend();
    this.write(method.name);
    this.wBrackets(() => {
      this.wMethodArgs(method.args);
    });
    this.write(':', SPACE)
    this.wPromise(method.type, method.throws);
    this.write(';'); this.write('\n');
  }

  wService(name: string, methods: {
    [name: string]: Method,
  }) {
    this.wIntend();
    this.write('class', SPACE, name, SPACE);
    this.wBlock(false, () => {
      this.increaseIntend();
      Object.values(methods).forEach((method, index, array) => {
        this.wMethod(method);
        if (index !== array.length - 1) {
          this.write('\n');
        }
      });
      this.decreaseIntend(false);
    });
  }

  writeStructs(structs: Structs) {
    Object.keys(structs).forEach((k: keyof typeof structs) => {
      const s = structs[k];
      this.wExport(() => this.wClass(k, s));
    });
  }

  writeExceptions(exceptions: Exceptions) {
    Object.keys(exceptions).forEach((k: keyof typeof exceptions) => {
      const e = exceptions[k];
      this.wExport(() => this.wException(k, e));
    });
  }

  writeServices(services: Services) {
    Object.keys(services).forEach((k: keyof typeof services) => {
      const s = services[k];
      this.wExport(() => this.wService(k, s));
    });
  }

  writeCommon() {
    this.write('type Callback<T, E> = (err: E, resp: T) => void;\n\n');
  }

  flush() {
    this.writeCommon();
    if (this.ast.struct) {
      this.writeStructs(this.ast.struct);
    }
    if (this.ast.exception) {
      this.writeExceptions(this.ast.exception);
    }
    if (this.ast.service) {
      this.writeServices(this.ast.service);
    }
  }
}

export default (filename: string, outfile: stream.Writable) => {
  const str = fs.readFileSync(filename);
  const ast = thriftPraser(str);
  const compiler = new Compiler(outfile, ast);
  compiler.flush();
}
