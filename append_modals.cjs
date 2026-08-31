const fs = require('fs');
let code = fs.readFileSync('src/components/airtel/AirtelMoneyLedger.tsx', 'utf-8');

const endForm = `              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddingRecord(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}`;

const replacement = `${endForm}

      {/* Modal: Edit Airtel Record */}
      {recordToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Edit Airtel Transfer</h3>
              </div>
              <button onClick={() => setRecordToEdit(null)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (updateAirtelMoneyRecord) {
                updateAirtelMoneyRecord(recordToEdit.id, recordToEdit);
              }
              setRecordToEdit(null);
            }} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Branch Site *
                  </label>
                  <select
                    value={recordToEdit.branchId}
                    onChange={(e) => setRecordToEdit({ ...recordToEdit, branchId: e.target.value, branchName: branches.find(b => b.id === e.target.value)?.name || 'HQ' })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Transfer Category *
                  </label>
                  <select
                    value={recordToEdit.type}
                    onChange={(e) => setRecordToEdit({ ...recordToEdit, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    <option value="DAILY_SALES_CASH_IN">Cash Deposit from Sales (Daily Remittance)</option>
                    <option value="DIRECT_CUSTOMER_PAYMENT">Direct Customer Till Payment</option>
                    <option value="SUPPLIER_PAYMENT_OUT">Supplier Settlement Outflow</option>
                    <option value="FLOAT_TOPUP">Float Wallet Top-up</option>
                    <option value="WITHDRAWAL_TO_BANK">Withdrawal to Bank</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Amount (Kwacha) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={recordToEdit.amount}
                  onChange={(e) => setRecordToEdit({ ...recordToEdit, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold text-red-600 bg-red-50"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Sender Phone Number
                  </label>
                  <input
                    type="text"
                    value={recordToEdit.senderNumber || ''}
                    onChange={(e) => setRecordToEdit({ ...recordToEdit, senderNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Receiver Phone or Merchant Till
                  </label>
                  <input
                    type="text"
                    value={recordToEdit.receiverNumber || ''}
                    onChange={(e) => setRecordToEdit({ ...recordToEdit, receiverNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Notes / Shift Ref
                </label>
                <input
                  type="text"
                  value={recordToEdit.notes || ''}
                  onChange={(e) => setRecordToEdit({ ...recordToEdit, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setRecordToEdit(null)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Airtel Record */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base">Confirm Deletion</h3>
              </div>
              <button onClick={() => setRecordToDelete(null)} className="text-red-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-sm text-stone-700">
              <p className="mb-4">
                Are you sure you want to permanently delete this Airtel Money record?
              </p>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                <div className="font-bold text-red-900">
                  {recordToDelete.transactionRef || recordToDelete.id}
                </div>
                <div className="text-red-700 font-bold text-lg">
                  K{recordToDelete.amount.toLocaleString()}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {recordToDelete.branchName} - {recordToDelete.date}
                </div>
              </div>
              <p className="text-xs text-stone-500 font-bold">
                Warning: This action cannot be undone and may affect branch reconciliation balances.
              </p>
            </div>
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 bg-white border border-stone-300 rounded-lg text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteAirtelMoneyRecord) {
                    deleteAirtelMoneyRecord(recordToDelete.id);
                  }
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}`;

code = code.replace(endForm, replacement);
fs.writeFileSync('src/components/airtel/AirtelMoneyLedger.tsx', code);
