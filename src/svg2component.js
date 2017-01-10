// https://astexplorer.net/#/T8EKu3LS1W/3
const {codeBlock} = require('common-tags');
const babel = require('babel-core');
const generate = require('babel-generator').default;
const babylon = require('babylon');

/**
 * remove and parameterize all svg attributes except viewbox
 */
const stripSvgArguments = (svgString) => {
    const viewBox = (svgString.match(/viewBox=['"]([^'"]*)['"]/) || [])[1];
    const viewBoxProp = viewBox ? 'viewBox="'+viewBox+'"' : '';
    const sizeProps = 'width={size} height={size}';

    return svgString
        .replace(/<svg([^>]*)*>/, `<svg ${sizeProps} ${viewBoxProp}>`);
};

/**
 * Transform from "this-is-the-string" to "thisIsTheString"
 * @param {string} string
 * @return {string}
 */
const camelize = (string) =>
    string.replace(/-(.)/g, (_, letter) => letter.toUpperCase());

/**
 * Converts the indentation of the provided source code to the specified
 * indentation (default 4 spaces)
 * @param {string} codeStr
 * @param {string} indentation
 * @return {string}
 */
const indent = (codeStr, indentation = '    ') =>
    codeStr.replace(/\n\s*/g, chunk => {
        const indentetionLevel = (chunk.length - 1) / 2; // original indentation is 2 spaces.
        return '\n' + indentation.repeat(indentetionLevel);
    });

/**
 * Converts a svg source string into a react component with some props:
 * - size: number // width and height in pixels for the icon
 * - color: string // fill color of the icon
 * @param {string} componentName
 * @param {string} svgString
 * @return {string} react component source code
 */
const svg2component = (componentName, svgString) => {
    const source = stripSvgArguments(svgString);
    const origAst = babylon.parse(source, {plugins: ['jsx'], sourceType: 'module'});

    const propNames = ['size'];
    const {ast} = babel.transformFromAst(origAst, source,  {plugins: [
        ({types: t}) => ({
            visitor: {
                JSXIdentifier(path) {
                    path.node.name = camelize(path.node.name);
                },

                JSXAttribute(path) {
                    if (path.node.name.name === 'fill') {
                        propNames.push(`color = '${path.node.value.value}'`);
                        path.node.value = t.JSXExpressionContainer(t.Identifier('color'));
                    }
                    if (path.node.name.name === 'stroke') {
                        propNames.push(`strokeColor = '${path.node.value.value}'`);
                        path.node.value = t.JSXExpressionContainer(t.Identifier('strokeColor'));
                    }
                },
            },
        })
    ]});

    const {code} = generate(ast);

    return codeBlock`
        import React from 'react';

        const ${componentName} = ({${propNames.filter(Boolean).join(', ')}}) => (
            ${indent(code)}
        );

        export default ${componentName};
    ` + '\n';
};

module.exports = svg2component;
