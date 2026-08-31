const fs = require('fs');
let code = fs.readFileSync('src/utils/csvExport.ts', 'utf-8');

code = code.replace(/    'Opening Cash Float \(ZMW\)',\n/g, '');
code = code.replace(/          r\.openingFloat \?\? 0,\n/g, '');
code = code.replace(/        r\.openingFloat \?\? 0,\n/g, '');
code = code.replace(/    b\.openingCashFloat \?\? 0,\n/g, '');

fs.writeFileSync('src/utils/csvExport.ts', code);
