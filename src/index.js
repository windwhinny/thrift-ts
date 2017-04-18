"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const thriftPraser = require("thrift-parser");
const fs = require("fs");
const unwrap = (fn) => {
    const result = fn();
    if (typeof result === 'function') {
        return unwrap(result);
    }
    else if (Array.isArray(result)) {
        result.forEach(r => {
            if (typeof r === 'function') {
                unwrap(r);
            }
        });
    }
    return;
};
const SPACE = ' ';
const TAB = ' ';
var INTEND_MODE;
(function (INTEND_MODE) {
    INTEND_MODE[INTEND_MODE["TAB"] = 0] = "TAB";
    INTEND_MODE[INTEND_MODE["SPACE"] = 1] = "SPACE";
})(INTEND_MODE || (INTEND_MODE = {}));
class Compiler {
    constructor(out, ast) {
        this.out = out;
        this.ast = ast;
        this.intends = 0;
        this.intendMode = INTEND_MODE.TAB;
        this.tabSize = 2;
    }
    write(...chunks) {
        chunks.forEach(chunk => {
            this.out.write(chunk);
        });
    }
    wexport(next) {
        this.wintend();
        this.write('export', SPACE);
        return next();
    }
    wblock(inline = false, next) {
        if (!inline)
            this.wintend();
        this.write('{');
        next();
        this.wintend();
        this.write('}');
        if (!inline)
            this.write('\n');
    }
    ;
    getThriftTypeName(t) {
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
    getTypeName(str) {
        const t = this.getThriftTypeName(str);
        if (t === null)
            return str;
        return t;
    }
    wfield(f) {
        this.wintend();
        this.write(f.name);
        if (f.option === 'optional')
            this.write('?');
        this.write(':', SPACE);
        const t = this.getTypeName(f.type);
        this.write(t, ';', '\n');
    }
    wnewline() {
        return () => {
            this.write('\n');
            this.write('\n');
        };
    }
    wintend() {
        for (let j = 0; j < this.intends; j++) {
            if (this.intendMode === INTEND_MODE.SPACE) {
                for (let i = 0; i < this.tabSize; i++) {
                    this.write(SPACE);
                }
            }
            else {
                this.write(TAB);
            }
        }
    }
    wreturn() {
        this.write('\n');
        this.wintend();
    }
    increaseIntend() {
        this.write('\n');
        this.intends += this.tabSize;
    }
    decreaseIntend(newline = true) {
        if (newline) {
            this.write('\n');
        }
        this.intends -= this.tabSize;
    }
    wbrackets(next) {
        this.write('(');
        next();
        this.write(')');
    }
    wStructBody(ast, next) {
        this.wblock(false, () => {
            this.increaseIntend();
            ast.forEach(this.wfield.bind(this));
            next && next();
            this.decreaseIntend(false);
        });
    }
    wclass(name, ast) {
        this.wintend();
        this.write('class', SPACE, name, SPACE);
        this.wStructBody(ast, () => {
            this.write('\n');
            this.wintend();
            this.write('constructor');
            this.wbrackets(() => {
                this.write('arg?', ':', SPACE);
                this.wblock(true, () => {
                    this.increaseIntend();
                    ast.forEach(this.wfield.bind(this));
                    this.decreaseIntend(false);
                });
            });
            this.write('\n');
        });
        this.write('\n');
    }
    wexception(name, ast) {
        this.wintend();
        this.write('type', SPACE, name, SPACE, '=', SPACE);
        this.wStructBody(ast);
        this.write('\n');
    }
    wmethodArgs(args, callback) {
        let left = callback ? args.length + 1 : args.length;
        args.forEach((arg) => {
            this.write(arg.name);
            this.write(':', SPACE);
            const t = this.getTypeName(arg.type);
            this.write(t);
            if (--left !== 0) {
                this.write(',', SPACE);
            }
        });
        if (callback) {
            this.write('callback', ':', SPACE, 'Callback', '<');
            if (typeof callback.returnType === 'string') {
                const t = this.getTypeName(callback.returnType);
                this.write(t, ',', SPACE);
            }
            else if (callback.returnType.name === 'list') {
                this.write(callback.returnType.valueType, '[]', ',', SPACE);
            }
            if (callback.expections.length) {
                const str = callback
                    .expections
                    .map(e => this.getTypeName(e.type))
                    .concat(['Error'])
                    .join(' | ');
                this.write(str, '>');
            }
            else {
                this.write('Error', '>');
            }
        }
    }
    wpromise(type, err) {
        this.write('Promise', '<');
        if (typeof type === 'string') {
            const t = this.getTypeName(type);
            this.write(t);
        }
        else if (type.name === 'list') {
            this.write(type.valueType, '[]');
        }
        if (err.length) {
            this.write(',', SPACE);
            this.write(err.map(e => e.type).join(' | '));
        }
        this.write('Promise', '>');
    }
    wmethod(method) {
        this.wintend();
        this.write(method.name);
        this.wbrackets(() => {
            const args = method.args;
            this.wmethodArgs(args, {
                returnType: method.type,
                expections: method.throws,
            });
        });
        this.write(':', SPACE, 'void');
        this.write(';');
        this.write('\n');
        this.wintend();
        this.write(method.name);
        this.wbrackets(() => {
            this.wmethodArgs(method.args);
        });
        this.write(':', SPACE);
        this.wpromise(method.type, method.throws);
        this.write(';');
        this.write('\n');
    }
    wservice(name, methods) {
        this.wintend();
        this.write('class', SPACE, name, SPACE);
        this.wblock(false, () => {
            this.increaseIntend();
            Object.values(methods).forEach((method, index, array) => {
                this.wmethod(method);
                if (index !== array.length - 1) {
                    this.write('\n');
                }
            });
            this.decreaseIntend(false);
        });
    }
    writeStructs(structs) {
        Object.keys(structs).forEach((k) => {
            const s = structs[k];
            this.wexport(() => this.wclass(k, s));
        });
    }
    writeExceptions(exceptions) {
        Object.keys(exceptions).forEach((k) => {
            const e = exceptions[k];
            this.wexport(() => this.wexception(k, e));
        });
    }
    writeServices(services) {
        Object.keys(services).forEach((k) => {
            const s = services[k];
            this.wexport(() => this.wservice(k, s));
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
exports.default = (filename, outfile) => {
    const str = fs.readFileSync(filename);
    const ast = thriftPraser(str);
    const compiler = new Compiler(outfile, ast);
    compiler.flush();
};
