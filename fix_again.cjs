const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  '  const [debtorTransactions,        expenses, setDebtorTransactions] = useState<DebtorTransaction[]>(() => {',
  '  const [debtorTransactions, setDebtorTransactions] = useState<DebtorTransaction[]>(() => {'
);

fs.writeFileSync('src/context/AppContext.tsx', code);
