# `htmlbilder`


**`htmlbilder`** is a tool for creating one HTML file, out of many Handlebars templates/layouts.  
It is useful for spliting a large HTML file into many smaller files in order to have better maintainability.

It mainly requires one thing, and that is a directory with a *`main.handlebars`* file in it.  
It then renders that template and will put the output in an HTML file.  

It looks in the directory that the template was found in for any *`.htm`* file, if it finds any, it then passes them to the template as data, using name of the file as key and contents of the file as value.  

It looks in the folders in the directory that the template was found in too:  
If folder does not contain a *`main.handlebars`* file, then it looks for any *`.htm`* files, and if it finds any, it concatenates them and passes them to the template as data, using the name of the folder as key and the concatenated result as value.  
But if folder does contain a *`main.handlebars`* then it tries to render that template according to the same rules, and when it is done rendering it, it passes the output to the first template, using name of the folder as key and the render output as value.

You can configure it to use different name patterns or extension for files.  
Let's see some examples:

## Usage example:
If we have the following directory:
```javascript
/*
  templates/
  ----main.handlebars
  ----header.htm
  ----footer.htm
*/
```
and our *`main.handlebars`* contained:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    {{{ header }}}
    
    {{{ footer }}}
  </body>
</html>
```

and contents of the *`header.htm`* file was:
```html
<header>
  <h1>Header</h1>
</header>
```

and the *`footer.htm`* file looked like this:
```html
<footer>
  <h3>Footer</h3>
</footer>
```
then after running:  
`htmlbilder templates/ -o index.html`  
our *`index.html`* would look like this:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <header>
      <h1>Header</h1>
    </header>
    
    <footer>
        <h1>Footer</h1>
    </footer>
  </body>
</html>
```

## CLI:
```
Usage:
 htmlbilder templates/ -o index.html [-t main.hbs -e .html -w]

Options:
  -r, --rootDir        Templates directory path. Ignored if hyphenless arg is provided. default: ./template  [string]
  -o, --outFile        The output file. default: ./index-built.html                                          [string]
  -t, --tempFiles      Template files.  default: main.handlebars                                             [string]
  -e, --dataFilesExt   Extention of data files. default: .htm                                                [string]
  -i, --indentChar     Indent character for indenting the output HTML file.
                       [tab|space4|space2|space|char] default: tab                                           [string]
  -c, --indentCount    How many indentChar. default: 1 (maximum value: 10)                                   [number]
  -w, --watch          Watch for changes and recreate the output file on changes.                            [boolean]
  -P, --outFilePath    Path of the output HTML file, Ignored if --outFile is provided. default: ./           [string]
  -N, --outFileName    Name of the output HTML file, Ignored if --outFile is provided. default: index-built  [string]
  -X, --outFileExt     Extention of the output HTML file, Ignored if --outFile is provided. default: .html   [string]
  -T, --tempFilesName  Name of template files. Ignored if --tempFiles is provided. default: main             [string]
  -E, --tempFilesExt   Extention of template files. Ignored if --tempFiles is provided. default: .handlebars [string]
  -v, --version        Prints the current version.                                                           [boolean]
  -h, --help           Show help                                                                             [boolean]

```
## Node:

```javascript


const htmlbilder = require("htmlbilder");

htmlbilder.setConfig({
//option         default value
  rootDir:       "./template",
  outFilePath:   "./",
  outFileName:   "index-built",
  outFileExt:    ".html",
  tempFilesName: "main",
  tempFilesExt:  ".handlebars",
  dataFilesExt:  ".htm",
  indentChar:    "\t",
  indentCount:   1
});

// Sync only
htmlbilder.buildHtml();

```