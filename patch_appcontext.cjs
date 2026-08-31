const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

// Replace the expense deduction from cash record and add to the global expenses API
const searchCode = `    if (pettyExp > 0) {
      addCashRecord({
        date: sale.date,
        details: \`Daily Petty Expenses - \${sale.branchName} (\${sale.shift})\`,
        debit: 0,
        credit: pettyExp,
        referenceNo: \`EXP-\${sale.branchCode || 'BR'}-\${Date.now().toString().slice(-4)}\`,
        category: 'PETTY_CASH',
        branchId: sale.branchId,
        branchName: sale.branchName,
      });
    }`;

const replaceCode = `    if (sale.pettyCashExpenses && sale.pettyCashExpenses.length > 0) {
      sale.pettyCashExpenses.forEach((exp, idx) => {
        const expData = {
          id: \`exp-\${Date.now()}-\${idx}\`,
          branchId: sale.branchId,
          branchName: sale.branchName,
          date: sale.date,
          description: exp.description,
          amount: exp.amount,
          category: 'Daily Sale Expense',
          reference: sale.id,
          createdAt: new Date().toISOString()
        };
        api.createExpense(expData).catch(console.error);
      });
    }`;

code = code.replace(searchCode, replaceCode);

fs.writeFileSync('src/context/AppContext.tsx', code);
