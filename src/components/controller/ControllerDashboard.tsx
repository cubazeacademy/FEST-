import React, { useState, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { SectionBadge, CategoryBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Program } from '../../types';
import {
  CalendarCheck,
  Clock,
  ArrowRight,
  Trophy,
  MapPin,
  Search,
  Layers,
  GraduationCap,
  Users,
  CheckCircle2,
  Filter,
  Award,
  Flame,
  Crown,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  Globe,
  FileSpreadsheet,
  FileCheck2,
  Info,
  ExternalLink,
  Tag,
  UserCheck,
  Shield,
  BarChart3
} from 'lucide-react';

interface ControllerDashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedProgramForEntry?: (progId: string) => void;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isHighlight?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtitle, icon, onClick, isHighlight }) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-[22px] bg-white border transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[128px] group ${
        isHighlight
          ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs group-hover:scale-105 transition-transform ${
            isHighlight
              ? 'bg-rose-100/80 border-rose-200 text-rose-600'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          {icon}
        </span>
      </div>

      <div className="my-1">
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {value}
        </p>
        <p className="text-xs text-slate-500 font-normal mt-0.5 truncate">
          {subtitle}
        </p>
      </div>

      <div className="pt-1">
        <p
          className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase truncate ${
            isHighlight ? 'text-rose-600/90' : 'text-slate-400'
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
};

export const ControllerDashboard: React.FC<ControllerDashboardProps> = ({
  setActiveTab,
  setSelectedProgramForEntry
}) => {
  const { currentUser } = useAuth();
  const {
    programs,
    results,
    students,
    registrations,
    teams,
    categoryConfigs,
    teamLeaderboard,
    settings
  } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;

  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'ARTS' | 'SPORTS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PUBLISHED'>('ALL');
  const [inspectingProgram, setInspectingProgram] = useState<Program | null>(null);

  // Standings Tab View: 'OVERALL' or 'CATEGORY_MATRIX'
  const [standingsTab, setStandingsTab] = useState<'OVERALL' | 'CATEGORY_MATRIX'>('OVERALL');
  const [categoryMatrixSection, setCategoryMatrixSection] = useState<'ALL' | 'ARTS' | 'SPORTS'>('ALL');

  const activeCategories = useMemo(() => {
    return categoryConfigs
      .filter(c => c.status !== 'INACTIVE')
      .map(c => c.category);
  }, [categoryConfigs]);

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

  const activePrograms = useMemo(() => {
    return programs.filter(p => {
      if (!isArtsEnabled && p.section === 'ARTS') return false;
      if (!isSportsEnabled && p.section === 'SPORTS') return false;
      return true;
    });
  }, [programs, isArtsEnabled, isSportsEnabled]);

  const artsPrograms = useMemo(() => activePrograms.filter(p => p.section === 'ARTS'), [activePrograms]);
  const sportsPrograms = useMemo(() => activePrograms.filter(p => p.section === 'SPORTS'), [activePrograms]);
  const publishedResults = useMemo(() => {
    return results.filter(r => {
      if (r.status !== 'PUBLISHED') return false;
      if (!isArtsEnabled && r.section === 'ARTS') return false;
      if (!isSportsEnabled && r.section === 'SPORTS') return false;
      return true;
    });
  }, [results, isArtsEnabled, isSportsEnabled]);
  const pendingResults = useMemo(() => activePrograms.filter(p => p.resultStatus === 'PENDING' || p.resultStatus === 'DRAFT'), [activePrograms]);

  const filteredPrograms = useMemo(() => {
    return activePrograms.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.stageLocation?.toLowerCase().includes(q);

      const matchSec = sectionFilter === 'ALL' || p.section === sectionFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && p.resultStatus === 'PUBLISHED') ||
        (statusFilter === 'PENDING' && p.resultStatus !== 'PUBLISHED');

      return matchQ && matchSec && matchStatus;
    });
  }, [activePrograms, searchQuery, sectionFilter, statusFilter]);

  const handleStartEntry = (progId: string) => {
    if (setSelectedProgramForEntry) {
      setSelectedProgramForEntry(progId);
    }
    setActiveTab('ctrl_result_entry');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-500">
              CONTROL ROOM • EVENT CONTROLLER
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {currentUser.name || 'Controller'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('ctrl_candidates')}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-sm font-semibold shadow-2xs transition-all flex items-center gap-2 cursor-pointer hover:border-slate-300"
          >
            <GraduationCap className="w-4 h-4 text-slate-600" />
            Candidate Details
          </button>

          <button
            onClick={() => setActiveTab('leaderboards')}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-sm font-semibold shadow-2xs transition-all flex items-center gap-2 cursor-pointer hover:border-slate-300"
          >
            <Trophy className="w-4 h-4 text-slate-600" />
            Full Leaderboard
          </button>

          <button
            onClick={() => setActiveTab('ctrl_result_entry')}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:shadow-md hover:scale-102"
          >
            <Trophy className="w-4 h-4" />
            Publish Results
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={`grid gap-3.5 sm:gap-4 ${
        isArtsEnabled && isSportsEnabled
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      }`}>
        <MetricCard
          label="PROGRAMMES"
          value={activePrograms.length}
          subtitle={`${pendingResults.length} pending`}
          icon={<Layers className="w-3.5 h-3.5" />}
          onClick={() => setActiveTab('ctrl_programs')}
          isHighlight={true}
        />
        <MetricCard
          label="CANDIDATES"
          value={students.length}
          subtitle={`${registrations.length} registered`}
          icon={<GraduationCap className="w-3.5 h-3.5" />}
          onClick={() => setActiveTab('ctrl_registrations')}
        />
        <MetricCard
          label="CATEGORIES"
          value={categoryConfigs.length || 4}
          subtitle={`${teams.length} teams`}
          icon={<Users className="w-3.5 h-3.5" />}
          onClick={() => setActiveTab('leaderboards')}
        />
        {isArtsEnabled && (
          <MetricCard
            label="ARTS EVENTS"
            value={artsPrograms.length}
            subtitle="Stage & Non-Stage"
            icon={<Award className="w-3.5 h-3.5" />}
            onClick={() => {
              setSectionFilter('ARTS');
            }}
          />
        )}
        {isSportsEnabled && (
          <MetricCard
            label="SPORTS EVENTS"
            value={sportsPrograms.length}
            subtitle="Athletics & Games"
            icon={<Flame className="w-3.5 h-3.5" />}
            onClick={() => {
              setSectionFilter('SPORTS');
            }}
          />
        )}
        <MetricCard
          label="PUBLISHED"
          value={`${publishedResults.length}/${activePrograms.length}`}
          subtitle={`${activePrograms.length > 0 ? Math.round((publishedResults.length / activePrograms.length) * 100) : 0}% done`}
          icon={<Trophy className="w-3.5 h-3.5" />}
          onClick={() => setActiveTab('ctrl_result_entry')}
        />
      </div>

      {/* DUAL CHAMPIONSHIP PODIUM ROW: ARTS & SPORTS */}
      {(isArtsEnabled || isSportsEnabled) && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isArtsEnabled && isSportsEnabled
                ? 'Arts and sports points are strictly separated in distinct standings.'
                : 'Championship standings for the active festival section.'}
            </p>
            <span className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5 font-bold self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> Strictly Separated Standings
            </span>
          </div>

          <div className={`grid grid-cols-1 ${isArtsEnabled && isSportsEnabled ? 'xl:grid-cols-2' : ''} gap-6`}>
            {/* CARD 1: ARTS FESTIVAL CHAMPIONSHIP */}
            {isArtsEnabled && (
              <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                      <Award className="w-4 h-4 text-rose-500" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        Arts Championship Podium
                      </h3>
                      <p className="text-xs text-slate-500">Stage & Non-Stage cumulative points</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    Arts Leaderboard
                  </span>
                </div>

                {/* Inner 3-Card Podium (Arts) */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 items-end pt-2">
                  {/* Arts Rank 2: Runner-Up (Left) */}
                  {artsSortedTeams[1] ? (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-xs text-center space-y-2 order-1 hover:shadow-md transition-all">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center mx-auto shadow-xs">
                        2
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          ARTS RUNNER-UP
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-center gap-1.5 mt-0.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0"
                            style={{ backgroundColor: artsSortedTeams[1].teamColor }}
                          />
                          <span className="truncate">{artsSortedTeams[1].teamName}</span>
                        </h4>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 font-mono">
                        <p className="font-bold text-sm sm:text-base text-slate-900">
                          {artsSortedTeams[1].artsTotalPoints} pts
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                          Stage: {artsSortedTeams[1].artsStagePoints} | Non-Stage: {artsSortedTeams[1].artsNonStagePoints}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      -
                    </div>
                  )}

                  {/* Arts Rank 1: Champion Leader (Center Elevated) */}
                  {artsSortedTeams[0] ? (
                    <div className="p-3.5 sm:p-4.5 rounded-2xl border-2 border-rose-300 bg-rose-50/25 shadow-md shadow-rose-100/50 text-center space-y-2 order-2 hover:shadow-lg transition-all relative -translate-y-1">
                      <div className="flex justify-center -mb-1">
                        <Crown className="w-5 h-5 sm:w-6 h-6 text-rose-500 animate-bounce" />
                      </div>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-rose-400 bg-white text-rose-600 font-black text-xs sm:text-sm flex items-center justify-center mx-auto shadow-xs">
                        1
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block truncate">
                          ARTS CHAMPION LEADER
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-950 flex items-center justify-center gap-1.5 mt-0.5 truncate">
                          <span
                            className="w-3 h-3 rounded-full shadow-xs shrink-0"
                            style={{ backgroundColor: artsSortedTeams[0].teamColor }}
                          />
                          <span className="truncate">{artsSortedTeams[0].teamName}</span>
                        </h4>
                      </div>
                      <div className="pt-2 border-t border-rose-200/60 font-mono">
                        <p className="font-black text-base sm:text-xl text-rose-600">
                          {artsSortedTeams[0].artsTotalPoints} pts
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                          Stage: {artsSortedTeams[0].artsStagePoints} • Non-Stage: {artsSortedTeams[0].artsNonStagePoints}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      -
                    </div>
                  )}

                  {/* Arts Rank 3: Third Place (Right) */}
                  {artsSortedTeams[2] ? (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-xs text-center space-y-2 order-3 hover:shadow-md transition-all">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center mx-auto shadow-xs">
                        3
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          ARTS THIRD PLACE
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-center gap-1.5 mt-0.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0"
                            style={{ backgroundColor: artsSortedTeams[2].teamColor }}
                          />
                          <span className="truncate">{artsSortedTeams[2].teamName}</span>
                        </h4>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 font-mono">
                        <p className="font-bold text-sm sm:text-base text-slate-900">
                          {artsSortedTeams[2].artsTotalPoints} pts
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                          Stage: {artsSortedTeams[2].artsStagePoints} | Non-Stage: {artsSortedTeams[2].artsNonStagePoints}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      -
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CARD 2: SPORTS MEET CHAMPIONSHIP */}
            {isSportsEnabled && (
              <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                      <Flame className="w-4 h-4 text-rose-500" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        Sports Championship Podium
                      </h3>
                      <p className="text-xs text-slate-500">Athletics & Games cumulative score</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    Sports Leaderboard
                  </span>
                </div>

                {/* Inner 3-Card Podium (Sports) */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 items-end pt-2">
                  {/* Sports Rank 2: Runner-Up (Left) */}
                  {sportsSortedTeams[1] ? (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-xs text-center space-y-2 order-1 hover:shadow-md transition-all">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center mx-auto shadow-xs">
                        2
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          SPORTS RUNNER-UP
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-center gap-1.5 mt-0.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0"
                            style={{ backgroundColor: sportsSortedTeams[1].teamColor }}
                          />
                          <span className="truncate">{sportsSortedTeams[1].teamName}</span>
                        </h4>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 font-mono">
                        <p className="font-bold text-sm sm:text-base text-slate-900">
                          {sportsSortedTeams[1].sportsTotalPoints} pts
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                          Athletics & Games Score
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      -
                    </div>
                  )}

                  {/* Sports Rank 1: Champion Leader (Center Elevated) */}
                  {sportsSortedTeams[0] ? (
                    <div className="p-3.5 sm:p-4.5 rounded-2xl border-2 border-rose-300 bg-rose-50/25 shadow-md shadow-rose-100/50 text-center space-y-2 order-2 hover:shadow-lg transition-all relative -translate-y-1">
                      <div className="flex justify-center -mb-1">
                        <Crown className="w-5 h-5 sm:w-6 h-6 text-rose-500 animate-bounce" />
                      </div>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-rose-400 bg-white text-rose-600 font-black text-xs sm:text-sm flex items-center justify-center mx-auto shadow-xs">
                        1
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block truncate">
                          SPORTS CHAMPION LEADER
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-950 flex items-center justify-center gap-1.5 mt-0.5 truncate">
                          <span
                            className="w-3 h-3 rounded-full shadow-xs shrink-0"
                            style={{ backgroundColor: sportsSortedTeams[0].teamColor }}
                          />
                          <span className="truncate">{sportsSortedTeams[0].teamName}</span>
                        </h4>
                      </div>
                      <div className="pt-2 border-t border-rose-200/60 font-mono">
                        <p className="font-black text-base sm:text-xl text-rose-600">
                          {sportsSortedTeams[0].sportsTotalPoints} pts
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                          Athletics & Games Score
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      -
                    </div>
                  )}

                  {/* Sports Rank 3: Third Place (Right) */}
                  {sportsSortedTeams[2] ? (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-xs text-center space-y-2 order-3 hover:shadow-md transition-all">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center mx-auto shadow-xs">
                        3
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          SPORTS THIRD PLACE
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-center gap-1.5 mt-0.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0"
                            style={{ backgroundColor: sportsSortedTeams[2].teamColor }}
                          />
                          <span className="truncate">{sportsSortedTeams[2].teamName}</span>
                        </h4>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 font-mono">
                        <p className="font-bold text-sm sm:text-base text-slate-900">
                          {sportsSortedTeams[2].sportsTotalPoints} pts
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                          Athletics & Games Score
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      -
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE HOUSE CHAMPIONSHIP BREAKDOWN & QUICK OPS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Championship Breakdown Table */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-rose-500" />
                Live House Championship Matrix
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {standingsTab === 'OVERALL'
                  ? (isArtsEnabled && isSportsEnabled
                      ? 'Strictly separate Arts (Stage + Non-Stage) & Sports points tally'
                      : 'Leaderboard breakdown for the active section')
                  : 'Live Category-based points breakdown across all competing houses'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Standings View Switcher */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setStandingsTab('OVERALL')}
                  className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    standingsTab === 'OVERALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Overall
                </button>
                <button
                  type="button"
                  onClick={() => setStandingsTab('CATEGORY_MATRIX')}
                  className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    standingsTab === 'CATEGORY_MATRIX'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Category Points</span>
                </button>
              </div>

              <button
                onClick={() => setActiveTab('leaderboards')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl transition-all border border-rose-200/60"
              >
                Full <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* VIEW 1: OVERALL STANDINGS TABLE */}
          {standingsTab === 'OVERALL' ? (
            <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-xl">Rank</th>
                    <th className="py-2.5 px-3">House / Team</th>
                    {isArtsEnabled && <th className="py-2.5 px-3 text-center">Arts (Stage)</th>}
                    {isArtsEnabled && <th className="py-2.5 px-3 text-center">Arts (Non-Stage)</th>}
                    {isArtsEnabled && <th className="py-2.5 px-3 text-center font-bold text-rose-600">Arts Total</th>}
                    {isSportsEnabled && <th className="py-2.5 px-3 text-center font-bold text-rose-600">Sports Total</th>}
                    <th className="py-2.5 px-3 text-center rounded-r-xl">Medal Tally</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(isArtsEnabled ? artsSortedTeams : sportsSortedTeams).map((team, idx) => (
                    <tr key={team.teamId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                            idx === 0
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          {/* House Shield Icon */}
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: team.teamColor }}
                          >
                            <Shield className="w-3 h-3 text-white/90" />
                          </div>
                          <div>
                            <span>{team.teamName}</span>
                            <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                              {getTeamCode(team.teamId, team.teamName)}
                            </span>
                          </div>
                        </div>
                      </td>
                      {isArtsEnabled && (
                        <td className="py-3 px-3 text-center font-mono text-slate-700 font-medium">
                          {team.artsStagePoints}
                        </td>
                      )}
                      {isArtsEnabled && (
                        <td className="py-3 px-3 text-center font-mono text-slate-700 font-medium">
                          {team.artsNonStagePoints}
                        </td>
                      )}
                      {isArtsEnabled && (
                        <td className="py-3 px-3 text-center font-mono font-black text-rose-600 text-sm">
                          {team.artsTotalPoints} pts
                        </td>
                      )}
                      {isSportsEnabled && (
                        <td className="py-3 px-3 text-center font-mono font-black text-rose-600 text-sm">
                          {team.sportsTotalPoints} pts
                        </td>
                      )}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          🥇{team.firstCount} 🥈{team.secondCount} 🥉{team.thirdCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW 2: CATEGORY-BASED TEAM POINTS MATRIX TABLE */
            <div className="space-y-3">
              {/* Category Sub-Filters */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">
                  Category Points Breakdown:
                </span>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setCategoryMatrixSection('ALL')}
                    className={`px-2.5 py-0.5 font-bold rounded-lg transition-all cursor-pointer ${
                      categoryMatrixSection === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Points
                  </button>
                  {isArtsEnabled && (
                    <button
                      type="button"
                      onClick={() => setCategoryMatrixSection('ARTS')}
                      className={`px-2.5 py-0.5 font-bold rounded-lg transition-all cursor-pointer ${
                        categoryMatrixSection === 'ARTS'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Arts Only
                    </button>
                  )}
                  {isSportsEnabled && (
                    <button
                      type="button"
                      onClick={() => setCategoryMatrixSection('SPORTS')}
                      className={`px-2.5 py-0.5 font-bold rounded-lg transition-all cursor-pointer ${
                        categoryMatrixSection === 'SPORTS'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Sports Only
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-xs uppercase tracking-wider">
                      <th className="py-2.5 px-3 rounded-l-xl">House / Team</th>
                      {activeCategories.map(cat => (
                        <th key={cat} className="py-2.5 px-3 text-center">
                          {cat}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center font-bold text-rose-600 rounded-r-xl">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamLeaderboard.map(team => {
                      let rowTotal = 0;

                      return (
                        <tr key={team.teamId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 font-bold text-slate-900">
                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                                style={{ backgroundColor: team.teamColor }}
                              >
                                <Shield className="w-3 h-3 text-white/90" />
                              </div>
                              <div>
                                <span>{team.teamName}</span>
                                <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                                  {getTeamCode(team.teamId, team.teamName)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {activeCategories.map(cat => {
                            const artsPts = team.categoryArtsPoints?.[cat] || 0;
                            const sportsPts = team.categorySportsPoints?.[cat] || 0;
                            const pts = categoryMatrixSection === 'ARTS'
                              ? artsPts
                              : categoryMatrixSection === 'SPORTS'
                              ? sportsPts
                              : artsPts + sportsPts;

                            rowTotal += pts;

                            // Find highest points in this category across teams
                            const isCategoryLeader = pts > 0 && !teamLeaderboard.some(otherTeam => {
                              if (otherTeam.teamId === team.teamId) return false;
                              const oArts = otherTeam.categoryArtsPoints?.[cat] || 0;
                              const oSports = otherTeam.categorySportsPoints?.[cat] || 0;
                              const oPts = categoryMatrixSection === 'ARTS'
                                ? oArts
                                : categoryMatrixSection === 'SPORTS'
                                ? oSports
                                : oArts + oSports;
                              return oPts > pts;
                            });

                            return (
                              <td key={cat} className="py-3 px-3 text-center font-mono text-xs font-bold">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                                    isCategoryLeader
                                      ? 'bg-amber-100 text-amber-900 font-black border border-amber-300'
                                      : pts > 0
                                      ? 'bg-slate-100 text-slate-800'
                                      : 'text-slate-400 font-normal'
                                  }`}
                                >
                                  {isCategoryLeader && <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />}
                                  {pts} <span className="text-[9px] font-sans font-normal opacity-70">pts</span>
                                </span>
                              </td>
                            );
                          })}

                          <td className="py-3 px-3 text-center font-mono font-black text-rose-600 text-sm">
                            {rowTotal} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Quick Operations Sidebar */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-rose-500" />
            Quick Operations
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setActiveTab('ctrl_programs')}
              className="p-3 rounded-2xl bg-slate-50/80 hover:bg-rose-50/60 border border-slate-200/90 hover:border-rose-200 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-600 group-hover:text-rose-600 mb-1 group-hover:scale-110 transition-all" />
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">Program Details</h4>
              <p className="text-[10px] text-slate-500 font-medium">{programs.length} events catalog</p>
            </button>

            <button
              onClick={() => setActiveTab('ctrl_registrations')}
              className="p-3 rounded-2xl bg-slate-50/80 hover:bg-rose-50/60 border border-slate-200/90 hover:border-rose-200 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <FileCheck2 className="w-4 h-4 text-slate-600 group-hover:text-rose-600 mb-1 group-hover:scale-110 transition-all" />
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">Candidate Regs</h4>
              <p className="text-[10px] text-slate-500 font-medium">{registrations.length} registered entries</p>
            </button>

            <button
              onClick={() => setActiveTab('ctrl_result_entry')}
              className="p-3 rounded-2xl bg-slate-50/80 hover:bg-rose-50/60 border border-slate-200/90 hover:border-rose-200 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <Trophy className="w-4 h-4 text-slate-600 group-hover:text-rose-600 mb-1 group-hover:scale-110 transition-all" />
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">Result Entry</h4>
              <p className="text-[10px] text-slate-500 font-medium">Scorecard matrix</p>
            </button>

            <button
              onClick={() => setActiveTab('ctrl_candidates')}
              className="p-3 rounded-2xl bg-slate-50/80 hover:bg-rose-50/60 border border-slate-200/90 hover:border-rose-200 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <GraduationCap className="w-4 h-4 text-slate-600 group-hover:text-rose-600 mb-1 group-hover:scale-110 transition-all" />
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">Candidate Details</h4>
              <p className="text-[10px] text-slate-500 font-medium">Chest # directory</p>
            </button>

            <button
              onClick={() => setActiveTab('leaderboards')}
              className="p-3 rounded-2xl bg-slate-50/80 hover:bg-rose-50/60 border border-slate-200/90 hover:border-rose-200 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <Layers className="w-4 h-4 text-slate-600 group-hover:text-rose-600 mb-1 group-hover:scale-110 transition-all" />
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">Category Tops</h4>
              <p className="text-[10px] text-slate-500 font-medium">Category leaderboards</p>
            </button>

            <button
              onClick={() => setActiveTab('public_live')}
              className="p-3 rounded-2xl bg-slate-50/80 hover:bg-rose-50/60 border border-slate-200/90 hover:border-rose-200 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <Globe className="w-4 h-4 text-slate-600 group-hover:text-rose-600 mb-1 group-hover:scale-110 transition-all" />
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">Live Feed</h4>
              <p className="text-[10px] text-slate-500 font-medium">Public scoreboard</p>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar for Program Events Matrix */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all events by title, code, venue..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-rose-400 cursor-pointer"
          >
            {isArtsEnabled && isSportsEnabled && <option value="ALL">All Sections</option>}
            {isArtsEnabled && <option value="ARTS">Arts Events</option>}
            {isSportsEnabled && <option value="SPORTS">Sports Events</option>}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-rose-400 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Evaluation</option>
            <option value="PUBLISHED">Published Results</option>
          </select>

          <button
            onClick={() => setActiveTab('ctrl_programs')}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Program Master</span>
          </button>
        </div>
      </div>

      {/* Events Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-rose-500" />
            Program Details & Event Matrix ({filteredPrograms.length})
          </h3>
          <button
            onClick={() => setActiveTab('ctrl_programs')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
          >
            Open Full Program Master <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPrograms.map(prog => {
            const res = results.find(r => r.programId === prog.id);
            const isCompleted = prog.resultStatus === 'PUBLISHED';
            const progRegs = registrations.filter(r => r.programId === prog.id);

            return (
              <div
                key={prog.id}
                className="p-5 rounded-[24px] bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                        {prog.code}
                      </span>
                      <SectionBadge section={prog.section} />
                      <CategoryBadge category={prog.category} />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isCompleted
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {prog.resultStatus}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-1">{prog.name}</h4>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      {prog.programType === 'GROUP' ? `Group (${prog.requiredMembersPerGroup || prog.maxParticipants || 1} members)` : 'Individual'}
                    </span>
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      {prog.subsection}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-medium">
                    {prog.rules || 'Standard judging rules apply.'}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3 font-medium">
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {prog.stageLocation || 'Venue TBD'}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {prog.scheduleTime || 'Schedule TBD'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {progRegs.length}
                    </span>
                    <button
                      onClick={() => setInspectingProgram(prog)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold hover:underline flex items-center gap-1 cursor-pointer py-1"
                    >
                      <Info className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>

                  <button
                    onClick={() => handleStartEntry(prog.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {res ? 'Edit Scores' : 'Enter Scores'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Program Details Modal */}
      {inspectingProgram && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingProgram(null)}
          title={`Program Details: ${inspectingProgram.name}`}
          subtitle={`Code: ${inspectingProgram.code} | Category: ${inspectingProgram.category}`}
          maxWidth="2xl"
        >
          <div className="p-6 space-y-6">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
                {inspectingProgram.code}
              </span>
              <SectionBadge section={inspectingProgram.section} />
              <CategoryBadge category={inspectingProgram.category} />
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                {inspectingProgram.subsection}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200">
                {inspectingProgram.programType}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ml-auto ${
                  inspectingProgram.resultStatus === 'PUBLISHED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {inspectingProgram.resultStatus}
              </span>
            </div>

            {/* Program Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Location & Stage
                </span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-600" />
                  {inspectingProgram.stageLocation || 'Venue Not Assigned'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Scheduled Time
                </span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                  <Clock className="w-4 h-4 text-slate-600" />
                  {inspectingProgram.scheduleTime || 'Schedule Not Assigned'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Participation Limits
                </span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-600" />
                  {inspectingProgram.programType === 'GROUP'
                    ? `Group: Max ${inspectingProgram.maxGroupsPerTeam || 1} team(s), ${inspectingProgram.requiredMembersPerGroup || inspectingProgram.maxParticipants || 1} members/team`
                    : `Individual: Max ${inspectingProgram.maxParticipants || 1} participant(s) per house`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registration Status
                </span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  {inspectingProgram.registrationOpen ? 'Registration Open' : 'Registration Closed'}
                </p>
              </div>
            </div>

            {/* Rules & Guidelines */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Judging Guidelines & Rules
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {inspectingProgram.rules || 'Standard festival scoring rules apply (First: 5pts, Second: 3pts, Third: 1pt).'}
              </p>
            </div>

            {/* Registered Candidates for this Program */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-rose-500" />
                  Registered Candidates / Teams ({registrations.filter(r => r.programId === inspectingProgram.id).length})
                </h4>
              </div>

              {registrations.filter(r => r.programId === inspectingProgram.id).length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No candidate registrations found for this program yet.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {registrations
                    .filter(r => r.programId === inspectingProgram.id)
                    .map((reg, rIdx) => {
                      const student = students.find(s => s.id === reg.studentId);
                      const team = teams.find(t => t.id === reg.teamId);

                      return (
                        <div key={reg.id || rIdx} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              #{reg.chestNumber || student?.chestNumber || 'N/A'}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">
                                {reg.groupName || student?.name || 'Registered Candidate'}
                              </p>
                              {student?.classNumber && (
                                <p className="text-[10px] text-slate-400">Class {student.classNumber}</p>
                              )}
                            </div>
                          </div>

                          {team && (
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: team.color }}
                              />
                              <span>{team.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => {
                  setInspectingProgram(null);
                  setActiveTab('ctrl_programs');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                Manage in Program Master
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setInspectingProgram(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const progId = inspectingProgram.id;
                    setInspectingProgram(null);
                    handleStartEntry(progId);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trophy className="w-4 h-4" />
                  Enter Scores
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
