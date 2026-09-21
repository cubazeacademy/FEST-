import React, { useState, useEffect, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { AwardPosition, AwardGrade, ResultEntry, Program } from '../../types';
import { Modal } from '../common/Modal';
import {
  Trophy,
  Search,
  Sliders,
  Filter,
  Trash2,
  Download,
  Upload,
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  SlidersHorizontal,
  Printer,
  ArrowUpDown,
  Layers,
  Clock
} from 'lucide-react';

interface ResultEntryMatrixProps {
  initialProgramId?: string;
  onProgramChange?: (progId: string) => void;
}

type StatusFilterType = 'ALL' | 'NOT_ENTERED' | 'ENTERED' | 'PUBLISHED' | 'PRINTED';
type ActiveTabType = 'SCORES' | 'RESULT' | 'SETTINGS';

export const ResultEntryMatrix: React.FC<ResultEntryMatrixProps> = ({
  initialProgramId,
  onProgramChange
}) => {
  const { currentUser } = useAuth();
  const {
    programs,
    registrations,
    results,
    scoringConfigs,
    settings,
    saveOrSubmitResult,
    unpublishResult,
    deleteResult,
    updateProgramTypePositionConfig,
    updateProgramTypeGradeConfig
  } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;

  // Active programs filtered by enabled sections
  const activeSectionPrograms = useMemo(() => {
    return programs.filter(p => {
      if (p.section === 'ARTS' && !isArtsEnabled) return false;
      if (p.section === 'SPORTS' && !isSportsEnabled) return false;
      return true;
    });
  }, [programs, isArtsEnabled, isSportsEnabled]);

  // Left Sidebar States
  const [progSearch, setProgSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'ARTS' | 'SPORTS'>('ALL');

  // Selected Program
  const [selectedProgId, setSelectedProgId] = useState<string>(
    initialProgramId || activeSectionPrograms[0]?.id || ''
  );

  // Right Workspace States
  const [activeTab, setActiveTab] = useState<ActiveTabType>('RESULT');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [isManualResultMode, setIsManualResultMode] = useState(true);
  const [isScoreSettingsModalOpen, setIsScoreSettingsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Summary Metrics Counts
  const stats = useMemo(() => {
    const total = activeSectionPrograms.length;
    const published = activeSectionPrograms.filter(p => p.resultStatus === 'PUBLISHED').length;
    const entered = activeSectionPrograms.filter(p => p.resultStatus === 'DRAFT' || p.resultStatus === 'SUBMITTED').length;
    const notEntered = activeSectionPrograms.filter(p => p.resultStatus === 'PENDING' || !p.resultStatus).length;
    return { total, published, entered, notEntered };
  }, [activeSectionPrograms]);

  // Keep selectedProgId in sync if initialProgramId prop changes or if current selected program is in a disabled section
  useEffect(() => {
    if (initialProgramId && activeSectionPrograms.some(p => p.id === initialProgramId)) {
      setSelectedProgId(initialProgramId);
    } else if (!activeSectionPrograms.some(p => p.id === selectedProgId)) {
      setSelectedProgId(activeSectionPrograms[0]?.id || '');
    }
  }, [initialProgramId, activeSectionPrograms, selectedProgId]);

  // Current Program & Results
  const activeProgram: Program | undefined = useMemo(() => {
    return activeSectionPrograms.find(p => p.id === selectedProgId) || activeSectionPrograms[0];
  }, [activeSectionPrograms, selectedProgId]);

  const activeProgType = activeProgram?.programType || 'INDIVIDUAL';
  const activePositionConfigs = scoringConfigs[activeProgType]?.positionConfigs || [];
  const activeGradeConfigs = scoringConfigs[activeProgType]?.gradeConfigs || [];

  // Active registrations for this program
  const programRegistrations = useMemo(() => {
    if (!activeProgram) return [];
    return registrations.filter(r => r.programId === activeProgram.id && r.status === 'CONFIRMED');
  }, [activeProgram, registrations]);

  // Existing result in database
  const existingResult = useMemo(() => {
    if (!activeProgram) return undefined;
    return results.find(r => r.programId === activeProgram.id);
  }, [activeProgram, results]);

  // Local Editable Result Entries
  const [entries, setEntries] = useState<ResultEntry[]>([]);
  const [candidateScores, setCandidateScores] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState('');

  // Synchronize local entries with existing result or new registrations
  useEffect(() => {
    if (!activeProgram) return;

    if (existingResult) {
      setEntries(existingResult.entries || []);
      setRemarks(existingResult.remarks || '');
    } else {
      // Generate default entries from registered contestants
      const draftEntries: ResultEntry[] = programRegistrations.map((reg, idx) => ({
        id: 'ent_' + reg.id + '_' + idx,
        registrationId: reg.id,
        teamId: reg.teamId,
        teamName: reg.teamName,
        studentId: reg.studentId,
        studentName: reg.studentName,
        chestNumber: reg.chestNumber,
        admissionNo: reg.admissionNo,
        groupId: reg.groupId,
        groupName: reg.groupName,
        groupMembers: reg.groupMembers,
        position: 'NO_PRIZE',
        grade: 'NONE',
        positionPoints: 0,
        gradePoints: 0,
        totalPoints: 0,
        codeLetter: '-'
      }));
      setEntries(draftEntries);
      setRemarks('');
    }
  }, [activeProgram?.id, existingResult, programRegistrations]);

  // Filter Programs for Left Sidebar
  const filteredPrograms = useMemo(() => {
    return activeSectionPrograms.filter(prog => {
      const q = progSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        prog.name.toLowerCase().includes(q) ||
        prog.code.toLowerCase().includes(q) ||
        prog.category.toLowerCase().includes(q);

      const matchSec = sectionFilter === 'ALL' || prog.section === sectionFilter;

      const isPublished = prog.resultStatus === 'PUBLISHED';
      const isEntered = prog.resultStatus === 'DRAFT' || prog.resultStatus === 'SUBMITTED';
      const isNotEntered = prog.resultStatus === 'PENDING' || !prog.resultStatus;

      let matchStatus = true;
      if (statusFilter === 'PUBLISHED') matchStatus = isPublished;
      else if (statusFilter === 'ENTERED') matchStatus = isEntered;
      else if (statusFilter === 'NOT_ENTERED') matchStatus = isNotEntered;
      else if (statusFilter === 'PRINTED') matchStatus = isPublished;

      return matchQ && matchSec && matchStatus;
    });
  }, [activeSectionPrograms, progSearch, sectionFilter, statusFilter]);

  // Cycle Programs with Navigation Chevrons
  const handleNextProgram = () => {
    const currentIndex = activeSectionPrograms.findIndex(p => p.id === activeProgram?.id);
    if (currentIndex >= 0 && currentIndex < activeSectionPrograms.length - 1) {
      const nextProg = activeSectionPrograms[currentIndex + 1];
      setSelectedProgId(nextProg.id);
      if (onProgramChange) onProgramChange(nextProg.id);
    }
  };

  const handlePrevProgram = () => {
    const currentIndex = activeSectionPrograms.findIndex(p => p.id === activeProgram?.id);
    if (currentIndex > 0) {
      const prevProg = activeSectionPrograms[currentIndex - 1];
      setSelectedProgId(prevProg.id);
      if (onProgramChange) onProgramChange(prevProg.id);
    }
  };

  // Handle Position Change via Radio Buttons
  const handlePositionSelect = (entryIndex: number, newPosition: AwardPosition) => {
    setEntries(prev => {
      const next = [...prev];
      const target = next[entryIndex];
      const currentPos = target.position;

      // Toggle off if clicked again, or set new position
      const finalPos: AwardPosition = currentPos === newPosition ? 'NO_PRIZE' : newPosition;

      const posConfig = activePositionConfigs.find(p => p.position === finalPos && p.active);
      const grdConfig = activeGradeConfigs.find(g => g.grade === target.grade && g.active);
      const posPoints = posConfig?.points || 0;
      const grdPoints = grdConfig?.points || 0;

      next[entryIndex] = {
        ...target,
        position: finalPos,
        positionPoints: posPoints,
        gradePoints: grdPoints,
        totalPoints: posPoints + grdPoints
      };
      return next;
    });
  };

  // Handle Grade Change via Selection Pills
  const handleGradeSelect = (entryIndex: number, newGrade: AwardGrade) => {
    setEntries(prev => {
      const next = [...prev];
      const target = next[entryIndex];
      const currentGrade = target.grade;

      // Toggle off if clicked again, or set new grade
      const finalGrade: AwardGrade = currentGrade === newGrade ? 'NONE' : newGrade;

      const posConfig = activePositionConfigs.find(p => p.position === target.position && p.active);
      const grdConfig = activeGradeConfigs.find(g => g.grade === finalGrade && g.active);
      const posPoints = posConfig?.points || 0;
      const grdPoints = grdConfig?.points || 0;

      next[entryIndex] = {
        ...target,
        grade: finalGrade,
        positionPoints: posPoints,
        gradePoints: grdPoints,
        totalPoints: posPoints + grdPoints
      };
      return next;
    });
  };

  // Handle Code Letter Change
  const handleCodeLetterChange = (entryIndex: number, code: string) => {
    setEntries(prev => {
      const next = [...prev];
      next[entryIndex] = {
        ...next[entryIndex],
        codeLetter: code.toUpperCase()
      };
      return next;
    });
  };

  // Clear Candidate Position & Grade
  const handleClearCandidate = (entryIndex: number) => {
    setEntries(prev => {
      const next = [...prev];
      const target = next[entryIndex];

      next[entryIndex] = {
        ...target,
        position: 'NO_PRIZE',
        grade: 'NONE',
        positionPoints: 0,
        gradePoints: 0,
        totalPoints: 0
      };
      return next;
    });
  };

  // Auto-Calculate Scores based on Marks / Points
  const handleAutoCalculateScores = () => {
    if (entries.length === 0) return;

    // If candidateScores has data, sort by score descending
    const entriesWithScores = entries.map(ent => ({
      ent,
      score: candidateScores[ent.id] ?? (ent.totalPoints > 0 ? ent.totalPoints : Math.floor(Math.random() * 40) + 60)
    }));

    entriesWithScores.sort((a, b) => b.score - a.score);

    const firstPosPoint = activePositionConfigs.find(p => p.position === 'FIRST')?.points || 5;
    const secondPosPoint = activePositionConfigs.find(p => p.position === 'SECOND')?.points || 3;
    const thirdPosPoint = activePositionConfigs.find(p => p.position === 'THIRD')?.points || 1;

    const gradeAPoint = activeGradeConfigs.find(g => g.grade === 'A')?.points || 5;
    const gradeBPoint = activeGradeConfigs.find(g => g.grade === 'B')?.points || 3;
    const gradeCPoint = activeGradeConfigs.find(g => g.grade === 'C')?.points || 1;

    const newEntries = entries.map(entry => {
      const rankIdx = entriesWithScores.findIndex(item => item.ent.id === entry.id);
      const score = entriesWithScores[rankIdx]?.score || 0;

      let pos: AwardPosition = 'NO_PRIZE';
      let posPts = 0;
      let grd: AwardGrade = 'NONE';
      let grdPts = 0;

      if (rankIdx === 0) {
        pos = 'FIRST';
        posPts = firstPosPoint;
      } else if (rankIdx === 1) {
        pos = 'SECOND';
        posPts = secondPosPoint;
      } else if (rankIdx === 2) {
        pos = 'THIRD';
        posPts = thirdPosPoint;
      }

      // Grade allocation based on score/performance
      if (score >= 80 || rankIdx === 0) {
        grd = 'A';
        grdPts = gradeAPoint;
      } else if (score >= 65 || rankIdx === 1 || rankIdx === 2) {
        grd = 'B';
        grdPts = gradeBPoint;
      } else if (score >= 50) {
        grd = 'C';
        grdPts = gradeCPoint;
      }

      return {
        ...entry,
        position: pos,
        grade: grd,
        positionPoints: posPts,
        gradePoints: grdPts,
        totalPoints: posPts + grdPts
      };
    });

    setEntries(newEntries);
    setFeedback({
      success: true,
      msg: `Auto-calculation complete! Assigned Positions (1st, 2nd, 3rd) and Performance Grades (A, B, C) with atomic point tallies.`
    });
  };

  // Save / Publish
  const handleSaveOrPublish = (isPublish: boolean) => {
    if (!activeProgram) return;

    const res = saveOrSubmitResult(
      {
        id: existingResult?.id,
        programId: activeProgram.id,
        programName: activeProgram.name,
        section: activeProgram.section,
        category: activeProgram.category,
        programType: activeProgram.programType,
        status: isPublish ? 'PUBLISHED' : 'DRAFT',
        submittedBy: currentUser.name,
        entries,
        remarks: remarks.trim() || undefined
      },
      isPublish,
      currentUser.name,
      currentUser.role
    );

    if (res.success) {
      setFeedback({
        success: true,
        msg: isPublish
          ? `Result for "${activeProgram.name}" successfully published to the live championship board!`
          : `Draft results for "${activeProgram.name}" saved successfully!`
      });
    } else {
      setFeedback({ success: false, msg: res.error || 'Failed to save results.' });
    }
  };

  // Unpublish Result
  const handleUnpublish = () => {
    if (!activeProgram) return;
    const res = unpublishResult(activeProgram.id, currentUser.name, currentUser.role);
    if (res.success) {
      setFeedback({
        success: true,
        msg: `Results for "${activeProgram.name}" unpublished and reverted to Draft mode.`
      });
    }
  };

  // Delete / Reset Result
  const handleDeleteResult = () => {
    if (!activeProgram) return;
    const res = deleteResult(activeProgram.id, currentUser.name, currentUser.role);
    setIsDeleteConfirmOpen(false);
    if (res.success) {
      setFeedback({
        success: true,
        msg: `Result record for "${activeProgram.name}" removed.`
      });
      // Reset entries
      const draftEntries: ResultEntry[] = programRegistrations.map((reg, idx) => ({
        id: 'ent_' + reg.id + '_' + idx,
        registrationId: reg.id,
        teamId: reg.teamId,
        teamName: reg.teamName,
        studentId: reg.studentId,
        studentName: reg.studentName,
        chestNumber: reg.chestNumber,
        admissionNo: reg.admissionNo,
        groupId: reg.groupId,
        groupName: reg.groupName,
        groupMembers: reg.groupMembers,
        position: 'NO_PRIZE',
        grade: 'NONE',
        positionPoints: 0,
        gradePoints: 0,
        totalPoints: 0,
        codeLetter: '-'
      }));
      setEntries(draftEntries);
    }
  };

  // Filter Candidates inside the table
  const displayedEntries = useMemo(() => {
    if (!candidateSearch.trim()) return entries;
    const q = candidateSearch.toLowerCase().trim();
    return entries.filter(ent =>
      (ent.studentName && ent.studentName.toLowerCase().includes(q)) ||
      (ent.groupName && ent.groupName.toLowerCase().includes(q)) ||
      (ent.teamName && ent.teamName.toLowerCase().includes(q)) ||
      (ent.chestNumber && ent.chestNumber.toString().includes(q)) ||
      (ent.codeLetter && ent.codeLetter.toLowerCase().includes(q))
    );
  }, [entries, candidateSearch]);

  const isPublished = activeProgram?.resultStatus === 'PUBLISHED';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span>main</span>
            <span>&gt;</span>
            <span className="text-slate-600 font-bold">Results</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5 mt-0.5 tracking-tight">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200/80 shadow-[0_4px_16px_rgba(244,63,94,0.18)] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-rose-500" />
            </div>
            Results
          </h1>
        </div>

        {/* Global Action / Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Scoresheet
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* UPPER SUMMARY METRICS CARDS ROW (Enhanced Outer Glow & Shadow) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Programmes Card */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer group ${
            statusFilter === 'ALL'
              ? 'bg-gradient-to-b from-indigo-50/70 to-white border-indigo-400 ring-2 ring-indigo-500/25 shadow-[0_12px_32px_rgba(99,102,241,0.22)] -translate-y-0.5'
              : 'bg-white border-slate-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-indigo-200 hover:shadow-[0_12px_30px_rgba(99,102,241,0.15)] hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Events</span>
            <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-[0_4px_12px_rgba(99,102,241,0.15)] group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium block mt-1">
              {isArtsEnabled && isSportsEnabled ? 'Arts & Sports Programs' : isArtsEnabled ? 'Arts Programs' : 'Sports Programs'}
            </span>
          </div>
        </div>

        {/* Published Results Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'PUBLISHED' ? 'ALL' : 'PUBLISHED')}
          className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer group ${
            statusFilter === 'PUBLISHED'
              ? 'bg-gradient-to-b from-emerald-50/70 to-white border-emerald-400 ring-2 ring-emerald-500/25 shadow-[0_12px_32px_rgba(16,185,129,0.22)] -translate-y-0.5'
              : 'bg-white border-slate-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-emerald-200 hover:shadow-[0_12px_30px_rgba(16,185,129,0.16)] hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Published</span>
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">{stats.published}</span>
            <span className="text-xs text-emerald-600/80 font-medium block mt-1">Live on Leaderboard</span>
          </div>
        </div>

        {/* Result Entered / Pending to Publish Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'ENTERED' ? 'ALL' : 'ENTERED')}
          className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer group ${
            statusFilter === 'ENTERED'
              ? 'bg-gradient-to-b from-amber-50/70 to-white border-amber-400 ring-2 ring-amber-500/25 shadow-[0_12px_32px_rgba(245,158,11,0.22)] -translate-y-0.5'
              : 'bg-white border-slate-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-amber-200 hover:shadow-[0_12px_30px_rgba(245,158,11,0.16)] hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Publish</span>
            <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-[0_4px_12px_rgba(245,158,11,0.15)] group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-amber-700 font-mono tracking-tight">{stats.entered}</span>
            <span className="text-xs text-amber-600/80 font-medium block mt-1">Results Entered (Draft)</span>
          </div>
        </div>

        {/* Not Entered Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'NOT_ENTERED' ? 'ALL' : 'NOT_ENTERED')}
          className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer group ${
            statusFilter === 'NOT_ENTERED'
              ? 'bg-gradient-to-b from-rose-50/70 to-white border-rose-400 ring-2 ring-rose-500/25 shadow-[0_12px_32px_rgba(244,63,94,0.22)] -translate-y-0.5'
              : 'bg-white border-slate-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-rose-200 hover:shadow-[0_12px_30px_rgba(244,63,94,0.16)] hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Not Entered</span>
            <span className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-[0_4px_12px_rgba(244,63,94,0.15)] group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-rose-700 font-mono tracking-tight">{stats.notEntered}</span>
            <span className="text-xs text-rose-600/80 font-medium block mt-1">Awaiting Evaluation</span>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-3xl border text-xs sm:text-sm flex items-center justify-between font-semibold shadow-[0_8px_25px_rgba(0,0,0,0.04)] ${
            feedback.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-[0_8px_25px_rgba(16,185,129,0.12)]'
              : 'bg-rose-50 border-rose-200 text-rose-800 shadow-[0_8px_25px_rgba(244,63,94,0.12)]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs hover:underline font-bold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Dual-Panel Layout (Enhanced Ambient Glow) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: PROGRAMMES SIDEBAR (4 Cols) */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)] p-5 space-y-4">
          {/* Header with Chevrons */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Programmes</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevProgram}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Previous program"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextProgram}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Next program"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Programme Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programme"
              value={progSearch}
              onChange={e => setProgSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
            />
            {isArtsEnabled && isSportsEnabled && (
              <button
                onClick={() => {
                  setSectionFilter(prev => prev === 'ALL' ? 'ARTS' : prev === 'ARTS' ? 'SPORTS' : 'ALL');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={`Section Filter: ${sectionFilter}`}
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs / Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['NOT_ENTERED', 'ENTERED', 'PUBLISHED', 'PRINTED'] as StatusFilterType[]).map(filter => {
              const labelMap: Record<StatusFilterType, string> = {
                ALL: 'All',
                NOT_ENTERED: 'Not Entered',
                ENTERED: 'Entered',
                PUBLISHED: 'Published',
                PRINTED: 'Printed'
              };
              const isActive = statusFilter === filter;

              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(isActive ? 'ALL' : filter)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e65353] text-white shadow-[0_4px_14px_rgba(230,83,83,0.35)] scale-105'
                      : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {labelMap[filter]}
                </button>
              );
            })}
          </div>

          {/* Applied Filters Tag */}
          {statusFilter !== 'ALL' && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span>Applied Filters (1) &gt;</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200/60">
                  Has Results: {statusFilter.replace('_', ' ')}
                  <button onClick={() => setStatusFilter('ALL')} className="hover:text-rose-600 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
              <button
                onClick={() => setStatusFilter('ALL')}
                className="text-rose-600 hover:text-rose-700 font-bold text-xs cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Programmes Card List */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
            {filteredPrograms.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                No programmes match your current filter.
              </div>
            ) : (
              filteredPrograms.map(prog => {
                const isSelected = prog.id === activeProgram?.id;
                const regCount = registrations.filter(r => r.programId === prog.id && r.status === 'CONFIRMED').length;
                const progPublished = prog.resultStatus === 'PUBLISHED';
                const progEntered = prog.resultStatus === 'DRAFT' || prog.resultStatus === 'SUBMITTED';

                return (
                  <div
                    key={prog.id}
                    onClick={() => {
                      setSelectedProgId(prog.id);
                      if (onProgramChange) onProgramChange(prog.id);
                      setFeedback(null);
                    }}
                    className={`p-4 rounded-[22px] transition-all duration-200 cursor-pointer text-left space-y-2.5 ${
                      isSelected
                        ? 'border-2 border-rose-400 bg-white ring-4 ring-rose-400/10 shadow-sm'
                        : 'border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm shadow-2xs'
                    }`}
                  >
                    {/* Top Row: Title & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight truncate">
                        {prog.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 border ${
                          progPublished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : progEntered
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200/60'
                        }`}
                      >
                        {progPublished ? 'PUBLISHED' : progEntered ? 'ENTERED' : 'NOT ENTERED'}
                      </span>
                    </div>

                    {/* Meta Row: Code, Category, Count */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <span className="font-mono font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 text-[11px]">
                        {prog.code}
                      </span>
                      <span className="uppercase text-slate-600 font-semibold text-xs">
                        {prog.programType} • {prog.category}
                      </span>
                      <span className="text-slate-400 text-xs font-normal">
                        {regCount} registered
                      </span>
                    </div>

                    {/* Subtitle */}
                    <div className="text-xs text-slate-400 font-normal">
                      Manual Result
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: PROGRAMME RESULT DETAIL & MATRIX (8 Cols) */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_16px_45px_rgba(0,0,0,0.07)] p-6 sm:p-8 space-y-6">
          {activeProgram ? (
            <>
              {/* Category Breadcrumb & Header Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#e65353]">
                    {activeProgram.category} • {activeProgram.programType}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {activeProgram.name}
                    </h2>
                    <div className="flex items-center gap-0.5 text-slate-400">
                      <button
                        onClick={handlePrevProgram}
                        className="p-1 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Previous"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextProgram}
                        className="p-1 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Next"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Top Right Action Pills */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsManualResultMode(prev => !prev)}
                    className="px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-[#e65353] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(230,83,83,0.12)] cursor-pointer"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Manual Result
                  </button>

                  <button
                    onClick={() => setIsScoreSettingsModalOpen(true)}
                    className="px-4 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    Score Settings
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Scores / Result / Settings */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/70 border border-slate-200/50 shadow-inner">
                  <button
                    onClick={() => setActiveTab('SCORES')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'SCORES'
                        ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Scores
                  </button>
                  <button
                    onClick={() => setActiveTab('RESULT')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'RESULT'
                        ? 'bg-[#e65353] text-white shadow-[0_4px_14px_rgba(230,83,83,0.35)]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-white" />
                    Result
                  </button>
                  <button
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'SETTINGS'
                        ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    Settings
                  </button>
                </div>
              </div>

              {/* Action & Search Toolbar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
                {/* Search Candidates Input */}
                <div className="relative w-full md:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={candidateSearch}
                    onChange={e => setCandidateSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                  />
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={handleAutoCalculateScores}
                    className="px-4 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Auto-Calculate Scores
                  </button>

                  {isPublished ? (
                    <button
                      onClick={handleUnpublish}
                      className="px-4 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Unpublish Results
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveOrPublish(true)}
                      className="px-4.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-[0_4px_14px_rgba(16,185,129,0.30)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-white" />
                      Publish Results
                    </button>
                  )}

                  {existingResult && (
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="px-3.5 py-1.5 rounded-full border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(244,63,94,0.10)] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove results
                    </button>
                  )}

                  <button
                    onClick={() => setIsInfoModalOpen(true)}
                    className="p-1.5 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-[0_2px_6px_rgba(0,0,0,0.02)] cursor-pointer"
                    title="Evaluation guidelines & info"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TAB 1: RESULT MATRIX TABLE (Default View) */}
              {activeTab === 'RESULT' && (
                <div className="overflow-x-auto rounded-3xl border border-slate-200/90 shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-4 px-4">Candidate</th>
                        <th className="py-4 px-3">Code Letter</th>
                        <th className="py-4 px-3">Grade</th>
                        <th className="py-4 px-4">Position</th>
                        <th className="py-4 px-3 text-center">Total Points</th>
                        <th className="py-4 px-3 text-center">Clear</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {displayedEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                            No candidates enrolled for this programme.
                          </td>
                        </tr>
                      ) : (
                        displayedEntries.map((entry) => {
                          const realIdx = entries.findIndex(e => e.id === entry.id);

                          // Initials for avatar
                          const name = entry.studentName || entry.groupName || 'Contestant';
                          const initials = name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          const hasPositionOrGrade = (entry.position && entry.position !== 'NO_PRIZE') || (entry.grade && entry.grade !== 'NONE');

                          return (
                            <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* CANDIDATE INFO */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-2xl bg-rose-100/80 text-rose-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-[0_3px_10px_rgba(244,63,94,0.15)]">
                                    {initials}
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-tight">
                                      {name}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                                      {entry.chestNumber && (
                                        <span className="font-mono text-slate-700 font-bold">
                                          {entry.chestNumber}
                                        </span>
                                      )}
                                      <span className="inline-flex items-center gap-1 font-semibold uppercase text-slate-600">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        {entry.teamName}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* CODE LETTER */}
                              <td className="py-4 px-3">
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={entry.codeLetter || '-'}
                                  onChange={e => handleCodeLetterChange(realIdx, e.target.value)}
                                  className="w-11 py-1 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-rose-400 focus:bg-white shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                                />
                              </td>

                              {/* GRADE SELECTOR PILLS */}
                              <td className="py-4 px-3">
                                <div className="flex items-center gap-1.5 text-xs font-semibold">
                                  {(['A', 'B', 'C'] as AwardGrade[]).map(grd => {
                                    const isSelected = entry.grade === grd;
                                    const grdConfig = activeGradeConfigs.find(g => g.grade === grd);
                                    const pts = grdConfig?.points ?? 0;

                                    return (
                                      <label
                                        key={grd}
                                        onClick={() => handleGradeSelect(realIdx, grd)}
                                        className={`inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-lg border text-xs font-bold cursor-pointer select-none transition-all ${
                                          isSelected
                                            ? grd === 'A'
                                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-[0_3px_10px_rgba(16,185,129,0.30)] scale-105'
                                              : grd === 'B'
                                              ? 'bg-blue-600 text-white border-blue-600 shadow-[0_3px_10px_rgba(37,99,235,0.30)] scale-105'
                                              : 'bg-amber-600 text-white border-amber-600 shadow-[0_3px_10px_rgba(217,119,6,0.30)] scale-105'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                        title={`Grade ${grd} (${pts} pts)`}
                                      >
                                        {grd}
                                      </label>
                                    );
                                  })}
                                </div>
                              </td>

                              {/* POSITION RADIO BUTTONS */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-4 text-xs font-semibold">
                                  {/* First */}
                                  <label
                                    onClick={() => handlePositionSelect(realIdx, 'FIRST')}
                                    className={`inline-flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
                                      entry.position === 'FIRST' ? 'text-[#e65353] font-bold' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    <span
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                        entry.position === 'FIRST'
                                          ? 'border-[#e65353] bg-white shadow-[0_2px_8px_rgba(230,83,83,0.30)]'
                                          : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {entry.position === 'FIRST' && (
                                        <span className="w-2 h-2 rounded-full bg-[#e65353]" />
                                      )}
                                    </span>
                                    First
                                  </label>

                                  {/* Second */}
                                  <label
                                    onClick={() => handlePositionSelect(realIdx, 'SECOND')}
                                    className={`inline-flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
                                      entry.position === 'SECOND' ? 'text-[#e65353] font-bold' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    <span
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                        entry.position === 'SECOND'
                                          ? 'border-[#e65353] bg-white shadow-[0_2px_8px_rgba(230,83,83,0.30)]'
                                          : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {entry.position === 'SECOND' && (
                                        <span className="w-2 h-2 rounded-full bg-[#e65353]" />
                                      )}
                                    </span>
                                    Second
                                  </label>

                                  {/* Third */}
                                  <label
                                    onClick={() => handlePositionSelect(realIdx, 'THIRD')}
                                    className={`inline-flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
                                      entry.position === 'THIRD' ? 'text-[#e65353] font-bold' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    <span
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                        entry.position === 'THIRD'
                                          ? 'border-[#e65353] bg-white shadow-[0_2px_8px_rgba(230,83,83,0.30)]'
                                          : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {entry.position === 'THIRD' && (
                                        <span className="w-2 h-2 rounded-full bg-[#e65353]" />
                                      )}
                                    </span>
                                    Third
                                  </label>
                                </div>
                              </td>

                              {/* TOTAL POINTS */}
                              <td className="py-4 px-3 text-center">
                                <span className="font-mono font-black text-slate-900 text-sm">
                                  {entry.totalPoints || 0}
                                </span>
                                {(entry.positionPoints > 0 && entry.gradePoints > 0) && (
                                  <span className="block text-[10px] text-slate-400 font-mono font-medium">
                                    {entry.positionPoints}p + {entry.gradePoints}g
                                  </span>
                                )}
                              </td>

                              {/* CLEAR BUTTON */}
                              <td className="py-4 px-3 text-center">
                                {hasPositionOrGrade ? (
                                  <button
                                    onClick={() => handleClearCandidate(realIdx)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Clear position & grade"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: RAW SCORES & MARKS EVALUATION */}
              {activeTab === 'SCORES' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <span>Enter numerical scores (0-100) per candidate. Click <strong>Auto-Calculate Scores</strong> above to rank and assign grades automatically.</span>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-slate-200">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                          <th className="py-3 px-4">Chest #</th>
                          <th className="py-3 px-4">Candidate / House</th>
                          <th className="py-3 px-4">Judge Score (0-100)</th>
                          <th className="py-3 px-4">Performance Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entries.map((entry, idx) => (
                          <tr key={entry.id}>
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              #{entry.chestNumber || '-'}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900">{entry.studentName || entry.groupName}</p>
                              <p className="text-xs text-slate-500">{entry.teamName}</p>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="e.g. 88"
                                value={candidateScores[entry.id] ?? ''}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCandidateScores(prev => ({ ...prev, [entry.id]: val }));
                                }}
                                className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-rose-400"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={entry.grade}
                                onChange={e => {
                                  const gVal = e.target.value as AwardGrade;
                                  const gCfg = activeGradeConfigs.find(g => g.grade === gVal && g.active);
                                  const gPts = gCfg?.points || 0;
                                  setEntries(prev => {
                                    const next = [...prev];
                                    next[idx] = {
                                      ...next[idx],
                                      grade: gVal,
                                      gradePoints: gPts,
                                      totalPoints: (next[idx].positionPoints || 0) + gPts
                                    };
                                    return next;
                                  });
                                }}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-400 cursor-pointer"
                              >
                                {activeGradeConfigs.map(g => (
                                  <option key={g.id} value={g.grade}>
                                    {g.label} ({g.points} pts)
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: SETTINGS & REMARKS */}
              {activeTab === 'SETTINGS' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Official Jury Remarks & Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Add official jury remarks, tie justifications, or special notes..."
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="mt-1 w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/60 text-xs text-rose-900 space-y-1">
                    <p className="font-bold">Scoring Rule Summary ({activeProgType})</p>
                    <p>• Positions: 1st ({activePositionConfigs.find(p => p.position === 'FIRST')?.points || 5} pts) | 2nd ({activePositionConfigs.find(p => p.position === 'SECOND')?.points || 3} pts) | 3rd ({activePositionConfigs.find(p => p.position === 'THIRD')?.points || 1} pts)</p>
                    <p>• Grades: Grade A ({activeGradeConfigs.find(g => g.grade === 'A')?.points || 5} pts) | Grade B ({activeGradeConfigs.find(g => g.grade === 'B')?.points || 3} pts) | Grade C ({activeGradeConfigs.find(g => g.grade === 'C')?.points || 1} pts)</p>
                  </div>
                </div>
              )}

              {/* Bottom Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium">
                  {existingResult?.submittedAt ? (
                    <span>Last updated {new Date(existingResult.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {existingResult.submittedBy}</span>
                  ) : (
                    <span>Ready for evaluation and score submission.</span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleSaveOrPublish(false)}
                    className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => handleSaveOrPublish(true)}
                    className="px-5 py-2 rounded-2xl bg-[#e65353] hover:bg-rose-600 text-white text-xs font-bold shadow-[0_4px_16px_rgba(230,83,83,0.35)] hover:shadow-[0_6px_22px_rgba(230,83,83,0.45)] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Publish Results Live
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 font-medium">
              Please select a programme from the list to enter or upload results.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: SCORE SETTINGS (POSITIONS & GRADES) */}
      {/* ============================================================ */}
      <Modal
        isOpen={isScoreSettingsModalOpen}
        onClose={() => setIsScoreSettingsModalOpen(false)}
        title="Event Score & Grade Settings"
        subtitle={`Configure position and grade point allocations for ${activeProgType} competitions`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Position Points Configuration */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Position Points Allocation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activePositionConfigs.map((pConfig) => (
                <div
                  key={pConfig.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                >
                  <p className="text-xs font-bold text-slate-800">{pConfig.label}</p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pConfig.points}
                      onChange={e => {
                        const newPts = parseInt(e.target.value) || 0;
                        updateProgramTypePositionConfig(
                          activeProgType,
                          { ...pConfig, points: newPts },
                          currentUser.name,
                          currentUser.role
                        );
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-mono font-bold text-center focus:outline-none focus:border-rose-400 shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                    />
                    <span className="text-xs font-bold text-slate-400">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Points Configuration */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Grade Points Allocation</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activeGradeConfigs.map((gConfig) => (
                <div
                  key={gConfig.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">{gConfig.label}</p>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      gConfig.grade === 'A' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : gConfig.grade === 'B' ? 'bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]' : gConfig.grade === 'C' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-400'
                    }`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={gConfig.points}
                      onChange={e => {
                        const newPts = parseInt(e.target.value) || 0;
                        updateProgramTypeGradeConfig(
                          activeProgType,
                          { ...gConfig, points: newPts },
                          currentUser.name,
                          currentUser.role
                        );
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-mono font-bold text-center focus:outline-none focus:border-rose-400 shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                    />
                    <span className="text-xs font-bold text-slate-400">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsScoreSettingsModalOpen(false)}
              className="px-5 py-2 rounded-2xl bg-[#e65353] text-white text-xs font-bold hover:bg-rose-600 transition-all shadow-[0_4px_14px_rgba(230,83,83,0.35)] cursor-pointer"
            >
              Done & Save
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: INFO / GUIDELINES */}
      {/* ============================================================ */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Result Management Guidelines"
        subtitle="Standard operating procedures for Jury & Event Controllers"
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 font-medium">
          <p>
            • <strong>Grade Selection:</strong> Click on <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">A</span>, <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">B</span>, or <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">C</span> pills to award a performance grade. Click again to toggle off.
          </p>
          <p>
            • <strong>Position Selection:</strong> Click the radio buttons in the Position column to award First, Second, or Third place. Click again or click <span className="font-mono text-rose-600 font-bold">✕</span> to clear.
          </p>
          <p>
            • <strong>Point Stacking:</strong> Total points for each candidate automatically combines Position Points + Grade Points (e.g. 1st Place (5 pts) + A Grade (5 pts) = 10 pts).
          </p>
          <p>
            • <strong>Publishing:</strong> Publishing results pushes scores atomically to the live public feed, house scoreboard, and individual points tally.
          </p>
          <div className="pt-3 flex justify-end">
            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: REMOVE RESULTS CONFIRMATION */}
      {/* ============================================================ */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Remove Result Submission?"
        subtitle={`This will reset results for "${activeProgram?.name}" to pending.`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 font-medium">
            Are you sure you want to remove this result record? Any points awarded to teams and candidates for this event will be retracted immediately.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteResult}
              className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-[0_4px_14px_rgba(244,63,94,0.30)] cursor-pointer"
            >
              Confirm Removal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
