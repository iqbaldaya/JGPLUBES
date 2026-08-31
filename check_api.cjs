const fs = require('fs');
const code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

const funcs = code.split(/const \w+ = \([^\)]*\)/g);
// This is hard to parse, let's just grep for functions that have `set` but not `api.`

