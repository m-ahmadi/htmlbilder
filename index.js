#!/usr/bin/env node

let defaults = {
	root:         "./template/static",
	outFile:      "./shindex.html",
	tempFilename: "main.handlebars",
	dataFileExt:  ".htm",
	indentChar:   "\t"
};
const Handlebars = require("handlebars");
const indent = require("indent.js");
const fs = require("fs");
const u = require("util-ma");
const path = require("path");
const DS = path.sep;

const fileOpt = {encoding: "utf-8", flag: "r"};
const isObj = u.isObj;
const isStr = u.isStr;
const isUndef = u.isUndef;

let root, dir, outFile, indentChar, tempFilename, dataFileExt,
	log, args, once,
	chokidar, watcher, colors,
	first;

if (require.main === module) { // called from command line
	log = console.log;
	args = process.argv; 
	once = args.indexOf("--once") !== -1;

	root = set("--root"); 
	dir = root;
	outFile = set("--outFile");
	indentChar = set("--indentChar");
	tempFilename = set("--tempFilename");
	dataFileExt = set("--dataFileExt");
	
	colors = require("colors/safe");
	if ( exists(dir) ) {
		chokidar = require("chokidar");
		watcher = chokidar.watch(`${dir}/**/*`, {ignored: /[\/\\]\./, persistent: true});
	} else {
		return;
	}
	
	first = false;
	addWatch();
} else { // required as a module
	module.exports = {
		setConfig: setConfig,
		buildHtml: buildHtml
	};
}

function addWatch() {
	if (once) {
		buildHtml();
		log( colors.blue.bold("The file ", colors.yellow(outFile), "is created.") );
	} else {
		watcher
			.on("ready", function () {
				first = true;
				buildHtml();
				log( colors.blue.bold("Initial", colors.yellow(outFile), "is created.") );
				log( colors.blue.bold("Watching", colors.yellow(dir), "for changes...") );
			})
			.on("add", path => {
				log( colors.green.bold("File added:"), path );
				buildHtml();
				msg();
			})
			.on("addDir", path => {
				log( colors.black.bgGreen("Folder added: "), path );
				buildHtml();
				msg();
			})
			.on("unlink", path => {
				log( colors.red.bold("File removed: "), path );
				buildHtml();
				msg();
			})
			.on("unlinkDir", path => {
				log( colors.white.bgRed("Folder removed:"), path );
				buildHtml();
				msg();
			})
			.on("change", path => {
				log( colors.cyan.bold("File changed: "), path );
				buildHtml();
				msg();
			});
	}
}
function msg() {
	if (first) {
		log( colors.blue.bold(colors.yellow(outFile), "was recreated.") );
	}
}
function set(arg) {
	let idx = args.indexOf(arg);
	if (idx !== -1) {
		return args[ idx + 1 ];
	} else {
		// let k = arg.slice(2).replace(/([A-Z])/g, '_$1').toUpperCase(); // --outDir  to  OUT_DIR
		let k = arg.slice(2); // --outDir  to  outDir
		return defaults[k];
	}
}
function setConfig(o) {
	if ( !isObj(o) ) { return false; }
	
	root         = o.root         || defaults.root;
	dir          = root;
	outFile      = o.outFile      || defaults.outFile;
	indentChar   = o.indentChar   || defaults.indentChar;
	tempFilename = o.tempFilename || defaults.tempFilename;
	dataFileExt  = o.dataFileExt  || defaults.dataFileExt;
	
	return true;
}
function exists(dir) {
	let existsSync = fs.existsSync;
	if ( !existsSync(dir) ) {
		log(
			colors.red.bold("Root template directory:",
			colors.white.bold.bgRed(" "+ dir +" "),
			"does not exist!")
		);
		return false;
	} else {
		let tempFile = dir.endsWith(DS) ? dir + tempFilename : `${dir}${DS}${tempFilename}`;
		if ( existsSync(tempFile) ) {
			return true;
		} else {
			log(
				colors.red.bold("Root template directory:"),
				colors.white.bold.bgRed(" "+ dir +" "),
				colors.red.bold("must contain a:"),
				colors.white.bold.bgRed(" "+ tempFilename +" "),
				colors.red.bold("file.")
			);
		}
	}
}

