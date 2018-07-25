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

