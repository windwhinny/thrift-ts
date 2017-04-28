import BaseCompiler from './BaseCompiler';
import path = require('path');
import {
  File,
  CompileOptions,
} from './types';
import {
  Method,
  Includes,
} from '../lib/ast';

export default class ServiceCompiler extends BaseCompiler {
  name: string;
  methods: {
    [methodName: string]: Method,
  };
  includes?: Includes;

  constructor(
    name: string,
    methods: {
      [methodName: string]: Method,
    },
    includes?: Includes,
    options?: CompileOptions,
  ) {
    super(options);
    this.name = name;
    this.methods = methods;
    this.includes = includes;
  }

  flush(): File {
    this.writeCallbackTypeDeclare();
    this.writeCommonType();
    if (this.includes) {
      this.writeInclude(this.includes);
    }
    this.wExport(() => this.wService(this.methods));

    return {
      filename: `${path.basename(this.name, '.thrift')}.d.ts`,
      content: this.buffer.join(''),
    }
  }
}
