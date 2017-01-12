#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const path = require('path');
const svg2component = require('./svg2component');

const camelize = string =>
    string.replace(/[-_](.)/g, (_, letter) => letter.toUpperCase());

const capitalize = string =>
    string[0].toUpperCase() + string.slice(1);

const getComponentName = fileName =>
    capitalize(camelize(fileName));

const convertToComponent = file => {
    fs.readFile(file, (err, content) => {
        const fileName = path.basename(file, '.svg');
        const componentName = getComponentName(fileName);
        const svgSource = content.toString();
        const result = svg2component(componentName, svgSource, program.propTypes);

        console.log(result.src);
        result.errors.forEach(errorMsg => console.error(errorMsg));
    });
};

program
    .version(require('../package.json').version)
    .usage('[options] <file>')
    .arguments('<file>')
    .option('-p, --propTypes', 'add propTypes declaration')
    .action(convertToComponent)
    .parse(process.argv)