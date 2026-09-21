import React, { useMemo, useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Trophy,
  Clock,
  ArrowUpRight,
  Flame,
  Award,
  Sparkles,
  Layers,
  Hash,
  Download,
  ShieldCheck,
  Crown,
  Activity,
  ChevronRight,
  Shield,
  Sliders,
  UserCheck,
  FileCheck2
} from 'lucide-react';

interface AdminDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const {
    students,
    teams,
    programs,
    registrations,
    results,
    teamLeaderboard,
    settings,
    auditLogs,
    exportDatabaseJSON
  } = useFestData();

  const [podiumView, setPodiumView] = useState<'BOTH' | 'ARTS' | 'SPORTS'>('BOTH');

  // Helper to get house code
  const getTeamCode = (teamId: string, fallbackName?: string) => {
    const t = teams.find(team => team.id === teamId || team.name?.toLowerCase() === fallbackName?.toLowerCase());
    return t?.code || fallbackName?.slice(0, 4).toUpperCase() || 'HOUSE';
  };

  // Strictly sorted lists for podiums
  const artsSortedTeams = useMemo(() => {
    return [...teamLeaderboard].sort((a, b) => {
      if (b.artsTotalPoints !== a.artsTotalPoints) return b.artsTotalPoints - a.artsTotalPoints;
      if (b.artsFirstCount !== a.artsFirstCount) return b.artsFirstCount - a.artsFirstCount;
      if (b.artsSecondCount !== a.artsSecondCount) return b.artsSecondCount - a.artsSecondCount;
      return b.artsThirdCount - a.artsThirdCount;
    });
  }, [teamLeaderboard]);

  const sportsSortedTeams = useMemo(() => {
    return [...teamLeaderboard].sort((a, b) => {
      if (b.sportsTotalPoints !== a.sportsTotalPoints) return b.sportsTotalPoints - a.sportsTotalPoints;
      if (b.sportsFirstCount !== a.sportsFirstCount) return b.sportsFirstCount - a.sportsFirstCount;
      if (b.sportsSecondCount !== a.sportsSecondCount) return b.sportsSecondCount - a.sportsSecondCount;
      return b.sportsThirdCount - a.sportsThirdCount;
    });
  }, [teamLeaderboard]);

  const artsPrograms = programs.filter(p => p.section === 'ARTS');
  const sportsPrograms = programs.filter(p => p.section === 'SPORTS');
  const publishedResults = results.filter(r => r.status === 'PUBLISHED');
  const pendingResults = programs.filter(p => p.resultStatus === 'PENDING' || p.resultStatus === 'DRAFT');

  const completionPercent = programs.length > 0
    ? Math.round((publishedResults.length / programs.length) * 100)
    : 0;

  const totalFestPoints = useMemo(() => {
    return teamLeaderboard.reduce((acc, curr) => acc + curr.artsTotalPoints + curr.sportsTotalPoints, 0);
  }, [teamLeaderboard]);

  const handleExportBackup = () => {
    const json = exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fest_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isArtsActive = settings.enableArtsSection !== false;
  const isSportsActive = settings.enableSportsSection !== false;

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* ============================================================ */}
      {/* 1. HERO COMMAND BANNER                                       */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-700/60">
        {/* Ambient Decorative Light Gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                Super Admin Center
              </span>

              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border backdrop-blur-md ${settings.registrationOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                <Activity className="w-3 h-3" />
                Registration {settings.registrationOpen ? 'OPEN' : 'CLOSED'}
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300/80 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {settings.festName || 'Fest 2026'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {getGreeting()}, {currentUser.name || 'Admin'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300/90 font-normal leading-relaxed">
              Live central controller station for event programs, scoring calculation engines, student credentials, and real-time house standings.
            </p>
          </div>

          {/* High-Impact Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('admin_results')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95 hover:shadow-rose-500/40"
            >
              <Trophy className="w-4 h-4" />
              <span>Publish Results</span>
            </button>

            <button
              onClick={() => setActiveTab('admin_students')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md active:scale-95"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>+ Enroll Candidate</span>
            </button>

            <button
              onClick={() => setActiveTab('admin_programs')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md active:scale-95"
            >
              <CalendarCheck className="w-4 h-4 text-sky-400" />
              <span>+ New Event</span>
            </button>

            <button
              onClick={handleExportBackup}
              title="Download full database JSON backup"
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md active:scale-95"
            >
              <Download className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">Backup DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. KPI METRICS BENTO GRID                                    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Programmes */}
        <div
          onClick={() => setActiveTab('admin_programs')}
          className="group relative overflow-hidden rounded-3xl bg-white p-4 sm:p-5 border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[142px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Events
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {programs.length}
            </p>
            <p className="text-xs text-indigo-600 font-semibold mt-0.5 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {pendingResults.length} pending results
            </p>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Programmes
          </p>
        </div>

        {/* Total Candidates */}
        <div
          onClick={() => setActiveTab('admin_students')}
          className="group relative overflow-hidden rounded-3xl bg-white p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[142px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Students
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {students.length}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {registrations.length} registrations
            </p>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Candidates
          </p>
        </div>

        {/* Houses / Teams */}
        <div
          onClick={() => setActiveTab('admin_teams')}
          className="group relative overflow-hidden rounded-3xl bg-white p-4 sm:p-5 border border-slate-200/90 hover:border-purple-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[142px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-100/80 text-purple-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              Houses
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {teams.length}
            </p>
            <p className="text-xs text-purple-600 font-semibold mt-0.5 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Active Squads
            </p>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Competing Teams
          </p>
        </div>

        {/* Arts Events */}
        {isArtsActive && (
          <div
            onClick={() => setActiveTab('admin_programs')}
            className="group relative overflow-hidden rounded-3xl bg-white p-4 sm:p-5 border border-slate-200/90 hover:border-fuchsia-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[142px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-fuchsia-50 border border-fuchsia-100/80 text-fuchsia-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700">
                Arts
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {artsPrograms.length}
              </p>
              <p className="text-xs text-fuchsia-600 font-semibold mt-0.5 truncate flex items-center gap-1">
                Stage & Non-Stage
              </p>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Arts Division
            </p>
          </div>
        )}

        {/* Sports Events */}
        {isSportsActive && (
          <div
            onClick={() => setActiveTab('admin_programs')}
            className="group relative overflow-hidden rounded-3xl bg-white p-4 sm:p-5 border border-slate-200/90 hover:border-sky-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[142px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-100/80 text-sky-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                Sports
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {sportsPrograms.length}
              </p>
              <p className="text-xs text-sky-600 font-semibold mt-0.5 truncate flex items-center gap-1">
                Athletics & Games
              </p>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sports Division
            </p>
          </div>
        )}

        {/* Results Completion */}
        <div
          onClick={() => setActiveTab('admin_results')}
          className="group relative overflow-hidden rounded-3xl bg-white p-4 sm:p-5 border border-rose-200 hover:border-rose-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[142px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100/80 text-rose-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {completionPercent}%
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {publishedResults.length}/{programs.length}
            </p>
            {/* Visual progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, completionPercent)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
            Results Published
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. DUAL CHAMPIONSHIP PODIUM SHOWCASE (ARTS & SPORTS)         */}
      {/* ============================================================ */}
      {(isArtsActive || isSportsActive) && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Championship Showcase
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Strictly separated rankings — Arts & Sports tallies operate on distinct official leaderboards.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
                <button
                  onClick={() => setPodiumView('BOTH')}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${podiumView === 'BOTH'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  Both Divisions
                </button>
                {isArtsActive && (
                  <button
                    onClick={() => setPodiumView('ARTS')}
                    className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${podiumView === 'ARTS'
                        ? 'bg-fuchsia-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Arts Only
                  </button>
                )}
                {isSportsActive && (
                  <button
                    onClick={() => setPodiumView('SPORTS')}
                    className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${podiumView === 'SPORTS'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Sports Only
                  </button>
                )}
              </div>

              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Isolated Standings
              </span>
            </div>
          </div>

          <div className={`grid gap-6 ${podiumView === 'BOTH' && isArtsActive && isSportsActive
              ? 'grid-cols-1 xl:grid-cols-2'
              : 'grid-cols-1'
            }`}>
            {/* ---------------------------------------------------- */}
            {/* ARTS FESTIVAL PODIUM CARD                            */}
            {/* ---------------------------------------------------- */}
            {(podiumView === 'BOTH' || podiumView === 'ARTS') && isArtsActive && (
              <div className="rounded-3xl bg-gradient-to-b from-white to-fuchsia-50/20 border border-fuchsia-100 p-5 sm:p-7 shadow-sm hover:shadow-md transition-all space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-fuchsia-100/70 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center font-bold shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        Arts Championship Podium
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Stage & Non-Stage Cumulative Standings</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('leaderboards')}
                    className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-800 flex items-center gap-1 cursor-pointer bg-fuchsia-50 hover:bg-fuchsia-100 px-3 py-1.5 rounded-xl transition-colors border border-fuchsia-200/60"
                  >
                    Leaderboard <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3-Column Podium Stand */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 items-end pt-3">
                  {/* Rank 2: Arts Runner-Up */}
                  <div className="order-1">
                    {artsSortedTeams[1] ? (
                      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all text-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center mx-auto border border-slate-300 shadow-inner">
                          2
                        </div>

                        {/* House Shield Emblem */}
                        <div className="flex justify-center">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                            style={{ backgroundColor: artsSortedTeams[1].teamColor }}
                          >
                            <Shield className="w-5 h-5 text-white/90" />
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block truncate">
                            RUNNER-UP
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                            {artsSortedTeams[1].teamName}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <p className="font-black text-base sm:text-lg text-fuchsia-600 font-mono">
                            {artsSortedTeams[1].artsTotalPoints} <span className="text-[10px]">pts</span>
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                            S: {artsSortedTeams[1].artsStagePoints} | NS: {artsSortedTeams[1].artsNonStagePoints}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                        No team
                      </div>
                    )}
                  </div>

                  {/* Rank 1: Arts Champion (Elevated Center) */}
                  <div className="order-2">
                    {artsSortedTeams[0] ? (
                      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-fuchsia-500/10 via-white to-white border-2 border-fuchsia-400 shadow-md shadow-fuchsia-200/50 hover:shadow-lg transition-all text-center space-y-2 relative -translate-y-2">
                        <div className="flex justify-center -mb-1">
                          <Crown className="w-6 h-6 text-amber-500 animate-bounce" />
                        </div>

                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center mx-auto shadow-md border-2 border-white">
                          1
                        </div>

                        {/* House Shield Emblem */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                              style={{
                                backgroundColor: artsSortedTeams[0].teamColor,
                                boxShadow: `0 8px 16px -4px ${artsSortedTeams[0].teamColor}50`
                              }}
                            >
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span
                              className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black text-white border border-white"
                              style={{ backgroundColor: artsSortedTeams[0].teamColor }}
                            >
                              {getTeamCode(artsSortedTeams[0].teamId, artsSortedTeams[0].teamName)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-700 block truncate">
                            ARTS CHAMPION
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-slate-950 truncate mt-0.5">
                            {artsSortedTeams[0].teamName}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-fuchsia-100">
                          <p className="font-black text-lg sm:text-2xl text-fuchsia-600 font-mono">
                            {artsSortedTeams[0].artsTotalPoints} <span className="text-xs">pts</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            Stage: {artsSortedTeams[0].artsStagePoints} • Non-Stage: {artsSortedTeams[0].artsNonStagePoints}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                        No team
                      </div>
                    )}
                  </div>

                  {/* Rank 3: Arts Third Place */}
                  <div className="order-3">
                    {artsSortedTeams[2] ? (
                      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all text-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 font-black text-xs flex items-center justify-center mx-auto border border-amber-300">
                          3
                        </div>

                        {/* House Shield Emblem */}
                        <div className="flex justify-center">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                            style={{ backgroundColor: artsSortedTeams[2].teamColor }}
                          >
                            <Shield className="w-5 h-5 text-white/90" />
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block truncate">
                            THIRD PLACE
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                            {artsSortedTeams[2].teamName}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <p className="font-black text-base sm:text-lg text-fuchsia-600 font-mono">
                            {artsSortedTeams[2].artsTotalPoints} <span className="text-[10px]">pts</span>
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                            S: {artsSortedTeams[2].artsStagePoints} | NS: {artsSortedTeams[2].artsNonStagePoints}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                        No team
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* SPORTS CHAMPIONSHIP PODIUM CARD                      */}
            {/* ---------------------------------------------------- */}
            {(podiumView === 'BOTH' || podiumView === 'SPORTS') && isSportsActive && (
              <div className="rounded-3xl bg-gradient-to-b from-white to-sky-50/20 border border-sky-100 p-5 sm:p-7 shadow-sm hover:shadow-md transition-all space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-sky-100/70 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shadow-xs">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        Sports Championship Podium
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Athletics, Track & Field Games Standings</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('leaderboards')}
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition-colors border border-sky-200/60"
                  >
                    Leaderboard <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3-Column Podium Stand */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 items-end pt-3">
                  {/* Rank 2: Sports Runner-Up */}
                  <div className="order-1">
                    {sportsSortedTeams[1] ? (
                      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all text-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center mx-auto border border-slate-300 shadow-inner">
                          2
                        </div>

                        {/* House Shield Emblem */}
                        <div className="flex justify-center">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                            style={{ backgroundColor: sportsSortedTeams[1].teamColor }}
                          >
                            <Shield className="w-5 h-5 text-white/90" />
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block truncate">
                            RUNNER-UP
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                            {sportsSortedTeams[1].teamName}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <p className="font-black text-base sm:text-lg text-sky-600 font-mono">
                            {sportsSortedTeams[1].sportsTotalPoints} <span className="text-[10px]">pts</span>
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                            Athletics Points
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                        No team
                      </div>
                    )}
                  </div>

                  {/* Rank 1: Sports Champion (Elevated Center) */}
                  <div className="order-2">
                    {sportsSortedTeams[0] ? (
                      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-sky-500/10 via-white to-white border-2 border-sky-400 shadow-md shadow-sky-200/50 hover:shadow-lg transition-all text-center space-y-2 relative -translate-y-2">
                        <div className="flex justify-center -mb-1">
                          <Crown className="w-6 h-6 text-amber-500 animate-bounce" />
                        </div>

                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center mx-auto shadow-md border-2 border-white">
                          1
                        </div>

                        {/* House Shield Emblem */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                              style={{
                                backgroundColor: sportsSortedTeams[0].teamColor,
                                boxShadow: `0 8px 16px -4px ${sportsSortedTeams[0].teamColor}50`
                              }}
                            >
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span
                              className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black text-white border border-white"
                              style={{ backgroundColor: sportsSortedTeams[0].teamColor }}
                            >
                              {getTeamCode(sportsSortedTeams[0].teamId, sportsSortedTeams[0].teamName)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block truncate">
                            SPORTS CHAMPION
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-slate-950 truncate mt-0.5">
                            {sportsSortedTeams[0].teamName}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-sky-100">
                          <p className="font-black text-lg sm:text-2xl text-sky-600 font-mono">
                            {sportsSortedTeams[0].sportsTotalPoints} <span className="text-xs">pts</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            Athletics & Track Cumulative
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                        No team
                      </div>
                    )}
                  </div>

                  {/* Rank 3: Sports Third Place */}
                  <div className="order-3">
                    {sportsSortedTeams[2] ? (
                      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all text-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 font-black text-xs flex items-center justify-center mx-auto border border-amber-300">
                          3
                        </div>

                        {/* House Shield Emblem */}
                        <div className="flex justify-center">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                            style={{ backgroundColor: sportsSortedTeams[2].teamColor }}
                          >
                            <Shield className="w-5 h-5 text-white/90" />
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block truncate">
                            THIRD PLACE
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                            {sportsSortedTeams[2].teamName}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <p className="font-black text-base sm:text-lg text-sky-600 font-mono">
                            {sportsSortedTeams[2].sportsTotalPoints} <span className="text-[10px]">pts</span>
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                            Athletics Points
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                        No team
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MAIN WORKSPACE: LIVE STANDINGS & QUICK OPERATIONS HUB      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live House Standings Table (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Live House Championship Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete breakdown of Arts, Sports, and medal distributions across all houses.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('leaderboards')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto border border-indigo-200/60"
              >
                Full Leaderboard <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-black uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 sm:px-4">Rank</th>
                    <th className="py-3 px-3 sm:px-4">House / Team</th>
                    {isArtsActive && (
                      <>
                        <th className="py-3 px-2 sm:px-3 text-center hidden sm:table-cell">Stage</th>
                        <th className="py-3 px-2 sm:px-3 text-center hidden sm:table-cell">Non-Stage</th>
                        <th className="py-3 px-3 sm:px-4 text-center font-bold text-fuchsia-700 bg-fuchsia-50/60">Arts Total</th>
                      </>
                    )}
                    {isSportsActive && (
                      <th className="py-3 px-3 sm:px-4 text-center font-bold text-sky-700 bg-sky-50/60">Sports Total</th>
                    )}
                    <th className="py-3 px-3 sm:px-4 text-right">Medals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {teamLeaderboard.map((team, index) => (
                    <tr key={team.teamId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 sm:px-4">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black text-xs ${index === 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                              : index === 1
                                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                : index === 2
                                  ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5 font-black text-slate-900 text-sm sm:text-base">
                          {/* House Shield Icon */}
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: team.teamColor }}
                          >
                            <Shield className="w-3.5 h-3.5 text-white/90" />
                          </div>
                          <div>
                            <span>{team.teamName}</span>
                            <span className="ml-2 text-[10px] font-mono font-bold text-slate-400 uppercase">
                              {getTeamCode(team.teamId, team.teamName)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {isArtsActive && (
                        <>
                          <td className="py-3.5 px-2 sm:px-3 text-center font-mono text-slate-600 text-xs hidden sm:table-cell">
                            {team.artsStagePoints}
                          </td>
                          <td className="py-3.5 px-2 sm:px-3 text-center font-mono text-slate-600 text-xs hidden sm:table-cell">
                            {team.artsNonStagePoints}
                          </td>
                          <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-black text-fuchsia-700 bg-fuchsia-50/40 text-sm">
                            {team.artsTotalPoints} <span className="text-[10px] font-sans font-bold">pts</span>
                          </td>
                        </>
                      )}

                      {isSportsActive && (
                        <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-black text-sky-700 bg-sky-50/40 text-sm">
                          {team.sportsTotalPoints} <span className="text-[10px] font-sans font-bold">pts</span>
                        </td>
                      )}

                      <td className="py-3.5 px-3 sm:px-4 text-right">
                        <div className="inline-flex items-center gap-1 font-mono text-xs font-bold">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80" title="Gold Medals">
                            🥇{team.firstCount}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80" title="Silver Medals">
                            🥈{team.secondCount}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 border border-orange-200/80" title="Bronze Medals">
                            🥉{team.thirdCount}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Arts & Sports scoring algorithms run on separate atomic pipelines.
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              Total Recorded Points: {totalFestPoints}
            </span>
          </div>
        </div>

        {/* Right Column: Quick Operations Hub & System Timeline */}
        <div className="space-y-6">
          {/* Quick Operations Launchpad */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Quick Operations
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Control Hub
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveTab('admin_categories_classes')}
                className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-purple-50/80 border border-slate-200/80 hover:border-purple-200 text-left transition-all group cursor-pointer active:scale-95 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <p className="text-xs font-black text-slate-900">Class Mappings</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Category Logic</p>
              </button>

              <button
                onClick={() => setActiveTab('admin_chest_numbers')}
                className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-200 text-left transition-all group cursor-pointer active:scale-95 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Hash className="w-4 h-4" />
                </div>
                <p className="text-xs font-black text-slate-900">Chest Numbers</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Auto Ranges</p>
              </button>

              <button
                onClick={() => setActiveTab('admin_points_config')}
                className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-200 text-left transition-all group cursor-pointer active:scale-95 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Sliders className="w-4 h-4" />
                </div>
                <p className="text-xs font-black text-slate-900">Points Rules</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Grade Scales</p>
              </button>

              <button
                onClick={() => setActiveTab('admin_users')}
                className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200 text-left transition-all group cursor-pointer active:scale-95 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <p className="text-xs font-black text-slate-900">User Access</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Roles & Pass</p>
              </button>

              <button
                onClick={() => setActiveTab('admin_registrations')}
                className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-rose-50/80 border border-slate-200/80 hover:border-rose-200 text-left transition-all group cursor-pointer active:scale-95 shadow-2xs col-span-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Registration Master</p>
                    <p className="text-[11px] text-slate-500">Inspect & verify all entries</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Recent System Activity Timeline */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <Clock className="w-4 h-4 text-slate-400" />
                Recent System Activity
              </h3>
              <button
                onClick={() => setActiveTab('admin_settings')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer hover:underline"
              >
                View Full Audit
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 5).map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/70 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-extrabold text-slate-800 capitalize">
                        {(log.action || '').toLowerCase().replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-slate-700 line-clamp-2 leading-relaxed font-normal">
                      {log.details}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-200/50 text-[10px] text-slate-400">
                      <span>Actor: <strong className="text-slate-600">{log.performedBy}</strong></span>
                      <span className="capitalize">{(log.entity || '').toLowerCase()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs italic">
                  No recent audit activities logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
