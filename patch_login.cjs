const fs = require('fs');
let code = fs.readFileSync('src/components/auth/LoginPage.tsx', 'utf-8');
code = code.replace(/ • Float: K\n\s*\{selectedBranch\.openingCashFloat\}/g, '');
fs.writeFileSync('src/components/auth/LoginPage.tsx', code);
