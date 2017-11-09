import BaseCompiler from '../src/BaseCompiler';
import * as sinon from 'sinon';
import * as chai from 'chai';
chai.should();

describe('src/BaseCompiler', () => {
  let baseCompiler: BaseCompiler | null;
  const stubs = sinon.stub;

  beforeEach(() => {
    baseCompiler = new BaseCompiler();
  });

  afterEach(() => {
    baseCompiler = null;
  });

  it('writeInclude, should transfer include to import', () => {

    type Include = {
      [key: string]: { path: string}
    };

    const includes: Include = { 
      0: { path: 'test.thrift' },
      1: { path: './test.thrift' },
      2: { path: '/test/test.thrift' },
      3: { path: './test/test.thrift' },
      4: { path: '../test.thrift' },
      5: { path: '../test/test.thrift' }
    };
    const result:string[] = [];
    const expectResult = (key: string) => `import * as ${key} from './test_types';\n`; 

   if (baseCompiler) {
    stubs(baseCompiler, 'write').callsFake(function(){
      result.push(Array.prototype.join.call(arguments,''));
    })

    baseCompiler.writeInclude(includes);

    for (let key in includes) {
      result[Number(key)].should.eql(expectResult(key));
    }
   }
  });
});
