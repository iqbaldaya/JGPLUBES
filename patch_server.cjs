const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// 1. Add to imports from queries.ts
code = code.replace(
  "  getAllAirtelMoneyRecords,\n  createAirtelMoneyRecord,",
  "  getAllAirtelMoneyRecords,\n  createAirtelMoneyRecord,\n  updateAirtelMoneyRecord,\n  deleteAirtelMoneyRecord,"
);

// 2. Add endpoints
const target = "app.post('/api/airtel-money-records', async (req, res) => {";
const addition = `app.put('/api/airtel-money-records/:id', async (req, res) => {
  try {
    const data = await updateAirtelMoneyRecord(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/airtel-money-records/:id', async (req, res) => {
  try {
    const data = await deleteAirtelMoneyRecord(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

`;

code = code.replace(target, addition + target);

fs.writeFileSync('server.ts', code);
