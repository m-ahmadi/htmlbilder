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