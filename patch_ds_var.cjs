const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DailySalesForm.tsx', 'utf-8');

code = code.replace(
  "{cashVariance > 0 ? \\`+\\${cashVariance.toFixed(2)}\\` : cashVariance < 0 ? \\`-\\${Math.abs(cashVariance).toFixed(2)}\\` : '0.00'}",
  "{cashVariance > 0 ? \\`\\${cashVariance.toFixed(2)} (Short)\\` : cashVariance < 0 ? \\`-\\${Math.abs(cashVariance).toFixed(2)} (Excess)\\` : '0.00'}"
);

fs.writeFileSync('src/components/sales/DailySalesForm.tsx', code);
