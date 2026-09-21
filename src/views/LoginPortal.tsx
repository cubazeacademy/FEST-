import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFestData } from '../context/FestDataContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Flame,
  Shield,
  Users,
  SlidersHorizontal,
  Globe,
  AlertCircle,
  KeyRound,
  X
} from 'lucide-react';

interface LoginPortalProps {
  onSuccess: (role: string) => void;
  onContinueAsGuest: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onSuccess,
  onContinueAsGuest,
  isModal = false,
  onClose
}) => {
  const { login } = useAuth();
  const { settings } = useFestData();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);

      if (res.success && res.user) {
        onSuccess(res.user.role);
      } else {
        setErrorMsg(res.error || 'Invalid username or password.');
      }
    }, 200);
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
  };

  const cardContent = (
    <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-slate-900/15 text-slate-900 animate-in zoom-in-95 duration-150">
      {/* Modal Close Button */}
      {(isModal || onClose) && (
        <button
          onClick={onClose || onContinueAsGuest}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close Popup"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-600 to-amber-500 p-0.5 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
            <Flame className="w-6 h-6 text-rose-600" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            Portal Authentication
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Enter credentials to access Admin, Team, or Controller portals
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-3.5">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Username</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. admin or ruby_leader"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {loading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Sign In to Portal
            </>
          )}
        </button>
      </form>

      {/* Quick Credentials Buttons */}
      <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick 1-Click Demo Logins
          </span>
          <span className="text-[10px] text-slate-500 font-mono">default pass: 1234</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('admin', '1234')}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">Super Admin</p>
              <p className="text-[10px] font-mono text-slate-500">admin / 1234</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('ruby_leader', '1234')}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">Ruby Leader</p>
              <p className="text-[10px] font-mono text-slate-500">ruby_leader / 1234</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('controller', 'password123')}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">Event Controller</p>
              <p className="text-[10px] font-mono text-slate-500">controller / pass123</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('sapphire_leader', 'password123')}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">Sapphire Leader</p>
              <p className="text-[10px] font-mono text-slate-500">sapphire_leader</p>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 text-center border-t border-slate-100">
        <button
          type="button"
          onClick={onClose || onContinueAsGuest}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          Continue browsing Public Live Results
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return cardContent;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-red-500/20">
      {cardContent}
    </div>
  );
};

