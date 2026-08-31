const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

const target = "  async createAirtelMoneyRecord(data: any) {";

const addition = `  async updateAirtelMoneyRecord(id: string, updates: any) {
    const res = await fetch(\`/api/airtel-money-records/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteAirtelMoneyRecord(id: string) {
    const res = await fetch(\`/api/airtel-money-records/\${id}\`, { method: 'DELETE' });
    return res.json();
  },

`;

code = code.replace(target, addition + target);

// Also we need to make sure deleteAirtelMoneyRecord is used in AppContext.tsx

fs.writeFileSync('src/lib/api.ts', code);
