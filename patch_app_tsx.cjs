const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes('import ExpensesLedger')) {
  // Import
  code = code.replace(
    "import DebtorsSection from './components/owner/DebtorsSection';",
    "import DebtorsSection from './components/owner/DebtorsSection';\nimport ExpensesLedger from './components/owner/ExpensesLedger';"
  );
  
  // Render
  code = code.replace(
    "{activeTab === 'debtors' && <DebtorsSection />}",
    "{activeTab === 'debtors' && <DebtorsSection />}\n          {activeTab === 'expenses' && <ExpensesLedger />}"
  );

  fs.writeFileSync('src/App.tsx', code);
}
