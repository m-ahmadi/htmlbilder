#!/usr/bin/env node

const DEFAULT = {
	root:         "template/static",
	outFile:      "shindex.html",
	tempFilename: "main.handlebars",
	dataFilesExt:  ".htm",
	indentChar:   "\t"
};
const log = console.log;
const args = process.argv; 
const once = args.indexOf("--once") !== -1;
const ROOT = set("--root"); 
const OUTPUT_FILE = set("--outFile");
const INDENT_CHAR = set("--indentChar");
const DIR = ROOT;

let Handlebars = require("handlebars");
let chokidar = require("chokidar");
let watcher = chokidar.watch(`${DIR}/**/*`, {ignored: /[\/\\]\./, persistent: true});
let indent = require("indent.js");
let colors = require("colors/safe");
let fs = require("fs");
let u = require("util-ma");

let first = false;
let fileOpt = {encoding: "utf-8", flag: "r"};
const isObj = u.isObj;
const isStr = u.isStr;
const isUndef = u.isUndef;

let src = newEmpty();
let html = "";

function newEmpty() {
	return {
		template: undefined,
		data: {}
	};
}

if (once) {
	buildHtml();
	log( colors.blue.bold("The file ", colors.yellow(OUTPUT_FILE), "is created.") );
} else {
	watcher
		.on("ready", function () {
			first = true;
			buildHtml();
			log( colors.blue.bold("Initial", colors.yellow(OUTPUT_FILE), "is created.") );
			log( colors.blue.bold("Watching", colors.yellow(DIR), "for changes...") );
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

function msg() {
	if (first) {
		log( colors.blue.bold(colors.yellow(OUTPUT_FILE), "was recreated.") );
	}
}
function set(arg) {
	let idx = args.indexOf(arg);
	if (idx !== -1) {
		return args[ idx + 1 ];
	} else {
		// let k = arg.slice(2).replace(/([A-Z])/g, '_$1').toUpperCase(); // --outDir  to  OUT_DIR
		let k = arg.slice(2); // --outDir  to  outDir
		return DEFAULT[k];
	}
}
function readFile(path) {
	return fs.readFileSync(path, { encoding: 'utf-8', flag: 'r' });
}
function writeFile(txt) {
	fs.writeFileSync("shindex.html", txt);
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
	let root = path.endsWith("/") ? path: path+"/";
	
	let files = getFiles(path);
	if (files.length) {
		files.forEach(i => {
			let fullPath = root+i;
			if ( i.endsWith("main.handlebars") ) {
				addTemplate(fullPath, o, ns);
			} else if ( i.endsWith(".htm") ) {
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
				if (files.indexOf("main.handlebars") !== -1) { // folder contains main.handlebars
					fudge(fullPath, ns ? o.data[ns] : o, i);
				} else { // folder doesn't contain .handlebars
					dirHandler(fullPath, o.data[ns] || o, i);
				}
			}
		});
	}
}
function dirHandler(p, root, ns) {
	let path = p.endsWith("/") ? p : p+"/";
	let files = getFiles(path);
	let dirs = getDirs(path);
	
	if (files.length) {
		files.forEach(i => {
			if ( i.endsWith(".htm") ) {
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
	fudge(DIR, src);
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
	html = indent.indentHTML(html, "\t");
	fs.writeFileSync(OUTPUT_FILE, html);
}