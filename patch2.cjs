const fs = require('fs');
const serverPath = 'server.ts';
let serverCode = fs.readFileSync(serverPath, 'utf-8');

if (!serverCode.includes('/api/expenses')) {
  const expenseRoutes = `
app.get('/api/expenses', async (req, res) => {
  try {
    const data = await db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.createdAt));
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const resDb = await db.insert(expenses).values(req.body).returning();
    res.json(resDb[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

`;
  serverCode = serverCode.replace('// 1. BRANCHES', expenseRoutes + '// 1. BRANCHES');
  
  // Also import expenses
  serverCode = serverCode.replace('stockTransfers,', 'stockTransfers, expenses,');
  
  fs.writeFileSync(serverPath, serverCode);
}
