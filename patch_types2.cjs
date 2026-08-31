const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf-8');

if (!code.includes('creditDebtorId?: string;')) {
  code = code.replace(
    'creditSales: number;\n  };',
    'creditSales: number;\n  };\n  creditDebtorId?: string;\n  creditDebtorName?: string;'
  );
  fs.writeFileSync('src/types/index.ts', code);
}
