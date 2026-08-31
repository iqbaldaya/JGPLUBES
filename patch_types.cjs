const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf-8');

if (!code.includes('export interface Expense')) {
  const expenseType = `
export interface Expense {
  id: string;
  branchId: string;
  branchName: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  reference?: string;
  createdAt: string;
}
`;
  code = code + expenseType;
  fs.writeFileSync('src/types/index.ts', code);
}
