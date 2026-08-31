const fs = require('fs');
let code = fs.readFileSync('src/components/sales/SalesAdjustmentModal.tsx', 'utf-8');

const targetToRemove = `              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Opening Float (K)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={openingFloat === 0 ? '' : openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>`;

code = code.replace(targetToRemove, '');
code = code.replace(/grid-cols-1 sm:grid-cols-4/g, 'grid-cols-1 sm:grid-cols-3');

// Oh wait, wait, the state openingFloat is removed, we must make sure there are no other references.
// Let's replace openingFloat variable usage with 0 if any remains.
code = code.replace(/openingFloat === 0 \? '' : openingFloat/g, "''");
code = code.replace(/setOpeningFloat\([^)]+\)/g, "");

fs.writeFileSync('src/components/sales/SalesAdjustmentModal.tsx', code);
