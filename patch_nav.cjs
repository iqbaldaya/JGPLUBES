const fs = require('fs');
let code = fs.readFileSync('src/components/layout/NavigationTabs.tsx', 'utf-8');

if (!code.includes("id: 'expenses'")) {
  code = code.replace(
    "{ id: 'debtors', label: 'Debtors (Credit Sales)', icon: UserCheck, group: 'Treasury Ledgers' },",
    "{ id: 'debtors', label: 'Debtors (Credit Sales)', icon: UserCheck, group: 'Treasury Ledgers' },\n    { id: 'expenses', label: 'Expenses Ledger', icon: Receipt, group: 'Treasury Ledgers' },"
  );
  
  // Need to import Receipt from lucide-react if not present
  if (!code.includes('Receipt')) {
    code = code.replace('Settings,', 'Settings,\n  Receipt,');
  }

  fs.writeFileSync('src/components/layout/NavigationTabs.tsx', code);
}
