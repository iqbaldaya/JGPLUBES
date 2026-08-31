const fs = require('fs');
let code = fs.readFileSync('src/db/queries.ts', 'utf-8');

const target = "export async function getAllAirtelMoneyRecords() {";

const addition = `export async function updateAirtelMoneyRecord(recordId: string, updates: any) {
  try {
    const res = await db.update(airtelMoneyRecords).set(updates).where(eq(airtelMoneyRecords.id, recordId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateAirtelMoneyRecord:', error);
    throw new Error('Failed to update airtel money record', { cause: error });
  }
}

export async function deleteAirtelMoneyRecord(recordId: string) {
  try {
    await db.delete(airtelMoneyRecords).where(eq(airtelMoneyRecords.id, recordId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteAirtelMoneyRecord:', error);
    throw new Error('Failed to delete airtel money record', { cause: error });
  }
}

`;

code = code.replace(target, addition + target);

fs.writeFileSync('src/db/queries.ts', code);
