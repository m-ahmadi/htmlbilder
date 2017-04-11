const opts = {
	"r": {
		"describe": "Templates directory path. Ignored if hyphenless arg is provided.\n default: ./template",
		"type": "string",
		"nargs": 1,
//		"default": "./template",
		"alias": "rootDir"
	},
	"o": {
		"describe": "The output file. \n default: ./index-built.html",
		"type": "string",
		"nargs": 1,
//		"default": "./index-built.html",
		"alias": "outFile"
	},
	"t": {
		"describe": "Template files. \n default: main.handlebars",
		"type": "string",
		"nargs": 1,
//		"default": "main.handlebars",
		"alias": "tempFiles"
	},
	"e": {
		"describe": "Extention of data files. \n default: .htm",
		"type": "string",
		"nargs": 1,
//		"default": ".htm",
		"alias": "dataFilesExt"
	},
	"i": {
		"describe": "Indent character for indenting the output HTML file. \n default: \\t",
		"type": "boolean",
//		"default": "\t",
		"alias": "indentChar"
	},
	"w": {
		"describe": "Watch for changes and recreate the output file on changes.",
		"type": "boolean",
//		"default": false,
		"alias": "watch"
	},
	"P": {
		"describe": "Path of the output HTML file, Ignored if --outFile is provided. \n default: ./",
		"type": "string",
		"nargs": 1,
//		"default": "./"
		"alias": "outFilePath"
	},
	"N": {
		"describe": "Name of the output HTML file, Ignored if --outFile is provided. \n default: index-built",
		"type": "string",
		"nargs": 1,
//		"default": "index-built"
		"alias": "outFileName"
	},
	"X": {
		"describe": "Extention of the output HTML file, Ignored if --outFile is provided. \n default: .html",
		"type": "string",
		"nargs": 1,
//		"default": ".html"
		"alias": "outFileExt"
	},
	"T": {
		"describe": "Name of template files. Ignored if --tempFiles is provided. \n default: main",
		"type": "string",
		"nargs": 1,
//		"default": "main"
		"alias": "tempFilesName"
	},
	"E": {
		"describe": "Extention of template files. Ignored if --tempFiles is provided. \n default: .handlebars",
		"type": "string",
		"nargs": 1,
//		"default": ".handlebars"
		"alias": "tempFilesExt"
	},
	"v": {
		"describe": "Prints the current version.",
		"type": "boolean",
		"alias": "version"
	}
};

module.exports = opts;