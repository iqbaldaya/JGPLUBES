const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DailySalesForm.tsx', 'utf-8');

const searchCode = `
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Opening Cash Float (K)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={openingFloat === 0 ? '' : openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
              disabled={isLockedForBranch}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold disabled:bg-slate-100"
            />
          </div>`;

code = code.replace(searchCode, '');
code = code.replace(/openingFloat/g, '0'); // Just zero out any remaining references

fs.writeFileSync('src/components/sales/DailySalesForm.tsx', code);
