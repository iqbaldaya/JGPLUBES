const fs = require('fs');
let code = fs.readFileSync('src/components/sales/SalesAdjustmentModal.tsx', 'utf-8');

code = code.replace(/const \[openingFloat, setOpeningFloat\] = useState<number>\(1000\);\n/g, '');
code = code.replace(/setOpeningFloat\(sale\.openingFloat \|\| 0\);\n/g, '');
code = code.replace(/openingFloat \+ actualCashReceived - cashSentToAirtelMoney - totalPettyExpenses/g, 'actualCashReceived - cashSentToAirtelMoney - totalPettyExpenses');
code = code.replace(/openingFloat,\n/g, 'openingFloat: 0,\n');

code = code.replace(/                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">\n                  <label className="block text-xs font-bold text-stone-700 uppercase mb-2">\n                    Opening Float \(K\)\n                  <\/label>\n                  <div className="relative">\n                    <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" \/>\n                    <input\n                      type="number"\n                      value=\{openingFloat === 0 \? '' : openingFloat\}\n                      onChange=\{\(e\) => setOpeningFloat\(e\.target\.value === '' \? 0 : parseFloat\(e\.target\.value\) \|\| 0\)\}\n                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-sm font-bold"\n                    \/>\n                  <\/div>\n                <\/div>\n/g, '');

fs.writeFileSync('src/components/sales/SalesAdjustmentModal.tsx', code);
