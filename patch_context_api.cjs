const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

const targetDelete = `  const deleteAirtelMoneyRecord = (recordId: string) => {
    setAirtelMoneyRecords((prev) => prev.filter((r) => r.id !== recordId));
  };`;

const replacementDelete = `  const deleteAirtelMoneyRecord = (recordId: string) => {
    setAirtelMoneyRecords((prev) => prev.filter((r) => r.id !== recordId));
    api.deleteAirtelMoneyRecord(recordId).catch(console.error);
  };`;

code = code.replace(targetDelete, replacementDelete);

const targetUpdate = `  const updateAirtelMoneyRecord = (recordId: string, updates: Partial<AirtelMoneyRecord>) => {
    setAirtelMoneyRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, ...updates } : r))
    );
  };`;

const replacementUpdate = `  const updateAirtelMoneyRecord = (recordId: string, updates: Partial<AirtelMoneyRecord>) => {
    setAirtelMoneyRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, ...updates } : r))
    );
    api.updateAirtelMoneyRecord(recordId, updates).catch(console.error);
  };`;

code = code.replace(targetUpdate, replacementUpdate);

const targetVerify = `  const verifyAirtelMoneyRecord = (recordId: string) => {
    setAirtelMoneyRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, verified: true } : r))
    );
  };`;

const replacementVerify = `  const verifyAirtelMoneyRecord = (recordId: string) => {
    setAirtelMoneyRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, verified: true } : r))
    );
    api.updateAirtelMoneyRecord(recordId, { verified: true }).catch(console.error);
  };`;

code = code.replace(targetVerify, replacementVerify);


fs.writeFileSync('src/context/AppContext.tsx', code);
