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

argv._.forEach((p) => {
  let out;
  if (argv.out) {
    out = argv.out;
  } else {
    out = './';
  }
  glob(p, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
      const files = thriftTs.default({
        filename: file,
        content: fs.readFileSync(file)
      }, {
        tabSize: argv.tabSize,
        spaceAsTab: argv.spaceAsTab,
        int64AsString: argv.int64AsString,
      });
      files.forEach(file => {
        console.log(path.join(out, file.filename))
        fs.writeFileSync(path.join(out, file.filename), file.content);
      })
    });
  });
});