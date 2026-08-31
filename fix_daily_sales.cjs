const fs = require('fs');
let dsCode = fs.readFileSync('src/components/sales/DailySalesForm.tsx', 'utf-8');
dsCode = dsCode.replace('0: 0,', 'openingFloat: 0,');
fs.writeFileSync('src/components/sales/DailySalesForm.tsx', dsCode);
