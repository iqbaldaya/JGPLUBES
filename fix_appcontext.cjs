const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

// Fix import
code = code.replace(
  'DebtorTransaction,',
  'DebtorTransaction,\n  Expense,'
);

// Fix the destructuring mess
code = code.replace(
  'const [debtorTransactions,        expenses, setDebtorTransactions]',
  'const [debtorTransactions, setDebtorTransactions]'
);

code = code.replace(
  'return saved ? JSON.parse(saved) : INITIAL_DEBTOR_TRANSACTIONS;\n  });',
  'return saved ? JSON.parse(saved) : INITIAL_DEBTOR_TRANSACTIONS;\n  });\n  const [expenses, setExpenses] = useState<Expense[]>([]);'
);

// Fix the return value of AppContext
code = code.replace(
  'debtorTransactions,\n        expenses,', // this replaced a generic 'debtorTransactions,'
  'debtorTransactions,'
);
// Now actually add expenses to the return correctly. Let's find it.
code = code.replace(
  'debtorTransactions, // Return debtorTransactions state', // or similar
  ''
);

fs.writeFileSync('src/context/AppContext.tsx', code);
