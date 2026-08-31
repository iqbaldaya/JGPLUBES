const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf-8');

code = code.replace('openingFloat: number;', 'openingFloat?: number;');
code = code.replace('expectedCashFromSales: number;', 'expectedCashFromSales?: number;');
code = code.replace('closingCashInDrawer: number;', 'closingCashInDrawer?: number;');

fs.writeFileSync('src/types/index.ts', code);
