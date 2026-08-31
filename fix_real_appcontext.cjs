const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  /const \[debtorTransactions,.*expenses,\s*setDebtorTransactions\]/g,
  'const [debtorTransactions, setDebtorTransactions]'
);

code = code.replace(
  'debtorTransactions,\n        totalDebtorsBalance,',
  'debtorTransactions,\n        expenses,\n        totalDebtorsBalance,'
);

fs.writeFileSync('src/context/AppContext.tsx', code);
