/// <reference types="node" />
import { JsonAST } from './ast';

interface ThriftFileParsingError extends Error {
  messgae: string;
  name: 'THRIFT_FILE_PARSING_ERROR';
}

declare function parser (str: string | Buffer): JsonAST;

export = parser;
