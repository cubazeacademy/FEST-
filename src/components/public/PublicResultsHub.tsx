import React, { useState, useMemo, useEffect } from 'react';
import { useFestData } from '../../context/FestDataContext';
import {
  Trophy,
  BarChart3,
  Star,
  Users,
  Search,
  ChevronRight,
  MapPin,
  Award,
  Crown,
  Medal,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  Columns,
  GraduationCap
} from 'lucide-react';
import { PositionBadge, GradeBadge } from '../common/Badge';

interface PublicResultsHubProps {
  setActiveTab?: (tab: string) => void;
}

type ResultTab = 'LEADERBOARD' | 'CATEGORY_LEADERBOARD' | 'TOPPERS' | 'PROGRAMMES' | 'CANDIDATES';

export const PublicResultsHub: React.FC<PublicResultsHubProps> = ({ setActiveTab }) => {
  const {
    settings,
    teams,
    teamLeaderboard,
    studentScores,
    programs,
    results,
    categoryConfigs
  } = useFestData();

  // Active section configuration from Admin Settings
  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;

  const [activeSubTab, setActiveSubTab] = useState<ResultTab>('LEADERBOARD');
  const [leaderboardSection, setLeaderboardSection] = useState<'ARTS' | 'SPORTS' | 'DUAL'>(() => {
    if (isArtsEnabled) return 'ARTS';
    if (isSportsEnabled) return 'SPORTS';
    return 'ARTS';
  });

  const [categorySection, setCategorySection] = useState<'ARTS' | 'SPORTS'>(() => {
    if (isArtsEnabled) return 'ARTS';
    if (isSportsEnabled) return 'SPORTS';
    return 'ARTS';
  });

  const [toppersSection, setToppersSection] = useState<'ARTS' | 'SPORTS' | 'ALL'>(() => {
    if (isArtsEnabled && !isSportsEnabled) return 'ARTS';
    if (!isArtsEnabled && isSportsEnabled) return 'SPORTS';
    return 'ARTS';
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [toppersCategoryFilter, setToppersCategoryFilter] = useState<string>('ALL');
  const [progCategoryFilter, setProgCategoryFilter] = useState<string>('ALL');
  const [searchProgQuery, setSearchProgQuery] = useState('');
  const [searchCandidateQuery, setSearchCandidateQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'ARTS' | 'SPORTS'>('ALL');

  // Keep section in sync if admin toggles settings
  useEffect(() => {
    if (isArtsEnabled && !isSportsEnabled) {
      setLeaderboardSection('ARTS');
      setCategorySection('ARTS');
      setToppersSection('ARTS');
      setSectionFilter('ARTS');
    } else if (!isArtsEnabled && isSportsEnabled) {
      setLeaderboardSection('SPORTS');
      setCategorySection('SPORTS');
      setToppersSection('SPORTS');
      setSectionFilter('SPORTS');
    }
  }, [isArtsEnabled, isSportsEnabled]);

  // Strictly sorted Arts teams
  const artsSortedTeams = useMemo(() => {
    return [...teamLeaderboard].sort((a, b) => {
      if (b.artsTotalPoints !== a.artsTotalPoints) return b.artsTotalPoints - a.artsTotalPoints;
      if (b.artsFirstCount !== a.artsFirstCount) return b.artsFirstCount - a.artsFirstCount;
      if (b.artsSecondCount !== a.artsSecondCount) return b.artsSecondCount - a.artsSecondCount;
      return b.artsThirdCount - a.artsThirdCount;
    });
  }, [teamLeaderboard]);

  // Strictly sorted Sports teams
  const sportsSortedTeams = useMemo(() => {
    return [...teamLeaderboard].sort((a, b) => {
      if (b.sportsTotalPoints !== a.sportsTotalPoints) return b.sportsTotalPoints - a.sportsTotalPoints;
      if (b.sportsFirstCount !== a.sportsFirstCount) return b.sportsFirstCount - a.sportsFirstCount;
      if (b.sportsSecondCount !== a.sportsSecondCount) return b.sportsSecondCount - a.sportsSecondCount;
      return b.sportsThirdCount - a.sportsThirdCount;
    });
  }, [teamLeaderboard]);

  // Categories list - strictly derived from Admin's active Category Configs
  const categories = useMemo(() => {
    if (categoryConfigs && categoryConfigs.length > 0) {
      const active = categoryConfigs.filter(c => c.status === 'ACTIVE' || !c.status);
      if (active.length > 0) {
        return active.map(c => c.displayName || c.category);
      }
    }
    return Array.from(new Set(programs.map(p => p.category))).filter(Boolean);
  }, [categoryConfigs, programs]);

  // Helper to match category aliases/keys (code vs displayName vs exact string)
  const getCategoryKeys = (cat: string) => {
    const config = categoryConfigs.find(
      c =>
        (c.displayName && c.displayName.trim().toUpperCase() === cat.trim().toUpperCase()) ||
        (c.category && c.category.trim().toUpperCase() === cat.trim().toUpperCase()) ||
        (c.id && c.id.trim().toUpperCase() === cat.trim().toUpperCase())
    );
    if (config) {
      return Array.from(
        new Set([config.category, config.displayName, cat].filter(Boolean) as string[])
      );
    }
    return [cat];
  };

  const isCategoryMatch = (selected: string, targetCategory?: string) => {
    if (selected === 'ALL') return true;
    if (!targetCategory) return false;
    const keys = getCategoryKeys(selected);
    return keys.some(k => k.trim().toUpperCase() === targetCategory.trim().toUpperCase());
  };

  // Category-wise Team Standings & Position Rankings per category strictly separated
  const categoryTeamData = useMemo(() => {
    const catStandings: Record<
      string,
      Array<{
        teamId: string;
        teamName: string;
        teamColor: string;
        catArtsPts: number;
        catSportsPts: number;
        catTotalPts: number;
        artsRank: number;
        sportsRank: number;
        rank: number;
      }>
    > = {};

    categories.forEach(cat => {
      const keys = getCategoryKeys(cat);

      const list = teams.map(team => {
        const breakdown = teamLeaderboard.find(t => t.teamId === team.id);
        let catArtsPts = 0;
        let catSportsPts = 0;

        keys.forEach(k => {
          if (isArtsEnabled) {
            catArtsPts += breakdown?.categoryArtsPoints?.[k] || 0;
          }
          if (isSportsEnabled) {
            catSportsPts += breakdown?.categorySportsPoints?.[k] || 0;
          }
        });

        const catTotalPts = catArtsPts + catSportsPts;
        return {
          teamId: team.id,
          teamName: team.name,
          teamColor: team.color,
          catArtsPts,
          catSportsPts,
          catTotalPts,
          artsRank: 0,
          sportsRank: 0,
          rank: 0
        };
      });

      // Rank by Arts
      const byArts = [...list].sort((a, b) => {
        if (b.catArtsPts !== a.catArtsPts) return b.catArtsPts - a.catArtsPts;
        return a.teamName.localeCompare(b.teamName);
      });
      byArts.forEach((item, idx) => {
        item.artsRank = idx + 1;
      });

      // Rank by Sports
      const bySports = [...list].sort((a, b) => {
        if (b.catSportsPts !== a.catSportsPts) return b.catSportsPts - a.catSportsPts;
        return a.teamName.localeCompare(b.teamName);
      });
      bySports.forEach((item, idx) => {
        item.sportsRank = idx + 1;
      });

      // Rank by Total
      const byTotal = [...list].sort((a, b) => {
        if (b.catTotalPts !== a.catTotalPts) return b.catTotalPts - a.catTotalPts;
        return a.teamName.localeCompare(b.teamName);
      });
      byTotal.forEach((item, idx) => {
        item.rank = idx + 1;
      });

      catStandings[cat] = list;
    });

    return catStandings;
  }, [categories, categoryConfigs, teams, teamLeaderboard]);

  // Comprehensive program-based results list (merging defined programs and results)
  const programResultsList = useMemo(() => {
    const resultMap = new Map<string, typeof results[0]>();
    results.forEach(r => {
      if (r.programId) {
        resultMap.set(r.programId, r);
      }
    });

    const list: Array<{
      id: string;
      programId: string;
      code: string;
      name: string;
      section: 'ARTS' | 'SPORTS';
      subsection?: string;
      category: string;
      programType?: string;
      stageLocation?: string;
      scheduleTime?: string;
      result?: typeof results[0];
      status: string;
      isPublished: boolean;
      publishedAt?: string;
    }> = [];

    const seenProgramIds = new Set<string>();

    programs.forEach(p => {
      seenProgramIds.add(p.id);
      const res = resultMap.get(p.id);
      const isPub = res ? res.status === 'PUBLISHED' : p.resultStatus === 'PUBLISHED';
      list.push({
        id: p.id,
        programId: p.id,
        code: p.code || '',
        name: p.name,
        section: (p.section as 'ARTS' | 'SPORTS') || 'ARTS',
        subsection: p.subsection,
        category: p.category,
        programType: p.programType,
        stageLocation: p.stageLocation,
        scheduleTime: p.scheduleTime,
        result: res,
        status: p.status || 'UPCOMING',
        isPublished: isPub,
        publishedAt: res?.publishedAt
      });
    });

    // Also include any published results that were created directly or not in programs array
    results.forEach(r => {
      if (!seenProgramIds.has(r.programId)) {
        list.push({
          id: r.id,
          programId: r.programId,
          code: '',
          name: r.programName,
          section: (r.section as 'ARTS' | 'SPORTS') || 'ARTS',
          category: r.category,
          result: r,
          status: 'COMPLETED',
          isPublished: r.status === 'PUBLISHED',
          publishedAt: r.publishedAt
        });
      }
    });

    return list;
  }, [programs, results]);

  const filteredPrograms = useMemo(() => {
    return programResultsList
      .filter(item => {
        // Exclusively show published results with certified entries
        if (!item.isPublished || !item.result || item.result.status !== 'PUBLISHED' || !item.result.entries || item.result.entries.length === 0) {
          return false;
        }

        if (!isArtsEnabled && item.section === 'ARTS') return false;
        if (!isSportsEnabled && item.section === 'SPORTS') return false;

        if (sectionFilter !== 'ALL' && item.section !== sectionFilter) return false;
        if (!isCategoryMatch(progCategoryFilter, item.category)) return false;

        const q = searchProgQuery.toLowerCase().trim();
        if (!q) return true;

        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchVenue = item.stageLocation?.toLowerCase().includes(q);
        const matchWinners = item.result.entries.some(
          e =>
            e.studentName?.toLowerCase().includes(q) ||
            e.groupName?.toLowerCase().includes(q) ||
            (e.chestNumber && e.chestNumber.toString().includes(q))
        );

        return matchName || matchCode || matchCategory || matchVenue || matchWinners;
      })
      .sort((a, b) => {
        const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return a.name.localeCompare(b.name);
      });
  }, [
    programResultsList,
    searchProgQuery,
    sectionFilter,
    progCategoryFilter,
    isArtsEnabled,
    isSportsEnabled,
    categoryConfigs
  ]);

  // Filtered candidate scores
  const filteredCandidates = useMemo(() => {
    const q = searchCandidateQuery.toLowerCase().trim();
    return studentScores.filter(s => {
      const matchQ =
        !q ||
        s.studentName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.chestNumber && s.chestNumber.toString().includes(q)) ||
        s.teamName.toLowerCase().includes(q) ||
        s.classNumber.toLowerCase().includes(q);

      const matchCat = isCategoryMatch(selectedCategory, s.category);
      return matchQ && matchCat;
    });
  }, [studentScores, searchCandidateQuery, selectedCategory, categoryConfigs]);

  // Helper to get active score for a student based on toppersSection
  const getStudentScore = (s: typeof studentScores[0], sec: 'ARTS' | 'SPORTS' | 'ALL') => {
    const artsPts = isArtsEnabled ? (s.artsIndividualPoints || 0) : 0;
    const sportsPts = isSportsEnabled ? (s.sportsIndividualPoints || 0) : 0;
    if (sec === 'ARTS') return artsPts;
    if (sec === 'SPORTS') return sportsPts;
    return artsPts + sportsPts;
  };

  // Grand Toppers across all categories (Festival Champions)
  const grandToppers = useMemo(() => {
    return [...studentScores]
      .sort((a, b) => {
        const scoreA = getStudentScore(a, toppersSection);
        const scoreB = getStudentScore(b, toppersSection);
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (b.firstCount !== a.firstCount) return b.firstCount - a.firstCount;
        if (b.secondCount !== a.secondCount) return b.secondCount - a.secondCount;
        if (b.thirdCount !== a.thirdCount) return b.thirdCount - a.thirdCount;
        if (b.gradeACount !== a.gradeACount) return b.gradeACount - a.gradeACount;
        return a.studentName.localeCompare(b.studentName);
      });
  }, [studentScores, toppersSection]);

  // Category-based Toppers mapping (Top students in each category)
  const categoryToppersMap = useMemo(() => {
    const map: Record<string, typeof studentScores> = {};

    categories.forEach(cat => {
      const catStudents = studentScores.filter(s => isCategoryMatch(cat, s.category));
      const sorted = [...catStudents].sort((a, b) => {
        const scoreA = getStudentScore(a, toppersSection);
        const scoreB = getStudentScore(b, toppersSection);
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (b.firstCount !== a.firstCount) return b.firstCount - a.firstCount;
        if (b.secondCount !== a.secondCount) return b.secondCount - a.secondCount;
        if (b.thirdCount !== a.thirdCount) return b.thirdCount - a.thirdCount;
        if (b.gradeACount !== a.gradeACount) return b.gradeACount - a.gradeACount;
        return a.studentName.localeCompare(b.studentName);
      });
      map[cat] = sorted;
    });

    return map;
  }, [categories, studentScores, toppersSection, categoryConfigs]);

  return (
    <div className="space-y-8 w-full">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab && setActiveTab('public_live')}
          className="hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>Home</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold">Results</span>
      </div>

      {/* Title Header & Fest Pill Selector */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          RESULTS
        </h1>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-xs text-xs sm:text-sm font-bold text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-red-600" />
          <span>{settings.festName}</span>
        </div>
      </div>

      {/* Main Results Grid: Sidebar Sub-Nav + Main Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sub-Navigation Menu (Matching Screenshot) */}
        <div className="lg:col-span-3 space-y-3">
          {/* 1. Leaderboard */}
          <button
            onClick={() => setActiveSubTab('LEADERBOARD')}
            className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3.5 cursor-pointer ${
              activeSubTab === 'LEADERBOARD'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 ring-2 ring-red-600/20'
                : 'bg-white border border-slate-200/90 hover:border-red-200 text-slate-900 shadow-xs hover:shadow-md'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeSubTab === 'LEADERBOARD'
                  ? 'bg-white/20 text-white'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black">Leaderboard</h3>
              <p
                className={`text-xs font-medium ${
                  activeSubTab === 'LEADERBOARD' ? 'text-red-100' : 'text-slate-500'
                }`}
              >
                Top performers & teams
              </p>
            </div>
          </button>

          {/* 2. Category Leaderboard */}
          <button
            onClick={() => setActiveSubTab('CATEGORY_LEADERBOARD')}
            className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3.5 cursor-pointer ${
              activeSubTab === 'CATEGORY_LEADERBOARD'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 ring-2 ring-red-600/20'
                : 'bg-white border border-slate-200/90 hover:border-red-200 text-slate-900 shadow-xs hover:shadow-md'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeSubTab === 'CATEGORY_LEADERBOARD'
                  ? 'bg-white/20 text-white'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black">Category Leaderboard</h3>
              <p
                className={`text-xs font-medium ${
                  activeSubTab === 'CATEGORY_LEADERBOARD' ? 'text-red-100' : 'text-slate-500'
                }`}
              >
                Category-wise toppers
              </p>
            </div>
          </button>

          {/* 3. Category Toppers (Student Performance Toppers) */}
          <button
            onClick={() => setActiveSubTab('TOPPERS')}
            className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3.5 cursor-pointer ${
              activeSubTab === 'TOPPERS'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 ring-2 ring-red-600/20'
                : 'bg-white border border-slate-200/90 hover:border-red-200 text-slate-900 shadow-xs hover:shadow-md'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeSubTab === 'TOPPERS'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}
            >
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black">Category Toppers</h3>
              <p
                className={`text-xs font-medium ${
                  activeSubTab === 'TOPPERS' ? 'text-red-100' : 'text-slate-500'
                }`}
              >
                Top 3 students per category
              </p>
            </div>
          </button>

          {/* 4. Programmes */}
          <button
            onClick={() => setActiveSubTab('PROGRAMMES')}
            className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3.5 cursor-pointer ${
              activeSubTab === 'PROGRAMMES'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 ring-2 ring-red-600/20'
                : 'bg-white border border-slate-200/90 hover:border-red-200 text-slate-900 shadow-xs hover:shadow-md'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeSubTab === 'PROGRAMMES'
                  ? 'bg-white/20 text-white'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black">Programmes</h3>
              <p
                className={`text-xs font-medium ${
                  activeSubTab === 'PROGRAMMES' ? 'text-red-100' : 'text-slate-500'
                }`}
              >
                Event winners
              </p>
            </div>
          </button>

          {/* 4. Candidate Profiles */}
          <button
            onClick={() => setActiveSubTab('CANDIDATES')}
            className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3.5 cursor-pointer ${
              activeSubTab === 'CANDIDATES'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 ring-2 ring-red-600/20'
                : 'bg-white border border-slate-200/90 hover:border-red-200 text-slate-900 shadow-xs hover:shadow-md'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeSubTab === 'CANDIDATES'
                  ? 'bg-white/20 text-white'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black">Candidate Profiles</h3>
              <p
                className={`text-xs font-medium ${
                  activeSubTab === 'CANDIDATES' ? 'text-red-100' : 'text-slate-500'
                }`}
              >
                All participants
              </p>
            </div>
          </button>
        </div>

        {/* Right Main Content Display Area */}
        <div className="lg:col-span-9 min-w-0">
          {/* TAB 1: OVERALL LEADERBOARD */}
          {activeSubTab === 'LEADERBOARD' && (
            <div className="space-y-6">
              {/* Section Mode Switcher (When both Arts and Sports are enabled) */}
              {isArtsEnabled && isSportsEnabled && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Strictly Separated Standings
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Arts and Sports points are independent institutional championships.
                    </p>
                  </div>

                  <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setLeaderboardSection('ARTS')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        leaderboardSection === 'ARTS'
                          ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      Arts Championship
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaderboardSection('SPORTS')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        leaderboardSection === 'SPORTS'
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      Sports Championship
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaderboardSection('DUAL')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        leaderboardSection === 'DUAL'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      Dual Standings
                    </button>
                  </div>
                </div>
              )}

              {/* ARTS STANDINGS VIEW */}
              {isArtsEnabled && (leaderboardSection === 'ARTS' || !isSportsEnabled) && (
                <div className="space-y-6">
                  {/* Podium Top 3 Houses for Arts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                    {/* 2nd Place */}
                    {artsSortedTeams[1] && (
                      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-3.5 order-2 md:order-1 hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                          2
                        </div>
                        <div>
                          <span className="text-xs uppercase font-bold text-fuchsia-600">
                            Arts Runner-Up
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-2 mt-0.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: artsSortedTeams[1].teamColor }}
                            />
                            {artsSortedTeams[1].teamName}
                          </h3>
                        </div>
                        <div className="pt-3 border-t border-slate-100 text-sm font-mono">
                          <p className="text-fuchsia-700 font-black text-xl">
                            {artsSortedTeams[1].artsTotalPoints} pts
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Stage: {artsSortedTeams[1].artsStagePoints} | Non-Stage: {artsSortedTeams[1].artsNonStagePoints}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 1st Place (Arts Champion) */}
                    {artsSortedTeams[0] && (
                      <div className="p-7 rounded-3xl border-2 text-center space-y-4 shadow-sm order-1 md:order-2 hover:shadow-md transition-all bg-gradient-to-b from-fuchsia-500/10 via-fuchsia-50/40 to-white border-fuchsia-300">
                        <Crown className="w-9 h-9 mx-auto text-fuchsia-600 animate-bounce" />
                        <div className="w-16 h-16 rounded-full border-2 font-black text-2xl flex items-center justify-center mx-auto shadow-sm bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900 shadow-fuchsia-200">
                          1
                        </div>
                        <div>
                          <span className="text-xs uppercase font-black tracking-wider text-fuchsia-700">
                            Arts Champion Leader
                          </span>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center justify-center gap-2.5 mt-0.5">
                            <span
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: artsSortedTeams[0].teamColor }}
                            />
                            {artsSortedTeams[0].teamName}
                          </h3>
                        </div>
                        <div className="pt-3.5 border-t border-fuchsia-200/60 text-sm font-mono">
                          <p className="text-fuchsia-700 font-black text-2xl">
                            {artsSortedTeams[0].artsTotalPoints} pts
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Stage: {artsSortedTeams[0].artsStagePoints} • Non-Stage: {artsSortedTeams[0].artsNonStagePoints}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {artsSortedTeams[2] && (
                      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-3.5 order-3 hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-black text-xl flex items-center justify-center mx-auto">
                          3
                        </div>
                        <div>
                          <span className="text-xs uppercase font-bold text-fuchsia-600">
                            Arts Third Place
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-2 mt-0.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: artsSortedTeams[2].teamColor }}
                            />
                            {artsSortedTeams[2].teamName}
                          </h3>
                        </div>
                        <div className="pt-3 border-t border-slate-100 text-sm font-mono">
                          <p className="text-fuchsia-700 font-black text-xl">
                            {artsSortedTeams[2].artsTotalPoints} pts
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Stage: {artsSortedTeams[2].artsStagePoints} | Non-Stage: {artsSortedTeams[2].artsNonStagePoints}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arts Official Table */}
                  <div className="p-6 rounded-3xl bg-white border border-fuchsia-200 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-fuchsia-100">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <Award className="w-5 h-5 text-fuchsia-600" />
                          Arts Festival Official Standings
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Stage & Non-Stage Cumulative Points</p>
                      </div>
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                        {artsSortedTeams.length} Houses
                      </span>
                    </div>

                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                            <th className="py-3 px-3.5 rounded-l-xl">Rank</th>
                            <th className="py-3 px-3.5">House / Team</th>
                            <th className="py-3 px-3.5 text-center">Stage Points</th>
                            <th className="py-3 px-3.5 text-center">Non-Stage Points</th>
                            <th className="py-3 px-3.5 text-center font-bold text-fuchsia-700">Total Arts Points</th>
                            <th className="py-3 px-3.5 text-right rounded-r-xl">Arts Medals (🥇/🥈/🥉)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {artsSortedTeams.map((team, idx) => (
                            <tr key={team.teamId} className="hover:bg-fuchsia-50/20 transition-colors">
                              <td className="py-3.5 px-3.5 font-mono font-bold">
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                    idx === 0
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
                                      : idx === 1
                                      ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                      : idx === 2
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-slate-50 text-slate-500'
                                  }`}
                                >
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="py-3.5 px-3.5">
                                <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                                  <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: team.teamColor }} />
                                  <span>{team.teamName}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3.5 text-center font-mono text-slate-700">
                                {team.artsStagePoints} pts
                              </td>
                              <td className="py-3.5 px-3.5 text-center font-mono text-slate-700">
                                {team.artsNonStagePoints} pts
                              </td>
                              <td className="py-3.5 px-3.5 text-center font-mono font-black text-fuchsia-700 bg-fuchsia-50/50 text-base">
                                {team.artsTotalPoints} pts
                              </td>
                              <td className="py-3.5 px-3.5 text-right">
                                <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold">
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                    🥇 {team.artsFirstCount}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                    🥈 {team.artsSecondCount}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                                    🥉 {team.artsThirdCount}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SPORTS STANDINGS VIEW */}
              {isSportsEnabled && (leaderboardSection === 'SPORTS' || !isArtsEnabled) && (
                <div className="space-y-6">
                  {/* Podium Top 3 Houses for Sports */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                    {/* 2nd Place */}
                    {sportsSortedTeams[1] && (
                      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-3.5 order-2 md:order-1 hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                          2
                        </div>
                        <div>
                          <span className="text-xs uppercase font-bold text-sky-600">
                            Sports Runner-Up
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-2 mt-0.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: sportsSortedTeams[1].teamColor }}
                            />
                            {sportsSortedTeams[1].teamName}
                          </h3>
                        </div>
                        <div className="pt-3 border-t border-slate-100 text-sm font-mono">
                          <p className="text-sky-700 font-black text-xl">
                            {sportsSortedTeams[1].sportsTotalPoints} pts
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Athletics & Games Score
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 1st Place (Sports Champion) */}
                    {sportsSortedTeams[0] && (
                      <div className="p-7 rounded-3xl border-2 text-center space-y-4 shadow-sm order-1 md:order-2 hover:shadow-md transition-all bg-gradient-to-b from-sky-500/10 via-sky-50/40 to-white border-sky-300">
                        <Crown className="w-9 h-9 mx-auto text-sky-600 animate-bounce" />
                        <div className="w-16 h-16 rounded-full border-2 font-black text-2xl flex items-center justify-center mx-auto shadow-sm bg-sky-100 border-sky-400 text-sky-900 shadow-sky-200">
                          1
                        </div>
                        <div>
                          <span className="text-xs uppercase font-black tracking-wider text-sky-700">
                            Sports Champion Leader
                          </span>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center justify-center gap-2.5 mt-0.5">
                            <span
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: sportsSortedTeams[0].teamColor }}
                            />
                            {sportsSortedTeams[0].teamName}
                          </h3>
                        </div>
                        <div className="pt-3.5 border-t border-sky-200/60 text-sm font-mono">
                          <p className="text-sky-700 font-black text-2xl">
                            {sportsSortedTeams[0].sportsTotalPoints} pts
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Athletics & Track & Field Points
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {sportsSortedTeams[2] && (
                      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-3.5 order-3 hover:shadow-md transition-all">
                        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-black text-xl flex items-center justify-center mx-auto">
                          3
                        </div>
                        <div>
                          <span className="text-xs uppercase font-bold text-sky-600">
                            Sports Third Place
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-2 mt-0.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: sportsSortedTeams[2].teamColor }}
                            />
                            {sportsSortedTeams[2].teamName}
                          </h3>
                        </div>
                        <div className="pt-3 border-t border-slate-100 text-sm font-mono">
                          <p className="text-sky-700 font-black text-xl">
                            {sportsSortedTeams[2].sportsTotalPoints} pts
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Athletics & Games Score
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sports Official Table */}
                  <div className="p-6 rounded-3xl bg-white border border-sky-200 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-sky-100">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <Flame className="w-5 h-5 text-sky-600" />
                          Sports Meet Official Standings
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Athletics & Track & Field Points</p>
                      </div>
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                        {sportsSortedTeams.length} Houses
                      </span>
                    </div>

                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                            <th className="py-3 px-3.5 rounded-l-xl">Rank</th>
                            <th className="py-3 px-3.5">House / Team</th>
                            <th className="py-3 px-3.5 text-center font-bold text-sky-700">Total Sports Points</th>
                            <th className="py-3 px-3.5 text-right rounded-r-xl">Sports Medals (🥇/🥈/🥉)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {sportsSortedTeams.map((team, idx) => (
                            <tr key={team.teamId} className="hover:bg-sky-50/20 transition-colors">
                              <td className="py-3.5 px-3.5 font-mono font-bold">
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                    idx === 0
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
                                      : idx === 1
                                      ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                      : idx === 2
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-slate-50 text-slate-500'
                                  }`}
                                >
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="py-3.5 px-3.5">
                                <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                                  <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: team.teamColor }} />
                                  <span>{team.teamName}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3.5 text-center font-mono font-black text-sky-700 bg-sky-50/50 text-base">
                                {team.sportsTotalPoints} pts
                              </td>
                              <td className="py-3.5 px-3.5 text-right">
                                <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold">
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                    🥇 {team.sportsFirstCount}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                    🥈 {team.sportsSecondCount}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                                    🥉 {team.sportsThirdCount}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* DUAL STANDINGS VIEW */}
              {leaderboardSection === 'DUAL' && isArtsEnabled && isSportsEnabled && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Arts Dual Table */}
                  <div className="p-6 rounded-3xl bg-white border border-fuchsia-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-fuchsia-100">
                      <h4 className="text-base font-black text-fuchsia-950 flex items-center gap-2">
                        <Award className="w-5 h-5 text-fuchsia-600" />
                        Arts Festival Standings
                      </h4>
                      <span className="text-xs font-mono font-bold text-fuchsia-700 bg-fuchsia-50 px-2.5 py-1 rounded-lg border border-fuchsia-200">
                        Arts Points Only
                      </span>
                    </div>

                    <div className="space-y-2">
                      {artsSortedTeams.map((team, idx) => (
                        <div
                          key={team.teamId}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-black text-slate-500 w-5 text-center">
                              #{idx + 1}
                            </span>
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.teamColor }} />
                            <span className="font-bold text-slate-900 text-sm">{team.teamName}</span>
                          </div>
                          <span className="font-mono font-black text-fuchsia-700 text-sm">
                            {team.artsTotalPoints} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sports Dual Table */}
                  <div className="p-6 rounded-3xl bg-white border border-sky-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                      <h4 className="text-base font-black text-sky-950 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-sky-600" />
                        Sports Meet Standings
                      </h4>
                      <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                        Sports Points Only
                      </span>
                    </div>

                    <div className="space-y-2">
                      {sportsSortedTeams.map((team, idx) => (
                        <div
                          key={team.teamId}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-black text-slate-500 w-5 text-center">
                              #{idx + 1}
                            </span>
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.teamColor }} />
                            <span className="font-bold text-slate-900 text-sm">{team.teamName}</span>
                          </div>
                          <span className="font-mono font-black text-sky-700 text-sm">
                            {team.sportsTotalPoints} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATEGORY LEADERBOARD */}
          {activeSubTab === 'CATEGORY_LEADERBOARD' && (
            <div className="space-y-6">
              {/* Top Controls: Section toggle (if both ON) + Category Filter Pills */}
              <div className="space-y-3">
                {isArtsEnabled && isSportsEnabled && (
                  <div className="flex items-center gap-2 pb-1">
                    <button
                      type="button"
                      onClick={() => setCategorySection('ARTS')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        categorySection === 'ARTS'
                          ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      Arts Category Points
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategorySection('SPORTS')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        categorySection === 'SPORTS'
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      Sports Category Points
                    </button>
                  </div>
                )}

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      selectedCategory === 'ALL'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategory !== 'ALL' ? (
                /* 1. SELECTED SINGLE CATEGORY: Category-based team points & standings */
                <div className="space-y-6">
                  {/* Category House Points & Positions Card */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          House Standings & Points ({selectedCategory})
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {isArtsEnabled && (categorySection === 'ARTS' || !isSportsEnabled)
                            ? `Arts Category Points & Standings for ${selectedCategory}`
                            : `Sports Category Points & Standings for ${selectedCategory}`}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200 self-start sm:self-auto">
                        {selectedCategory} Category
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(categoryTeamData[selectedCategory] || []).map((team, idx) => {
                        const isArtsMode = isArtsEnabled && (categorySection === 'ARTS' || !isSportsEnabled);
                        const displayPts = isArtsMode ? team.catArtsPts : team.catSportsPts;
                        const rank = isArtsMode ? team.artsRank : team.sportsRank;

                        return (
                          <div
                            key={team.teamId}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group ${
                              idx === 0
                                ? 'bg-gradient-to-r from-amber-500/10 via-amber-50/40 to-white border-amber-300 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              {/* Rank Badge */}
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                                  idx === 0
                                    ? 'bg-amber-400 text-slate-900'
                                    : idx === 1
                                    ? 'bg-slate-300 text-slate-900'
                                    : idx === 2
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {idx === 0 ? <Crown className="w-5 h-5 text-slate-900" /> : `#${idx + 1}`}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: team.teamColor }}
                                  />
                                  <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-red-600 transition-colors">
                                    {team.teamName}
                                  </h4>
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                  {isArtsMode ? 'Arts Category Score' : 'Sports Category Score'}
                                </p>
                              </div>
                            </div>

                            {/* Category Points & Position */}
                            <div className="text-right shrink-0">
                              <span className="text-xl sm:text-2xl font-black font-mono text-red-600 block">
                                {displayPts} pts
                              </span>
                              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 inline-block mt-0.5 shadow-2xs">
                                Position #{rank}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Top Student Performers */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                      <BarChart3 className="w-5 h-5 text-red-600" />
                      Category Top Student Performers ({selectedCategory})
                    </h3>

                    {filteredCandidates.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        No student performers recorded yet in {selectedCategory}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {filteredCandidates.slice(0, 8).map((student, idx) => {
                          const isArtsMode = isArtsEnabled && (categorySection === 'ARTS' || !isSportsEnabled);
                          const totalPts = isArtsMode
                            ? student.artsIndividualPoints || 0
                            : student.sportsIndividualPoints || 0;

                          return (
                            <div
                              key={student.studentId}
                              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold text-slate-400">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                                    {student.studentName}
                                  </h4>
                                  <p className="text-xs text-slate-500 font-medium">
                                    Chest #{student.chestNumber || '—'} • {student.teamName}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-base font-black font-mono text-red-600 block">
                                  {totalPts} pts
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {student.firstCount} Gold
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 2. ALL CATEGORIES: All category points & positions matrix */
                <div className="space-y-6">
                  {/* All Category Points & Positions Table Matrix */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-red-600" />
                          All Categories House Standings & Positions ({isArtsEnabled && (categorySection === 'ARTS' || !isSportsEnabled) ? 'Arts' : 'Sports'})
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Category-by-category house point distribution and relative positions
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 self-start sm:self-auto">
                        {categories.length} Categories • {teams.length} Houses
                      </span>
                    </div>

                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-xs uppercase tracking-wider">
                            <th className="py-3 px-3.5 rounded-l-xl">Rank</th>
                            <th className="py-3 px-3.5">House / Team</th>
                            {categories.map(cat => (
                              <th key={cat} className="py-3 px-3.5 text-center whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedCategory(cat)}
                                  className="hover:text-red-600 underline-offset-2 hover:underline font-black cursor-pointer"
                                >
                                  {cat}
                                </button>
                              </th>
                            ))}
                            <th className="py-3 px-3.5 text-right font-black text-red-600 rounded-r-xl">
                              Total {isArtsEnabled && (categorySection === 'ARTS' || !isSportsEnabled) ? 'Arts' : 'Sports'} Pts
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(isArtsEnabled && (categorySection === 'ARTS' || !isSportsEnabled) ? artsSortedTeams : sportsSortedTeams).map((team, idx) => {
                            const isArtsMode = isArtsEnabled && (categorySection === 'ARTS' || !isSportsEnabled);
                            const totalPts = isArtsMode ? team.artsTotalPoints : team.sportsTotalPoints;

                            return (
                              <tr
                                key={team.teamId}
                                className="hover:bg-slate-50/80 transition-colors"
                              >
                                <td className="py-3.5 px-3.5 font-mono font-bold">
                                  <span
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                                      idx === 0
                                        ? 'bg-amber-400 text-slate-900 shadow-xs'
                                        : idx === 1
                                        ? 'bg-slate-200 text-slate-800'
                                        : idx === 2
                                        ? 'bg-amber-700 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    #{idx + 1}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0"
                                      style={{ backgroundColor: team.teamColor }}
                                    />
                                    <span>{team.teamName}</span>
                                  </div>
                                </td>

                                {/* Points and Position in Each Category */}
                                {categories.map(cat => {
                                  const catEntry = (categoryTeamData[cat] || []).find(
                                    t => t.teamId === team.teamId
                                  );
                                  const catPts = isArtsMode ? catEntry?.catArtsPts || 0 : catEntry?.catSportsPts || 0;
                                  const catRank = isArtsMode ? catEntry?.artsRank || '-' : catEntry?.sportsRank || '-';

                                  return (
                                    <td
                                      key={cat}
                                      className="py-3.5 px-3.5 text-center whitespace-nowrap"
                                    >
                                      <div className="inline-flex flex-col items-center">
                                        <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                                          {catPts} pts
                                        </span>
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                            catRank === 1
                                              ? 'bg-amber-100 text-amber-900 font-black'
                                              : 'bg-slate-100 text-slate-500'
                                          }`}
                                        >
                                          Pos #{catRank}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}

                                <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                                  <span className="font-mono font-black text-red-600 text-base">
                                    {totalPts} pts
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Category Top Student Performers (ALL) */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                      <BarChart3 className="w-5 h-5 text-red-600" />
                      Category Top Student Performers (ALL)
                    </h3>

                    {filteredCandidates.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        No student performers found.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {filteredCandidates.slice(0, 8).map((student, idx) => {
                          const isArtsMode = isArtsEnabled && (categorySection === 'ARTS' || !isSportsEnabled);
                          const totalPts = isArtsMode
                            ? student.artsIndividualPoints || 0
                            : student.sportsIndividualPoints || 0;

                          return (
                            <div
                              key={student.studentId}
                              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold text-slate-400">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                                    {student.studentName}
                                  </h4>
                                  <p className="text-xs text-slate-500 font-medium">
                                    Chest #{student.chestNumber || '—'} • {student.teamName} ({student.category})
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-base font-black font-mono text-red-600 block">
                                  {totalPts} pts
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {student.firstCount} Gold
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORY TOPPERS & GRAND TOPPERS */}
          {activeSubTab === 'TOPPERS' && (
            <div className="space-y-6">
              {/* Controls Bar: Section Switcher & Category Filter */}
              <div className="space-y-3">
                {isArtsEnabled && isSportsEnabled && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        Student Performance Section
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        View individual student toppers filtered by Arts, Sports, or Combined scores.
                      </p>
                    </div>

                    <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setToppersSection('ARTS')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          toppersSection === 'ARTS'
                            ? 'bg-fuchsia-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        Arts Toppers
                      </button>
                      <button
                        type="button"
                        onClick={() => setToppersSection('SPORTS')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          toppersSection === 'SPORTS'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        Sports Toppers
                      </button>
                      <button
                        type="button"
                        onClick={() => setToppersSection('ALL')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          toppersSection === 'ALL'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        Overall Fest Toppers
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  <button
                    onClick={() => setToppersCategoryFilter('ALL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      toppersCategoryFilter === 'ALL'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setToppersCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        toppersCategoryFilter === cat
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. MASTER CARD: GRAND FESTIVAL TOPPERS (ALL-TOPPERS SHOWCASE) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-amber-500/10 via-white to-orange-500/10 border-2 border-amber-200/90 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-black px-3 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                        <Crown className="w-3.5 h-3.5 fill-current" />
                        FESTIVAL CHAMPIONS
                      </span>
                      <span className="text-xs font-bold text-amber-900/70">
                        {toppersSection === 'ARTS'
                          ? 'Arts Festival Overall Toppers'
                          : toppersSection === 'SPORTS'
                          ? 'Sports Meet Overall Toppers'
                          : 'Grand Combined Fest Toppers'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      All-Toppers Master Showcase
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                      The top verified individual high-scorers across all competition categories.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-900">
                      {grandToppers.filter(s => getStudentScore(s, toppersSection) > 0).length} Scored Candidates
                    </span>
                  </div>
                </div>

                {/* Podium Cards for Top 3 Grand Champions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-end">
                  {/* #2 Runner Up */}
                  {(() => {
                    const student = grandToppers[1];
                    const pts = student ? getStudentScore(student, toppersSection) : 0;
                    return (
                      <div className="order-2 md:order-1 p-5 rounded-3xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center space-y-3 relative overflow-hidden">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-black text-slate-700 text-lg shadow-inner">
                          🥈
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            2nd Place • Runner-Up
                          </span>
                          <h3 className="text-base font-black text-slate-900 mt-1.5 line-clamp-1">
                            {student?.studentName || 'Awaiting Results'}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Chest #{student?.chestNumber || '—'} • {student?.category || 'General'}
                          </p>
                        </div>

                        {student && (
                          <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: student.teamColor }} />
                            <span className="text-slate-800">{student.teamName}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-around">
                          <div>
                            <span className="text-xs text-slate-400 font-bold block">Score</span>
                            <span className="text-lg font-black font-mono text-slate-900">{pts} pts</span>
                          </div>
                          {student && (
                            <div className="text-right">
                              <span className="text-xs text-slate-400 font-bold block">Prizes</span>
                              <span className="text-xs font-bold text-slate-700">
                                🥇{student.firstCount} 🥈{student.secondCount} 🥉{student.thirdCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* #1 Grand Champion (Taller & Highlighted) */}
                  {(() => {
                    const student = grandToppers[0];
                    const pts = student ? getStudentScore(student, toppersSection) : 0;
                    return (
                      <div className="order-1 md:order-2 p-6 rounded-3xl bg-linear-to-b from-amber-500/15 via-white to-amber-50/50 border-2 border-amber-400 shadow-lg shadow-amber-500/15 flex flex-col items-center text-center space-y-3 relative overflow-hidden transform md:-translate-y-2">
                        <div className="absolute top-2 right-2">
                          <Crown className="w-6 h-6 text-amber-500 animate-bounce" />
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2 border-amber-500 flex items-center justify-center font-black text-white text-2xl shadow-md shadow-amber-400/30">
                          👑
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-300 shadow-2xs">
                            🥇 1st Place • Grand Champion
                          </span>
                          <h3 className="text-lg font-black text-slate-900 mt-2 line-clamp-1">
                            {student?.studentName || 'Awaiting Results'}
                          </h3>
                          <p className="text-xs text-amber-950 font-bold">
                            Chest #{student?.chestNumber || '—'} • Class {student?.classNumber} • {student?.category}
                          </p>
                        </div>

                        {student && (
                          <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white border border-amber-200 shadow-2xs">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: student.teamColor }} />
                            <span className="text-slate-900 font-extrabold">{student.teamName}</span>
                          </div>
                        )}

                        <div className="pt-3 border-t border-amber-200/80 w-full flex items-center justify-around">
                          <div>
                            <span className="text-xs text-amber-800 font-bold block">Individual Total</span>
                            <span className="text-2xl font-black font-mono text-amber-600">{pts} pts</span>
                          </div>
                          {student && (
                            <div className="text-right">
                              <span className="text-xs text-amber-800 font-bold block">Medal Tally</span>
                              <span className="text-xs font-extrabold text-slate-800">
                                🥇{student.firstCount} 🥈{student.secondCount} 🥉{student.thirdCount} 🎖️{student.gradeACount}A
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* #3 Second Runner Up */}
                  {(() => {
                    const student = grandToppers[2];
                    const pts = student ? getStudentScore(student, toppersSection) : 0;
                    return (
                      <div className="order-3 md:order-3 p-5 rounded-3xl bg-white/90 backdrop-blur-xs border border-orange-200 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center space-y-3 relative overflow-hidden">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 border-2 border-orange-300 flex items-center justify-center font-black text-orange-800 text-lg shadow-inner">
                          🥉
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                            3rd Place • 2nd Runner-Up
                          </span>
                          <h3 className="text-base font-black text-slate-900 mt-1.5 line-clamp-1">
                            {student?.studentName || 'Awaiting Results'}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Chest #{student?.chestNumber || '—'} • {student?.category || 'General'}
                          </p>
                        </div>

                        {student && (
                          <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50/50 border border-orange-200">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: student.teamColor }} />
                            <span className="text-slate-800">{student.teamName}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-around">
                          <div>
                            <span className="text-xs text-slate-400 font-bold block">Score</span>
                            <span className="text-lg font-black font-mono text-slate-900">{pts} pts</span>
                          </div>
                          {student && (
                            <div className="text-right">
                              <span className="text-xs text-slate-400 font-bold block">Prizes</span>
                              <span className="text-xs font-bold text-slate-700">
                                🥇{student.firstCount} 🥈{student.secondCount} 🥉{student.thirdCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Additional Top Performers List (#4 to #10) */}
                {grandToppers.filter(s => getStudentScore(s, toppersSection) > 0).length > 3 && (
                  <div className="pt-4 border-t border-amber-200/60">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                      Top Performers Leaderboard (Rank #4 - #10)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {grandToppers.slice(3, 9).map((student, idx) => {
                        const pts = getStudentScore(student, toppersSection);
                        return (
                          <div
                            key={student.studentId}
                            className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-black text-slate-500 w-5 text-center">
                                #{idx + 4}
                              </span>
                              <div>
                                <h5 className="font-bold text-slate-900 line-clamp-1">
                                  {student.studentName}
                                </h5>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  Chest #{student.chestNumber || '—'} • {student.teamName} ({student.category})
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-black text-slate-900 text-sm">
                              {pts} pts
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CATEGORY-WISE TOPPERS CARDS GRID */}
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-red-500/20">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      Category-Based Student Toppers
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                      Top 3 individual students featured across all active festival categories.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                    {categories.length} Categories Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(toppersCategoryFilter === 'ALL' ? categories : [toppersCategoryFilter]).map(cat => {
                    const catStudents = categoryToppersMap[cat] || [];
                    const top3 = catStudents.slice(0, 3);
                    const topScorerPts = top3[0] ? getStudentScore(top3[0], toppersSection) : 0;

                    return (
                      <div
                        key={cat}
                        className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-red-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between group relative overflow-hidden"
                      >
                        {/* Subtle Corner Ambient Glow */}
                        <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-red-500/5 blur-2xl pointer-events-none group-hover:bg-red-500/10 transition-colors" />

                        <div className="relative z-10 space-y-3.5">
                          {/* Category Card Header */}
                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xs shrink-0 border border-red-100">
                                <GraduationCap className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-wider text-red-600 block">
                                  CATEGORY TOPPERS
                                </span>
                                <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                                  {cat}
                                </h4>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Top Score</span>
                              <span className="text-xs sm:text-sm font-black font-mono px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-100/80 inline-block">
                                {topScorerPts} pts
                              </span>
                            </div>
                          </div>

                          {/* Top 3 Students in this Category */}
                          {top3.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-xs font-medium italic">
                              No students registered in this category yet.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {top3.map((student, posIdx) => {
                                const pts = getStudentScore(student, toppersSection);
                                const isFirst = posIdx === 0;
                                const isSecond = posIdx === 1;
                                const isThird = posIdx === 2;

                                return (
                                  <div
                                    key={student.studentId}
                                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                      isFirst
                                        ? 'bg-gradient-to-r from-amber-100/50 via-amber-50/30 to-white border-amber-300/80 shadow-2xs'
                                        : isSecond
                                        ? 'bg-gradient-to-r from-slate-100/70 via-slate-50/30 to-white border-slate-200/90 shadow-2xs'
                                        : 'bg-gradient-to-r from-orange-100/40 via-orange-50/20 to-white border-orange-200/80 shadow-2xs'
                                    }`}
                                  >
                                    {/* Left: Rank Medal Badge + Student Info */}
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                                          isFirst
                                            ? 'bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 border border-amber-500/80'
                                            : isSecond
                                            ? 'bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-800 border border-slate-300'
                                            : 'bg-gradient-to-tr from-orange-300 to-orange-200 text-orange-950 border border-orange-400'
                                        }`}
                                      >
                                        {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <h5 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                            {student.studentName}
                                          </h5>
                                          {isFirst && pts > 0 && (
                                            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                          )}
                                        </div>

                                        <p className="text-[11px] text-slate-500 font-medium truncate">
                                          Chest <strong className="text-slate-700">#{student.chestNumber || '—'}</strong> • Class {student.classNumber || '—'}
                                        </p>

                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span
                                            className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                            style={{ backgroundColor: student.teamColor }}
                                          />
                                          <span className="text-[10px] font-bold text-slate-600 truncate">
                                            {student.teamName}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right: Points and Prizes Badge */}
                                    <div className="text-right shrink-0">
                                      <span
                                        className={`text-sm sm:text-base font-black font-mono block ${
                                          isFirst ? 'text-amber-700' : 'text-slate-900'
                                        }`}
                                      >
                                        {pts} <span className="text-[10px] font-sans font-bold">pts</span>
                                      </span>

                                      <div className="mt-0.5">
                                        {student.firstCount > 0 || student.secondCount > 0 || student.thirdCount > 0 ? (
                                          <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold">
                                            {student.firstCount > 0 && (
                                              <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                                🥇{student.firstCount}
                                              </span>
                                            )}
                                            {student.secondCount > 0 && (
                                              <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                                🥈{student.secondCount}
                                              </span>
                                            )}
                                            {student.thirdCount > 0 && (
                                              <span className="px-1.5 py-0.2 rounded-md bg-orange-100 text-orange-900 border border-orange-200">
                                                🥉{student.thirdCount}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                            0 Medals
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROGRAMMES (EVENT WINNERS & PROGRAM SEARCH) */}
          {activeSubTab === 'PROGRAMMES' && (
            <div className="space-y-6">
              {/* Filter & Search Toolbar */}
              <div className="space-y-3">
                {/* Search Bar & Primary Filters */}
                <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search published event results by program title, code (e.g. 101), category, or contestant name..."
                      value={searchProgQuery}
                      onChange={e => setSearchProgQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    {isArtsEnabled && isSportsEnabled && (
                      <select
                        value={sectionFilter}
                        onChange={e => setSectionFilter(e.target.value as any)}
                        className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-red-500"
                      >
                        <option value="ALL">All Sections (Arts & Sports)</option>
                        <option value="ARTS">Arts Stage</option>
                        <option value="SPORTS">Sports Ground</option>
                      </select>
                    )}

                    <span className="text-xs font-mono font-bold px-3.5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 shrink-0">
                      {filteredPrograms.length} Published Results
                    </span>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  <button
                    onClick={() => setProgCategoryFilter('ALL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      progCategoryFilter === 'ALL'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setProgCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        progCategoryFilter === cat
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Published Programmes & Results Grid */}
              <div className="space-y-4">
                {filteredPrograms.length === 0 ? (
                  <div className="p-16 text-center bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-3">
                    <Award className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-base font-bold text-slate-800">No Published Results Found</h4>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
                      {searchProgQuery
                        ? `No published results matching "${searchProgQuery}".`
                        : 'Official certified event results will appear here as soon as jury controllers publish competition scores.'}
                    </p>
                  </div>
                ) : (
                  filteredPrograms.map(item => {
                    const hasResult = item.isPublished && item.result && item.result.entries && item.result.entries.length > 0;
                    const sortedEntries = hasResult
                      ? [...item.result!.entries].sort((a, b) => {
                          const posRank: Record<string, number> = { FIRST: 1, SECOND: 2, THIRD: 3, OTHER: 4, NO_PRIZE: 5 };
                          const rankA = posRank[a.position] || 99;
                          const rankB = posRank[b.position] || 99;
                          if (rankA !== rankB) return rankA - rankB;
                          return b.totalPoints - a.totalPoints;
                        })
                      : [];

                    return (
                      <div
                        key={item.id}
                        className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all space-y-4 ${
                          hasResult
                            ? 'border-slate-200/90 hover:border-red-200 shadow-xs hover:shadow-md'
                            : 'border-slate-200/80 bg-slate-50/40'
                        }`}
                      >
                        {/* Event Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              {item.code && (
                                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                  #{item.code}
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                  item.section === 'ARTS'
                                    ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'
                                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                                }`}
                              >
                                {item.section}
                              </span>
                              {item.category && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                  {item.category}
                                </span>
                              )}
                              {item.programType && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {item.programType}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              {item.name}
                            </h4>

                            {(item.stageLocation || item.scheduleTime) && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                                {item.stageLocation && <span>📍 {item.stageLocation}</span>}
                                {item.scheduleTime && <span>🕒 {item.scheduleTime}</span>}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0">
                            {hasResult ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Official Certified Result</span>
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span>Result Awaiting Publishing</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Result Entries / Podium */}
                        {hasResult ? (
                          <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                              Certified Winners & Rankings
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {sortedEntries
                                .filter(e => e.position !== 'NO_PRIZE' && e.position !== 'OTHER')
                                .map((entry, eIdx) => {
                                  const team = teams.find(t => t.id === entry.teamId);
                                  const isFirst = entry.position === 'FIRST';
                                  const isSecond = entry.position === 'SECOND';
                                  const isThird = entry.position === 'THIRD';

                                  return (
                                    <div
                                      key={eIdx}
                                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                        isFirst
                                          ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                                          : isSecond
                                          ? 'bg-slate-50 border-slate-200'
                                          : isThird
                                          ? 'bg-orange-50/50 border-orange-200'
                                          : 'bg-white border-slate-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div
                                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                                            isFirst
                                              ? 'bg-amber-400 text-slate-900 border border-amber-500'
                                              : isSecond
                                              ? 'bg-slate-200 text-slate-800 border border-slate-300'
                                              : isThird
                                              ? 'bg-orange-200 text-orange-900 border border-orange-300'
                                              : 'bg-slate-100 text-slate-600'
                                          }`}
                                        >
                                          {isFirst ? '🥇 #1' : isSecond ? '🥈 #2' : isThird ? '🥉 #3' : `#${eIdx + 1}`}
                                        </div>

                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                              {entry.studentName || entry.groupName}
                                            </p>
                                          </div>
                                          <p className="text-[11px] text-slate-500 font-medium truncate">
                                            Chest #{entry.chestNumber || '—'}
                                          </p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span
                                              className="w-2 h-2 rounded-full shrink-0"
                                              style={{ backgroundColor: team?.color || '#ef4444' }}
                                            />
                                            <span className="text-[10px] font-bold text-slate-600 truncate">
                                              {team?.name || 'House'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <span className="text-xs sm:text-sm font-black font-mono text-slate-900 block">
                                          {entry.totalPoints} pts
                                        </span>
                                        {entry.grade !== 'NONE' && (
                                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                            Grade {entry.grade}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
                            <span className="font-medium">
                              Competition completed or underway. Awaiting jury scoring publication.
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                              Status: {item.status}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CANDIDATE PROFILES (ALL PARTICIPANTS) */}
          {activeSubTab === 'CANDIDATES' && (
            <div className="space-y-5">
              {/* Search Bar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search participant by name, chest number (e.g. 101), or house..."
                    value={searchCandidateQuery}
                    onChange={e => setSearchCandidateQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
              </div>

              {/* Candidate Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredCandidates.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-3xl text-xs font-medium">
                    No participants found matching "{searchCandidateQuery}".
                  </div>
                ) : (
                  filteredCandidates.slice(0, 12).map(candidate => {
                    const isArtsMode = isArtsEnabled && (categorySection === 'ARTS' || !isSportsEnabled);
                    const totalPts = isArtsMode
                      ? candidate.artsIndividualPoints || 0
                      : candidate.sportsIndividualPoints || 0;

                    return (
                      <div
                        key={candidate.studentId}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-red-200 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                            {candidate.studentName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                              {candidate.studentName}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              Chest #{candidate.chestNumber || '—'} • Class {candidate.classNumber}
                            </p>
                            <span className="text-[10px] font-bold text-slate-600">
                              {candidate.teamName} ({candidate.category})
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black font-mono text-slate-900 block">
                            {totalPts}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {isArtsMode ? 'Arts Pts' : 'Sports Pts'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


