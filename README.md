# static-spa
This is middleware for serving static files of single-page-applications. I mainly designed it for `express`, but it might also work for similar libraries. 

Basic use:

```js
const path = require('path');
const express = require('express');
const staticSpa = require('static-spa');

const app = express();

app.use(staticSpa(path.join(__dirname, 'public')));

app.listen(8000);
```

Unlike `express.static`, `staticSpa` will try to find the nearest `index.html` and serve that instead if the originally requested file doesn't exist. 

It can also take an object for additional options.

```js
app.use(staticSpa({
  dir: path.join(__dirname, 'public'))),
  index: 'foobar.html',
});
```

### Options

| key | type | default | description |
|:----|:-----|:--------|:------------|
| `dir` *(required)* | `string` | | The directory to serve from. |
| `index` | `string` | `"index.html"` | The name of the index file(s). |
| `template` | `TemplateOptions` | `{}` | Use to configure templating. Omit to disable templating. |

### TemplateOptions

| key | type | default | description |
|:----|:-----|:--------|:------------|
| `index` | `string` | Set to `options.index` | Use this to distinguish template files from regular index files, for example `"index.htmlt"` |
| `match` | `string | RegExp` | `/\$([\w.|]*)\$/g` (example: `$variable|filter$` or `$variable|filter1|filter2$`) | Determines what to replace. |
| `split` | `string | RegExp` | `"|"` | Character to use for filters. |
| `data` | `object` | `{}` | The data to use when templating files. |
| `fitlers` | `{ [name: string]: (value: any) => any }` | `defaultFilters` | The list of filters to use in the template. |

Example template with default settings:

```html
<!DOCTYPE html>
<html>
<head>
  <base href="$base$/">
  <meta charset="UTF-8">
  <title>$title$</title>
  <link rel="styleshee" type="text/css" href="style.css">
</head>
<body>
  <h1>$title$</h1>
  <div id="main"></div>
  <script type="text/javascript" src="main.js"></script>
</body>
</html>
```

You can use `clean` to insert safe HTML.

```html
  <title>$title|clean$</title>
```

Default filters:
- `clean` => Replaces special characters with HTML entities.
- `encode` => Encodes string using `encodeURLComponent`.
- `date` => Converts variable to a date.
- `number` => Converts variable to a number.
- `boolean` => Converts variable to a boolean.
- `json` => Prints variable as JSON using `JSON.stringify`.
