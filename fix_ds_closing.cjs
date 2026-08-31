const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DailySalesForm.tsx', 'utf-8');

code = code.replace(
  'const cashVariance = totalSalesAmount - totalAccounted; // Positive = Short, Negative = Excess',
  'const cashVariance = totalSalesAmount - totalAccounted; // Positive = Short, Negative = Excess\n  const closingCashInDrawer = actualCashReceived - cashSentToAirtelMoney;'
);

fs.writeFileSync('src/components/sales/DailySalesForm.tsx', code);
