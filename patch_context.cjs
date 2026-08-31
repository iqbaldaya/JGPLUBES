const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

// Add to context type interface:
code = code.replace(
  "verifyAirtelMoneyRecord: (recordId: string) => void;",
  "verifyAirtelMoneyRecord: (recordId: string) => void;\n  deleteAirtelMoneyRecord: (recordId: string) => void;\n  updateAirtelMoneyRecord: (recordId: string, updates: Partial<AirtelMoneyRecord>) => void;"
);

// Add implementations:
const verifyImpl = "const verifyAirtelMoneyRecord = (recordId: string) => {\n    setAirtelMoneyRecords((prev) =>\n      prev.map((r) => (r.id === recordId ? { ...r, verified: true } : r))\n    );\n  };";

const newImpl = `const verifyAirtelMoneyRecord = (recordId: string) => {
    setAirtelMoneyRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, verified: true } : r))
    );
  };

  const deleteAirtelMoneyRecord = (recordId: string) => {
    setAirtelMoneyRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  const updateAirtelMoneyRecord = (recordId: string, updates: Partial<AirtelMoneyRecord>) => {
    setAirtelMoneyRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, ...updates } : r))
    );
  };`;

code = code.replace(verifyImpl, newImpl);

// Add to context provider value:
code = code.replace(
  "verifyAirtelMoneyRecord,",
  "verifyAirtelMoneyRecord,\n        deleteAirtelMoneyRecord,\n        updateAirtelMoneyRecord,"
);

fs.writeFileSync('src/context/AppContext.tsx', code);
