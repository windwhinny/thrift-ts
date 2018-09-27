const thriftParser: (
    str: string | Buffer
) => JsonAST = require("thrift-parser");

export type SetType = {
    name: "set";
    valueType: ValueType;
};

export type ListType = {
    name: "list";
    valueType: ValueType;
};

export type MapType = {
    name: "map";
    keyType: ValueType;
    valueType: ValueType;
};

export type ValueType = string | SetType | ListType | MapType;

export type ThriftType =
    | "int"
    | "bool"
    | "i8"
    | "i16"
    | "i32"
    | "i64"
    | "string"
    | "double"
    | "binary";

export type FieldOption = "required" | "optional";

export type Field = {
    id?: string;
    option?: FieldOption;
    type: ThriftType;
    name: string;
};

export type ArgOrExecption = {
    id: string;
    type: ValueType;
    name: string;
};

export type Method = {
    type: ValueType;
    name: string;
    args: ArgOrExecption[];
    throws: ArgOrExecption[];
};

export type Structs = {
    [name: string]: Field[];
};

export type Unions = {
    [name: string]: Field[];
};

export type Exceptions = {
    [name: string]: Field[];
};

export type Service = {
    functions: {
        [methodName: string]: Method;
    };
};
export type Services = {
    [name: string]: Service;
};

export type Namespaces = {
    [name: string]: {
        serviceName: string;
    };
};

export type Includes = {
    [name: string]: {
        path: string;
    };
};

export type TypeDefs = {
    [name: string]: {
        type: ValueType;
    };
};

export type StaticConst = {
    type: string;
    value: any;
};

export type ListConst = {
    type: ListType;
    value: any;
};

export type MapConst = {
    type: MapType;
    value: {
        key: any;
        value: any;
    }[];
};

export type SetConst = {
    type: SetType;
    value: any;
};

export type Consts = {
    [name: string]: StaticConst | ListConst | MapConst | SetConst;
};

export type Enum = {
    name: string;
    value: string | number | boolean;
};

export type Enums = {
    [name: string]: {
        items: Enum[];
    };
};

export type JsonAST = {
    namespace?: Namespaces;
    typedef?: TypeDefs;
    include?: Includes;
    const?: Consts;
    enum?: Enums;
    struct?: Structs;
    union?: Unions;
    exception?: Exceptions;
    service?: Services;
};

export interface ThriftFileParsingError extends Error {
    messgae: string;
    name: "THRIFT_FILE_PARSING_ERROR";
}

export default thriftParser;
