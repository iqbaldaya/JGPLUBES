import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Droplets,
  Flame,
  ShieldCheck,
  Building2,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Store,
  UserCheck,
  ChevronDown,
  KeyRound,
  Info,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { branches, login, ownerPassword } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('OWNER');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCredentialsHelper, setShowCredentialsHelper] = useState<boolean>(false);

  // Auto-select first active branch if switching to BRANCH_MANAGER and none selected
  useEffect(() => {
    if (selectedRole === 'BRANCH_MANAGER' && !selectedBranchId && branches.length > 0) {
      const firstActive = branches.find((b) => b.status === 'ACTIVE') || branches[0];
      if (firstActive) {
        setSelectedBranchId(firstActive.id);
      }
    }
  }, [selectedRole, selectedBranchId, branches]);

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    setErrorMessage(null);
    setPassword('');
    if (newRole === 'BRANCH_MANAGER' && !selectedBranchId && branches.length > 0) {
      const firstActive = branches.find((b) => b.status === 'ACTIVE') || branches[0];
      if (firstActive) {
        setSelectedBranchId(firstActive.id);
      }
    }
  };

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    setErrorMessage(null);
    setPassword('');
  };

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = login(
      selectedRole,
      selectedRole === 'BRANCH_MANAGER' ? selectedBranchId : null,
      password
    );

    if (!res.success) {
      setErrorMessage(res.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickFillDemo = (roleToSet: UserRole, branchIdToSet?: string) => {
    setSelectedRole(roleToSet);
    setErrorMessage(null);
    if (roleToSet === 'OWNER') {
      setPassword(ownerPassword || 'admin123');
    } else {
      const targetBId = branchIdToSet || branches[0]?.id || '';
      setSelectedBranchId(targetBId);
      const b = branches.find((item) => item.id === targetBId);
      setPassword(b?.password || '123456');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-blue-600/15 via-transparent to-transparent pointer-events-none blur-3xl" />
      <div className="absolute -bottom-24 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Enterprise Brand Logo */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 p-2.5 px-4 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
              <div className="flex -space-x-1">
                <Droplets className="w-5 h-5 text-white" />
                <Flame className="w-5 h-5 text-blue-200" />
              </div>
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="font-black tracking-tight text-lg text-white">
                  JGP <span className="text-blue-400">LUBES</span>
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Lubes &amp; LPG Enterprise Network
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Portal Access
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          Secure multi-site operations login for Executive Owners and Branch Site Lubes Champs.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/95 py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-800 backdrop-blur-md space-y-6">
          {/* Error Alert Box */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-xs sm:text-sm flex items-start space-x-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. ROLE DROPDOWN / SELECTOR */}
            <div>
              <label
                htmlFor="select-login-role"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between"
              >
                <span>Select Access Role *</span>
                <span className="text-[10px] text-blue-400 font-normal">Executive / Site POS</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {selectedRole === 'OWNER' ? (
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Building2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>

                <select
                  id="select-login-role"
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:border-slate-600 transition"
                >
                  <option value="OWNER">Executive Owner HQ (All Sites &amp; Treasury)</option>
                  <option value="BRANCH_MANAGER">Branch Site Location (POS &amp; Shift Ops)</option>
                </select>

                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 2. BRANCH DROPDOWN (Shown when Role is BRANCH_MANAGER) */}
            {selectedRole === 'BRANCH_MANAGER' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label
                  htmlFor="select-login-branch"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between"
                >
                  <span className="flex items-center space-x-1.5">
                    <Store className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Branch Location *</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-normal">
                    {branches.filter((b) => b.status === 'ACTIVE').length} Active Sites
                  </span>
                </label>

                <div className="relative">
                  <select
                    id="select-login-branch"
                    value={selectedBranchId}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    required={selectedRole === 'BRANCH_MANAGER'}
                    className="block w-full px-3.5 py-2.5 bg-slate-800/90 border border-amber-500/40 rounded-xl text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none cursor-pointer hover:border-amber-500/60 transition"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">
                      -- Choose your branch site location --
                    </option>
                    {branches.map((b) => (
                      <option
                        key={b.id}
                        value={b.id}
                        disabled={b.status === 'INACTIVE'}
                        className="bg-slate-900 text-white py-1"
                      >
                        [{b.code}] {b.name} — Champ: {b.lubesChamp}{' '}
                        {b.status === 'INACTIVE' ? '(INACTIVE)' : ''}
                      </option>
                    ))}
                  </select>

                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-amber-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Selected Branch Context Card */}
                {selectedBranch && (
                  <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl text-xs text-slate-300 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span className="flex items-center space-x-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lubes Champ: {selectedBranch.lubesChamp}</span>
                      </span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                        {selectedBranch.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      📍 {selectedBranch.location || 'Station Address'} • Float: K
                      {selectedBranch.openingCashFloat}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. LOGIN PASSWORD SECTION */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="input-login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {selectedRole === 'OWNER'
                      ? 'Owner Master Password *'
                      : `${selectedBranch?.code || 'Branch'} Portal Password *`}
                  </span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {selectedRole === 'OWNER'
                    ? 'Owner HQ Access PIN'
                    : 'Set in Owner Branch Management'}
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={
                    selectedRole === 'OWNER'
                      ? 'Enter Owner HQ master password'
                      : `Enter ${selectedBranch?.name || 'branch'} access password`
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-11 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 transition"
                />

                <button
                  type="button"
                  id="btn-toggle-show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                selectedRole === 'OWNER'
                  ? 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500 shadow-blue-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500 shadow-amber-600/30'
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>
                    Sign In to {selectedRole === 'OWNER' ? 'Owner HQ Portal' : 'Branch Site POS'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials & Passwords Guide */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              id="btn-toggle-demo-credentials"
              onClick={() => setShowCredentialsHelper(!showCredentialsHelper)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition py-1"
            >
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold">Demo Credentials &amp; Quick Login</span>
              </span>
              <span className="text-[11px] text-blue-400">
                {showCredentialsHelper ? 'Hide Details' : 'View Passwords'}
              </span>
            </button>

            {showCredentialsHelper && (
              <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-2.5 animate-in fade-in">
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Click any account below to instantly autofill and test the login workflow:
                </div>

                {/* Owner Autofill */}
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-blue-500/30">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-bold text-white text-xs">Executive Owner HQ</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Password: <strong className="text-blue-300">{ownerPassword || 'admin123'}</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickFillDemo('OWNER')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition shadow-xs"
                  >
                    Use Owner
                  </button>
                </div>

                {/* Branches Autofill List */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
                    Branch Site Passwords (Set in Branch Management):
                  </div>

                  {branches.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-800 hover:border-slate-700 transition text-[11px]"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-slate-200">[{b.code}] {b.name}</span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Password: <strong className="text-amber-300">{b.password || '123456'}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickFillDemo('BRANCH_MANAGER', b.id)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-[10px] font-semibold shrink-0 border border-slate-700"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Passcodes and Lubes Champ credentials can be configured anytime by the Executive Owner inside{' '}
          <strong className="text-slate-400">Owner Portal &gt; Branch Management</strong>.
        </p>
      </div>
    </div>
  );
};
