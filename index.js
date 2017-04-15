#!/usr/bin/env node

let defaults = {
	rootDir:       "./template",
	outFilePath:   "./",
	outFileName:   "index-built",
	outFileExt:    ".html",
	tempFilesName: "main",
	tempFilesExt:  ".handlebars",
	dataFilesExt:  ".htm",
	indentChar:    "\t",
	indentCount:   1
};
const Handlebars = require("handlebars");
const indent = require("indent.js");
const fs = require("fs");
const u = require("util-ma");
const path = require("path");
const SEP = path.sep;
const DS = "/";

const fileOpt = {encoding: "utf8", flag: "r"};
const isObj = u.isObj;
const isStr = u.isStr;
const isUndef = u.isUndef;
const isNum = u.isNum;

let dir, outFile, tempFiles, dataFilesExt, indentChar,
	log, args, once,
	chokidar, watcher, colors,
	first;

let src;
let html = "";

if (require.main === module) { // called from command line
	log = console.log;
	colors = require("colors/safe");
	
	const y = require("yargs");
	y.usage("Usage: \n $0 templates/ -o index.html [-t main.hbs -e .html -w]");
	y.version();
	y.options( require("./yOpts") );
	y.help('h').alias('h', 'help')
	let args = y.argv;
	
	if ( !process.argv.slice(2).length && !args._.length &&
		!args.r && !args.o && !args.t && !args.e && !args.i && !args.c && !args.w && !args.v &&
		!args.P && !args.N && !args.X && !args.T && !args.E
	) {
		log(
			colors.yellow.bold("No argument was specified,"),
			colors.yellow.bold("switching to default values...\n")
		);
	}
	
	if (args._.length) {
		args.hyphenless = args._[0];
	}
	setConfig(args);
	let dirExists = exists(dir);
	if (!dirExists) { return; }
	if ( !isOutFileValid(outFile) ) { return; }
	
	if (args.w) {
		first = false;
		chokidar = require("chokidar");
		watcher = chokidar.watch(`${dir}/**/*`, {ignored: /[\/\\]\./, persistent: true});
		addWatch();
	} else {
		buildHtml();
		log( colors.blue.bold("File:", colors.yellow(outFile), "is created.") );
	}
	
} else { // required as a module
	module.exports = {
		setConfig: setConfig,
		buildHtml: buildHtml
	};
}


function addWatch() {
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
		// let k = arg.slice(2).replace(/([A-Z])/g, "_$1").toUpperCase(); // --outDir  to  OUT_DIR
		let k = arg.slice(2); // --outDir  to  outDir
		return defaults[k];
	}
}
function setConfig(a) {
	if ( !isObj(a) ) { return false; }
	
	dir = a.hyphenless ? a.hyphenless : a.rootDir || defaults.rootDir;
	if (a.outFile) {
		outFile = a.outFile;
	} else {
		outFile  = "";
		outFile += a.outFilePath || defaults.outFilePath;
		outFile += a.outFileName || defaults.outFileName;
		outFile += a.outFileExt  || defaults.outFileExt;
	}
	if (a.tempFiles) {
		tempFiles = a.tempFiles;
	} else {
		let ext = a.tempFilesExt  || defaults.tempFilesExt;
		tempFiles = "";
		tempFiles += a.tempFilesName || defaults.tempFilesName;
		tempFiles += ext.startsWith(".") ? ext : "."+ ext;
	}
	let i = a.indentChar;
	i = i === "tab"    ? i = "\t"   :
		i === "space4" ? i = "    " :
		i === "space2" ? i = "  "   :
		i === "space"  ? i = " "    : defaults.indentChar;
	let c = a.indentCount;
	c = isNum(c) ? c > 10 ? 10 : c : defaults.indentCount;
	indentChar    = i.repeat(c);
	dataFilesExt  = a.dataFilesExt || defaults.dataFilesExt;
	dataFilesExt  = dataFilesExt.startsWith(".") ? dataFilesExt : "."+ dataFilesExt;
	
	return true;
}
function exists(dir) {
	let existsSync = fs.existsSync;
	if ( existsSync(dir) ) {
		if ( isDir(dir) ) {
			debugger
			let mainTemp = dir.endsWith(DS) ? dir + tempFiles : `${dir}${DS}${tempFiles}`;
			if ( existsSync(mainTemp) ) {
				return true;
			} else {
				log(
					colors.red.bold("rootDir:"),
					colors.white.bold.bgRed(" "+ dir +" "),
					colors.red.bold("must contain a:"),
					colors.white.bold.bgRed(" "+ tempFiles +" "),
					colors.red.bold("file.")
				);
				return false;
			}
		} else {
			log(
				colors.red.bold("rootDir:"),
				colors.white.bold.bgRed(" "+ dir +" "),
				colors.red.bold(" must be a dir, and not a file!")
			);
			return false;
		}
	} else {
		log(
			colors.red.bold("rootDir:",
			colors.white.bold.bgRed(" "+ dir +" "),
			"does not exist!")
		);
		return false
		// /^.+.*[.]{1}[^.]*$/
	}
}
function isOutFileValid(path) {
	if ( path.endsWith(DS) || path.endsWith(SEP) ) {
		log(
			colors.red.bold("outFile:"),
			colors.white.bold.bgRed(" "+ path +" "),
			colors.red.bold("must be path of a file, and not a directory!")
		);
		return false;
	}
	return true;
}
function isDir(p) {
	return fs.lstatSync(p).isDirectory();
}

function newEmpty() {
	return {
		template: undefined,
		data: {}
	};
}
function readFile(path) {
	return fs.readFileSync(path, { encoding: "utf8", flag: "r" });
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
			o[namespace] += "\n";
			o[namespace] += readFile(filePath) ;
		} else {
			o += "\n";
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
			if ( i.endsWith(tempFiles) ) {
				addTemplate(fullPath, o, ns);
			} else if ( i.endsWith(dataFilesExt) ) {
				let fileName = i.substr( 0, i.indexOf(".") );
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
				if (files.indexOf(tempFiles) !== -1) { // folder contains main.handlebars
					fudge(fullPath, ns ? o.data[ns] : o, i);
				} else { // folder doesn"t contain .handlebars
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
			if ( i.endsWith(dataFilesExt) ) {
				addData(path+i, i.substr( 0, i.indexOf(".") ), root, ns, true);
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
	src = newEmpty();
	buildSrc();
	html = compile(src);
	html = indent.indentHTML(html, indentChar);
	fs.writeFileSync(outFile, html, "utf8");
}