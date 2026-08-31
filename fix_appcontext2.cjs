const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  'debtorTransactions,\n        suppliers,',
  'debtorTransactions,\n        expenses,\n        suppliers,'
);

fs.writeFileSync('src/context/AppContext.tsx', code);
