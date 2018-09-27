import { camelCase } from "lodash";
import {
    JsonAST,
    ThriftType,
    ValueType,
    Field,
    Structs,
    Unions,
    Exceptions,
    Includes,
    Enums,
    ListConst,
    StaticConst,
    MapConst,
    Consts,
    SetConst,
    TypeDefs,
    ArgOrExecption,
    Method,
    Service,
    MapType
} from "./thrift-parser";
import { INTEND_MODE, SPACE, TAB, CompileOptions } from "./types";

export default class BaseCompiler {
    intends: number = 0;
    intendMode: INTEND_MODE = INTEND_MODE.TAB;
    tabSize: number = 2;
    ast: JsonAST;
    buffer: string[] = [];
    filename: string;
    int64AsString: boolean = false;
    camelCase: boolean = false;
    definition: boolean = true;

    constructor(options?: CompileOptions) {
        if (options) {
            if (typeof options.tabSize !== "undefined") {
                this.tabSize = options.tabSize;
            }

            if (typeof options.spaceAsTab !== "undefined") {
                this.intendMode = options.spaceAsTab
                    ? INTEND_MODE.SPACE
                    : INTEND_MODE.TAB;
            }

            if (typeof options.int64AsString !== "undefined") {
                this.int64AsString = options.int64AsString;
            }

            if (typeof options.camelCase !== "undefined") {
                this.camelCase = options.camelCase;
            }

            if (typeof options.definition !== "undefined") {
                this.definition = options.definition;
            }
        }
    }

    write(...chunks: (string | Buffer)[]) {
        chunks.forEach(chunk => {
            this.buffer.push(chunk.toString());
        });
    }
    wExport(next: Function) {
        this.wIntend();
        this.write("export", SPACE);
        return next();
    }

    wBlock(inline: boolean = false, next?: Function) {
        if (!inline) this.wIntend();
        this.write("{");
        next && next();
        this.wIntend();
        this.write("}");
        if (!inline) this.write("\n");
    }

    getThriftTypeName(t: ThriftType) {
        switch (t) {
            case "int":
                return "number";
            case "bool":
                return "boolean";
            case "double":
            case "i32":
            case "i16":
            case "i8":
                return "number";
            case "i64":
                return "Int64";
            case "string":
            case "binary":
                return "string";
            default:
                return null;
        }
    }

    getTypeName(str: string) {
        const t = this.getThriftTypeName(str as ThriftType);
        if (t === null) return str;
        return t;
    }

    getName(v: { name: string }) {
        return this.camelCase ? camelCase(v.name) : v.name;
    }

    wField(f: Field) {
        this.wIntend();
        this.write(this.getName(f));

        if (f.option === "optional") this.write("?");
        this.write(":", SPACE);
        this.wValueType(f.type);
        this.write(";", "\n");
    }

    wNewline() {
        return () => {
            this.write("\n");
            this.write("\n");
        };
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
        this.write("\n");
        this.wIntend();
    }

    increaseIntend() {
        this.write("\n");
        this.intends += this.tabSize;
    }

    decreaseIntend(newline: boolean = true) {
        if (newline) {
            this.write("\n");
        }
        this.intends -= this.tabSize;
    }

    wBrackets(next: Function) {
        this.write("(");
        next();
        this.write(")");
    }

    wValueType(vt: ValueType | ValueType[]) {
        if (Array.isArray(vt)) {
            vt.forEach((v, i) => {
                this.wValueType(v);
                if (i !== vt.length - 1) {
                    this.write(SPACE, "|", SPACE);
                }
            });
            return;
        }
        if (typeof vt === "string") {
            return this.write(this.getTypeName(vt));
        }
        if (vt.name === "list") {
            this.wValueType(vt.valueType);
            this.write("[]");
        }
        if (vt.name === "map") {
            this.write("Map<");
            this.wValueType(vt.keyType);
            this.write(",");
            this.wValueType(vt.valueType);
            this.write(">");
        }
        if (vt.name === "set") {
            this.write("Set<");
            this.wValueType(vt.valueType);
            this.write(">");
        }
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
        this.write(this.definition ? "class" : "interface", SPACE, name, SPACE);
        this.wStructBody(
            ast,
            this.definition
                ? () => {
                      this.write("\n");
                      this.wIntend();
                      this.write("constructor");
                      this.wBrackets(() => {
                          this.write("arg?", ":", SPACE);
                          this.wBlock(true, () => {
                              this.increaseIntend();
                              ast.forEach(this.wField.bind(this));
                              this.decreaseIntend(false);
                          });
                      });
                      this.write("\n");
                  }
                : () => {}
        );
        this.write("\n");
    }

