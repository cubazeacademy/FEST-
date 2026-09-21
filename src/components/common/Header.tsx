import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFestData } from '../../context/FestDataContext';
import {
  Shield,
  Users,
  Trophy,
  SlidersHorizontal,
  ChevronDown,
  Globe,
  Radio,
  Flame,
  LogOut,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLoginModal?: () => void;
  isSidebarHidden?: boolean;
  setIsSidebarHidden?: (hidden: boolean | ((prev: boolean) => boolean)) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenLoginModal,
  isSidebarHidden,
  setIsSidebarHidden
}) => {
  const {
    currentUser,
    allUsers,
    switchUser,
    logout,
    isSuperAdmin,
    isTeamLeader,
    isController,
    isPublic
  } = useAuth();

  const { settings, updateSettings, cloudStatus, lastSyncedAt, syncWithCloud, teams } = useFestData();

  const currentUserTeam = teams.find(
    t =>
      t.id === currentUser.teamId ||
      t.name.toLowerCase() === currentUser.teamId?.toLowerCase() ||
      t.code.toLowerCase() === currentUser.teamId?.toLowerCase() ||
      (currentUser.username &&
        (currentUser.username.toLowerCase().includes(t.code.toLowerCase()) ||
          currentUser.username.toLowerCase().includes(t.name.toLowerCase())))
  );

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const toggleRegistration = () => {
    if (isSuperAdmin) {
      updateSettings({ registrationOpen: !settings.registrationOpen }, currentUser.name, currentUser.role);
    }
  };

  const getRoleIcon = () => {
    if (isSuperAdmin) return <Shield className="w-4 h-4 text-emerald-600" />;
    if (isTeamLeader) return <Users className="w-4 h-4 text-blue-600" />;
    if (isController) return <SlidersHorizontal className="w-4 h-4 text-amber-600" />;
    return <Globe className="w-4 h-4 text-purple-600" />;
  };

  const getRoleBadgeStyle = () => {
    if (isSuperAdmin) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (isTeamLeader) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (isController) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-17 gap-4">
          {/* Logo & Fest Brand + Sidebar Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {setIsSidebarHidden && (
              <button
                onClick={() => setIsSidebarHidden(prev => !prev)}
                title={isSidebarHidden ? 'Show sidebar (Expand navigation)' : 'Hide sidebar (Full width view)'}
                className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                aria-label="Toggle Sidebar"
              >
                {isSidebarHidden ? (
                  <PanelLeftOpen className="w-4 h-4 text-rose-500" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}

            <div
              onClick={() => setActiveTab(isPublic ? 'public_live' : isTeamLeader ? 'tl_my_team' : isController ? 'ctrl_assigned' : 'admin_dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-indigo-600 to-sky-500 p-0.5 flex items-center justify-center shadow-md shadow-indigo-500/15 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Flame className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-slate-900 tracking-tight">{settings.festName}</span>
                  <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {settings.festYear}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">{settings.institutionName}</p>
              </div>
            </div>

            {/* Live Registration Status Pill */}
            <div className="hidden md:flex items-center ml-2">
              <button
                onClick={toggleRegistration}
                title={isSuperAdmin ? 'Click to toggle registration state' : undefined}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${settings.registrationOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70 shadow-xs'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70 shadow-xs'
                  } ${isSuperAdmin ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`w-2 h-2 rounded-full ${settings.registrationOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {settings.registrationOpen ? 'Registration OPEN' : 'Registration CLOSED'}
                {isSuperAdmin && <span className="text-[10px] font-normal opacity-70 ml-0.5">(Toggle)</span>}
              </button>
            </div>

            {/* Cloud Sync Status Indicator */}
            <div className="hidden xl:flex items-center ml-1">
              <button
                onClick={syncWithCloud}
                title={`Cloud Database: ${cloudStatus.toUpperCase()}${lastSyncedAt ? ` | Last Synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : ''}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                  cloudStatus === 'connected'
                    ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                    : cloudStatus === 'syncing'
                    ? 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse'
                    : cloudStatus === 'error'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {cloudStatus === 'syncing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
                ) : cloudStatus === 'connected' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : cloudStatus === 'error' ? (
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                ) : (
                  <Cloud className="w-3 h-3 text-slate-500" />
                )}
                <span>
                  {cloudStatus === 'connected'
                    ? 'Supabase Live'
                    : cloudStatus === 'syncing'
                    ? 'Syncing Cloud...'
                    : cloudStatus === 'error'
                    ? 'Cloud Offline'
                    : 'Local Cache'}
                </span>
              </button>
            </div>
          </div>

          {/* Center Tabs: Quick Navigation */}
          <div className="hidden lg:flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('public_live')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab.startsWith('public')
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Radio className="w-4 h-4 text-rose-500" />
              Public Live Results
            </button>
            <button
              onClick={() => setActiveTab('leaderboards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === 'leaderboards'
                  ? 'bg-white text-amber-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Championship Leaderboard
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isPublic ? (
              <button
                onClick={() => {
                  if (onOpenLoginModal) onOpenLoginModal();
                  else setActiveTab('login_view');
                }}
                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md shadow-red-600/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span>Portal Sign In</span>
              </button>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className={`flex items-center gap-3 p-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-white hover:bg-slate-50 border transition-all cursor-pointer shadow-xs ${
                    isUserMenuOpen ? 'border-indigo-400 ring-2 ring-indigo-400/20 shadow-md' : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                  aria-expanded={isUserMenuOpen}
                  aria-label="Toggle user session menu"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      getRoleIcon()
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 line-clamp-1 max-w-[140px]">{currentUser.name}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-slate-700' : ''}`} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs font-mono font-medium text-indigo-600">@{currentUser.username}</span>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-semibold ${getRoleBadgeStyle()}`}>
                        {currentUser.role.replace('_', ' ')}
                      </span>
                      {currentUserTeam && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-bold"
                          style={{
                            backgroundColor: `${currentUserTeam.color || '#6366f1'}15`,
                            borderColor: `${currentUserTeam.color || '#6366f1'}35`,
                            color: currentUserTeam.color || '#6366f1'
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: currentUserTeam.color || '#6366f1' }}
                          />
                          {currentUserTeam.name}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Session Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{currentUser.name}</p>
                        {currentUserTeam ? (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0"
                            style={{
                              backgroundColor: `${currentUserTeam.color || '#6366f1'}15`,
                              borderColor: `${currentUserTeam.color || '#6366f1'}35`,
                              color: currentUserTeam.color || '#6366f1'
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: currentUserTeam.color || '#6366f1' }}
                            />
                            {currentUserTeam.name}
                          </span>
                        ) : (
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-semibold shrink-0 ${getRoleBadgeStyle()}`}>
                            {currentUser.role.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs font-mono text-indigo-600 font-semibold">@{currentUser.username}</p>
                        {currentUserTeam && (
                          <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getRoleBadgeStyle()}`}>
                            {currentUser.role.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                    </div>

                    <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                      <div className="text-[10px] font-bold text-slate-400 px-2 pt-1 uppercase tracking-wider">Switch Account Role</div>
                      {allUsers.map(u => {
                        const uTeam = teams.find(
                          t =>
                            t.id === u.teamId ||
                            t.name.toLowerCase() === u.teamId?.toLowerCase() ||
                            t.code.toLowerCase() === u.teamId?.toLowerCase() ||
                            (u.username &&
                              (u.username.toLowerCase().includes(t.code.toLowerCase()) ||
                                u.username.toLowerCase().includes(t.name.toLowerCase())))
                        );

                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              switchUser(u.id);
                              setIsUserMenuOpen(false);
                              if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') setActiveTab('admin_dashboard');
                              else if (u.role === 'TEAM_LEADER') setActiveTab('tl_my_team');
                              else if (u.role === 'CONTROLLER') setActiveTab('ctrl_assigned');
                              else setActiveTab('public_live');
                            }}
                            className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer ${
                              currentUser.id === u.id ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="truncate">{u.name}</span>
                              {uTeam && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0"
                                  style={{
                                    backgroundColor: `${uTeam.color || '#6366f1'}15`,
                                    borderColor: `${uTeam.color || '#6366f1'}35`,
                                    color: uTeam.color || '#6366f1'
                                  }}
                                >
                                  {uTeam.name}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-slate-400 shrink-0">@{u.username}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                          setActiveTab('public_live');
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