let src = newEmpty();
let html = "";

function newEmpty() {
	return {
		template: undefined,
		data: {}
	};
}
function readFile(path) {
	return fs.readFileSync(path, { encoding: 'utf-8', flag: 'r' });
}
function getDirs(p) {
	return fs.readdirSync(p).filter( f => fs.statSync(p+"/"+f).isDirectory() );
}
function getFiles(p) {
	return fs.readdirSync(p).filter( f => fs.statSync(p+"/"+f).isFile() );
}

function getTarget(root, namespace, noTemp) {
	let o;
	if (root) {
		if (!namespace) {
			if ( isObj(root) ) {
				o = root;
			} else if ( isStr(root) ) {
				if (!src.data[root]) {
					src.data[root] = newEmpty();
				}
				o = src.data[root];
			}
		} else if (namespace) {
			if ( isObj(root) ) {
				let p = root.data[namespace];
				if ( isUndef(p) || isStr(p) ) {
					if (noTemp) {
						if ( isUndef(p) ) { root.data[namespace] = ""; }
						o = root.data;
					} else {
						root.data[namespace] = newEmpty();
						o = root.data[namespace];
					}
				} else {
					if ( isObj(p) ) {
						o = root.data[namespace];
					}
				}
			} else if ( isStr(root) ) {
				let p = src.data[root];
				if (!p) {
					src.data[root] = newEmpty();
				} else if (!p.data[namespace]) {
					src.data[root].data[namespace] = noTemp ? "" : newEmpty();
				}
				o = noTemp ? src.data[root].data : src.data[root].data[namespace];
			}
		}
	} else {
		o = src;
	}
	
	return o;
}
function addTemplate(path, root, namespace) {
	let o = getTarget(root, namespace);
	o.template = Handlebars.compile( readFile(path) );
}
function addData(filePath, fileName, root, namespace, noTemp) {
	let o = getTarget(root, namespace, noTemp);
	
	if (!noTemp) {
		o.data[fileName] = readFile(filePath);
	} else {
		if (namespace) {
			o[namespace] += readFile(filePath) ;
		} else {
			o += readFile(filePath) ;
		}
		
	}
}
function fudge(path, o, ns) {
	let root = path.endsWith(DS) ? path: path+DS;
	
	let files = getFiles(path);
	if (files.length) {
		files.forEach(i => {
			let fullPath = root+i;
			if ( i.endsWith(tempFilename) ) {
				addTemplate(fullPath, o, ns);
			} else if ( i.endsWith(dataFileExt) ) {
				let fileName = i.substr( 0, i.indexOf('.') );
				addData(fullPath, fileName, o, ns);
			}
		});
	}
	let dirs = getDirs(path);
	if (dirs.length) { // folder contains folder(s)
		dirs.forEach(i => {
			let fullPath = root+i;
			let files = getFiles(fullPath);
			if (files.length) {
				if (files.indexOf(tempFilename) !== -1) { // folder contains main.handlebars
					fudge(fullPath, ns ? o.data[ns] : o, i);
				} else { // folder doesn't contain .handlebars
					dirHandler(fullPath, o.data[ns] || o, i);
				}
			}
		});
	}
}
function dirHandler(p, root, ns) {
	let path = p.endsWith(DS) ? p : p+DS;
	let files = getFiles(path);
	let dirs = getDirs(path);
	
	if (files.length) {
		files.forEach(i => {
			if ( i.endsWith(dataFileExt) ) {
				addData(path+i, i.substr( 0, i.indexOf('.') ), root, ns, true);
			}
		});
	}
	if (dirs.length) {
		dirs.forEach(i => {
			dirHandler(path+i, root, ns);
		});
	}
}

function buildSrc() {
	fudge(dir, src);
	// console.log(src);
}
function compile(o, parent, key) {
	let data = o.data;
	Object.keys(data).forEach(i => {
		let p = data[i];
		if ( isObj(p) ) {
			compile(p, o, i);
		}
	});
	if (parent && key) {
		parent.data[key] = o.template(data);
	} else {
		return o.template(data);
	}
}
function buildHtml() {
	buildSrc();
	html = compile(src);
	html = indent.indentHTML(html, indentChar);
	fs.writeFileSync(outFile, html);
}