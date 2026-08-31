const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DailySalesForm.tsx', 'utf-8');

// 1. Remove openingFloat from state
code = code.replace(/const \[openingFloat, setOpeningFloat\].*?\n/, '');
code = code.replace(/setOpeningFloat\(existingRecord\.openingFloat.*?\n/, '');

// 2. Calculation logic
code = code.replace(
  /  \/\/ Auto-sync cash sales when items change[\s\S]*?const closingCashInDrawer[\s\S]*?;/,
  `  // Variance Calculation
  const totalPettyExpenses = pettyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalAccounted = actualCashReceived + airtelDirectSales + creditSales + totalPettyExpenses;
  const cashVariance = totalSalesAmount - totalAccounted; // Positive = Short, Negative = Excess
  
  // Set default Debtor if credit sales exist but none selected
  useEffect(() => {
    if (creditSales > 0 && !selectedDebtorId && debtors.length > 0) {
      setSelectedDebtorId(debtors[0].id);
    }
  }, [creditSales, debtors, selectedDebtorId]);`
);

// 3. Update the saving of record
code = code.replace(/openingFloat,/g, 'openingFloat: 0,');
code = code.replace(/expectedCashFromSales,/g, 'expectedCashFromSales: 0,');
code = code.replace(/cashSales,/g, 'cashSales: actualCashReceived,');

// 4. UI Replacement
const searchUI = `        {/* Step 3: Payment Breakdown */}`;
const endUI = `        {/* Step 5: Cash Sent to Airtel Money */}`;
const replaceUI = `
        {/* Step 3: Collections & Discrepancies */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Sales Breakdown & Reconciliation
            </h3>
            <span
              className={\`text-xs font-bold px-2.5 py-1 rounded-full \${
                Math.abs(cashVariance) < 0.01
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }\`}
            >
              {Math.abs(cashVariance) < 0.01
                ? '✓ 100% Balanced'
                : \`⚠ Discrepancy: \${cashVariance > 0 ? \`K\${cashVariance.toFixed(2)} (Shortage)\` : \`K\${Math.abs(cashVariance).toFixed(2)} (Excess)\`}\`}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Physical Cash (K)
              </label>
              <input
                id="input-actual-cash-received"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={actualCashReceived === 0 ? '' : actualCashReceived}
                disabled={isLockedForBranch}
                onChange={(e) => setActualCashReceived(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                <Smartphone className="w-3.5 h-3.5 text-red-500" />
                <span>Airtel Direct (K)</span>
              </label>
              <input
                id="input-sale-airtel-direct"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={airtelDirectSales === 0 ? '' : airtelDirectSales}
                disabled={isLockedForBranch}
                onChange={(e) => setAirtelDirectSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-red-900 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Credit Sales (K)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={creditSales === 0 ? '' : creditSales}
                disabled={isLockedForBranch}
                onChange={(e) => setCreditSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-amber-900 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Variance (K)
              </label>
              <div
                className={\`w-full px-3 py-1.5 rounded-lg text-xs font-bold border \${
                  cashVariance === 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }\`}
              >
                {cashVariance > 0 ? \`+\${cashVariance.toFixed(2)}\` : cashVariance < 0 ? \`-\${Math.abs(cashVariance).toFixed(2)}\` : '0.00'}
              </div>
            </div>
          </div>

          {/* If credit sales occur, allow debtor selection */}
          {creditSales > 0 && (
            <div className="pt-2 border-t border-slate-200 flex items-center space-x-3">
              <label className="text-xs font-bold text-amber-900">
                Select Credit Customer:
              </label>
              <select
                value={selectedDebtorId}
                disabled={isLockedForBranch}
                onChange={(e) => setSelectedDebtorId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 disabled:bg-slate-100"
              >
                {debtors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

`;

const startIndex = code.indexOf(searchUI);
const endIndex = code.indexOf(endUI);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replaceUI + code.substring(endIndex);
}

fs.writeFileSync('src/components/sales/DailySalesForm.tsx', code);
