const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf-8');

if (!code.includes('credit_debtor_id')) {
  code = code.replace(
    "status: text('status').default('SUBMITTED').notNull(),",
    "status: text('status').default('SUBMITTED').notNull(),\n    creditDebtorId: text('credit_debtor_id'),\n    creditDebtorName: text('credit_debtor_name'),"
  );
  fs.writeFileSync('src/db/schema.ts', code);
}
