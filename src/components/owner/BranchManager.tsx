import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Branch } from '../../types';
import {
  Building2,
  Plus,
  Edit2,
  Check,
  X,
  Phone,
  MapPin,
  Award,
  DollarSign,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const BranchManager: React.FC = () => {
  const { branches, addBranch, updateBranch, lowStockAlerts, dailySales } = useApp();

  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  // New Branch Form State
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    code: '',
    lubesChamp: '',
    phone: '',
    location: '',
    openingCashFloat: 1000,
    airtelMerchantNumber: '',
    targetMonthlySales: 80000,
    status: 'ACTIVE' as const,
  });

  // Edit Branch Form State
  const [editFormData, setEditFormData] = useState<Partial<Branch>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleStartEdit = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setEditFormData({
      name: branch.name,
      code: branch.code,
      lubesChamp: branch.lubesChamp,
      phone: branch.phone,
      location: branch.location,
      openingCashFloat: branch.openingCashFloat,
      airtelMerchantNumber: branch.airtelMerchantNumber,
      targetMonthlySales: branch.targetMonthlySales,
      status: branch.status,
    });
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingBranchId(null);
    setEditFormData({});
    setErrorMsg(null);
  };

  const handleSaveEdit = (branchId: string) => {
    if (!editFormData.name?.trim()) {
      setErrorMsg('Branch name cannot be empty.');
      return;
    }
    if (!editFormData.code?.trim()) {
      setErrorMsg('Branch code cannot be empty.');
      return;
    }
    if (!editFormData.lubesChamp?.trim()) {
      setErrorMsg('Lubes Champ name is required.');
      return;
    }

    // Check code uniqueness across other branches
    const codeConflict = branches.some(
      (b) => b.id !== branchId && b.code.toLowerCase() === editFormData.code?.toLowerCase().trim()
    );
    if (codeConflict) {
      setErrorMsg(`Branch code "${editFormData.code}" is already in use by another branch.`);
      return;
    }

    updateBranch(branchId, {
      name: editFormData.name.trim(),
      code: editFormData.code.toUpperCase().trim(),
      lubesChamp: editFormData.lubesChamp.trim(),
      phone: editFormData.phone?.trim() || '',
      location: editFormData.location?.trim() || '',
      openingCashFloat: Number(editFormData.openingCashFloat) || 0,
      airtelMerchantNumber: editFormData.airtelMerchantNumber?.trim() || '',
      targetMonthlySales: Number(editFormData.targetMonthlySales) || 0,
      status: editFormData.status || 'ACTIVE',
    });

    setEditingBranchId(null);
    setSuccessMsg('Branch details and Lubes Champ successfully updated!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchData.name.trim() || !newBranchData.code.trim() || !newBranchData.lubesChamp.trim()) {
      setErrorMsg('Please fill in Branch Name, Branch Code, and Lubes Champ Name.');
      return;
    }

    // Check code uniqueness
    const codeConflict = branches.some(
      (b) => b.code.toLowerCase() === newBranchData.code.toLowerCase().trim()
    );
    if (codeConflict) {
      setErrorMsg(`Branch code "${newBranchData.code}" is already in use.`);
      return;
    }

    addBranch({
      name: newBranchData.name.trim(),
      code: newBranchData.code.toUpperCase().trim(),
      lubesChamp: newBranchData.lubesChamp.trim(),
      phone: newBranchData.phone.trim(),
      location: newBranchData.location.trim(),
      openingCashFloat: Number(newBranchData.openingCashFloat) || 1000,
      airtelMerchantNumber: newBranchData.airtelMerchantNumber.trim(),
      targetMonthlySales: Number(newBranchData.targetMonthlySales) || 80000,
      status: 'ACTIVE',
    });

    setIsAddingBranch(false);
    setNewBranchData({
      name: '',
      code: '',
      lubesChamp: '',
      phone: '',
      location: '',
      openingCashFloat: 1000,
      airtelMerchantNumber: '',
      targetMonthlySales: 80000,
      status: 'ACTIVE',
    });
    setSuccessMsg('New branch successfully created and added to the network!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Multi-Location Network Config</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Branch Locations &amp; Lubes Champs Management
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Add new branches, modify site names, configure branch codes, assign Lubes Champs, and set monthly targets.
          </p>
        </div>

        <button
          id="btn-add-branch-modal"
          onClick={() => {
            setIsAddingBranch(true);
            setErrorMsg(null);
          }}
          className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Modal: Add New Branch Form */}
      {isAddingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Add New Branch Location</h3>
              </div>
              <button
                onClick={() => setIsAddingBranch(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Branch Name *
                  </label>
                  <input
                    id="input-new-branch-name"
                    type="text"
                    required
                    placeholder="e.g. Chingola Mine Station"
                    value={newBranchData.name}
                    onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Branch Code * (e.g. CHN-05)
                  </label>
                  <input
                    id="input-new-branch-code"
                    type="text"
                    required
                    placeholder="e.g. CHN-05"
                    value={newBranchData.code}
                    onChange={(e) => setNewBranchData({ ...newBranchData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lubes Champ Name *</span>
                  </label>
                  <input
                    id="input-new-branch-champ"
                    type="text"
                    required
                    placeholder="e.g. Brian Mwila"
                    value={newBranchData.lubesChamp}
                    onChange={(e) => setNewBranchData({ ...newBranchData, lubesChamp: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>Branch / Champ Contact</span>
                  </label>
                  <input
                    id="input-new-branch-phone"
                    type="text"
                    placeholder="e.g. +260 97 9001122"
                    value={newBranchData.phone}
                    onChange={(e) => setNewBranchData({ ...newBranchData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  <span>Location / Physical Address</span>
                </label>
                <input
                  id="input-new-branch-location"
                  type="text"
                  placeholder="e.g. Plot 108, Solwezi Highway, Chingola"
                  value={newBranchData.location}
                  onChange={(e) => setNewBranchData({ ...newBranchData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Opening Float (K)
                  </label>
                  <input
                    id="input-new-branch-float"
                    type="number"
                    min="0"
                    value={newBranchData.openingCashFloat}
                    onChange={(e) => setNewBranchData({ ...newBranchData, openingCashFloat: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Monthly Target (K)
                  </label>
                  <input
                    id="input-new-branch-target"
                    type="number"
                    min="0"
                    value={newBranchData.targetMonthlySales}
                    onChange={(e) => setNewBranchData({ ...newBranchData, targetMonthlySales: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Airtel Merchant #
                  </label>
                  <input
                    id="input-new-branch-merchant"
                    type="text"
                    placeholder="AM-CHN-001"
                    value={newBranchData.airtelMerchantNumber}
                    onChange={(e) => setNewBranchData({ ...newBranchData, airtelMerchantNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingBranch(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-create-branch"
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 shadow"
                >
                  Save &amp; Activate Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branches List Table & Inline Edit */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900">Configured Sites &amp; Lubes Champs ({branches.length})</h3>
          </div>
          <span className="text-xs text-stone-500">Edit codes, names &amp; champs at any time</span>
        </div>

        <div className="divide-y divide-stone-200">
          {branches.map((branch) => {
            const isEditing = editingBranchId === branch.id;
            const branchSales = dailySales.filter((s) => s.branchId === branch.id);
            const totalRev = branchSales.reduce((sum, s) => sum + s.totalSalesAmount, 0);
            const lowStockCount = lowStockAlerts.filter((a) => a.branchId === branch.id).length;

            return (
              <div key={branch.id} className="p-6 transition hover:bg-stone-50/50">
                {isEditing ? (
                  /* Edit Form */
                  <div className="space-y-4 bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        Editing Branch: {branch.name}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          id={`btn-cancel-edit-branch-${branch.id}`}
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg text-xs font-semibold hover:bg-stone-100 flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                        <button
                          id={`btn-save-edit-branch-${branch.id}`}
                          onClick={() => handleSaveEdit(branch.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Site Name
                        </label>
                        <input
                          type="text"
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Branch Code
                        </label>
                        <input
                          type="text"
                          value={editFormData.code || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white font-mono uppercase text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Lubes Champ Name
                        </label>
                        <input
                          type="text"
                          value={editFormData.lubesChamp || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, lubesChamp: e.target.value })}
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-sm font-semibold text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Location Address
                        </label>
                        <input
                          type="text"
                          value={editFormData.location || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Contact Phone
                        </label>
                        <input
                          type="text"
                          value={editFormData.phone || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Airtel Merchant #
                        </label>
                        <input
                          type="text"
                          value={editFormData.airtelMerchantNumber || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, airtelMerchantNumber: e.target.value })}
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Display Row */
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-xs font-black bg-stone-900 text-amber-400 px-2 py-0.5 rounded shadow-xs">
                          {branch.code}
                        </span>
                        <h4 className="text-base font-bold text-stone-900">{branch.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            branch.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {branch.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center text-xs text-stone-500 gap-x-4 gap-y-1">
                        <div className="flex items-center space-x-1">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>Lubes Champ: <strong className="text-stone-900 font-semibold">{branch.lubesChamp}</strong></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{branch.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{branch.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Smartphone className="w-3.5 h-3.5 text-red-500" />
                          <span>Airtel Till: <strong>{branch.airtelMerchantNumber}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-xs text-stone-500">Recorded Sales</div>
                        <div className="text-base font-black text-stone-900">
                          K{totalRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {lowStockCount > 0 && (
                          <div className="text-[11px] font-semibold text-amber-700">
                            {lowStockCount} items low in stock
                          </div>
                        )}
                      </div>

                      <button
                        id={`btn-edit-branch-${branch.id}`}
                        onClick={() => handleStartEdit(branch)}
                        className="px-3.5 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-semibold text-xs flex items-center space-x-1.5 transition shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                        <span>Edit Site &amp; Champ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
