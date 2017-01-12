const tags = require('common-tags');
const codeBlock = tags.codeBlock;
const oneLine = tags.oneLine;
const babel = require('babel-core');
const t = babel.types;
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
 * indentation
 * @param {string} codeStr
 * @param {string} indentation
 * @return {string}
 */
const indent = (codeStr, indentation) =>
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
 * @param {bool} withPropTypes
 * @return {string} react component source code
 */
const svg2component = (componentName, svgString, withPropTypes) => {
    const errors = [];
    const source = stripSvgArguments(svgString);
    const origAst = babylon.parse(source, {plugins: ['jsx'], sourceType: 'module'});

    const propsDeclaration = [{name: 'size', type: 'number'}];

    const isPropAlreadyFound = propName =>
        propsDeclaration.some(prop => prop.name === propName);

    const getPropDeclaration = propName =>
        propsDeclaration.find(prop => prop.name === propName);

    const extractAttributeAsProp = (node, attributeName, propName) => {
        if (node.name.name === attributeName) {
            const value = node.value.value;
            if (value === 'none') {
                return;
            }

            if (!isPropAlreadyFound(propName)) {
                propsDeclaration.push({name: propName, defaultValue: value, type: 'string'});
            } else {
                const prop = getPropDeclaration(propName);
                if (prop.defaultValue !== value) {
                    errors.push(oneLine`
                        [WARN] ${prop.name} prop already found with a different value.
                        ${prop.defaultValue} !== ${value}.
                        SVGs with multiple ${prop.name} are not supported yet.
                    `);
                }
            }
            node.value = t.JSXExpressionContainer(t.Identifier(propName));
        }
    };

    const ast = babel.transformFromAst(origAst, source,  {plugins: [
        () => ({
            visitor: {
                JSXIdentifier(path) {
                    path.node.name = camelize(path.node.name);
                },

                JSXAttribute(path) {
                    extractAttributeAsProp(path.node, 'fill', 'color');
                    extractAttributeAsProp(path.node, 'stroke', 'strokeColor');
                },
            },
        })
    ]}).ast;

    const code = generate(ast).code.slice(0, -1); //remove the last semicolon

    const propsParams = propsDeclaration
        .filter(Boolean)
        .map(prop => prop.defaultValue !== undefined ? `${prop.name} = '${prop.defaultValue}'` : prop.name)
        .join(', ');

    const propTypes = propsDeclaration
        .filter(Boolean)
        .map((prop) => `${prop.name}: t.${prop.type}`)
        .join(',\n');

    const propTypesSrc = !!withPropTypes
        ? '\n' + codeBlock`
            ${componentName}.propTypes = {
                ${propTypes},
            };` + '\n'
        : '';

    const importSrc = !!withPropTypes
        ? `import React, {PropTypes as t} from 'react';`
        : `import React from 'react';`;

    return {
        src: codeBlock`
            ${importSrc}

            const ${componentName} = ({${propsParams}}) => (
                ${indent(code, '    ')}
            );
            ${propTypesSrc}
            export default ${componentName};
        ` + '\n',

        errors,
    };
};

module.exports = svg2component;
