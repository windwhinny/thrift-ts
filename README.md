[![Build Status](https://travis-ci.org/windwhinny/thrift-ts.svg?branch=master)](https://travis-ci.org/windwhinny/thrift-ts)

# thrift-ts

`thrift-ts` is a typescript compiler that compile *.thrift files to *.d.ts files.
It should works with `thrift --gen js:node` commands.

## Installation
```bash
$ npm install -g thrift-ts
```

## How to use
### CLI
```bash
// just compile one file
thrift-ts Model.thrift

// compile all IDL files in the folder and output in other folder
thrift-ts ./src -o ./dist

// learn more
thrift-ts -h
```

### Node
```js
import thriftTs from 'thriftTs';
import fs = require('fs');

const filename = './Model.thrift';
const files = thriftTs({
  filename,
  content: fs.readFileSync(filename),
})

console.log(files);
// [{ filename: 'Model_types.d.ts', content: '...'}]
```

## Example

thrift file:

```thrift
namespace java com.my.test

struct Result {
 1: i32 id;
 2: string name;
}

enum Status {
  Success = 1;
  Error = 2;
}

struct Response {
  1:required Status status;
  2:optional list<Result> result;
}

struct Request {
  1: required string query;
  2: optional number page;
}

service MyTestService {
    Response search(1:Request request);
}
```

.d.ts file:
```typescript
type Callback<T, E> = (err: E, resp: T) => void;

interface Int64 {
    constructor(o?: number | string): this;
    toString(): string;
    toJson(): string;
}

export enum Status {
    Success = 1,
    Error = 2,
}

export class Result {
    id: number;
    name: string;

    constructor(arg?: {
        id: number;
        name: string;
    })
}

export class Response {
    status: Status;
    result?: Result[];

    constructor(arg?: {
        status: Status;
        result?: Result[];
    })
}

export class Request {
    query: string;
    page?: number;

    constructor(arg?: {
        query: string;
        page?: number;
    })
}

export class Client {
    search(request: Request, callback: Callback<Response, Error>): void;
    search(request: Request): Promise<Response>;
}
```