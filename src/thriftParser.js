// thrift-parser have some type-definition problems
// we will not use it directly until they publish the new version
// in this way, we can import our "correct" d.ts file
// https://github.com/eleme/thrift-parser/commit/bb998c2836f20ee8dc431be38164c4d193320f87
const parser = require("thrift-parser");
module.exports = parser;
