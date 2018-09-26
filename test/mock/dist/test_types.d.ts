interface Int64 {
    constructor(o?: number | string): this;
    toString(): string;
    toJson(): string;
}

export enum Status {
    Success = 1,
    Error = 2
}

export class Result {
    id: number;
    name: string;

    constructor(arg?: { id: number; name: string });
}

export class Response {
    status: Status;
    result?: Result[];

    constructor(arg?: { status: Status; result?: Result[] });
}

export class Request {
    query: string;
    page?: number;

    constructor(arg?: { query: string; page?: number });
}
