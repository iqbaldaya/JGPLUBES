const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "import { DebtorsSection } from './components/owner/DebtorsSection';",
  "import { DebtorsSection } from './components/owner/DebtorsSection';\nimport ExpensesLedger from './components/owner/ExpensesLedger';"
);

code = code.replace(
  "case 'debtors':\n          return <DebtorsSection onNavigateTab={setActiveTab} />;",
  "case 'debtors':\n          return <DebtorsSection onNavigateTab={setActiveTab} />;\n        case 'expenses':\n          return <ExpensesLedger />;"
);

fs.writeFileSync('src/App.tsx', code);
