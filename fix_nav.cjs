const fs = require('fs');
let code = fs.readFileSync('src/components/layout/NavigationTabs.tsx', 'utf-8');

code = code.replace(
  'Settings,\n  Database,',
  'Settings,\n  Database,\n  Receipt,'
);

fs.writeFileSync('src/components/layout/NavigationTabs.tsx', code);
