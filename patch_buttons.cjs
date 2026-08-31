const fs = require('fs');
let code = fs.readFileSync('src/components/airtel/AirtelMoneyLedger.tsx', 'utf-8');

const target = `                  {!record.verified && verifyFn && (
                    <button
                      onClick={() => verifyFn(record.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow cursor-pointer"
                    >
                      Verify
                    </button>
                  )}`;

const replacement = `                  {!record.verified && verifyFn && (
                    <button
                      onClick={() => verifyFn(record.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow cursor-pointer"
                    >
                      Verify
                    </button>
                  )}
                  {role === 'OWNER' && (
                    <div className="flex flex-col space-y-1 border-l border-stone-200 pl-3">
                      <button
                        onClick={() => setRecordToEdit(record)}
                        className="p-1.5 bg-stone-100 hover:bg-blue-50 text-stone-600 hover:text-blue-700 rounded transition cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRecordToDelete(record)}
                        className="p-1.5 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 rounded transition cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/airtel/AirtelMoneyLedger.tsx', code);
