/// <reference types="node" />

type ThriftType = 'int' | 'bool' | 'i16' | 'i32' | 'i64' | 'string';
type FieldOption = 'required' | 'optional';
type Field = {
  id: string,
  option: FieldOption,
  type: ThriftType,
  name: string,
};

type ArgOrExecption = {
  id: string,
  type: string,
  name: string | ThriftType,
}

type ReturnType = {
  name: "list",
  valueType: string,
}

type Method = {
  type: ThriftType | ReturnType,
  name: string,
  args: ArgOrExecption[],
  throws: ArgOrExecption[],
}

type Structs = {
  [name: string]: Field[],
}

type Exceptions = {
  [name: string]: Field[],
}

type Services = {
  [serviceName: string]: {
    [methodName: string]: Method,
  },
}

type JsonAST = {
  struct?: Structs,
  exception?: Exceptions,
  service?: Services,
};

declare module 'thrift-parser' {
  interface ThriftFileParsingError extends Error {
    messgae: string;
    name: 'THRIFT_FILE_PARSING_ERROR';
  }

  function parser (str: string | Buffer): JsonAST;

  export = parser;
}
