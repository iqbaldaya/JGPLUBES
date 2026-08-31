const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf-8');

const expensesCode = `
export const expenses = pgTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    branchId: text('branch_id').notNull(),
    branchName: text('branch_name').notNull(),
    date: text('date').notNull(),
    description: text('description').notNull(),
    amount: doublePrecision('amount').notNull(),
    category: text('category').notNull(),
    reference: text('reference'), // e.g. daily sale ID
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    branchIdx: index('expenses_branch_idx').on(table.branchId),
    dateIdx: index('expenses_date_idx').on(table.date),
  })
);
`;

code = code.replace('// --- RELATIONS DEFINITIONS ---', expensesCode + '\n// --- RELATIONS DEFINITIONS ---');

fs.writeFileSync('src/db/schema.ts', code);
