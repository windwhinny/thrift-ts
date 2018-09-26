import thriftParser from "thrift-parser";
import { JsonAST } from "./ast";

export interface ThriftFileParsingError extends Error {
    messgae: string;
    name: "THRIFT_FILE_PARSING_ERROR";
}

export default thriftParser as { (str: string | Buffer): JsonAST };
