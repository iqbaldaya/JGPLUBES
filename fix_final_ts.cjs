const fs = require('fs');
// Fix DailySalesForm.tsx
let dsCode = fs.readFileSync('src/components/sales/DailySalesForm.tsx', 'utf-8');
dsCode = dsCode.replace('setOpeningFloat(selectedBranch?.openingCashFloat || 1000);', '');
fs.writeFileSync('src/components/sales/DailySalesForm.tsx', dsCode);

// Fix AppContext.tsx
let acCode = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');
// Find the return value object structure
// It returns an object literal that needs expenses
acCode = acCode.replace(
  'debtors,\n        debtorTransactions,\n        suppliers,',
  'debtors,\n        debtorTransactions,\n        expenses,\n        suppliers,'
);

// If it's not exactly that format, let's just do it dynamically:
if (!acCode.includes('expenses,\\n        suppliers')) {
  acCode = acCode.replace(
    'debtorTransactions,',
    'debtorTransactions,\n        expenses,'
  );
}
fs.writeFileSync('src/context/AppContext.tsx', acCode);

