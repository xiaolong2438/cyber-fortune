# Third-Party Notices

## Kangxi Stroke Count Data

- Project: `breezyreeds/kangxi-strokecount`
- Source: https://github.com/breezyreeds/kangxi-strokecount
- Copyright: 2017-2018 Kawai Lo
- License: MIT

The generated `js/data/kangxi-strokes.js` file contains Kangxi stroke counts derived
from this data. The license text is stored in `js/data/kangxi-strokecount.LICENSE`.

## iztro

- Project: `SylarLong/iztro`
- Source: https://github.com/SylarLong/iztro
- Copyright: 2023 All Contributors
- License: MIT

The bundled browser build is stored in `js/vendor/iztro.min.js`; its license is
stored alongside it in `js/vendor/iztro.LICENSE`.

## react-iztro browser bundle

The browser bundle in `js/vendor/react-iztro-chart.js` is generated locally by
`npm run build:ziwei-chart`; its component styles are in
`js/vendor/react-iztro-chart.css`. It contains the following MIT-licensed projects:

- `react-iztro` 1.4.2 — Copyright (c) 2023 Sylar Long — https://github.com/SylarLong/react-iztro
- `iztro-hook` 1.3.3 — Copyright (c) 2023 Sylar Long — https://github.com/SylarLong/iztro-hook
- `iztro` 2.5.3 — Copyright (c) 2023 All Contributors — https://github.com/SylarLong/iztro
- `lunar-lite` 0.2.7 — Copyright (c) 2023 Sylar — https://github.com/SylarLong/lunar-lite
- `react` 18.2.0, `react-dom` 18.2.0 and `scheduler` 0.23.2 — Copyright (c) Facebook, Inc. and its affiliates. — https://github.com/facebook/react
- `classnames` 2.5.1 — Copyright (c) 2018 Jed Watson — https://github.com/JedWatson/classnames

The complete copyright notices and MIT permission text distributed with these
packages are preserved in `scripts/licenses/react-iztro-bundle.LICENSE`.

## cnchar and cnchar-trad

- Project: `theajack/cnchar`
- Source: https://github.com/theajack/cnchar
- Copyright: theajack / tackchen
- License: MIT

These build-time packages provide the simplified-to-traditional character mapping
embedded in `js/data/kangxi-strokes.js`. Ambiguous simplified characters can map to
more than one traditional form and must be reviewed in context. The license text is
stored in `scripts/licenses/cnchar.LICENSE`.

## DOMPurify

- Project: `cure53/DOMPurify`
- Source: https://github.com/cure53/DOMPurify
- Copyright: 2015 Mario Heiderich
- License: MPL-2.0 OR Apache-2.0

The local browser build in `js/vendor/purify.min.js` sanitizes untrusted AI-generated
HTML before it is inserted into the page. Its license text is stored in
`js/vendor/dompurify.LICENSE`.
