const fs = require('fs');
let code = fs.readFileSync('src/components/reconciliation/CashReconciliationView.tsx', 'utf-8');

code = code.replace(/const \[editOpeningFloat, setEditOpeningFloat\] = useState<string>\(''\);\n/g, '');
code = code.replace(/setEditOpeningFloat\(String\(sale\.openingFloat \?\? '0'\)\);\n/g, '');
code = code.replace(/const opening = parseFloat\(editOpeningFloat\) \|\| 0;\n/g, '');
code = code.replace(/openingFloat: opening,\n/g, 'openingFloat: 0,\n');
code = code.replace(/const opn = parseFloat\(editOpeningFloat\) \|\| 0;\n/g, '');
code = code.replace(/const sysVariance = editCalcActual - editCalcExpected;\n/g, 'const sysVariance = editCalcActual - editCalcExpected;\n');

code = code.replace(/                \{\/\* Opening Cash Float \*\/\}\n                <div>\n                  <label className="block text-xs font-bold text-slate-700 mb-1">\n                    Opening Cash Float \(K\)\n                  <\/label>\n                  <input\n                    type="number"\n                    step="any"\n                    value=\{editOpeningFloat\}\n                    onChange=\{\(e\) => setEditOpeningFloat\(e\.target\.value\)\}\n                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"\n                  \/>\n                <\/div>\n/g, '');


fs.writeFileSync('src/components/reconciliation/CashReconciliationView.tsx', code);
