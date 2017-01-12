#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const svg2component = require('./svg2component');

const file = process.argv[2]

const camelize = string =>
    string.replace(/[-_](.)/g, (_, letter) => letter.toUpperCase());

const capitalize = string =>
    string[0].toUpperCase() + string.slice(1);

const getComponentName = fileName =>
    capitalize(camelize(fileName));

fs.readFile(file, function(err, content) {
    const fileName = path.basename(file, '.svg');
    const componentName = getComponentName(fileName);
    const svgSource = content.toString();
    const result = svg2component(componentName, svgSource);

    console.log(result.src);
    result.errors.forEach(errorMsg => console.error(errorMsg));
});
