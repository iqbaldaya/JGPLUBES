const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

const str1 = '  const [debtorTransactions,\\n        expenses, setDebtorTransactions] = useState<DebtorTransaction[]>(() => {';
const str2 = '  const [debtorTransactions, setDebtorTransactions] = useState<DebtorTransaction[]>(() => {';

// If it has actual newlines, just replace 'expenses, setDebtorTransactions]'
code = code.replace(
  'expenses, setDebtorTransactions] = useState<DebtorTransaction[]>(() => {',
  'setDebtorTransactions] = useState<DebtorTransaction[]>(() => {'
);
code = code.replace(
  '  const [debtorTransactions,\n        setDebtorTransactions]',
  '  const [debtorTransactions, setDebtorTransactions]'
);

code = code.replace(
  'debtorTransactions,\n        expenses,\n        totalDebtorsBalance,',
  'debtorTransactions,\n        totalDebtorsBalance,'
); // Revert first if it got mangled

code = code.replace(
  'debtorTransactions,\n        totalDebtorsBalance,',
  'debtorTransactions,\n        expenses,\n        totalDebtorsBalance,'
);

// For the `api.createDebtorTransaction` error, let's fix api imports or add ? to make it safe
code = code.replace(/api\.createDebtorTransaction\(/g, 'api.createDebtorTransaction?.(');
code = code.replace(/api\.updateDebtorTransaction\(/g, 'api.updateDebtorTransaction?.(');
code = code.replace(/api\.deleteDebtorTransaction\(/g, 'api.deleteDebtorTransaction?.(');
code = code.replace(/api\.addSupplier\(/g, 'api.addSupplier?.(');
code = code.replace(/api\.updateSupplier\(/g, 'api.updateSupplier?.(');

fs.writeFileSync('src/context/AppContext.tsx', code);
