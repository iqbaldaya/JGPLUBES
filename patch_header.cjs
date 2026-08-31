const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf-8');
code = code.replace(/<span>•<\/span>\s*<\/div>\s*<span className="text-\[11px\]/g, '</div>\n          <span className="text-[11px]');
fs.writeFileSync('src/components/layout/Header.tsx', code);
