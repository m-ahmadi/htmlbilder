#!/usr/bin/env node
const { writeFileSync, readFileSync, readdirSync, statSync } = require('fs');
const { join, extname, parse } = require('path');
const chokidar = require('chokidar');
const Handlebars = require('handlebars');
const indent = require('indent.js');
const log = console.log;
colors();

const defaults = {
  rootDir:         './',
  outFile:         './index.html',
  tempFile:        'index.hbs',
  dataFileExt:     '.htm',
  indentChar:      'tab',
  indentCharCount: 1
};
const charmap = new Map([['tab', '\t'], ['space', ' ']]);

if (require.main === module) { // called from command line
  const cmd = require('commander');
  const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
  cmd
    .helpOption('-h, --help', 'Show help.')
    .name('htmlbilder')
    .usage('somedir [-o page.html -t main.hbs -e .html -w]')
    .description(pkg.description)
    .option('-r, --rootDir [value]',         'Templates directory path. Ignored if hyphenless arg is provided.',        defaults.rootDir)
    .option('-o, --outFile [value]',         'The output file.',                                                        defaults.outFile)
    .option('-t, --tempFile [value]',        'Filename pattern for the template files.',                                defaults.tempFile)
    .option('-e, --dataFileExt [value]',     'The file extension that should be considered as a data file.',            defaults.dataFileExt)
    .option('-i, --indentChar [value]',      'Indent character for indenting the output HTML file. options: tab|space', defaults.indentChar)
    .option('-c, --indentCharCount [value]', 'How many indentChar? maximum value: 8',                                   defaults.indentCharCount)
    .option('-w, --watch',                   'Watch for changes and recreate the output file on changes.')
    .version(pkg.version, '-v, --version',   'Show version number.');
  cmd.parse(process.argv);
  
  const hypenless = cmd.args[0];
  if (hypenless) cmd.rootDir = hypenless;
  if (cmd.watch) {
    watch( cmd.opts() );
  } else {
    build( cmd.opts() );
  }
} else { // required as a module
  module.exports = build;
}

function build(userSettings) {
  const settings = Object.assign(defaults, userSettings);
  const { rootDir, outFile, tempFile, dataFileExt, indentChar, indentCharCount } = settings;
  const tree = dirTree(rootDir, dataFileExt);
  const html = parseAndRender(tree, {tempFile, dataFileExt});
  const indentedHtml = indent.html(html, {tabString: charmap.get(indentChar).repeat(indentCharCount > 8 ? 8 : +indentCharCount)});
  writeFileSync(outFile, indentedHtml, 'utf8');
  log('Built:'.greenB, outFile.yellowB);
}

function dirTree(dir, dataFileExt, tree={}) {
  readdirSync(dir).forEach(file => {
    const path = join(dir, file);
    if ( statSync(path).isDirectory() ) {
      tree[file] = {};
      dirTree(path, dataFileExt, tree[file]);
    } else {
      const content = readFileSync(path, 'utf8') ;
      tree[file] = extname(file) === dataFileExt ? content : Handlebars.compile(content);
    }
  });
  return tree;
}

function parseAndRender(node, settings) {
  const dirs = getDirs(node);
  if (dirs.length) {
    dirs.forEach(k => {
      if (getDirs(node[k]).length) {
        node[k] = parseAndRender(node[k], settings);
      } else {
        node[k] = render(node[k], settings);
      }
    });
  }
  return render(node, settings);
}

function getDirs(node) {
  return Object.keys(node).filter(k => Object.prototype.toString.call(node[k]) === '[object Object]');
}

function render(node, settings) {
  const files     = Object.keys(node).filter( k => ['function','string'].includes(typeof node[k]) );
  const tempFile  = files.find(k => k === settings.tempFile);
  const dataFiles = files.filter(k => !extname(k) || extname(k) === settings.dataFileExt);
  let result = '';
  if (tempFile) {
    const context = dataFiles.reduce((a,c) => (a[c.replace(extname(c), '')] = node[c]) && a, {});
    result = node[tempFile](context);
  } else {
    result = dataFiles.reduce((a,c) => a += node[c]+'\n', '');
  }
  return result;
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// util
function watch(settings) {
  const { rootDir, outFile } = settings;
  const watcher = chokidar.watch(rootDir, {ignored: /[\/\\]\./, persistent: true}).on('ready', () => {
    build(settings);
    log('Watching'.magenta, rootDir.whiteB, 'for changes...'.magenta);
    
    watcher
      .on('add', path => {
        log( 'File added:'.magenta, path);
        build(settings);
      })
      .on('addDir', path => {
        log('Folder added:'.magenta, path);
        build(settings);
      })
      .on('unlink', path => {
        log('File removed:'.magenta, path);
        build(settings);
      })
      .on('unlinkDir', path => {
        log('Folder removed:'.magenta, path);
        build(settings);
      })
      .on('change', path => {
        log('File changed:'.magenta, path);
        build(settings);
      });
  });
}
function colors() {
  [
    ['magenta',    35],
    ['greenB',     92],
    ['yellowB',    93],
    ['whiteB',     97],
  ].forEach(([k, n]) => {
    String.prototype.__defineGetter__(k, function () {
      return `[${n}m${this}[0m`;
    });
  });
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@