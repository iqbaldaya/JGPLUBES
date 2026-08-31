const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DailySalesForm.tsx', 'utf-8');

code = code.replace(
  'const [cashSales: actualCashReceived, setCashSales]',
  'const [cashSales, setCashSales]'
);

code = code.replace(
  'const expectedCashFromSales = cashSales: actualCashReceived;',
  'const expectedCashFromSales = cashSales;'
);

code = code.replace(
  'setCashSales: actualCashReceived(',
  'setCashSales('
);

fs.writeFileSync('src/components/sales/DailySalesForm.tsx', code);
