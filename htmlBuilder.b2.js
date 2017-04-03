const DIR = "template/static";
const EXT = ".handlebars";

let Handlebars = require("handlebars");
let chokidar = require("chokidar");
let watcher = chokidar.watch(`${DIR}/**/*${EXT}`, {ignored: /[\/\\]\./, persistent: true});
let colors = require("colors/safe");
let fs = require("fs");
let u = require("util-ma");
let fileOpt = {encoding: "utf-8", flag: "r"};
let once = process.argv.indexOf("--once") !== -1;
let log = console.log;

let isObj = u.isObj,
	isStr = u.isStr,
	isUndef = u.isUndef;


function newEmpty() {
	return {
		template: undefined,
		data: {}
	};
}

let src = newEmpty();
let html = "";

if (!once) {
	watcher
		.on("ready", function () {
			log( colors.blue.bold("Initial scan complete. Ready for changes.") );
		})
		.on("add", path => {
			log( colors.green.bold("File added:"), path );
		})
		.on("addDir", path => {
			log( colors.black.bgGreen("Folder added: "), path );
		})
		.on("unlink", path => {
			log( colors.red.bold("File removed: "), path );
		})
		.on("unlinkDir", path => {
			log( colors.white.bgRed("Folder removed:"), path );
		})
		.on("change", path => {
			log( colors.cyan.bold("File changed: "), path );
		});
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
				}
				if (!p.data[namespace]) {
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
				// addData( path+i, root, i.substr( 0, i.indexOf('.') ), true );
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
	debugger
	fudge("template/static", src);
	
	console.log(src);
	
}

function compile(o) {
	Object.keys(o).forEach(k => {
		let p = o[k];
		
		if ( isObj(p) ) {
			o[k] = p.template(p.data);
		}
	});
}
function buildHtml() {
	let template = src.template;
	let data = src.data;
	
	compile(src.data);
	html = src.template(src.data);
	
}

buildSrc();
// buildHtml();

console.log(html);
/* fs.writeFile("shindex.html", text, "utf8", (err) => {
	if (err) { return console.log(err); }
	log("The file was saved!");
}); */







/*

function createIndex() {
	let index = readFile(DIR+"/index.handlebars");
	
	let output = "";
	
	console.log( files(DIR) );
	walk("template/static/profile").forEach(i => {
		let p = i.replace(DIR, "").slice(1);
		let a = p.split("/");
		
		if (p.indexOf("/") === -1) { // root folder
			src.data = {};
			if ( p.endsWith(".handlebars") ) { // template
				
				
				src.template = Handlebars.compile( readFile(i) )();
				
			} else if ( p.endsWith(".htm") ) { // data
				let fileName = p.substr( 0, p.indexOf('.') );
				src.data[fileName] = readFile(i);
				
				
			}
		} else if (p.indexOf("/") >=0) { // 
			
		}
	});
	// console.log( walk(DIR) );
	
	
	
	
	
	
}


if (files.filter(v => {return /.htm/.test(v)}).length) { // at-least one .htm file

















walk(DIR).forEach(i => {
		let p = i.replace(DIR, "").slice(1);
		let a = p.split("/");
		let last = a[a.length-1];
		console.log(a);
		if (last.endsWith(".handlebars")) {
			// console.log(last.replace(DIR, ""));
		}
	});
	// console.log( walk(DIR) );






	let source = readFile(DIR+"/main"+EXT);
	let a = Handlebars.compile(source);
	
	console.log(a);
	fs.writeFile("shindex.html", "Hey there!", "utf8", (err) => {
		if (err) { return console.log(err); }
		log("The file was saved!");
	});



let g = Handlebars.compile(src.main)();
	console.log(g);
	// getDirsIn(DIR).forEach(i => {


function walk(dir) {
	let results = []
	let list = fs.readdirSync(dir);
	list.forEach( function (file) {
		file = dir + '/' + file;
		let stat = fs.statSync(file);
		if ( stat && stat.isDirectory() ) {
			results = results.concat( walk(file) );
		} else {
			results.push(file)
		}
	});
	return results;
};
*/