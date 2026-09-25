import React, { useState, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  CategoryBadge,
  SectionBadge,
  PositionBadge,
  GradeBadge,
} from '../common/Badge';
import { Modal } from '../common/Modal';
import { FestCategory, Program, Registration, ResultEntry } from '../../types';
import {
  UserPlus,
  Users2,
  AlertCircle,
  Layers,
  GraduationCap,
  Trophy,
  Award,
  Crown,
  Search,
  CalendarCheck,
  Clock,
  MapPin,
  Flame,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Sparkles,
  ChevronRight,
  Shield,
  Activity,
  CheckCircle2,
  SlidersHorizontal,
  Download,
  Zap,
  Target
} from 'lucide-react';

interface TeamLeaderDashboardProps {
  setActiveTab: (tab: string) => void;
}

type DashboardSubView = 'CATEGORY_POINTS' | 'REGISTERED_PROGRAMS' | 'STUDENT_LIMITS';

export const TeamLeaderDashboard: React.FC<TeamLeaderDashboardProps> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const {
    teams,
    students,
    programs,
    registrations,
    results,
    categoryConfigs,
    teamLeaderboard,
    settings
  } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;

  // Active subview inside dashboard
  const [currentView, setCurrentView] = useState<DashboardSubView>('CATEGORY_POINTS');

  // Registered Programs filtering state
  const [programSearch, setProgramSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'ARTS' | 'SPORTS'>('ALL');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'STAGE' | 'NON_STAGE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'GROUP' | 'GENERAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'POINTS_SCORED' | 'PUBLISHED' | 'SCHEDULED'>('ALL');

  // Inspected Category Modal state
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<string | null>(null);

  // Resolve current leader's team reliably
  const myTeam = useMemo(() => {
    return (
      teams.find(
        t =>
          t.id === currentUser.teamId ||
          t.name.toLowerCase() === currentUser.teamId?.toLowerCase() ||
          t.code.toLowerCase() === currentUser.teamId?.toLowerCase() ||
          (currentUser.name && t.name.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) ||
          (currentUser.username &&
            (currentUser.username.toLowerCase().includes(t.code.toLowerCase()) ||
              currentUser.username.toLowerCase().includes(t.name.toLowerCase())))
      ) || teams[0]
    );
  }, [teams, currentUser]);

  // Team students
  const myStudents = useMemo(() => {
    if (!myTeam) return [];
    return students.filter(
      s =>
        s.teamId === myTeam.id ||
        s.teamId?.toLowerCase() === myTeam.name?.toLowerCase() ||
        s.teamId?.toLowerCase() === myTeam.code?.toLowerCase() ||
        (currentUser.teamId && s.teamId === currentUser.teamId)
    );
  }, [students, myTeam, currentUser]);

  // Team registrations
  const myRegistrations = useMemo(() => {
    if (!myTeam) return [];
    return registrations.filter(
      r =>
        r.teamId === myTeam.id ||
        r.teamId?.toLowerCase() === myTeam.name?.toLowerCase() ||
        r.teamId?.toLowerCase() === myTeam.code?.toLowerCase() ||
        r.teamName?.toLowerCase() === myTeam.name?.toLowerCase() ||
        (currentUser.teamId && r.teamId === currentUser.teamId)
    );
  }, [registrations, myTeam, currentUser]);

  const individualRegs = useMemo(
    () => myRegistrations.filter(r => r.programType === 'INDIVIDUAL'),
    [myRegistrations]
  );
  const groupRegs = useMemo(
    () => myRegistrations.filter(r => r.programType === 'GROUP' || r.programType === 'GENERAL'),
    [myRegistrations]
  );

  // Leaderboard entry for this team
  const myTeamScore = useMemo(() => {
    if (!myTeam) return null;
    return teamLeaderboard.find(t => t.teamId === myTeam.id) || null;
  }, [teamLeaderboard, myTeam]);

  // All published/submitted results where this team has an entry
  const myTeamResultEntries = useMemo(() => {
    if (!myTeam) return [];
    const entries: {
      result: typeof results[0];
      program: Program | undefined;
      entry: ResultEntry;
    }[] = [];

    results
      .filter(r => r.status === 'PUBLISHED' || r.status === 'SUBMITTED')
      .forEach(res => {
        const prog = programs.find(p => p.id === res.programId);
        res.entries.forEach(ent => {
          if (
            ent.teamId === myTeam.id ||
            ent.teamName?.toLowerCase() === myTeam.name?.toLowerCase() ||
            (currentUser.teamId && ent.teamId === currentUser.teamId)
          ) {
            entries.push({
              result: res,
              program: prog,
              entry: ent
            });
          }
        });
      });

    return entries;
  }, [results, programs, myTeam, currentUser]);

  // Build unique category list (merging categoryConfigs and any active categories in students/programs)
  const allCategories = useMemo(() => {
    const catMap = new Map<string, { id: string; category: string; displayName: string }>();

    categoryConfigs.forEach(c => {
      catMap.set(c.category.toUpperCase(), {
        id: c.id,
        category: c.category,
        displayName: c.displayName || c.category
      });
    });

    // Add any categories present in programs or students
    [...programs, ...myStudents].forEach(item => {
      if (item.category && !catMap.has(item.category.toUpperCase())) {
        catMap.set(item.category.toUpperCase(), {
          id: `cat_${item.category.toLowerCase()}`,
          category: item.category,
          displayName: item.category.replace(/_/g, ' ')
        });
      }
    });

    return Array.from(catMap.values());
  }, [categoryConfigs, programs, myStudents]);

  // Compute category-based stats for this team
  const categoryStats = useMemo(() => {
    return allCategories.map(cat => {
      const catKey = cat.category;

      // Filter entries for this category
      const catEntries = myTeamResultEntries.filter(e => {
        const pCat = e.program?.category || e.result.category;
        return pCat && pCat.toUpperCase() === catKey.toUpperCase();
      });

      let artsPoints = 0;
      let sportsPoints = 0;
      let stageArtsPoints = 0;
      let nonStageArtsPoints = 0;
      let firstCount = 0;
      let secondCount = 0;
      let thirdCount = 0;

      catEntries.forEach(({ program, entry }) => {
        const pts = entry.totalPoints || 0;
        const isArts = program ? program.section === 'ARTS' : true;
        const isSports = program ? program.section === 'SPORTS' : false;

        if (entry.position === 'FIRST') firstCount += 1;
        if (entry.position === 'SECOND') secondCount += 1;
        if (entry.position === 'THIRD') thirdCount += 1;

        if (isArts && isArtsEnabled) {
          artsPoints += pts;
          if (program?.subsection === 'STAGE') stageArtsPoints += pts;
          if (program?.subsection === 'NON_STAGE') nonStageArtsPoints += pts;
        } else if (isSports && isSportsEnabled) {
          sportsPoints += pts;
        }
      });

      // Also cross check with teamScore category points if available
      if (myTeamScore) {
        if (isArtsEnabled && myTeamScore.categoryArtsPoints && myTeamScore.categoryArtsPoints[catKey]) {
          artsPoints = Math.max(artsPoints, myTeamScore.categoryArtsPoints[catKey]);
        }
        if (isSportsEnabled && myTeamScore.categorySportsPoints && myTeamScore.categorySportsPoints[catKey]) {
          sportsPoints = Math.max(sportsPoints, myTeamScore.categorySportsPoints[catKey]);
        }
      }

      const totalPoints = artsPoints + sportsPoints;

      // Category registrations
      const catRegistrations = myRegistrations.filter(r => {
        return r.category && r.category.toUpperCase() === catKey.toUpperCase();
      });

      // Programs registered in this category
      const uniqueProgramIds = new Set(catRegistrations.map(r => r.programId));
      const registeredProgramsCount = uniqueProgramIds.size;

      // All programs available in this category
      const totalAvailablePrograms = programs.filter(
        p => p.category && p.category.toUpperCase() === catKey.toUpperCase()
      ).length;

      // Students in this category
      const catStudentsCount = myStudents.filter(
        s => s.category && s.category.toUpperCase() === catKey.toUpperCase()
      ).length;

      // Compute rank of this team in this category among all teams
      let catRank = 1;
      if (teamLeaderboard && teamLeaderboard.length > 0) {
        const teamScoresInCat = teamLeaderboard.map(t => {
          const aPts = (t.categoryArtsPoints && t.categoryArtsPoints[catKey]) || 0;
          const sPts = (t.categorySportsPoints && t.categorySportsPoints[catKey]) || 0;
          return { teamId: t.teamId, total: aPts + sPts };
        });
        teamScoresInCat.sort((a, b) => b.total - a.total);
        const myRankIndex = teamScoresInCat.findIndex(t => t.teamId === myTeam?.id);
        if (myRankIndex !== -1) {
          catRank = myRankIndex + 1;
        }
      }

      return {
        categoryKey: catKey,
        displayName: cat.displayName,
        totalPoints,
        artsPoints,
        sportsPoints,
        stageArtsPoints,
        nonStageArtsPoints,
        firstCount,
        secondCount,
        thirdCount,
        registeredProgramsCount,
        totalAvailablePrograms,
        catStudentsCount,
        catRank,
        entries: catEntries
      };
    });
  }, [allCategories, myTeamResultEntries, myTeamScore, myRegistrations, programs, myStudents, teamLeaderboard, myTeam, isArtsEnabled, isSportsEnabled]);

  // Overall totals across categories
  const categoryTotals = useMemo(() => {
    return categoryStats.reduce(
      (acc, curr) => ({
        totalPoints: acc.totalPoints + curr.totalPoints,
        artsPoints: acc.artsPoints + curr.artsPoints,
        sportsPoints: acc.sportsPoints + curr.sportsPoints,
        firstCount: acc.firstCount + curr.firstCount,
        secondCount: acc.secondCount + curr.secondCount,
        thirdCount: acc.thirdCount + curr.thirdCount,
        registeredProgramsCount: acc.registeredProgramsCount + curr.registeredProgramsCount
      }),
      {
        totalPoints: 0,
        artsPoints: 0,
        sportsPoints: 0,
        firstCount: 0,
        secondCount: 0,
        thirdCount: 0,
        registeredProgramsCount: 0
      }
    );
  }, [categoryStats]);

  // Aggregate Registered Programs List for this Team
  const registeredProgramsData = useMemo(() => {
    const progMap = new Map<
      string,
      {
        program: Program | undefined;
        programId: string;
        programName: string;
        programCode: string;
        category: FestCategory;
        section: string;
        subsection: string;
        programType: string;
        registrations: Registration[];
        resultEntries: ResultEntry[];
        resultStatus: string;
        pointsScored: number;
        bestPosition?: string;
        bestGrade?: string;
      }
    >();

    myRegistrations.forEach(reg => {
      const prog = programs.find(p => p.id === reg.programId);
      const progId = reg.programId;

      // If program section is disabled, skip
      if (!isArtsEnabled && (prog?.section === 'ARTS' || reg.section === 'ARTS')) return;
      if (!isSportsEnabled && (prog?.section === 'SPORTS' || reg.section === 'SPORTS')) return;

      if (!progMap.has(progId)) {
        const progResult = results.find(
          r => r.programId === progId && (r.status === 'PUBLISHED' || r.status === 'SUBMITTED')
        );
        const myEntries = progResult
          ? progResult.entries.filter(
              e =>
                e.teamId === myTeam?.id ||
                e.teamName?.toLowerCase() === myTeam?.name?.toLowerCase() ||
                (currentUser.teamId && e.teamId === currentUser.teamId)
            )
          : [];

        const points = myEntries.reduce((sum, e) => sum + (e.totalPoints || 0), 0);
        const bestPos = myEntries.find(e => e.position === 'FIRST')
          ? 'FIRST'
          : myEntries.find(e => e.position === 'SECOND')
          ? 'SECOND'
          : myEntries.find(e => e.position === 'THIRD')
          ? 'THIRD'
          : myEntries[0]?.position;

        const bestGrd = myEntries.find(e => e.grade === 'A')
          ? 'A'
          : myEntries.find(e => e.grade === 'B')
          ? 'B'
          : myEntries.find(e => e.grade === 'C')
          ? 'C'
          : myEntries[0]?.grade;

        progMap.set(progId, {
          program: prog,
          programId: progId,
          programName: prog?.name || reg.programName || 'Unknown Program',
          programCode: prog?.code || 'PRG',
          category: prog?.category || reg.category,
          section: prog?.section || reg.section,
          subsection: prog?.subsection || reg.subsection,
          programType: prog?.programType || reg.programType,
          registrations: [reg],
          resultEntries: myEntries,
          resultStatus: prog?.resultStatus || (progResult ? progResult.status : 'PENDING'),
          pointsScored: points,
          bestPosition: bestPos,
          bestGrade: bestGrd
        });
      } else {
        const item = progMap.get(progId)!;
        item.registrations.push(reg);
      }
    });

    return Array.from(progMap.values());
  }, [myRegistrations, programs, results, myTeam, currentUser, isArtsEnabled, isSportsEnabled]);

  // Filtered registered programs
  const filteredRegisteredPrograms = useMemo(() => {
    return registeredProgramsData.filter(item => {
      if (programSearch.trim()) {
        const q = programSearch.toLowerCase();
        const matchesName = item.programName.toLowerCase().includes(q);
        const matchesCode = item.programCode.toLowerCase().includes(q);
        const matchesCategory = String(item.category || '').toLowerCase().includes(q);
        const matchesCandidate = item.registrations.some(
          r =>
            r.studentName?.toLowerCase().includes(q) ||
            r.groupName?.toLowerCase().includes(q) ||
            r.chestNumber?.toString().includes(q)
        );
        if (!matchesName && !matchesCode && !matchesCategory && !matchesCandidate) {
          return false;
        }
      }

      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      if (sectionFilter !== 'ALL' && item.section !== sectionFilter) {
        return false;
      }

      if (stageFilter !== 'ALL' && item.subsection !== stageFilter) {
        return false;
      }

      if (typeFilter !== 'ALL' && item.programType !== typeFilter) {
        return false;
      }

      if (statusFilter === 'POINTS_SCORED' && item.pointsScored <= 0) {
        return false;
      }
      if (statusFilter === 'PUBLISHED' && item.resultStatus !== 'PUBLISHED') {
        return false;
      }
      if (statusFilter === 'SCHEDULED' && item.resultStatus === 'PUBLISHED') {
        return false;
      }

      return true;
    });
  }, [registeredProgramsData, programSearch, categoryFilter, sectionFilter, stageFilter, typeFilter, statusFilter]);

  // Active Category modal data
  const inspectedCategoryData = useMemo(() => {
    if (!selectedCategoryModal) return null;
    return categoryStats.find(c => c.categoryKey === selectedCategoryModal) || null;
  }, [selectedCategoryModal, categoryStats]);

  const teamColor = myTeam?.color || '#3b82f6';

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HERO HOUSE COMMAND STATION (MODERN GLASSMORPHISM & DYNAMIC COLORING)   */}
      {/* ========================================================================= */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-slate-900 border border-slate-200/80 shadow-xl transition-all"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${teamColor}1a 0%, transparent 60%), radial-gradient(circle at 0% 100%, ${teamColor}0d 0%, transparent 50%), linear-gradient(135deg, #ffffff 40%, #f8fafc 100%)`
        }}
      >
        {/* Subtle decorative glowing mesh */}
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: teamColor }}
        />
        <div
          className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: teamColor }}
        />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left: House Identity, Leader details & Rank Badges */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            {/* 3D Glossy House Emblem */}
            <div className="relative shrink-0 group">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: teamColor,
                  boxShadow: `0 12px 28px -6px ${teamColor}50, inset 0 2px 4px rgba(255,255,255,0.4)`
                }}
              >
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white/90" />
              </div>
              <span
                className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black font-mono tracking-wider text-white shadow-md border border-white"
                style={{ backgroundColor: teamColor }}
              >
                {myTeam?.code || 'HOUSE'}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-white shadow-sm">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  TEAM {myTeam?.name ? myTeam.name.toUpperCase() : 'SARAHA'} Command Center
                </span>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Leader: <strong className="text-slate-900">{currentUser.name}</strong>
                </span>

                {myTeamScore && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isArtsEnabled && (
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1"
                        style={{ backgroundColor: `${teamColor}10`, color: teamColor, borderColor: `${teamColor}30` }}
                      >
                        <Trophy className="w-3 h-3" />
                        Arts Rank #{myTeamScore.artsRank || 1}
                      </span>
                    )}
                    {isSportsEnabled && (
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1"
                        style={{ backgroundColor: `${teamColor}10`, color: teamColor, borderColor: `${teamColor}30` }}
                      >
                        <Flame className="w-3 h-3" />
                        Sports Rank #{myTeamScore.sportsRank || 1}
                      </span>
                    )}
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1"
                      style={{ backgroundColor: `${teamColor}15`, color: teamColor, borderColor: `${teamColor}35` }}
                    >
                      <Crown className="w-3 h-3" />
                      Overall #{myTeamScore.rank || 1}
                    </span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span>TEAM {myTeam?.name ? myTeam.name.toUpperCase() : 'SARAHA'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium flex items-center gap-2">
                <span className="italic text-slate-500">"{myTeam?.motto || 'Rising Fierce from the Ashes'}"</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{myStudents.length} Assigned Candidates</span>
              </p>
            </div>
          </div>

          {/* Right: Modern Floating Actions (Single Team Color Theme) */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('tl_students')}
              className="px-4 sm:px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <GraduationCap className="w-4 h-4" style={{ color: teamColor }} />
              <span>Roster & Points</span>
            </button>

            <button
              onClick={() => setActiveTab('tl_reg_individual')}
              disabled={!settings.registrationOpen}
              className="px-4 sm:px-5 py-2.5 rounded-2xl disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              style={{
                backgroundColor: teamColor,
                boxShadow: `0 8px 20px -4px ${teamColor}50`
              }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Individual</span>
            </button>

            <button
              onClick={() => setActiveTab('tl_reg_group')}
              disabled={!settings.registrationOpen}
              className="px-4 sm:px-5 py-2.5 rounded-2xl disabled:opacity-50 border text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              style={{
                backgroundColor: `${teamColor}12`,
                borderColor: `${teamColor}40`,
                color: teamColor
              }}
            >
              <Users2 className="w-4 h-4" />
              <span>Register Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BENTO-STYLE KPI METRIC CARDS (DYNAMIC TEAM COLOR THEME)               */}
      {/* ========================================================================= */}
      <div className={`grid gap-4 sm:gap-5 ${
        isArtsEnabled && isSportsEnabled
          ? 'grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 sm:grid-cols-3'
      }`}>
        {/* Card 1: Registered Programs */}
        <div
          onClick={() => setCurrentView('REGISTERED_PROGRAMS')}
          className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer group ${
            currentView === 'REGISTERED_PROGRAMS'
              ? 'shadow-lg ring-2'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md'
          }`}
          style={
            currentView === 'REGISTERED_PROGRAMS'
              ? {
                  backgroundColor: `${teamColor}08`,
                  borderColor: teamColor,
                  // @ts-ignore
                  '--tw-ring-color': `${teamColor}30`
                }
              : {}
          }
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${teamColor}15`, color: teamColor }}
              >
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Registered Programs</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <p className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight mt-1">
            {registeredProgramsData.length}
          </p>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-2 bg-slate-100/70 py-1.5 px-3 rounded-xl w-fit">
            <span className="font-bold" style={{ color: teamColor }}>{individualRegs.length} Indiv</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-700">{groupRegs.length} Group</span>
          </div>
        </div>

        {/* Card 2: Arts Category Points (if enabled) */}
        {isArtsEnabled && (
          <div
            onClick={() => setCurrentView('CATEGORY_POINTS')}
            className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer group ${
              currentView === 'CATEGORY_POINTS'
                ? 'shadow-lg ring-2'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md'
            }`}
            style={
              currentView === 'CATEGORY_POINTS'
                ? {
                    backgroundColor: `${teamColor}08`,
                    borderColor: teamColor,
                    // @ts-ignore
                    '--tw-ring-color': `${teamColor}30`
                  }
                : {}
            }
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${teamColor}15`, color: teamColor }}
                >
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Arts Points</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight mt-1" style={{ color: teamColor }}>
              {myTeamScore?.artsTotalPoints ?? categoryTotals.artsPoints}
              <span className="text-sm font-semibold text-slate-500 ml-1">pts</span>
            </p>

            <div
              className="flex items-center gap-1.5 text-xs font-semibold mt-2 py-1.5 px-3 rounded-xl w-fit border"
              style={{ backgroundColor: `${teamColor}0a`, borderColor: `${teamColor}20`, color: '#334155' }}
            >
              <span>Stage: <strong style={{ color: teamColor }}>{myTeamScore?.artsStagePoints ?? 0}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Non-Stage: <strong style={{ color: teamColor }}>{myTeamScore?.artsNonStagePoints ?? 0}</strong></span>
            </div>
          </div>
        )}

        {/* Card 3: Sports Category Points (if enabled) */}
        {isSportsEnabled && (
          <div
            onClick={() => setCurrentView('CATEGORY_POINTS')}
            className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer group ${
              currentView === 'CATEGORY_POINTS'
                ? 'shadow-lg ring-2'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md'
            }`}
            style={
              currentView === 'CATEGORY_POINTS'
                ? {
                    backgroundColor: `${teamColor}08`,
                    borderColor: teamColor,
                    // @ts-ignore
                    '--tw-ring-color': `${teamColor}30`
                  }
                : {}
            }
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${teamColor}15`, color: teamColor }}
                >
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Sports Points</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight mt-1" style={{ color: teamColor }}>
              {myTeamScore?.sportsTotalPoints ?? categoryTotals.sportsPoints}
              <span className="text-sm font-semibold text-slate-500 ml-1">pts</span>
            </p>

            <div
              className="flex items-center gap-1.5 text-xs font-semibold mt-2 py-1.5 px-3 rounded-xl w-fit border"
              style={{ backgroundColor: `${teamColor}0a`, borderColor: `${teamColor}20`, color: '#334155' }}
            >
              <span>Athletics & Track events</span>
            </div>
          </div>
        )}

        {/* Card 4: Medals & Podiums */}
        <div
          onClick={() => setCurrentView('CATEGORY_POINTS')}
          className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${teamColor}15`, color: teamColor }}
              >
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Podium Medals</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
              {(myTeamScore?.firstCount || categoryTotals.firstCount) +
                (myTeamScore?.secondCount || categoryTotals.secondCount) +
                (myTeamScore?.thirdCount || categoryTotals.thirdCount)}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Podiums</span>
          </div>

          <div className="flex items-center gap-2 text-xs mt-2 font-mono font-bold">
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
              🥇 {myTeamScore?.firstCount || categoryTotals.firstCount}
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
              🥈 {myTeamScore?.secondCount || categoryTotals.secondCount}
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
              🥉 {myTeamScore?.thirdCount || categoryTotals.thirdCount}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEGMENTED VIEW CONTROLLER                                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setCurrentView('CATEGORY_POINTS')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              currentView === 'CATEGORY_POINTS'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" style={{ color: currentView === 'CATEGORY_POINTS' ? teamColor : undefined }} />
            <span>Category Points Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('REGISTERED_PROGRAMS')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              currentView === 'REGISTERED_PROGRAMS'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" style={{ color: currentView === 'REGISTERED_PROGRAMS' ? teamColor : undefined }} />
            <span>Registered Programs</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-mono font-bold border"
              style={{
                backgroundColor: `${teamColor}12`,
                color: teamColor,
                borderColor: `${teamColor}30`
              }}
            >
              {registeredProgramsData.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentView('STUDENT_LIMITS')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              currentView === 'STUDENT_LIMITS'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" style={{ color: currentView === 'STUDENT_LIMITS' ? teamColor : undefined }} />
            <span>Student Quotas</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 pb-1 sm:pb-0 text-xs text-slate-500 font-medium">
          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: teamColor }} />
          <span>Live data synced for {myTeam?.name}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: CATEGORY POINTS DASHBOARD                                         */}
      {/* ========================================================================= */}
      {currentView === 'CATEGORY_POINTS' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                <Trophy className="w-5 h-5" style={{ color: teamColor }} />
                <span>Team Category Points Matrix</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                Detailed points breakdown, medal counts, and standings across every category for {myTeam?.name}.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('tl_students')}
              className="text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto group"
              style={{ color: teamColor }}
            >
              <span>View Individual Candidate Scorecards</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {categoryStats.map(cat => {
              const maxPointsInList = Math.max(...categoryStats.map(c => c.totalPoints), 1);
              const progressPercent = Math.min(100, Math.round((cat.totalPoints / maxPointsInList) * 100));

              return (
                <div
                  key={cat.categoryKey}
                  className="rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-5 group"
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CategoryBadge category={cat.categoryKey} />
                        <h3 className="text-lg font-black text-slate-900 mt-2">
                          {cat.displayName}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {cat.catStudentsCount} Students Enrolled • {cat.registeredProgramsCount} Events Slotted
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className="px-3 py-1.5 rounded-2xl border text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                          style={{
                            backgroundColor: `${teamColor}10`,
                            borderColor: `${teamColor}30`,
                            color: teamColor
                          }}
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>Rank #{cat.catRank}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Points Display */}
                    <div className="mt-5 p-4 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Category Score</p>
                        <p className="text-3xl font-black font-mono mt-0.5" style={{ color: teamColor }}>
                          {cat.totalPoints}{' '}
                          <span className="text-xs font-bold text-slate-500 uppercase">Pts</span>
                        </p>
                      </div>

                      {/* Medals Pips */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col items-center bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-xs">🥇</span>
                          <span className="text-xs font-mono font-bold text-slate-800">{cat.firstCount}</span>
                        </div>
                        <div className="flex flex-col items-center bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-xs">🥈</span>
                          <span className="text-xs font-mono font-bold text-slate-800">{cat.secondCount}</span>
                        </div>
                        <div className="flex flex-col items-center bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-xs">🥉</span>
                          <span className="text-xs font-mono font-bold text-slate-800">{cat.thirdCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Arts vs Sports Split */}
                    {(isArtsEnabled || isSportsEnabled) && (
                      <div className={`grid gap-2.5 mt-3.5 ${
                        isArtsEnabled && isSportsEnabled ? 'grid-cols-2' : 'grid-cols-1'
                      }`}>
                        {isArtsEnabled && (
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-1">
                              <span>🎭 Arts</span>
                              <span className="font-mono font-bold" style={{ color: teamColor }}>{cat.artsPoints} pts</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Stage: {cat.stageArtsPoints} | Non-Stage: {cat.nonStageArtsPoints}
                            </p>
                          </div>
                        )}

                        {isSportsEnabled && (
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-1">
                              <span>🏃 Sports</span>
                              <span className="font-mono font-bold" style={{ color: teamColor }}>{cat.sportsPoints} pts</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Track & Athletic meets
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Relative Contribution Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                        <span>Relative Points Share</span>
                        <span className="font-mono font-bold text-slate-700">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: teamColor
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCategoryModal(cat.categoryKey)}
                      className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      style={{ color: teamColor }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Inspect Winning Events ({cat.entries.length})</span>
                    </button>
                    <button
                      onClick={() => {
                        setCategoryFilter(cat.categoryKey);
                        setCurrentView('REGISTERED_PROGRAMS');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Filter Programs →</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category Points Summary Table */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: teamColor }} />
                  Category Breakdown Summary Table
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Consolidated tally per section and medal distribution for {myTeam?.name}.
                </p>
              </div>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor: `${teamColor}12`,
                  color: teamColor,
                  borderColor: `${teamColor}30`
                }}
              >
                {categoryStats.length} Active Categories
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-4">House Rank</th>
                    {isArtsEnabled && <th className="py-3.5 px-4">Arts (Stage)</th>}
                    {isArtsEnabled && <th className="py-3.5 px-4">Arts (Non-Stage)</th>}
                    {isArtsEnabled && <th className="py-3.5 px-4">Arts Total</th>}
                    {isSportsEnabled && <th className="py-3.5 px-4">Sports Total</th>}
                    <th className="py-3.5 px-4">Medals (1st/2nd/3rd)</th>
                    <th className="py-3.5 px-5 text-right">Cumulative Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {categoryStats.map(cat => (
                    <tr key={cat.categoryKey} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <CategoryBadge category={cat.categoryKey} />
                          <span className="font-bold text-slate-900">{cat.displayName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold font-mono">
                          #{cat.catRank}
                        </span>
                      </td>
                      {isArtsEnabled && (
                        <td className="py-4 px-4 font-mono text-slate-600">
                          {cat.stageArtsPoints} pts
                        </td>
                      )}
                      {isArtsEnabled && (
                        <td className="py-4 px-4 font-mono text-slate-600">
                          {cat.nonStageArtsPoints} pts
                        </td>
                      )}
                      {isArtsEnabled && (
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                          {cat.artsPoints} pts
                        </td>
                      )}
                      {isSportsEnabled && (
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                          {cat.sportsPoints} pts
                        </td>
                      )}
                      <td className="py-4 px-4 font-mono text-xs text-slate-700">
                        <span className="font-bold">{cat.firstCount}🥇</span>{' '}
                        <span className="font-bold">{cat.secondCount}🥈</span>{' '}
                        <span className="font-bold">{cat.thirdCount}🥉</span>
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-black text-base" style={{ color: teamColor }}>
                        {cat.totalPoints} Pts
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-slate-50/90 font-black border-t-2 border-slate-200 text-slate-900">
                    <td className="py-4 px-5 uppercase tracking-wider text-xs">Total Across All Categories</td>
                    <td className="py-4 px-4">-</td>
                    {isArtsEnabled && (
                      <td className="py-4 px-4 font-mono">
                        {categoryStats.reduce((s, c) => s + c.stageArtsPoints, 0)} pts
                      </td>
                    )}
                    {isArtsEnabled && (
                      <td className="py-4 px-4 font-mono">
                        {categoryStats.reduce((s, c) => s + c.nonStageArtsPoints, 0)} pts
                      </td>
                    )}
                    {isArtsEnabled && (
                      <td className="py-4 px-4 font-mono text-slate-900">
                        {categoryTotals.artsPoints} pts
                      </td>
                    )}
                    {isSportsEnabled && (
                      <td className="py-4 px-4 font-mono text-slate-900">
                        {categoryTotals.sportsPoints} pts
                      </td>
                    )}
                    <td className="py-4 px-4 font-mono text-xs">
                      <span>{categoryTotals.firstCount}🥇</span>{' '}
                      <span>{categoryTotals.secondCount}🥈</span>{' '}
                      <span>{categoryTotals.thirdCount}🥉</span>
                    </td>
                    <td className="py-4 px-5 text-right font-mono text-lg" style={{ color: teamColor }}>
                      {categoryTotals.totalPoints} Pts
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: REGISTERED PROGRAMS DIRECTORY                                     */}
      {/* ========================================================================= */}
      {currentView === 'REGISTERED_PROGRAMS' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                <CalendarCheck className="w-5 h-5" style={{ color: teamColor }} />
                <span>Team Registered Programs Directory</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                Comprehensive tracking of all events registered by {myTeam?.name}, assigned candidates, schedules, and live scored results.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveTab('tl_reg_individual')}
                disabled={!settings.registrationOpen}
                className="px-4 py-2 rounded-2xl disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                style={{ backgroundColor: teamColor }}
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Register More</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards for Programs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <p className="text-xs uppercase font-extrabold text-slate-400">Total Registered</p>
              <p className="text-2xl sm:text-3xl font-black font-mono mt-1" style={{ color: teamColor }}>
                {registeredProgramsData.length}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Distinct events slotted</p>
            </div>

            {isArtsEnabled && (
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <p className="text-xs uppercase font-extrabold text-slate-400">Arts Events</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
                  {registeredProgramsData.filter(p => p.section === 'ARTS').length}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Stage & Non-Stage</p>
              </div>
            )}

            {isSportsEnabled && (
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                <p className="text-xs uppercase font-extrabold text-slate-400">Sports Events</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
                  {registeredProgramsData.filter(p => p.section === 'SPORTS').length}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Athletics & games</p>
              </div>
            )}

            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <p className="text-xs uppercase font-extrabold text-slate-400">Points Scored</p>
              <p className="text-2xl sm:text-3xl font-black font-mono mt-1" style={{ color: teamColor }}>
                {registeredProgramsData.reduce((acc, p) => acc + p.pointsScored, 0)} Pts
              </p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                From {registeredProgramsData.filter(p => p.pointsScored > 0).length} awarded events
              </p>
            </div>
          </div>

          {/* Filtering and Search Toolbar */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search registered program by code, title, student name, or chest #..."
                  value={programSearch}
                  onChange={e => setProgramSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:outline-none transition-all"
                />
                {programSearch && (
                  <button
                    onClick={() => setProgramSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Section Filter Pills */}
              {isArtsEnabled && isSportsEnabled && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 shrink-0">
                  <button
                    onClick={() => setSectionFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      sectionFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    All Sections
                  </button>
                  <button
                    onClick={() => setSectionFilter('ARTS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      sectionFilter === 'ARTS'
                        ? 'text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    style={sectionFilter === 'ARTS' ? { backgroundColor: teamColor, borderColor: teamColor } : {}}
                  >
                    🎭 Arts
                  </button>
                  <button
                    onClick={() => setSectionFilter('SPORTS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      sectionFilter === 'SPORTS'
                        ? 'text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    style={sectionFilter === 'SPORTS' ? { backgroundColor: teamColor, borderColor: teamColor } : {}}
                  >
                    🏃 Sports
                  </button>
                </div>
              )}
            </div>

            {/* Additional Secondary Filter Selectors */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {allCategories.map(cat => (
                    <option key={cat.category} value={cat.category}>
                      {cat.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Type:</span>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="GROUP">Group</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Results:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="POINTS_SCORED">🏆 Points Won</option>
                  <option value="PUBLISHED">Results Published</option>
                  <option value="SCHEDULED">Scheduled / In Progress</option>
                </select>
              </div>

              {(programSearch || categoryFilter !== 'ALL' || sectionFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setProgramSearch('');
                    setCategoryFilter('ALL');
                    setSectionFilter('ALL');
                    setStageFilter('ALL');
                    setTypeFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-auto cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Registered Programs List / Table */}
          {filteredRegisteredPrograms.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No matching registered programs</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No registered programs matched your current search filters. Try clearing filters or register candidates.
              </p>
              <button
                onClick={() => {
                  setProgramSearch('');
                  setCategoryFilter('ALL');
                  setSectionFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer"
                style={{
                  backgroundColor: `${teamColor}12`,
                  color: teamColor,
                  borderColor: `${teamColor}30`
                }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Showing {filteredRegisteredPrograms.length} of {registeredProgramsData.length} Registered Programs
                </span>
                <span className="text-xs font-mono font-bold" style={{ color: teamColor }}>
                  {filteredRegisteredPrograms.reduce((sum, p) => sum + p.registrations.length, 0)} Total Slotted Entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-4">Program</th>
                      <th className="py-3.5 px-4">Category & Section</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Slotted Candidate(s) / Group</th>
                      <th className="py-3.5 px-4">Venue & Time</th>
                      <th className="py-3.5 px-4">Result / Standing</th>
                      <th className="py-3.5 px-4 text-right">Points Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRegisteredPrograms.map(item => {
                      const prog = item.program;
                      const hasWonPoints = item.pointsScored > 0;

                      return (
                        <tr key={item.programId} className="hover:bg-slate-50/80 transition-colors">
                          {/* Program Info */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                {item.programCode}
                              </span>
                              <div>
                                <p className="font-black text-slate-900 text-sm">
                                  {item.programName}
                                </p>
                                <p className="text-xs text-slate-500 font-normal">
                                  {item.registrations.length} team {item.registrations.length === 1 ? 'slot' : 'slots'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category & Section */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <CategoryBadge category={item.category} />
                              <div className="flex items-center gap-1 mt-0.5">
                                <SectionBadge section={item.section as any} />
                                {item.subsection === 'STAGE' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    Stage
                                  </span>
                                )}
                                {item.subsection === 'NON_STAGE' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    Non-Stage
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-4 px-4">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {item.programType}
                            </span>
                          </td>

                          {/* Slotted Candidates */}
                          <td className="py-4 px-4">
                            <div className="space-y-1.5 max-w-xs">
                              {item.registrations.map((reg, idx) => (
                                <div key={reg.id || idx} className="text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                                  {reg.programType === 'INDIVIDUAL' ? (
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-slate-900 truncate">
                                        {reg.studentName || 'Student'}
                                      </span>
                                      <span className="font-mono font-bold shrink-0" style={{ color: teamColor }}>
                                        {reg.chestNumber ? `#${reg.chestNumber}` : 'No Chest #'}
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex items-center justify-between font-bold text-slate-900">
                                        <span>{reg.groupName || `Group Team #${reg.groupNumber || idx + 1}`}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                                          {reg.groupMembers?.length || 0} Members
                                        </span>
                                      </div>
                                      {reg.groupMembers && reg.groupMembers.length > 0 && (
                                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                                          {reg.groupMembers.map(m => m.name).join(', ')}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Schedule / Venue */}
                          <td className="py-4 px-4 text-xs">
                            {prog?.scheduleTime || prog?.stageLocation ? (
                              <div className="space-y-1 text-slate-600">
                                {prog.scheduleTime && (
                                  <div className="flex items-center gap-1 font-mono">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{new Date(prog.scheduleTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                  </div>
                                )}
                                {prog.stageLocation && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-semibold text-slate-800">{prog.stageLocation}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Schedule pending</span>
                            )}
                          </td>

                          {/* Result / Position */}
                          <td className="py-4 px-4">
                            {item.resultStatus === 'PUBLISHED' ? (
                              <div className="space-y-1">
                                {item.resultEntries.length > 0 ? (
                                  item.resultEntries.map((ent, eIdx) => (
                                    <div key={ent.id || eIdx} className="flex items-center gap-1.5 flex-wrap">
                                      <PositionBadge position={ent.position} />
                                      {ent.grade && ent.grade !== 'NONE' && (
                                        <GradeBadge grade={ent.grade} />
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-500 font-medium">
                                    No podium award
                                  </span>
                                )}
                              </div>
                            ) : item.resultStatus === 'SUBMITTED' ? (
                              <span className="text-xs font-bold px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                Under Review
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">
                                Awaiting Results
                              </span>
                            )}
                          </td>

                          {/* Points Earned */}
                          <td className="py-4 px-4 text-right">
                            {hasWonPoints ? (
                              <span
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border font-black font-mono text-sm shadow-2xs"
                                style={{
                                  backgroundColor: `${teamColor}12`,
                                  borderColor: `${teamColor}30`,
                                  color: teamColor
                                }}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                +{item.pointsScored} Pts
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-slate-400">0 Pts</span>
                            )}
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
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: STUDENT PARTICIPATION LIMIT MONITOR                               */}
      {/* ========================================================================= */}
      {currentView === 'STUDENT_LIMITS' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5" style={{ color: teamColor }} />
                  <span>Student Participation Limit Monitor</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                  Track individual participation counts against configured maximum limits for each student in {myTeam?.name}.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('tl_students')}
                className="text-xs sm:text-sm font-bold cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                style={{ color: teamColor }}
              >
                <span>View Full Candidates & Points Roster</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4">Chest #</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Class</th>
                    {isArtsEnabled && <th className="py-3.5 px-4">Arts Events</th>}
                    {isSportsEnabled && <th className="py-3.5 px-4">Sports Events</th>}
                    <th className="py-3.5 px-4">Participation Quota</th>
                    <th className="py-3.5 px-4 text-right">Quick Register</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {myStudents.map(st => {
                    const catConfig = categoryConfigs.find(c => c.category === st.category);
                    const maxAllowed = catConfig?.maxIndividualProgramsPerStudent || 5;

                    const artsCount = individualRegs.filter(r => r.studentId === st.id && r.section === 'ARTS').length;
                    const sportsCount = individualRegs.filter(r => r.studentId === st.id && r.section === 'SPORTS').length;
                    const totalCount = (isArtsEnabled ? artsCount : 0) + (isSportsEnabled ? sportsCount : 0);
                    const percentUsed = Math.min(100, Math.round((totalCount / maxAllowed) * 100));
                    const isFull = totalCount >= maxAllowed;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-sm" style={{ color: teamColor }}>
                          {st.chestNumber ? `#${st.chestNumber}` : <span className="text-slate-400 font-normal">Pending</span>}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-900 text-sm">{st.name}</p>
                          <p className="text-xs font-mono text-slate-500">{st.admissionNo}</p>
                        </td>
                        <td className="py-4 px-4">
                          <CategoryBadge category={st.category} />
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-600 text-sm">
                          Class {st.classNumber || '-'}
                        </td>
                        {isArtsEnabled && (
                          <td className="py-4 px-4 font-mono font-bold text-sm text-slate-900">
                            {artsCount}
                          </td>
                        )}
                        {isSportsEnabled && (
                          <td className="py-4 px-4 font-mono font-bold text-sm text-slate-900">
                            {sportsCount}
                          </td>
                        )}
                        <td className="py-4 px-4">
                          <div className="w-44">
                            <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                              <span className={`font-mono ${isFull ? 'text-amber-700' : 'text-slate-700'}`}>
                                {totalCount} / {maxAllowed} Events
                              </span>
                              {isFull && <span className="text-[10px] text-amber-700 font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">MAX</span>}
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${isFull ? 'bg-amber-500' : ''}`}
                                style={isFull ? { width: `${percentUsed}%` } : { width: `${percentUsed}%`, backgroundColor: teamColor }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setActiveTab('tl_reg_individual')}
                            disabled={isFull || !settings.registrationOpen}
                            className="px-3.5 py-1.5 rounded-xl disabled:opacity-40 border text-xs font-bold transition-colors cursor-pointer"
                            style={{
                              backgroundColor: `${teamColor}12`,
                              borderColor: `${teamColor}30`,
                              color: teamColor
                            }}
                          >
                            + Register
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CATEGORY WINNING ENTRIES & DETAILS INSPECTION                      */}
      {/* ========================================================================= */}
      {selectedCategoryModal && inspectedCategoryData && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCategoryModal(null)}
          title={`${inspectedCategoryData.displayName} - Points & Winning Events`}
          subtitle={`Detailed score breakdown and podium achievements for ${myTeam?.name}`}
          maxWidth="2xl"
        >
          <div className="p-6 space-y-6">
            {/* Modal Summary KPI */}
            <div className={`grid gap-3 ${
              isArtsEnabled && isSportsEnabled ? 'grid-cols-3' : 'grid-cols-2'
            }`}>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase">Category Total</p>
                <p className="text-2xl font-black font-mono mt-0.5" style={{ color: teamColor }}>
                  {inspectedCategoryData.totalPoints} Pts
                </p>
              </div>
              {isArtsEnabled && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 uppercase">Arts Total</p>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                    {inspectedCategoryData.artsPoints} Pts
                  </p>
                </div>
              )}
              {isSportsEnabled && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 uppercase">Sports Total</p>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                    {inspectedCategoryData.sportsPoints} Pts
                  </p>
                </div>
              )}
            </div>

            {/* Winning Results Table */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" style={{ color: teamColor }} />
                Scored Events & Winning Entries ({inspectedCategoryData.entries.length})
              </h4>

              {inspectedCategoryData.entries.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium">
                  No published scores or awards recorded yet in this category for {myTeam?.name}.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {inspectedCategoryData.entries.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {item.program?.code || 'PRG'}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {item.program?.name || item.result.programName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Winner: <span className="font-semibold text-slate-800">{item.entry.studentName || item.entry.groupName || 'Team Entry'}</span>
                          {item.entry.chestNumber && ` (#${item.entry.chestNumber})`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <PositionBadge position={item.entry.position} />
                        {item.entry.grade && item.entry.grade !== 'NONE' && (
                          <GradeBadge grade={item.entry.grade} />
                        )}
                        <span
                          className="text-sm font-black font-mono px-2.5 py-1 rounded-xl border"
                          style={{
                            backgroundColor: `${teamColor}12`,
                            borderColor: `${teamColor}30`,
                            color: teamColor
                          }}
                        >
                          +{item.entry.totalPoints} Pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedCategoryModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

