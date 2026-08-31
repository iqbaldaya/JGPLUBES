const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

if (!code.includes('expenses: Expense[];')) {
  // Add to AppContextType
  code = code.replace(
    'debtorTransactions: DebtorTransaction[];',
    'debtorTransactions: DebtorTransaction[];\n  expenses: Expense[];'
  );
  
  // Add state variable
  code = code.replace(
    'const [debtorTransactions, setDebtorTransactions] = useState<DebtorTransaction[]>([]);',
    'const [debtorTransactions, setDebtorTransactions] = useState<DebtorTransaction[]>([]);\n  const [expenses, setExpenses] = useState<Expense[]>([]);'
  );

  // Add to syncWithDatabase
  code = code.replace(
    'if (Array.isArray(data.debtorTransactions)) {\n          setIfChanged(setDebtorTransactions, data.debtorTransactions);\n        }',
    'if (Array.isArray(data.debtorTransactions)) {\n          setIfChanged(setDebtorTransactions, data.debtorTransactions);\n        }\n        if (Array.isArray(data.expenses)) {\n          setIfChanged(setExpenses, data.expenses);\n        }'
  );

  // Add to return context
  code = code.replace(
    'debtorTransactions,',
    'debtorTransactions,\n        expenses,'
  );

  fs.writeFileSync('src/context/AppContext.tsx', code);
}