    wUnion(name: string, ast: Field[]) {
        this.write("type", SPACE, name, SPACE, "=", SPACE);
        ast.forEach((field, idx) => {
            this.write("{");
            this.increaseIntend();
            this.wIntend();
            this.write(this.getName(field));
            if (field.option === "optional") {
                this.write("?");
            }
            this.write(":", SPACE);
            this.wValueType(field.type);
            this.write(";");
            this.decreaseIntend();
            this.write("}");
            if (idx < ast.length - 1) {
                this.write(" | ");
            }
        });
        this.write("\n\n");
    }

    wException(name: string, ast: Field[]) {
        this.wIntend();
        this.write("type", SPACE, name, SPACE, "=", SPACE);
        this.wStructBody(ast);
        this.write("\n");
    }

    writeStructs(structs: Structs) {
        Object.keys(structs).forEach((k: keyof typeof structs) => {
            const s = structs[k];
            this.wExport(() => this.wClass(String(k), s));
        });
    }

    writeUnions(unions: Unions) {
        Object.keys(unions).forEach((k: keyof typeof unions) => {
            const s = unions[k];
            this.wExport(() => this.wUnion(String(k), s));
        });
    }

    writeExceptions(exceptions: Exceptions) {
        Object.keys(exceptions).forEach((k: keyof typeof exceptions) => {
            const e = exceptions[k];
            this.wExport(() => this.wException(String(k), e));
        });
    }

