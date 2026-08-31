const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

if (code.includes('const branchesData = await getAllBranches();') && !code.includes('const expensesData = await db.select()')) {
  code = code.replace(
    'const branchesData = await getAllBranches();',
    `const branchesData = await getAllBranches();
    const expensesData = await db.select().from(expenses).orderBy(desc(expenses.createdAt));`
  );
  code = code.replace(
    'branches: branchesData,',
    'branches: branchesData,\n        expenses: expensesData,'
  );
  fs.writeFileSync('server.ts', code);
}
