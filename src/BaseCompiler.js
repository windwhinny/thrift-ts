"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
class BaseCompiler {
    constructor(options) {
        this.intends = 0;
        this.intendMode = types_1.INTEND_MODE.TAB;
        this.tabSize = 2;
        this.buffer = [];
        if (options) {
            if (typeof options.tabSize !== 'undefined') {
                this.tabSize = options.tabSize;
            }
            if (typeof options.spaceAsTab !== 'undefined') {
                this.intendMode = options.spaceAsTab ? types_1.INTEND_MODE.SPACE : types_1.INTEND_MODE.TAB;
            }
        }
    }
    write(...chunks) {
        chunks.forEach(chunk => {
            this.buffer.push(chunk.toString());
        });
    }
    wExport(next) {
        this.wIntend();
        this.write('export', types_1.SPACE);
        return next();
    }
    wBlock(inline = false, next) {
        if (!inline)
            this.wIntend();
        this.write('{');
        next();
        this.wIntend();
        this.write('}');
        if (!inline)
            this.write('\n');
    }
    ;
    getThriftTypeName(t) {
        switch (t) {
            case 'int': return 'number';
            case 'bool': return 'boolean';
            case 'double':
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
    wField(f) {
        this.wIntend();
        this.write(f.name);
        if (f.option === 'optional')
            this.write('?');
        this.write(':', types_1.SPACE);
        this.wValueType(f.type);
        this.write(';', '\n');
    }
    wNewline() {
        return () => {
            this.write('\n');
            this.write('\n');
        };
    }
    wIntend() {
        for (let j = 0; j < this.intends; j++) {
            if (this.intendMode === types_1.INTEND_MODE.SPACE) {
                for (let i = 0; i < this.tabSize; i++) {
                    this.write(types_1.SPACE);
                }
            }
            else {
                this.write(types_1.TAB);
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
    decreaseIntend(newline = true) {
        if (newline) {
            this.write('\n');
        }
        this.intends -= this.tabSize;
    }
    wBrackets(next) {
        this.write('(');
        next();
        this.write(')');
    }
    wValueType(vt) {
        if (Array.isArray(vt)) {
            vt.forEach((v, i) => {
                this.wValueType(v);
                if (i !== vt.length - 1) {
                    this.write(types_1.SPACE, '|', types_1.SPACE);
                }
            });
            return;
        }
        if (typeof vt === 'string') {
            return this.write(this.getTypeName(vt));
        }
        if (vt.name === 'list') {
            this.wValueType(vt.valueType);
            this.write('[]');
        }
        if (vt.name === 'map') {
            this.write('Map<');
            this.wValueType(vt.keyType);
            this.write(',');
            this.wValueType(vt.valueType);
            this.write('>');
        }
        if (vt.name === 'set') {
            this.write('Set<');
            this.wValueType(vt.valueType);
            this.write('>');
        }
    }
    wStructBody(ast, next) {
        this.wBlock(false, () => {
            this.increaseIntend();
            ast.forEach(this.wField.bind(this));
            next && next();
            this.decreaseIntend(false);
        });
    }
    wClass(name, ast) {
        this.wIntend();
        this.write('class', types_1.SPACE, name, types_1.SPACE);
        this.wStructBody(ast, () => {
            this.write('\n');
            this.wIntend();
            this.write('constructor');
            this.wBrackets(() => {
                this.write('arg?', ':', types_1.SPACE);
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
    wException(name, ast) {
        this.wIntend();
        this.write('type', types_1.SPACE, name, types_1.SPACE, '=', types_1.SPACE);
        this.wStructBody(ast);
        this.write('\n');
    }
    writeStructs(structs) {
        Object.keys(structs).forEach((k) => {
            const s = structs[k];
            this.wExport(() => this.wClass(k, s));
        });
    }
    writeExceptions(exceptions) {
        Object.keys(exceptions).forEach((k) => {
            const e = exceptions[k];
            this.wExport(() => this.wException(k, e));
        });
    }
    writeInclude(includes) {
        const getIncludePath = (path) => {
            return './' + path.replace(/.thrift$/, '') + '_types';
        };
        Object.keys(includes).forEach((k) => {
            const include = includes[k];
            this.write('import', types_1.SPACE, '*', types_1.SPACE, 'as', types_1.SPACE, k, types_1.SPACE, 'from', types_1.SPACE, `'`, getIncludePath(include.path), `';\n`);
        });
    }
    wEnum(name, e) {
        this.wIntend();
        this.wExport(() => {
            this.write('enum', types_1.SPACE, name, types_1.SPACE);
            this.wBlock(false, () => {
                this.increaseIntend();
                e.items.forEach(item => {
                    this.wIntend();
                    this.write(item.name);
                    if (typeof item.value === 'string') {
                        this.write(types_1.SPACE, '=', types_1.SPACE, `'`, item.value, `'`);
                    }
                    else if (typeof item.value === 'number') {
                        this.write(types_1.SPACE, '=', types_1.SPACE, String(item.value));
                    }
                    else if (typeof item.value === 'boolean') {
                        this.write(types_1.SPACE, '=', types_1.SPACE, item.value ? 'true' : 'false');
                    }
                    this.write(',\n');
                });
                this.decreaseIntend(false);
            });
        });
        this.write('\n');
    }
    writeEnum(enums) {
        Object.keys(enums).forEach((k) => {
            const e = enums[k];
            this.wEnum(k, e);
        });
    }
    wString(s) {
        this.write(`'`, s, `'`);
    }
    wNumber(n) {
        this.write(String(n));
    }
    wValue(v) {
        if (typeof v === 'string') {
            this.wString(v);
        }
        else if (typeof v === 'number') {
            this.wNumber(v);
        }
        else if (Array.isArray(v)) {
            this.write('[');
            v.forEach((_v, i) => {
                this.wValue(_v);
                if (i !== v.length - 1) {
                    this.write(',', types_1.SPACE);
                }
            });
            this.write(']');
        }
        else if (typeof v === 'object') {
            this.wBlock(true, () => {
                this.increaseIntend();
                Object.keys(v).forEach((k) => {
                    this.wIntend();
                    this.write(k, ':', types_1.SPACE);
                    this.wValue(v[k]);
                    this.write(',\n');
                });
                this.decreaseIntend();
            });
        }
    }
    wConst(name, t) {
        this.wIntend();
        this.write('export', types_1.SPACE, 'const', types_1.SPACE, name);
        if (typeof t.type === 'string') {
            this.write(types_1.SPACE, '=', types_1.SPACE);
            this.wValue(t.value);
        }
        else {
            this.write(':', types_1.SPACE);
            this.wValueType(t.type);
        }
        this.write(';\n');
    }
    ;
    writeConst(consts) {
        Object.keys(consts).forEach((k) => {
            const c = consts[k];
            this.wConst(k, c);
        });
    }
    writeTypeof(typedefs) {
        Object.keys(typedefs).forEach((k) => {
            const typedef = typedefs[k];
            this.wIntend();
            this.write('type', types_1.SPACE, k, types_1.SPACE, '=', types_1.SPACE, this.getTypeName(typedef.type));
            this.write(';\n');
        });
    }
    writeCommon() {
        this.write('type Callback<T, E> = (err: E, resp: T) => void;\n\n');
    }
    wPromise(type, err) {
        this.write('Promise', '<');
        this.wValueType(type);
        if (err.length) {
            this.write(',', types_1.SPACE);
            this.write(err.map(e => e.type).join(' | '));
        }
        this.write('>');
    }
    wMethodArgs(args, callback) {
        let left = callback ? args.length + 1 : args.length;
        args.forEach((arg) => {
            this.write(arg.name);
            this.write(':', types_1.SPACE);
            this.wValueType(arg.type);
            if (--left !== 0) {
                this.write(',', types_1.SPACE);
            }
        });
        if (callback) {
            this.write('callback', ':', types_1.SPACE, 'Callback', '<');
            this.wValueType(callback.returnType);
            this.write(',', types_1.SPACE);
            if (callback.expections.length) {
                let type = callback.expections.map(e => e.type);
                type = type.concat('Error');
                this.wValueType(type);
                this.write('>');
            }
            else {
                this.write('Error', '>');
            }
        }
    }
    wMethod(method) {
        this.wIntend();
        this.write(method.name);
        this.wBrackets(() => {
            const args = method.args;
            this.wMethodArgs(args, {
                returnType: method.type,
                expections: method.throws,
            });
        });
        this.write(':', types_1.SPACE, 'void');
        this.write(';');
        this.write('\n');
        this.wIntend();
        this.write(method.name);
        this.wBrackets(() => {
            this.wMethodArgs(method.args);
        });
        this.write(':', types_1.SPACE);
        this.wPromise(method.type, method.throws);
        this.write(';');
        this.write('\n');
    }
    wService(methods) {
        this.wIntend();
        this.write('class', types_1.SPACE, 'Client', types_1.SPACE);
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
}
exports.default = BaseCompiler;
