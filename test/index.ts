import compiler from '../src';
import stream = require('stream');

compiler('./test.thrift', process.stdout as stream.Writable)