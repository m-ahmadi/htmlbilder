This is a tool for converting a directory of `Handlebars` templates into one `.html` file.

It recursively does the following:  
If it finds an `index.hbs` file in a directory, it renders the template and passes all the `.htm` files in that directory (direct children) to the template as a context object, using name of the file as key and contents of the file as value.  
If no `index.hbs` file is found in a directory, it just concatenates the `.htm` files in that directory.

You can configure it to use different name patterns or extension for files.

## Usage:
If we have the following directory:
```
somedir/
├─ index.hbs
├─ header.htm
└─ footer.htm
```
and our `index.hbs` contained:
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

and contents of the `header.htm` file were:
```html
<header>
  <h1>Header</h1>
</header>
```

and the `footer.htm` file looked like this:
```html
<footer>
  <h3>Footer</h3>
</footer>
```
then after running: `htmlbilder somedir` our `index.html` would look like this:
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
### CLI:
```
Usage: htmlbilder somedir [-o page.html -t main.hbs -e .html -w]

A tool for converting a directory of Handlebars templates into one HTML file.

Options:
  -r, --rootDir [value]          Templates directory path. Ignored if
                                 hyphenless arg is provided. (default: "./")
  -o, --outFile [value]          The output file. (default: "./index.html")
  -t, --tempFile [value]         Filename pattern for the template files.
                                 (default: "index.hbs")
  -e, --dataFileExt [value]      The file extension that should be considered
                                 as a data file. (default: ".htm")
  -i, --indentChar [value]       Indent character for indenting the output HTML
                                 file. options: tab|space (default: "tab")
  -c, --indentCharCount [value]  How many indentChar? maximum value: 8
                                 (default: 1)
  -w, --watch                    Watch for changes and recreate the output file
                                 on changes.
  -v, --version                  Show version number.
  -h, --help                     Show help.
```
## More examples:
### A directory containing a template:
```html
somedir/
├─ index.hbs
├─ sidebar.htm
└─ header/
   ├─ index.hbs
   ├─ user.htm
   └─ nav.htm
```
```html
<!-- somedir/index.hbs -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    {{{ header }}}

    {{{ sidebar }}}
  </body>
</html>

<!-- somedir/sidebar.htm -->     <div id="sidebar"></div>
<!-- somedir/header/index.hbs -->
<header>
  {{{ nav }}}
  {{{ user }}}
</header>
<!-- somedir/header/user.htm --> <div id="user-info"></div>
<!-- somedir/header/nav.htm -->  <nav id="navigation"></nav>
```

`index.html` after running `htmlbilder somedir`:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <header>
      <nav id="navigation"></nav>
      <div id="user-info"></div>
    </header>

    <div id="sidebar"></div>
  </body>
</html>
```
### A directory not containing a template:
When a directory does not contain a template, all the data files inside it (if there's any) or inside any subsequent folders will be concatenated.
```
somedir/
├─ index.hbs
├─ sidebar.htm
└─ modals/
   ├─ confirm.htm
   ├─ alert.htm
└─ prompts/
   ├─ age.htm
   └─ job.htm
```
```html
<!-- somedir/index.hbs: --> 
<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    {{{ sidebar }}}

    {{{ modals }}}
  </body>
</html>

<!-- somedir/sidebar.htm -->            <div id="sidebar"></div>
<!-- somedir/modals/confirm.htm -->     <div class="modal">confirm</div>
<!-- somedir/modals/alert.htm -->       <div class="modal">alert</div>
<!-- somedir/modals/prompts/age.htm --> <div class="modal">prompt age</div>
<!-- somedir/modals/prompts/job.htm --> <div class="modal">prompt job</div>
```

`index.html` after running `htmlbilder somedir`:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <div id="sidebar"></div>

    <div class="modal">confirm</div>
    <div class="modal">alert</div>
    <div class="modal">prompt age</div>
    <div class="modal">prompt job</div>
  </body>
</html>
```