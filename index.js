const fs = require('fs');
const path = require('path');
const svg2component = require('./src/svg2component');

const file = process.argv[2]

const camelize = string =>
    string.replace(/-(.)/g, (_, letter) => letter.toUpperCase());

const capitalize = string =>
    string[0].toUpperCase() + string.slice(1);

const getComponentName = fileName =>
    capitalize(camelize(fileName));

fs.readFile(file, function(err, content) {
    const fileName = path.basename(file, '.svg');
    const componentName = getComponentName(fileName);
    const svgSource = content.toString();
    console.log(svg2component(componentName, svgSource));
});
