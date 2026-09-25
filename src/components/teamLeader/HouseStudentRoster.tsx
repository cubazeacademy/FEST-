import React, { useState, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { Student, FestCategory } from '../../types';
import { triggerExcelDownload, triggerFileDownload } from '../../utils/csvHelpers';
import { SectionBadge, CategoryBadge, PositionBadge, GradeBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Users,
  Search,
  Trophy,
  Award,
  Medal,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  FileSpreadsheet,
  Download,
  Filter,
  ArrowRight,
  UserPlus,
  Sparkles,
  GraduationCap,
  Shield,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Printer
} from 'lucide-react';

interface HouseStudentRosterProps {
  setActiveTab: (tab: string) => void;
  onSelectStudentForRegistration?: (studentId: string) => void;
}

export const HouseStudentRoster: React.FC<HouseStudentRosterProps> = ({
  setActiveTab,
  onSelectStudentForRegistration
}) => {
  const { currentUser } = useAuth();
  const {
    students,
    teams,
    programs,
    registrations,
    results,
    categoryConfigs,
    studentScores,
    settings
  } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;

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

  const validTeamIdentifiers = useMemo(() => {
    return new Set(
      [
        currentUser?.teamId,
        myTeam?.id,
        myTeam?.code,
        myTeam?.name
      ]
        .filter(Boolean)
        .map(s => String(s).toLowerCase().trim())
    );
  }, [currentUser?.teamId, myTeam]);

  // Filter students belonging only to this house
  const houseStudents = useMemo(() => {
    if (!myTeam && !currentUser?.teamId) return [];
    return students.filter(
      s =>
        validTeamIdentifiers.has((s.teamId || '').toLowerCase().trim()) ||
        (myTeam && (s.teamId === myTeam.id || s.teamId?.toLowerCase() === myTeam.name?.toLowerCase()))
    );
  }, [students, myTeam, validTeamIdentifiers]);

  // Filter registrations belonging to this house
  const houseRegistrations = useMemo(() => {
    if (!myTeam && !currentUser?.teamId) return [];
    return registrations.filter(
      r =>
        validTeamIdentifiers.has((r.teamId || '').toLowerCase().trim()) ||
        validTeamIdentifiers.has((r.teamName || '').toLowerCase().trim()) ||
        (myTeam && (r.teamId === myTeam.id || r.teamName?.toLowerCase() === myTeam.name?.toLowerCase()))
    );
  }, [registrations, myTeam, validTeamIdentifiers]);

  // State Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [participationFilter, setParticipationFilter] = useState<'ALL' | 'WITH_POINTS' | 'REGISTERED' | 'NO_REG'>('ALL');
  const [sortBy, setSortBy] = useState<'POINTS_DESC' | 'CHEST_ASC' | 'NAME_ASC' | 'EVENTS_DESC'>('POINTS_DESC');

  // Inspected student modal state
  const [inspectedStudent, setInspectedStudent] = useState<Student | null>(null);

  // Student Score Map for fast lookup
  const studentScoreMap = useMemo(() => {
    const map = new Map<string, any>();
    studentScores.forEach(score => {
      map.set(score.studentId, score);
    });
    return map;
  }, [studentScores]);

  // Registered programs mapping per student
  const studentProgramsMap = useMemo(() => {
    const map = new Map<string, any[]>();

    houseStudents.forEach(stu => {
      // Individual registrations
      const indivRegs = houseRegistrations.filter(
        r => r.studentId === stu.id && r.status !== 'WITHDRAWN'
      );

      // Group registrations
      const grpRegs = houseRegistrations.filter(
        r =>
          r.status !== 'WITHDRAWN' &&
          r.groupMembers?.some(m => m.studentId === stu.id)
      );

      const allStuRegs = [...indivRegs, ...grpRegs].filter(reg => {
        const prog = programs.find(p => p.id === reg.programId);
        const sec = prog?.section || reg.section;
        if (!isArtsEnabled && sec === 'ARTS') return false;
        if (!isSportsEnabled && sec === 'SPORTS') return false;
        return true;
      });

      const progDetails = allStuRegs.map(reg => {
        const prog = programs.find(p => p.id === reg.programId);
        const pubResult = results.find(
          r => r.programId === reg.programId && r.status === 'PUBLISHED'
        );

        let resultEntry = undefined;
        if (pubResult) {
          resultEntry = pubResult.entries.find(
            e =>
              e.studentId === stu.id ||
              e.registrationId === reg.id ||
              e.groupMembers?.some(m => m.studentId === stu.id)
          );
        }

        return {
          registration: reg,
          program: prog,
          result: pubResult,
          entry: resultEntry
        };
      });

      map.set(stu.id, progDetails);
    });

    return map;
  }, [houseStudents, houseRegistrations, programs, results, isArtsEnabled, isSportsEnabled]);

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    return houseStudents
      .filter(stu => {
        const q = searchQuery.toLowerCase().trim();
        const score = studentScoreMap.get(stu.id);
        const stuPrograms = studentProgramsMap.get(stu.id) || [];

        const matchSearch =
          !q ||
          stu.name.toLowerCase().includes(q) ||
          stu.admissionNo.toLowerCase().includes(q) ||
          (stu.chestNumber && stu.chestNumber.toString().includes(q)) ||
          (stu.classNumber && stu.classNumber.toLowerCase().includes(q)) ||
          stuPrograms.some(p => p.program?.name.toLowerCase().includes(q) || p.program?.code.toLowerCase().includes(q));

        const matchCategory = selectedCategory === 'ALL' || stu.category === selectedCategory;

        let matchPart = true;
        if (participationFilter === 'WITH_POINTS') {
          const pts = (score?.artsIndividualPoints || 0) + (score?.sportsIndividualPoints || 0);
          matchPart = pts > 0;
        } else if (participationFilter === 'REGISTERED') {
          matchPart = stuPrograms.length > 0;
        } else if (participationFilter === 'NO_REG') {
          matchPart = stuPrograms.length === 0;
        }

        return matchSearch && matchCategory && matchPart;
      })
      .sort((a, b) => {
        const scoreA = studentScoreMap.get(a.id);
        const scoreB = studentScoreMap.get(b.id);
        const ptsA = (scoreA?.artsIndividualPoints || 0) + (scoreA?.sportsIndividualPoints || 0);
        const ptsB = (scoreB?.artsIndividualPoints || 0) + (scoreB?.sportsIndividualPoints || 0);
        const countA = (studentProgramsMap.get(a.id) || []).length;
        const countB = (studentProgramsMap.get(b.id) || []).length;

        if (sortBy === 'POINTS_DESC') {
          if (ptsB !== ptsA) return ptsB - ptsA;
          return (Number(a.chestNumber) || 9999) - (Number(b.chestNumber) || 9999);
        }
        if (sortBy === 'CHEST_ASC') {
          return (Number(a.chestNumber) || 9999) - (Number(b.chestNumber) || 9999);
        }
        if (sortBy === 'NAME_ASC') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'EVENTS_DESC') {
          return countB - countA;
        }
        return 0;
      });
  }, [houseStudents, searchQuery, selectedCategory, participationFilter, sortBy, studentScoreMap, studentProgramsMap]);

  // House Totals
  const houseTotals = useMemo(() => {
    let artsPts = 0;
    let sportsPts = 0;
    let goldCount = 0;
    let silverCount = 0;
    let bronzeCount = 0;
    let activeParticipants = 0;

    houseStudents.forEach(stu => {
      const score = studentScoreMap.get(stu.id);
      const progCount = (studentProgramsMap.get(stu.id) || []).length;
      if (progCount > 0) activeParticipants++;

      if (score) {
        artsPts += isArtsEnabled ? (score.artsIndividualPoints || 0) : 0;
        sportsPts += isSportsEnabled ? (score.sportsIndividualPoints || 0) : 0;
        goldCount += score.firstCount || 0;
        silverCount += score.secondCount || 0;
        bronzeCount += score.thirdCount || 0;
      }
    });

    return {
      artsPts,
      sportsPts,
      totalPts: artsPts + sportsPts,
      goldCount,
      silverCount,
      bronzeCount,
      activeParticipants
    };
  }, [houseStudents, studentScoreMap, studentProgramsMap, isArtsEnabled, isSportsEnabled]);

  const handleExportSpreadsheet = (format: 'csv' | 'xlsx' = 'xlsx') => {
    const headers = [
      'Chest No',
      'Student Name',
      'Admission No',
      'Class',
      'Category',
      'House',
      'Registered Events Count',
      ...(isArtsEnabled ? ['Arts Points'] : []),
      ...(isSportsEnabled ? ['Sports Points'] : []),
      'Total Points',
      '1st Place',
      '2nd Place',
      '3rd Place',
      'Registered Programs List'
    ];

    const rows = filteredStudents.map(stu => {
      const score = studentScoreMap.get(stu.id);
      const progs = studentProgramsMap.get(stu.id) || [];
      const progTitles = progs.map(p => p.program ? `${p.program.code}: ${p.program.name}` : 'Unknown').join('; ');
      const aPts = isArtsEnabled ? (score?.artsIndividualPoints || 0) : 0;
      const sPts = isSportsEnabled ? (score?.sportsIndividualPoints || 0) : 0;

      return [
        stu.chestNumber || '',
        stu.name,
        stu.admissionNo,
        stu.classNumber || '-',
        stu.category,
        myTeam?.name || 'House',
        progs.length,
        ...(isArtsEnabled ? [aPts] : []),
        ...(isSportsEnabled ? [sPts] : []),
        aPts + sPts,
        score?.firstCount || 0,
        score?.secondCount || 0,
        score?.thirdCount || 0,
        progTitles
      ];
    });

    const fullData = [headers, ...rows];
    const filename = `${myTeam?.code || 'House'}_Students_Performance_Roster_${Date.now()}`;

    if (format === 'xlsx') {
      triggerExcelDownload(fullData, `${filename}.xlsx`, 'HouseRoster');
    } else {
      const csvContent = fullData
        .map(row => row.map(cell => (typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(','))
        .join('\n');
      triggerFileDownload(csvContent, `${filename}.csv`);
    }
  };

  const handleRegisterNew = (studentId: string) => {
    if (onSelectStudentForRegistration) {
      onSelectStudentForRegistration(studentId);
    }
    setActiveTab('tl_reg_individual');
  };

  const teamColor = myTeam?.color || '#ef4444';

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* House Header Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl transition-all"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${teamColor}1a 0%, transparent 60%), radial-gradient(circle at 0% 100%, ${teamColor}0d 0%, transparent 50%), linear-gradient(135deg, #ffffff 40%, #f8fafc 100%)`
        }}
      >
        {/* Ambient Glow */}
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: teamColor }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
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
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-white shadow-sm">
                  TEAM {myTeam?.name ? myTeam.name.toUpperCase() : 'SARAHA'} Roster
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Leader: <strong className="text-slate-900">{currentUser.name}</strong>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                TEAM {myTeam?.name ? myTeam.name.toUpperCase() : 'SARAHA'} Candidates & Performance Matrix
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                Dedicated student dossier and live points roster for <strong className="text-slate-900">TEAM {myTeam?.name ? myTeam.name.toUpperCase() : 'SARAHA'}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => handleExportSpreadsheet('xlsx')}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold shadow-2xs border border-emerald-200/60 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Export House Student Performance Roster to Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => handleExportSpreadsheet('csv')}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Export House Student Performance Roster to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </button>
            </div>
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
              <span>Register Events</span>
            </button>
          </div>
        </div>
      </div>

      {/* House Performance Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-1" style={{ color: teamColor }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Roster</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono mt-1" style={{ color: teamColor }}>{houseStudents.length}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{houseTotals.activeParticipants} enrolled in events</p>
        </div>

        {isArtsEnabled && (
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Arts Points</span>
              <Award className="w-4 h-4" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">{houseTotals.artsPts} pts</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Stage & Non-Stage tally</p>
          </div>
        )}

        {isSportsEnabled && (
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sports Points</span>
              <Flame className="w-4 h-4" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">{houseTotals.sportsPts} pts</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Athletics & Games score</p>
          </div>
        )}

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Medals Won</span>
            <Trophy className="w-4 h-4" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono flex items-center gap-1.5 mt-1">
            <span>🥇{houseTotals.goldCount}</span>
            <span>🥈{houseTotals.silverCount}</span>
            <span>🥉{houseTotals.bronzeCount}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Top-3 podium finishes</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-1" style={{ color: teamColor }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Event Registrations</span>
            <CalendarCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono mt-1" style={{ color: teamColor }}>{houseRegistrations.length}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Confirmed candidate slots</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate by name, chest #, admission no, class, or program..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categoryConfigs.map(c => (
              <option key={c.id} value={c.category}>
                {c.displayName}
              </option>
            ))}
          </select>

          <select
            value={participationFilter}
            onChange={e => setParticipationFilter(e.target.value as any)}
            className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Candidates</option>
            <option value="WITH_POINTS">With Points / Medals</option>
            <option value="REGISTERED">With Registered Events</option>
            <option value="NO_REG">No Registrations</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="POINTS_DESC">Sort: Points (High to Low)</option>
            <option value="CHEST_ASC">Sort: Chest No (Ascending)</option>
            <option value="NAME_ASC">Sort: Name (A to Z)</option>
            <option value="EVENTS_DESC">Sort: Events Count</option>
          </select>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" style={{ color: teamColor }} />
            TEAM {myTeam?.name ? myTeam.name.toUpperCase() : 'SARAHA'} Candidates ({filteredStudents.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Showing only <strong className="text-slate-800">TEAM {myTeam?.name ? myTeam.name.toUpperCase() : 'SARAHA'}</strong> candidates
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">No candidates match the current filter</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query or reset the category and participation filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredStudents.map(stu => {
              const score = studentScoreMap.get(stu.id);
              const progs = studentProgramsMap.get(stu.id) || [];
              const artsPts = score?.artsIndividualPoints || 0;
              const sportsPts = score?.sportsIndividualPoints || 0;
              const totalPts = artsPts + sportsPts;
              const firsts = score?.firstCount || 0;
              const seconds = score?.secondCount || 0;
              const thirds = score?.thirdCount || 0;

              return (
                <div
                  key={stu.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Chest No & Category */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs shadow-xs">
                          #{stu.chestNumber || 'NO CHEST'}
                        </span>
                        <CategoryBadge category={stu.category} />
                      </div>

                      <span className="text-[11px] font-bold text-slate-500 font-mono">
                        Adm: {stu.admissionNo}
                      </span>
                    </div>

                    {/* Candidate Name & Class */}
                    <h4 className="text-base font-bold text-slate-900 transition-colors">
                      {stu.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {stu.classNumber ? `Class ${stu.classNumber}` : 'Class Unassigned'} • {stu.gender || 'Student'}
                    </p>

                    {/* Points & Medals Strip */}
                    <div className="mt-4 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Total Score
                        </span>
                        <span className="text-lg font-black font-mono" style={{ color: teamColor }}>
                          {totalPts} <span className="text-xs font-semibold text-slate-500">pts</span>
                        </span>
                      </div>

                      {isArtsEnabled && isSportsEnabled && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Arts / Sports
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold mt-0.5">
                            <span className="text-slate-800">{artsPts}A</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-800">{sportsPts}S</span>
                          </div>
                        </div>
                      )}

                      {isArtsEnabled && !isSportsEnabled && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Arts Score
                          </span>
                          <span className="text-slate-800 font-mono text-xs font-bold mt-0.5 block">
                            {artsPts} pts
                          </span>
                        </div>
                      )}

                      {!isArtsEnabled && isSportsEnabled && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Sports Score
                          </span>
                          <span className="text-slate-800 font-mono text-xs font-bold mt-0.5 block">
                            {sportsPts} pts
                          </span>
                        </div>
                      )}

                      {(firsts > 0 || seconds > 0 || thirds > 0) && (
                        <div className="text-right border-l border-slate-200 pl-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Medals
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {firsts > 0 && `🥇${firsts}`} {seconds > 0 && `🥈${seconds}`} {thirds > 0 && `🥉${thirds}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Registered Programs Quick Summary */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="w-3.5 h-3.5" style={{ color: teamColor }} />
                          Registered Events ({progs.length})
                        </span>
                      </div>

                      {progs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1 font-normal">
                          No events registered yet.
                        </p>
                      ) : (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {progs.slice(0, 3).map((item, pIdx) => {
                            const prog = item.program;
                            const resEntry = item.entry;
                            return (
                              <div
                                key={pIdx}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex items-center justify-between gap-1"
                              >
                                <span className="font-medium text-slate-800 truncate">
                                  {prog ? prog.name : 'Registered Event'}
                                </span>
                                {resEntry && resEntry.position ? (
                                  <span
                                    className="font-bold text-[10px] px-1.5 py-0.5 rounded border shrink-0"
                                    style={{
                                      backgroundColor: `${teamColor}12`,
                                      borderColor: `${teamColor}30`,
                                      color: teamColor
                                    }}
                                  >
                                    {resEntry.position === 1 ? '🥇 1st' : resEntry.position === 2 ? '🥈 2nd' : '🥉 3rd'} ({resEntry.points}pts)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {prog?.section}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {progs.length > 3 && (
                            <p className="text-[11px] font-bold text-right pt-0.5" style={{ color: teamColor }}>
                              +{progs.length - 3} more event(s)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleRegisterNew(stu.id)}
                      disabled={!settings.registrationOpen}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer py-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> + Register Event
                    </button>

                    <button
                      onClick={() => setInspectedStudent(stu)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs border"
                      style={{
                        backgroundColor: `${teamColor}12`,
                        borderColor: `${teamColor}30`,
                        color: teamColor
                      }}
                    >
                      Full Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Student Portfolio & Registered Programs Modal */}
      {inspectedStudent && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedStudent(null)}
          title={`Candidate Details: ${inspectedStudent.name}`}
          subtitle={`Chest #${inspectedStudent.chestNumber || 'N/A'} • Admission: ${inspectedStudent.admissionNo} • ${myTeam?.name || 'House'}`}
          maxWidth="2xl"
        >
          {(() => {
            const score = studentScoreMap.get(inspectedStudent.id);
            const progs = studentProgramsMap.get(inspectedStudent.id) || [];
            const artsPts = score?.artsIndividualPoints || 0;
            const sportsPts = score?.sportsIndividualPoints || 0;
            const totalPts = artsPts + sportsPts;

            return (
              <div className="p-6 space-y-6">
                {/* Top Profile Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-sm">
                      #{inspectedStudent.chestNumber || 'NO CHEST'}
                    </span>
                    <CategoryBadge category={inspectedStudent.category} />
                    <span
                      className="px-3 py-1 rounded-xl text-white font-bold text-xs shadow-xs"
                      style={{ backgroundColor: teamColor }}
                    >
                      {myTeam?.name || 'House'}
                    </span>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                      {inspectedStudent.classNumber ? `Class ${inspectedStudent.classNumber}` : 'Class Unassigned'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Points Won
                    </span>
                    <span className="text-2xl font-black font-mono" style={{ color: teamColor }}>
                      {totalPts} pts
                    </span>
                  </div>
                </div>

                {/* Points Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Arts Score
                    </span>
                    <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{artsPts} pts</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Sports Score
                    </span>
                    <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{sportsPts} pts</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Podium Positions
                    </span>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      🥇{score?.firstCount || 0} 🥈{score?.secondCount || 0} 🥉{score?.thirdCount || 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Events Enrolled
                    </span>
                    <p className="text-xl font-black font-mono mt-0.5" style={{ color: teamColor }}>{progs.length}</p>
                  </div>
                </div>

                {/* All Registered Programs with Result Status */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4" style={{ color: teamColor }} />
                    All Registered Programs ({progs.length})
                  </h4>

                  {progs.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      This student is not enrolled in any programs yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {progs.map((item, idx) => {
                        const prog = item.program;
                        const reg = item.registration;
                        const res = item.result;
                        const entry = item.entry;
                        const isPublished = res && res.status === 'PUBLISHED';

                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
                                  {prog?.code || 'EVT'}
                                </span>
                                <h5 className="text-sm font-bold text-slate-900">{prog?.name || reg.programName}</h5>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {prog && <SectionBadge section={prog.section} />}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isPublished
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {isPublished ? 'PUBLISHED' : 'PENDING'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {prog?.stageLocation || 'Venue TBD'}
                              </span>
                              <span className="flex items-center gap-1 font-mono truncate">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {prog?.scheduleTime || 'Time TBD'}
                              </span>
                              <span className="truncate">
                                Format: <strong className="text-slate-700">{reg.programType}</strong>
                              </span>
                            </div>

                            {/* Result Award Card if Published */}
                            {entry && isPublished && (
                              <div className="mt-2 p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  {entry.position && <PositionBadge position={entry.position} />}
                                  {entry.grade && <GradeBadge grade={entry.grade} />}
                                </div>
                                <span className="font-mono font-black text-emerald-700 text-sm">
                                  +{entry.points || 0} pts
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      const stuId = inspectedStudent.id;
                      setInspectedStudent(null);
                      handleRegisterNew(stuId);
                    }}
                    disabled={!settings.registrationOpen}
                    style={{ backgroundColor: teamColor, boxShadow: `0 4px 12px 0 ${teamColor}35` }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register for Another Program
                  </button>

                  <button
                    onClick={() => setInspectedStudent(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
