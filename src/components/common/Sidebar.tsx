import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFestData } from '../../context/FestDataContext';
import {
  LayoutDashboard,
  GraduationCap,
  Layers,
  Hash,
  Users2,
  CalendarCheck,
  UserCog,
  FileCheck2,
  Trophy,
  Sliders,
  Settings,
  UserPlus,
  Users,
  ClipboardList,
  Flame,
  Award,
  Radio,
  Search,
  ArrowUpDown,
  Globe,
  CalendarDays,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isSidebarHidden?: boolean;
  setIsSidebarHidden?: (hidden: boolean | ((prev: boolean) => boolean)) => void;
}

type NavModule = 'FESTIVALS' | 'USERS' | 'WEBSITE' | 'SETTINGS';

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  isSidebarHidden = false,
  setIsSidebarHidden
}) => {
  const { isSuperAdmin, isTeamLeader, isController, currentUser, allUsers } = useAuth();
  const { students, programs, registrations, results, teams, settings } = useFestData();

  // Search filter inside sub-panel
  const [searchNavQuery, setSearchNavQuery] = useState('');

  // Primary navigation module state
  const [selectedModule, setSelectedModule] = useState<NavModule>('FESTIVALS');

  // Sync module whenever activeTab changes
  useEffect(() => {
    if (['admin_students', 'admin_teams', 'admin_categories_classes', 'admin_users'].includes(activeTab)) {
      setSelectedModule('USERS');
    } else if (['public_live', 'public_arts_board', 'public_sports_board', 'leaderboards', 'public_search'].includes(activeTab)) {
      setSelectedModule('WEBSITE');
    } else if (['admin_settings', 'admin_points_config'].includes(activeTab)) {
      setSelectedModule('SETTINGS');
    } else if (
      [
        'admin_dashboard',
        'admin_programs',
        'admin_registrations',
        'admin_results',
        'admin_chest_numbers',
        'tl_my_team',
        'tl_students',
        'tl_reg_individual',
        'tl_reg_group',
        'tl_history',
        'ctrl_assigned',
        'ctrl_programs',
        'ctrl_registrations',
        'ctrl_result_entry',
        'ctrl_candidates'
      ].includes(activeTab)
    ) {
      setSelectedModule('FESTIVALS');
    }
  }, [activeTab]);

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;

  const activePrograms = programs.filter(p => {
    if (p.section === 'ARTS' && !isArtsEnabled) return false;
    if (p.section === 'SPORTS' && !isSportsEnabled) return false;
    return true;
  });

  const activeRegistrations = registrations.filter(r => {
    const prog = programs.find(p => p.id === r.programId);
    if (!prog) return true;
    if (prog.section === 'ARTS' && !isArtsEnabled) return false;
    if (prog.section === 'SPORTS' && !isSportsEnabled) return false;
    return true;
  });

  const myTeam = isTeamLeader
    ? teams.find(
        t =>
          t.id === currentUser.teamId ||
          t.name.toLowerCase() === currentUser.teamId?.toLowerCase() ||
          t.code.toLowerCase() === currentUser.teamId?.toLowerCase() ||
          (currentUser.name && t.name.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) ||
          (currentUser.username &&
            (currentUser.username.toLowerCase().includes(t.code.toLowerCase()) ||
              currentUser.username.toLowerCase().includes(t.name.toLowerCase())))
      ) || teams[0]
    : null;

  const myHouseStudents = isTeamLeader && myTeam
    ? students.filter(
        s =>
          s.teamId === myTeam.id ||
          s.teamId?.toLowerCase() === myTeam.name?.toLowerCase() ||
          s.teamId?.toLowerCase() === myTeam.code?.toLowerCase() ||
          (currentUser.teamId && s.teamId === currentUser.teamId)
      )
    : [];

  const handleModuleClick = (module: NavModule) => {
    setSelectedModule(module);
    // Switch to primary tab of the selected module
    if (module === 'FESTIVALS') {
      if (isSuperAdmin) setActiveTab('admin_dashboard');
      else if (isTeamLeader) setActiveTab('tl_my_team');
      else if (isController) setActiveTab('ctrl_assigned');
      else setActiveTab('public_live');
    } else if (module === 'USERS') {
      if (isSuperAdmin) setActiveTab('admin_students');
      else if (isController) setActiveTab('ctrl_registrations');
    } else if (module === 'WEBSITE') {
      setActiveTab('leaderboards');
    } else if (module === 'SETTINGS') {
      if (isSuperAdmin) setActiveTab('admin_settings');
    }
  };

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpenMobile(false);
  };

  const matchesSearch = (text: string) => {
    if (!searchNavQuery.trim()) return true;
    return text.toLowerCase().includes(searchNavQuery.toLowerCase().trim());
  };

  const teamColor = isTeamLeader && myTeam?.color ? myTeam.color : '#ef4444';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Dual Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-17 left-0 z-30 h-[calc(100vh-4.25rem)] bg-white flex flex-row transition-all duration-300 ease-in-out shrink-0 ${isOpenMobile
            ? 'translate-x-0 border-r border-slate-200/80 shadow-2xl'
            : isSidebarHidden
              ? '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-r-0 lg:opacity-0 pointer-events-none'
              : '-translate-x-full lg:translate-x-0 border-r border-slate-200/80'
          }`}
      >
        {/* ============================================================ */}
        {/* PRIMARY LEFT MODULE RAIL (ICON + LABEL)                      */}
        {/* ============================================================ */}
        <div className="w-18 bg-slate-50/70 border-r border-slate-200/70 flex flex-col justify-between items-center py-4 shrink-0 select-none">
          {/* Module Nav Items */}
          <div className="space-y-3 w-full px-1.5 flex flex-col items-center">
            {/* Festivals */}
            <button
              onClick={() => handleModuleClick('FESTIVALS')}
              title="Festivals Management & Dashboard"
              style={selectedModule === 'FESTIVALS' && isTeamLeader ? { backgroundColor: `${teamColor}12`, color: teamColor } : undefined}
              className={`w-full flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer group ${selectedModule === 'FESTIVALS'
                  ? isTeamLeader ? 'shadow-2xs font-bold' : 'bg-rose-50 text-rose-500 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/80'
                }`}
            >
              <div
                style={selectedModule === 'FESTIVALS' && isTeamLeader ? { backgroundColor: teamColor } : undefined}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${selectedModule === 'FESTIVALS'
                    ? isTeamLeader ? 'text-white shadow-sm scale-105' : 'bg-rose-500 text-white shadow-sm scale-105'
                    : 'text-slate-500 group-hover:text-slate-900'
                  }`}
              >
                <CalendarDays className="w-5 h-5" />
              </div>
              <span
                style={selectedModule === 'FESTIVALS' && isTeamLeader ? { color: teamColor } : undefined}
                className={`text-[10px] tracking-tight ${selectedModule === 'FESTIVALS' ? 'font-extrabold' : 'text-slate-500 font-medium'
                  }`}
              >
                Festivals
              </span>
            </button>

            {/* Users (Super Admin only) */}
            {isSuperAdmin && (
              <button
                onClick={() => handleModuleClick('USERS')}
                title="Users & Students Directory"
                className={`w-full flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer group ${selectedModule === 'USERS'
                    ? 'bg-rose-50 text-rose-500 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/80'
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${selectedModule === 'USERS'
                      ? 'bg-rose-500 text-white shadow-sm scale-105'
                      : 'text-slate-500 group-hover:text-slate-900'
                    }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] tracking-tight ${selectedModule === 'USERS' ? 'text-rose-600 font-extrabold' : 'text-slate-500 font-medium'
                    }`}
                >
                  Users
                </span>
              </button>
            )}

            {/* Website */}
            <button
              onClick={() => {
                setActiveTab('public_live');
                setIsOpenMobile(false);
              }}
              title="Go to Public Website"
              className="w-full flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer group text-slate-500 hover:text-slate-800 hover:bg-white/80"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-slate-500 group-hover:text-white group-hover:bg-rose-500 group-hover:shadow-sm group-hover:scale-105"
              >
                <Globe className="w-5 h-5" />
              </div>
              <span
                className="text-[10px] tracking-tight text-slate-500 font-medium group-hover:text-rose-600 group-hover:font-extrabold"
              >
                Website
              </span>
            </button>

            {/* Settings */}
            {isSuperAdmin && (
              <button
                onClick={() => handleModuleClick('SETTINGS')}
                title="System Settings & Points Configuration"
                className={`w-full flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer group ${selectedModule === 'SETTINGS'
                    ? 'bg-rose-50 text-rose-500 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/80'
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${selectedModule === 'SETTINGS'
                      ? 'bg-rose-500 text-white shadow-sm scale-105'
                      : 'text-slate-500 group-hover:text-slate-900'
                    }`}
                >
                  <Settings className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] tracking-tight ${selectedModule === 'SETTINGS' ? 'text-rose-600 font-extrabold' : 'text-slate-500 font-medium'
                    }`}
                >
                  Settings
                </span>
              </button>
            )}
          </div>

          {/* Bottom Rail Action: Collapse / Hide Sidebar */}
          {setIsSidebarHidden && (
            <div className="pt-2 w-full px-2 border-t border-slate-200/70 flex flex-col items-center">
              <button
                onClick={() => setIsSidebarHidden(true)}
                title="Hide sidebar (Expand main content)"
                className="w-full flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors">
                  <PanelLeftClose className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold text-slate-400 group-hover:text-rose-600">Hide</span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECONDARY SUB-NAVIGATION PANEL (ACTIVE MODULE TOOLS)        */}
        {/* ============================================================ */}
        <div className="w-64 bg-white flex flex-col justify-between overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3.5">
            {/* Top Search Navigation Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search navigation..."
                value={searchNavQuery}
                onChange={e => setSearchNavQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-full bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-400/10 transition-colors shadow-2xs"
              />
            </div>

            {/* ========================================= */}
            {/* MODULE 1: FESTIVALS SESSION               */}
            {/* ========================================= */}
            {selectedModule === 'FESTIVALS' && (
              <div className="space-y-1">
                <div className="px-3 pt-1 pb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isSuperAdmin ? 'Festival Command' : isTeamLeader ? 'House Festival' : 'Event Operations'}
                  </span>
                  <span
                    style={isTeamLeader ? { backgroundColor: `${teamColor}12`, color: teamColor, borderColor: `${teamColor}30` } : undefined}
                    className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200 font-bold"
                  >
                    Active
                  </span>
                </div>

                {isSuperAdmin && (
                  <>
                    {matchesSearch('Dashboard & Metrics') && (
                      <NavItem
                        icon={<LayoutDashboard className="w-[18px] h-[18px]" />}
                        label="Dashboard & Metrics"
                        active={activeTab === 'admin_dashboard'}
                        onClick={() => handleNavClick('admin_dashboard')}
                      />
                    )}
                    {matchesSearch('Programs (Arts & Sports)') && (
                      <NavItem
                        icon={<CalendarCheck className="w-[18px] h-[18px]" />}
                        label="Programs (Arts & Sports)"
                        count={programs.length}
                        active={activeTab === 'admin_programs'}
                        onClick={() => handleNavClick('admin_programs')}
                      />
                    )}
                    {matchesSearch('Registrations Master') && (
                      <NavItem
                        icon={<FileCheck2 className="w-[18px] h-[18px]" />}
                        label="Registrations Master"
                        count={registrations.length}
                        active={activeTab === 'admin_registrations'}
                        onClick={() => handleNavClick('admin_registrations')}
                      />
                    )}
                    {matchesSearch('Participation Rules') && (
                      <NavItem
                        icon={<Sliders className="w-[18px] h-[18px]" />}
                        label="Participation Rules"
                        active={activeTab === 'admin_rules'}
                        onClick={() => handleNavClick('admin_rules')}
                      />
                    )}
                    {matchesSearch('Result & Tie Approval') && (
                      <NavItem
                        icon={<Trophy className="w-[18px] h-[18px]" />}
                        label="Result & Tie Approval"
                        count={results.filter(r => r.status === 'SUBMITTED').length || undefined}
                        active={activeTab === 'admin_results'}
                        onClick={() => handleNavClick('admin_results')}
                      />
                    )}
                    {matchesSearch('Chest No. Generator') && (
                      <NavItem
                        icon={<Hash className="w-[18px] h-[18px]" />}
                        label="Chest No. Generator"
                        active={activeTab === 'admin_chest_numbers'}
                        onClick={() => handleNavClick('admin_chest_numbers')}
                      />
                    )}
                  </>
                )}

                {isTeamLeader && (
                  <>
                    {(matchesSearch(`TEAM ${myTeam?.name || 'SARAHA'}`) || matchesSearch('Team Dashboard')) && (
                      <NavItem
                        icon={<LayoutDashboard className="w-[18px] h-[18px]" />}
                        label={`TEAM ${myTeam?.name || 'SARAHA'}`}
                        active={activeTab === 'tl_my_team'}
                        activeColor={teamColor}
                        onClick={() => handleNavClick('tl_my_team')}
                      />
                    )}
                    {matchesSearch('Team Candidates & Points') && (
                      <NavItem
                        icon={<GraduationCap className="w-[18px] h-[18px]" />}
                        label="Team Candidates & Points"
                        count={myHouseStudents.length}
                        active={activeTab === 'tl_students'}
                        activeColor={teamColor}
                        onClick={() => handleNavClick('tl_students')}
                      />
                    )}
                    {matchesSearch('Register Individual') && (
                      <NavItem
                        icon={<UserPlus className="w-[18px] h-[18px]" />}
                        label="Register Individual"
                        active={activeTab === 'tl_reg_individual'}
                        activeColor={teamColor}
                        onClick={() => handleNavClick('tl_reg_individual')}
                      />
                    )}
                    {matchesSearch('Register Group') && (
                      <NavItem
                        icon={<Users className="w-[18px] h-[18px]" />}
                        label="Register Group"
                        active={activeTab === 'tl_reg_group'}
                        activeColor={teamColor}
                        onClick={() => handleNavClick('tl_reg_group')}
                      />
                    )}
                    {matchesSearch('Registration History') && (
                      <NavItem
                        icon={<ClipboardList className="w-[18px] h-[18px]" />}
                        label="Registration History"
                        active={activeTab === 'tl_history'}
                        activeColor={teamColor}
                        onClick={() => handleNavClick('tl_history')}
                      />
                    )}
                  </>
                )}

                {isController && (
                  <>
                    {matchesSearch('Control Room & Events') && (
                      <NavItem
                        icon={<CalendarCheck className="w-[18px] h-[18px]" />}
                        label="Control Room & Events"
                        count={activePrograms.length}
                        active={activeTab === 'ctrl_assigned'}
                        onClick={() => handleNavClick('ctrl_assigned')}
                      />
                    )}
                    {matchesSearch('Program Details') && (
                      <NavItem
                        icon={<FileSpreadsheet className="w-[18px] h-[18px]" />}
                        label="Program Details"
                        count={activePrograms.length}
                        active={activeTab === 'ctrl_programs'}
                        onClick={() => handleNavClick('ctrl_programs')}
                      />
                    )}
                    {matchesSearch('Candidate Registrations') && (
                      <NavItem
                        icon={<FileCheck2 className="w-[18px] h-[18px]" />}
                        label="Candidate Registrations"
                        count={activeRegistrations.length}
                        active={activeTab === 'ctrl_registrations'}
                        onClick={() => handleNavClick('ctrl_registrations')}
                      />
                    )}
                    {matchesSearch('Result Entry Matrix') && (
                      <NavItem
                        icon={<Trophy className="w-[18px] h-[18px]" />}
                        label="Result Entry Matrix"
                        active={activeTab === 'ctrl_result_entry'}
                        onClick={() => handleNavClick('ctrl_result_entry')}
                      />
                    )}
                    {matchesSearch('Candidate Details') && (
                      <NavItem
                        icon={<GraduationCap className="w-[18px] h-[18px]" />}
                        label="Candidate Details"
                        count={students.length}
                        active={activeTab === 'ctrl_candidates'}
                        onClick={() => handleNavClick('ctrl_candidates')}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* ========================================= */}
            {/* MODULE 2: USERS & HOUSES SESSION          */}
            {/* ========================================= */}
            {selectedModule === 'USERS' && (isSuperAdmin || isController) && (
              <div className="space-y-1">
                <div className="px-3 pt-1 pb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Candidates & Personnel
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                    Directory
                  </span>
                </div>

                {matchesSearch('Candidate Registrations') && (
                  <NavItem
                    icon={<FileCheck2 className="w-[18px] h-[18px]" />}
                    label="Candidate Registrations"
                    count={isController ? activeRegistrations.length : registrations.length}
                    active={activeTab === 'ctrl_registrations' || activeTab === 'admin_registrations'}
                    onClick={() => handleNavClick(isSuperAdmin ? 'admin_registrations' : 'ctrl_registrations')}
                  />
                )}

                {matchesSearch('Candidate Directory') && (
                  <NavItem
                    icon={<GraduationCap className="w-[18px] h-[18px]" />}
                    label="Candidate Directory"
                    count={students.length}
                    active={activeTab === 'admin_students' || activeTab === 'ctrl_candidates'}
                    onClick={() => handleNavClick(isSuperAdmin ? 'admin_students' : 'ctrl_candidates')}
                  />
                )}

                {isSuperAdmin && (
                  <>
                    {matchesSearch('Teams & Leaders') && (
                      <NavItem
                        icon={<Users2 className="w-[18px] h-[18px]" />}
                        label="Teams & Leaders"
                        count={teams.length}
                        active={activeTab === 'admin_teams'}
                        onClick={() => handleNavClick('admin_teams')}
                      />
                    )}

                    {matchesSearch('Categories & Class Map') && (
                      <NavItem
                        icon={<Layers className="w-[18px] h-[18px]" />}
                        label="Categories & Class Map"
                        active={activeTab === 'admin_categories_classes'}
                        onClick={() => handleNavClick('admin_categories_classes')}
                      />
                    )}

                    {matchesSearch('Participation Rules') && (
                      <NavItem
                        icon={<Sliders className="w-[18px] h-[18px]" />}
                        label="Participation Rules"
                        active={activeTab === 'admin_rules'}
                        onClick={() => handleNavClick('admin_rules')}
                      />
                    )}

                    {matchesSearch('User Accounts & Access') && (
                      <NavItem
                        icon={<UserCog className="w-[18px] h-[18px]" />}
                        label="User Accounts & Access"
                        count={allUsers.length}
                        active={activeTab === 'admin_users'}
                        onClick={() => handleNavClick('admin_users')}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* ========================================= */}
            {/* MODULE 3: WEBSITE & LIVE LEADERBOARDS     */}
            {/* ========================================= */}
            {selectedModule === 'WEBSITE' && (
              <div className="space-y-1">
                <div className="px-3 pt-1 pb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Website & Live Boards
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                    Public
                  </span>
                </div>

                {matchesSearch('Live Fest Results') && (
                  <NavItem
                    icon={<Radio className="w-[18px] h-[18px] text-rose-500" />}
                    label="Live Fest Results"
                    active={activeTab === 'public_live'}
                    onClick={() => handleNavClick('public_live')}
                  />
                )}

                {matchesSearch('Team Leaderboard') && (
                  <NavItem
                    icon={<Trophy className="w-[18px] h-[18px] text-amber-500" />}
                    label="Team Leaderboard"
                    active={activeTab === 'leaderboards'}
                    onClick={() => handleNavClick('leaderboards')}
                  />
                )}

                {settings.enableArtsSection !== false && matchesSearch('Arts Championship') && (
                  <NavItem
                    icon={<Award className="w-[18px] h-[18px] text-fuchsia-600" />}
                    label="Arts Championship"
                    active={activeTab === 'public_arts_board'}
                    onClick={() => handleNavClick('public_arts_board')}
                  />
                )}

                {settings.enableSportsSection !== false && matchesSearch('Sports Championship') && (
                  <NavItem
                    icon={<Flame className="w-[18px] h-[18px] text-sky-600" />}
                    label="Sports Championship"
                    active={activeTab === 'public_sports_board'}
                    onClick={() => handleNavClick('public_sports_board')}
                  />
                )}

                {matchesSearch('Participant Search') && (
                  <NavItem
                    icon={<Search className="w-[18px] h-[18px] text-indigo-600" />}
                    label="Participant Search"
                    active={activeTab === 'public_search'}
                    onClick={() => handleNavClick('public_search')}
                  />
                )}
              </div>
            )}

            {/* ========================================= */}
            {/* MODULE 4: SETTINGS SESSION                */}
            {/* ========================================= */}
            {selectedModule === 'SETTINGS' && (
              <div className="space-y-1">
                <div className="px-3 pt-1 pb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    System Configuration
                  </span>
                  <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-200 font-bold">
                    Settings
                  </span>
                </div>

                {matchesSearch('Fest Settings & Logs') && (
                  <NavItem
                    icon={<Settings className="w-[18px] h-[18px]" />}
                    label="Fest Settings & Logs"
                    active={activeTab === 'admin_settings'}
                    onClick={() => handleNavClick('admin_settings')}
                  />
                )}

                {matchesSearch('Points Configuration') && (
                  <NavItem
                    icon={<Sliders className="w-[18px] h-[18px]" />}
                    label="Points Configuration"
                    active={activeTab === 'admin_points_config'}
                    onClick={() => handleNavClick('admin_points_config')}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Fest Engine v2.6</span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, count, active, activeColor, onClick }) => {
  const dynamicActiveStyle = active && activeColor
    ? { backgroundColor: `${activeColor}12`, borderColor: `${activeColor}35`, color: activeColor }
    : undefined;

  return (
    <button
      onClick={onClick}
      style={dynamicActiveStyle}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[18px] text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer group ${active
          ? activeColor ? 'shadow-2xs font-bold border' : 'bg-rose-50/80 text-rose-500 border border-rose-200/70 shadow-2xs font-bold'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent font-medium'
        }`}
    >
      {/* Left Icon & Label */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          style={active && activeColor ? { color: activeColor } : undefined}
          className={`transition-colors shrink-0 ${active ? (activeColor ? '' : 'text-rose-500') : 'text-slate-400 group-hover:text-slate-600'
            }`}
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>

      {/* Right Indicator (Count badge & subtle icon) */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {count !== undefined && count > 0 && (
          <span
            style={active && activeColor ? { backgroundColor: activeColor, color: '#ffffff' } : undefined}
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${active
                ? activeColor ? '' : 'bg-rose-500 text-white'
                : 'bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}
          >
            {count}
          </span>
        )}
        <ArrowUpDown
          style={active && activeColor ? { color: activeColor } : undefined}
          className={`w-3.5 h-3.5 transition-colors ${active
              ? activeColor ? 'opacity-80' : 'text-rose-400'
              : 'text-slate-300 group-hover:text-slate-400 opacity-60'
            }`}
        />
      </div>
    </button>
  );
};
