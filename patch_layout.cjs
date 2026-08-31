const fs = require('fs');

function removeMatches(file, regex) {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(regex, '');
  fs.writeFileSync(file, code);
}

removeMatches('src/components/auth/LoginPage.tsx', /<div className="flex justify-between items-center bg-stone-50 p-2 rounded border border-stone-200 mt-2">\n\s*<span className="text-stone-500 font-semibold">Opening Float<\/span>\n\s*<span className="font-mono font-bold text-stone-800">\n\s*K\n\s*\{selectedBranch\.openingCashFloat\}\n\s*<\/span>\n\s*<\/div>/g);

removeMatches('src/components/layout/NavigationTabs.tsx', /<span className="font-mono text-\[10px\] text-blue-400">K\{currentBranch\.openingCashFloat\} Float<\/span>/g);

removeMatches('src/components/layout/Header.tsx', /<span className="hidden sm:inline text-slate-300">\|<\/span>\n\s*<span>Opening Cash Float: <strong className="text-slate-700 font-mono">K\{currentBranch\.openingCashFloat\}<\/strong><\/span>/g);
