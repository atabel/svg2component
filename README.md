# svg2component

Converts SVG icons into React components.

## Example

**icon.svg**:
```svg
<svg xmlns="http://www.w3.org/2000/svg">
    <circle stroke-width="2" fill="#191919" stroke="#424242"></circle>
</svg>
```
```bash
$ svg2component icon.svg > icon.js
```
**icon.js**:
```js
import React from 'react';

const Icon = ({size, color='#191919', strokeColor='#424242'}) => (
    <svg width={size} height={size}>
        <circle strokeWidth="2" fill={color} stroke={strokeColor}></circle>
    </svg>;
);

```