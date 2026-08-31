const fs = require('fs');
let code = fs.readFileSync('src/components/owner/BranchManager.tsx', 'utf-8');

const target1 = `                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Opening Cash Float (K)
                  </label>
                  <input
                    id="input-new-branch-float"
                    type="number"
                    min="0"
                    value={newBranchData.openingCashFloat}
                    onChange={(e) => setNewBranchData({ ...newBranchData, openingCashFloat: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>`;
code = code.replace(target1, '');

// Also check the edit form
const target2 = `                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Opening Cash Float (K)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.openingCashFloat}
                    onChange={(e) => setEditFormData({ ...editFormData, openingCashFloat: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>`;
code = code.replace(target2, '');

fs.writeFileSync('src/components/owner/BranchManager.tsx', code);