    writeInclude(includes: Includes) {
        const getIncludePath = (path: string): string => {
            return (
                "./" +
                path.replace(/.*\//, "").replace(/.thrift$/, "") +
                (this.definition ? "_types" : "")
            );
        };

        Object.keys(includes).forEach((k: keyof typeof includes) => {
            const include = includes[k];
            this.write(
                "import",
                SPACE,
                "*",
                SPACE,
                "as",
                SPACE,
                String(k),
                SPACE,
                "from",
                SPACE,
                `'`,
                getIncludePath(include.path),
                `';\n`
            );
        });
    }

    wEnum(
        name: string,
        e: {
            items: {
                name: string;
                value: string | number | boolean;
            }[];
        }
    ) {
        this.wIntend();
        this.wExport(() => {
            this.write("enum", SPACE, name, SPACE);
            this.wBlock(false, () => {
                this.increaseIntend();
                e.items.forEach(item => {
                    this.wIntend();
                    this.write(this.getName(item));
                    if (typeof item.value === "string") {
                        this.write(SPACE, "=", SPACE, `'`, item.value, `'`);
                    } else if (typeof item.value === "number") {
                        this.write(SPACE, "=", SPACE, String(item.value));
                    } else if (typeof item.value === "boolean") {
                        this.write(
                            SPACE,
                            "=",
                            SPACE,
                            item.value ? "true" : "false"
                        );
                    }
                    this.write(",\n");
                });
                this.decreaseIntend(false);
            });
        });
        this.write("\n");
    }

    writeEnum(enums: Enums) {
        Object.keys(enums).forEach((k: keyof typeof enums) => {
            const e = enums[k];
            this.wEnum(String(k), e);
        });
    }

    wString(s: string) {
        this.write(`'`, s, `'`);
    }

    wNumber(n: number) {
        this.write(String(n));
    }

    // tslint:disable-next-line:no-any
    wValue(v: any) {
        if (typeof v === "string") {
            this.wString(v);
        } else if (typeof v === "number") {
            this.wNumber(v);
        } else if (Array.isArray(v)) {
            this.write("[");
            v.forEach((_v, i) => {
                this.wValue(_v);
                if (i !== v.length - 1) {
                    this.write(",", SPACE);
                }
            });
            this.write("]");
        } else if (typeof v === "object") {
            this.wBlock(true, () => {
                this.increaseIntend();
                Object.keys(v).forEach((k: keyof typeof v) => {
                    this.wIntend();
                    this.write(String(k), ":", SPACE);
                    this.wValue(v[k]);
                    this.write(",\n");
                });
                this.decreaseIntend();
            });
        }
    }

    // tslint:disable-next-line:no-any
    wConst(name: string, t: StaticConst | ListConst | MapConst | SetConst) {
        this.wIntend();
        this.write("export", SPACE, "const", SPACE, name);
        if (typeof t.type === "string") {
            this.write(SPACE, "=", SPACE);
            this.wValue(t.value);
        } else {
            this.write(":", SPACE);
            this.wValueType(t.type);
        }
        this.write(";\n");
    }

    writeConst(consts: Consts) {
        Object.keys(consts).forEach((k: keyof Consts) => {
            const c = consts[k];
            this.wConst(String(k), c);
        });
    }

    writeTypeof(typedefs: TypeDefs) {
        Object.keys(typedefs).forEach((k: keyof TypeDefs) => {
            const typedef = typedefs[k];
            this.wIntend();
            this.write("export type", SPACE, String(k), SPACE, "=", SPACE);
            this.wValueType(typedef.type);
            this.write(";\n");
        });
    }

    writeCallbackTypeDeclare() {
        this.wIntend();
        this.write("type Callback<T, E> = (err: E, resp: T) => void;\n\n");
    }

    writeCommonType() {
        if (this.int64AsString) {
            this.wIntend();
            this.write(
                "type",
                SPACE,
                "Int64",
                SPACE,
                "=",
                SPACE,
                "string;",
                "\n"
            );
        } else {
            this.wIntend();
            this.write("interface Int64 {");
            this.increaseIntend();
            this.wIntend();
            this.write("constructor(o?: number | string): this;", "\n");
            this.wIntend();
            this.write("toString(): string;", "\n");
            this.wIntend();
            this.write("toJson(): string;");
            this.decreaseIntend();
            this.wIntend();
            this.write("}\n\n");
        }
    }

    wPromise(type: ValueType) {
        this.write("Promise", "<");
        this.wValueType(type);
        this.write(">");
    }

    getUniqName(argsLike: { name: string }[], name: string = "") {
        while (argsLike.findIndex(arg => arg.name === name) >= 0) {
            name = "_" + name;
        }
        return name;
    }

    wMethodArgs(
        args: ArgOrExecption[],
        callback?: {
            returnType: ValueType;
            expections: ArgOrExecption[];
        }
    ) {
        let left = callback ? args.length + 1 : args.length;
        args.forEach(arg => {
            this.write(arg.name);
            this.write(":", SPACE);
            this.wValueType(arg.type);
            if (--left !== 0) {
                this.write(",", SPACE);
            }
        });

        if (callback) {
            this.write(
                this.getUniqName(args, "callback"),
                ":",
                SPACE,
                "Callback",
                "<"
            );
            this.wValueType(callback.returnType);
            this.write(",", SPACE);
            if (callback.expections.length) {
                let type: ValueType[] = callback.expections.map(e => e.type);
                type = type.concat("Error");
                this.wValueType(type);
                this.write(">");
            } else {
                this.write("Error", ">");
            }
        }
    }

    wMethod(method: Method) {
        this.wIntend();
        this.write(method.name);
        this.wBrackets(() => {
            const args = method.args;
            this.wMethodArgs(args, {
                returnType: method.type,
                expections: method.throws
            });
        });
        this.write(":", SPACE, "void");
        this.write(";");
        this.write("\n");

        this.wIntend();
        this.write(method.name);
        this.wBrackets(() => {
            this.wMethodArgs(method.args);
        });
        this.write(":", SPACE);
        this.wPromise(method.type);
        this.write(";");
        this.write("\n");
    }

    getFixedType(type: ValueType, basename: string) {
        if (type) {
            if (typeof type === "string") {
                const parts = type.split(".");
                if (!parts[1] && type[0] === type[0].toUpperCase()) {
                    type = basename + "." + parts[0];
                }
            } else if (typeof type === "object") {
                if (type.hasOwnProperty("valueType")) {
                    type.valueType = this.getFixedType(
                        type.valueType,
                        basename
                    );
                }
                if (type.hasOwnProperty("keyType")) {
                    (type as MapType).keyType = this.getFixedType(
                        (type as MapType).keyType,
                        basename
                    );
                }
            }
        }
        return type;
    }

    setArgFixedType(argLike: { type: ValueType }, basename: string) {
        argLike.type = this.getFixedType(argLike.type, basename);
        return argLike;
    }

    wService(service: Service, basename: string) {
        this.wIntend();
        this.write("class", SPACE, "Client", SPACE);
        this.wBlock(false, () => {
            this.increaseIntend();
            Object.values(service.functions).forEach((method, index, array) => {
                const setArgFixedType = (arg: { type: ValueType }) =>
                    this.setArgFixedType(arg, basename);
                setArgFixedType(method);
                method.args.forEach(setArgFixedType);
                method.throws.forEach(setArgFixedType);
                this.wMethod(method);
                if (index !== array.length - 1) {
                    this.write("\n");
                }
            });
            this.decreaseIntend(false);
        });
    }
}
