const fs = require('fs');
let code = fs.readFileSync('src/components/branch/BranchDayToDaySalesSection.tsx', 'utf-8');

code = code.replace(
  'const { branches, dailySales } = useApp();',
  'const { branches, dailySales, role } = useApp();'
);

// We have two places where the Trash button is rendered
const trashButton1 = `<button
                                    onClick={() => setDeletingSale(sale)}
                                    className="p-1 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded text-xs border border-slate-200 transition cursor-pointer"
                                    title="Delete Shift Entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>`;
const trashButton1Replacement = `{role === 'OWNER' && (
                                  <button
                                    onClick={() => setDeletingSale(sale)}
                                    className="p-1 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded text-xs border border-slate-200 transition cursor-pointer"
                                    title="Delete Shift Entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}`;

const trashButton2 = `<button
                          onClick={() => setDeletingSale(sale)}
                          className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg text-xs transition cursor-pointer"
                          title="Delete Shift Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>`;
const trashButton2Replacement = `{role === 'OWNER' && (
                        <button
                          onClick={() => setDeletingSale(sale)}
                          className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg text-xs transition cursor-pointer"
                          title="Delete Shift Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}`;

code = code.replace(trashButton1, trashButton1Replacement);
code = code.replace(trashButton2, trashButton2Replacement);

fs.writeFileSync('src/components/branch/BranchDayToDaySalesSection.tsx', code);
