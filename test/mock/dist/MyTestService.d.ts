import * as test from './test_types';
type Callback<T, E> = (err: E, resp: T) => void;

interface Int64 {
    constructor(o?: number | string): this;
    toString(): string;
    toJson(): string;
}

export class Client {
    search(request: Request, callback: Callback<Response, Error>): void;
    search(request: Request): Promise<Response>;
}
