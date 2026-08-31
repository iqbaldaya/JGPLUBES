const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

code = code.replace(
  "const res = await fetch('/api/bootstrap');",
  "const res = await fetch('/api/bootstrap?t=' + Date.now(), { cache: 'no-store' });"
);

fs.writeFileSync('src/lib/api.ts', code);
