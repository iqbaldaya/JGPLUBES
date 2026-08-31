const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DailySalesForm.tsx', 'utf-8');

// Replace the calculation logic
code = code.replace(
  '  // Expected Cash & Variance\n  const expectedCashFromSales = cashSales;\n  const cashVariance = actualCashReceived - expectedCashFromSales;\n\n  const totalPettyExpenses = pettyExpenses.reduce((sum, exp) => sum + exp.amount, 0);\n\n  const closingCashInDrawer =\n    openingFloat + actualCashReceived - cashSentToAirtelMoney - totalPettyExpenses;',
  `  // Variance Calculation
  const totalPettyExpenses = pettyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalAccounted = actualCashReceived + airtelDirectSales + creditSales + totalPettyExpenses;
  const cashVariance = totalSalesAmount - totalAccounted; // Positive = Short, Negative = Excess
  const closingCashInDrawer = actualCashReceived - cashSentToAirtelMoney;`
);

// We need to also remove openingFloat and expectedCashFromSales from saving
code = code.replace(
  '        openingFloat,\n        expectedCashFromSales,\n',
  '        openingFloat: 0,\n        expectedCashFromSales: 0,\n'
);

// We should replace the "Payment Breakdown" and "Cash Drawer Reconciliation" UI parts.
// It's quite large to do with a simple replace. It might be easier to use a script that just overwrites the file entirely or specifically patches sections.
fs.writeFileSync('src/components/sales/DailySalesForm.tsx', code);
