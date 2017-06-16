#!/usr/bin/env node
const fs = require('fs');
const glob = require('glob');
const thriftTs = require('../src');
const path = require('path');

const argv = require('yargs')
  .usage('Usage: $0 [options] files')
  .option('s', {
    alias: 'spaceAsTab',
    describe: 'use space as tab',
    default: true,
    type: 'number',
  })
  .options('t', {
    alias: 'tabSize',
    describe: 'tab size',
    default: 2,
    type: 'boolean',
  })
  .options('o', {
    alias: 'out',
    describe: 'out put dir',
    type: 'string'
  })
  .options('i', {
    alias: 'int64AsString',
    describe: 'treat type int64 as type string',
    default: false,
    type: 'boolean'
  })
  .help('h')
  .alias('h', 'help')
  .argv;


if (!argv._.length) {
  throw new Error('must specify a file');
}

function getBasePath(files) {
 let i = 0;
  if (files.length <= 1) return '';
  while (i < files[0].length) {
    let char = '';
    const equal = files.every((file, index) => {
      if (index === 0) {
        char = file[i]
        return true;
      } else if (file[i] === char) {
        return true;
      }
      return false;
    });
    if (!equal) {
      break;
    }
    i++;
  }

  return files[0].slice(0, i);
}

let basePath = null;
if (argv._.length > 1) {
  basePath = getBasePath(argv._);
}

argv._.forEach((p) => {
  let out;
  if (argv.out) {
    out = argv.out;
  } else {
    out = './';
  }
  glob(p, (err, files) => {
    if (err) throw err;
    if (!basePath) {
      basePath = getBasePath(files); 
    }
    console.log(basePath)
    files.forEach(file => {
      const files = thriftTs.default({
        filename: file,
        content: fs.readFileSync(file)
      }, {
        tabSize: argv.tabSize,
        spaceAsTab: argv.spaceAsTab,
        int64AsString: argv.int64AsString,
      });
      files.forEach(newFile => {
        const outfile = path.join(out, path.relative(basePath, path.dirname(file)), newFile.filename);
        console.log(outfile);
        fs.writeFileSync(outfile, newFile.content);
      })
    });
  });
});