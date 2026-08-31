const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

if (!code.includes('api.expenses =')) {
  code = code.replace('bootstrap: async () => {', `
  getExpenses: async () => {
    const res = await fetch('/api/expenses');
    return res.json();
  },
  createExpense: async (data: any) => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  bootstrap: async () => {`);
  fs.writeFileSync('src/lib/api.ts', code);
}
