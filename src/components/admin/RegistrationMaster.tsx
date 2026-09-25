import React, { useState, useMemo, useEffect } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { Program, Registration, FestCategory, Team, Student } from '../../types';
import { exportRegistrationsToSpreadsheet } from '../../utils/csvHelpers';
import { isCategoryMatch } from '../../utils/validations';
import {
  Search,
  Download,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserPlus,
  Plus,
  Settings,
  SlidersHorizontal,
  X,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Table,
  LayoutGrid,
  Check,
  Eye,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

export const RegistrationMaster: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    registrations,
    programs,
    students,
    teams,
    categoryConfigs,
    settings,
    registerIndividualStudent,
    withdrawRegistration,
    clearAllRegistrations,
    clearRegistrationsByTeam,
    deleteRegistrationsBatch
  } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;
  const isController = currentUser.role === 'CONTROLLER';
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Base registrations
  const baseRegistrations = useMemo(() => {
    if (!isController) return registrations;
    return registrations.filter(r => {
      if (r.section === 'ARTS' && !isArtsEnabled) return false;
      if (r.section === 'SPORTS' && !isSportsEnabled) return false;
      return true;
    });
  }, [registrations, isController, isArtsEnabled, isSportsEnabled]);

  // Base Programs (with strict deduplication)
  const availablePrograms = useMemo(() => {
    const list = programs.filter(p => {
      if (!isArtsEnabled && p.section === 'ARTS') return false;
      if (!isSportsEnabled && p.section === 'SPORTS') return false;
      return true;
    });

    const seen = new Set<string>();
    const deduplicated: Program[] = [];
    for (const prog of list) {
      const codeKey = prog.code ? prog.code.toLowerCase().trim() : '';
      const nameKey = (prog.name || '').toLowerCase().trim();
      const catKey = (prog.category || '').toLowerCase().trim();
      const typeKey = (prog.programType || '').toLowerCase().trim();
      const uniqueKey = codeKey ? `code:${codeKey}` : `name:${nameKey}|${catKey}|${typeKey}`;

      if (!seen.has(uniqueKey) && !seen.has(prog.id)) {
        seen.add(uniqueKey);
        seen.add(prog.id);
        if (codeKey) seen.add(`name:${nameKey}|${catKey}|${typeKey}`);
        deduplicated.push(prog);
      }
    }
    return deduplicated;
  }, [programs, isArtsEnabled, isSportsEnabled]);

  // Left Sidebar State
  const [programSearch, setProgramSearch] = useState('');
  const debouncedProgramSearch = useDebounce(programSearch, 200);
  const [progStatusFilter, setProgStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'INDIVIDUAL' | 'GROUP'>('ALL');
  const [collectionFilter, setCollectionFilter] = useState<string>('ALL');

  // Selected Program
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    return availablePrograms[0]?.id || '';
  });

  // Right View State
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [candidateSearch, setCandidateSearch] = useState('');
  const debouncedCandidateSearch = useDebounce(candidateSearch, 200);

  // Register Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerStudentSearch, setRegisterStudentSearch] = useState('');
  const debouncedRegisterStudentSearch = useDebounce(registerStudentSearch, 150);
  const [selectedStudentForReg, setSelectedStudentForReg] = useState<string>('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // High performance student lookup maps
  const { studentMapById, studentMapByChest } = useMemo(() => {
    const byId = new Map<string, Student>();
    const byChest = new Map<number, Student>();
    students.forEach(s => {
      byId.set(s.id, s);
      if (s.chestNumber) byChest.set(Number(s.chestNumber), s);
    });
    return { studentMapById: byId, studentMapByChest: byChest };
  }, [students]);

  // Group Details Modal State
  const [inspectedGroup, setInspectedGroup] = useState<Registration | null>(null);

  // Multi-selection state for table view
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Admin Clear Modals
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearTeamModalOpen, setIsClearTeamModalOpen] = useState(false);
  const [teamToClear, setTeamToClear] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to normalize strings for robust comparison
  const normalizeText = (text?: string): string => {
    if (!text) return '';
    return text.toLowerCase().replace(/[\s_\-()./]/g, '').trim();
  };

  // Helper to check if a registration is active (not withdrawn)
  const isRegistrationActive = (r: Registration): boolean => {
    if (!r) return false;
    if (r.status && r.status.toUpperCase() === 'WITHDRAWN') return false;
    return true;
  };

  // Helper to match team flexibly by ID, Code, or Name
  const isTeamMatch = (team: Team, r: Registration): boolean => {
    if (!team || !r) return false;
    const tId = (team.id || '').toLowerCase().trim();
    const tCode = (team.code || '').toLowerCase().trim();
    const tName = (team.name || '').toLowerCase().trim();
    const rTeamId = (r.teamId || '').toLowerCase().trim();
    const rTeamName = (r.teamName || '').toLowerCase().trim();

    if (rTeamId && (rTeamId === tId || rTeamId === tCode || rTeamId === tName)) return true;
    if (rTeamName && (rTeamName === tName || rTeamName === tCode || rTeamName === tId)) return true;
    if (tName && rTeamName && (tName.includes(rTeamName) || rTeamName.includes(tName))) return true;
    if (tName && rTeamId && (tName.includes(rTeamId) || rTeamId.includes(tName))) return true;
    return false;
  };

  // Helper to test if a registration matches a program
  const isProgramRegMatch = (r: Registration, prog: Program): boolean => {
    if (!r || !prog) return false;
    const rProgId = (r.programId || '').toLowerCase().trim();
    const pId = (prog.id || '').toLowerCase().trim();
    const pCode = (prog.code || '').toLowerCase().trim();
    const rProgName = (r.programName || '').toLowerCase().trim();
    const pName = (prog.name || '').toLowerCase().trim();
    const rProgCode = ((r as any).programCode || '').toLowerCase().trim();

    // 1. Direct ID match or Code match
    if (rProgId && (rProgId === pId || (pCode && rProgId === pCode))) return true;
    if (rProgCode && (rProgCode === pCode || rProgCode === pId)) return true;

    // 2. Lookup program from master list by registration's programId
    const registeredProgram = programs.find(
      p =>
        (p.id && p.id.toLowerCase().trim() === rProgId) ||
        (p.code && p.code.toLowerCase().trim() === rProgId)
    );
    if (registeredProgram) {
      const regPId = (registeredProgram.id || '').toLowerCase().trim();
      const regPCode = (registeredProgram.code || '').toLowerCase().trim();
      const regPName = (registeredProgram.name || '').toLowerCase().trim();

      if (regPId === pId) return true;
      if (regPCode && pCode && regPCode === pCode) return true;
      if (
        normalizeText(regPName) === normalizeText(pName) &&
        (!registeredProgram.category || !prog.category || isCategoryMatch(registeredProgram.category, prog.category, categoryConfigs))
      ) {
        return true;
      }
    }

    // 3. Match by normalized Name + Category
    if (normalizeText(rProgName) && normalizeText(pName) && normalizeText(rProgName) === normalizeText(pName)) {
      if (!r.category || !prog.category || isCategoryMatch(r.category, prog.category, categoryConfigs)) {
        return true;
      }
    }

    return false;
  };

  // Helper to count registrations for a program
  const getProgramRegCount = (prog: Program): number => {
    return baseRegistrations.filter(r => isProgramRegMatch(r, prog) && isRegistrationActive(r)).length;
  };

  // Filtered Programmes for Left Sidebar
  const filteredPrograms = useMemo(() => {
    return availablePrograms.filter(p => {
      // 1. Search Query
      const q = debouncedProgramSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      if (!matchQ) return false;

      // 2. Status / Type Filter
      if (progStatusFilter === 'OPEN' && p.registrationOpen === false) return false;
      if (progStatusFilter === 'CLOSED' && p.registrationOpen !== false) return false;
      if (progStatusFilter === 'INDIVIDUAL' && p.programType !== 'INDIVIDUAL') return false;
      if (progStatusFilter === 'GROUP' && p.programType === 'INDIVIDUAL') return false;

      // 3. Collection Filter
      if (collectionFilter !== 'ALL') {
        if (collectionFilter === 'STAGE' && p.subsection !== 'STAGE') return false;
        if (collectionFilter === 'NON_STAGE' && p.subsection !== 'NON_STAGE') return false;
        if (collectionFilter === 'SPORTS' && p.section !== 'SPORTS') return false;
        if (collectionFilter === 'ARTS' && p.section !== 'ARTS') return false;
        if (collectionFilter.startsWith('CAT_')) {
          const cat = collectionFilter.replace('CAT_', '');
          if (!isCategoryMatch(p.category, cat, categoryConfigs)) return false;
        }
      }

      return true;
    });
  }, [availablePrograms, debouncedProgramSearch, progStatusFilter, collectionFilter, categoryConfigs]);

  // Active Selected Program
  const activeProgram = useMemo(() => {
    const found = filteredPrograms.find(p => p.id === selectedProgramId || p.code === selectedProgramId);
    if (found) return found;
    return filteredPrograms[0] || null;
  }, [filteredPrograms, selectedProgramId]);

  // Next / Previous Navigation
  const currentProgramIndex = filteredPrograms.findIndex(p => p.id === activeProgram?.id);
  const handlePrevProgram = () => {
    if (currentProgramIndex > 0) {
      setSelectedProgramId(filteredPrograms[currentProgramIndex - 1].id);
      setSelectedTeamFilter('ALL');
      setCandidateSearch('');
    }
  };
  const handleNextProgram = () => {
    if (currentProgramIndex >= 0 && currentProgramIndex < filteredPrograms.length - 1) {
      setSelectedProgramId(filteredPrograms[currentProgramIndex + 1].id);
      setSelectedTeamFilter('ALL');
      setCandidateSearch('');
    }
  };

  // Registrations for the active program
  const activeProgramRegistrations = useMemo(() => {
    if (!activeProgram) return [];
    return baseRegistrations.filter(r => isProgramRegMatch(r, activeProgram) && isRegistrationActive(r));
  }, [baseRegistrations, activeProgram, programs, categoryConfigs]);

  // House/Team breakdown counts for active program
  const teamRegCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    teams.forEach(t => {
      counts[t.id] = 0;
    });

    activeProgramRegistrations.forEach(r => {
      const matchedTeam = teams.find(t => isTeamMatch(t, r));
      if (matchedTeam) {
        counts[matchedTeam.id] = (counts[matchedTeam.id] || 0) + 1;
      }
    });

    return counts;
  }, [activeProgramRegistrations, teams]);

  // Filtered registrations for Right Candidate Grid
  const filteredActiveRegistrations = useMemo(() => {
    return activeProgramRegistrations.filter(r => {
      // Team filter
      if (selectedTeamFilter !== 'ALL') {
        const targetTeam = teams.find(t => t.id === selectedTeamFilter);
        if (targetTeam && !isTeamMatch(targetTeam, r)) {
          return false;
        }
      }

      // Candidate search query
      const q = debouncedCandidateSearch.toLowerCase().trim();
      if (!q) return true;

      // Lookup student for enriched search
      const student = r.studentId ? studentMapById.get(r.studentId) : (r.chestNumber ? studentMapByChest.get(Number(r.chestNumber)) : undefined);
      const sName = (r.studentName || student?.name || '').toLowerCase();
      const sAdm = (r.admissionNo || student?.admissionNo || '').toLowerCase();
      const sChest = (r.chestNumber || student?.chestNumber || '').toString();

      return (
        sName.includes(q) ||
        r.groupName?.toLowerCase().includes(q) ||
        sAdm.includes(q) ||
        sChest.includes(q) ||
        r.teamName?.toLowerCase().includes(q) ||
        r.classNumber?.toLowerCase().includes(q) ||
        r.groupMembers?.some(
          m =>
            m.name.toLowerCase().includes(q) ||
            m.admissionNo.toLowerCase().includes(q) ||
            (m.chestNumber && m.chestNumber.toString().includes(q))
        )
      );
    });
  }, [activeProgramRegistrations, selectedTeamFilter, debouncedCandidateSearch, teams, studentMapById, studentMapByChest]);

  // Cards Pagination
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsPageSize, setCardsPageSize] = useState(24);

  useEffect(() => {
    setCardsPage(1);
  }, [activeProgram?.id, selectedTeamFilter, debouncedCandidateSearch]);

  const paginatedActiveRegistrations = useMemo(() => {
    const start = (cardsPage - 1) * cardsPageSize;
    return filteredActiveRegistrations.slice(start, start + cardsPageSize);
  }, [filteredActiveRegistrations, cardsPage, cardsPageSize]);

  // Table View Pagination & Filter
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(50);

  const filteredMasterRegistrations = useMemo(() => {
    const q = debouncedCandidateSearch.toLowerCase().trim();
    return baseRegistrations
      .filter(r => isRegistrationActive(r))
      .filter(r => {
        if (!q) return true;
        const student = r.studentId ? studentMapById.get(r.studentId) : (r.chestNumber ? studentMapByChest.get(Number(r.chestNumber)) : undefined);
        const sName = (r.studentName || student?.name || r.groupName || '').toLowerCase();
        const sAdm = (r.admissionNo || student?.admissionNo || '').toLowerCase();
        const sChest = (r.chestNumber || student?.chestNumber || '').toString();

        return (
          r.programName.toLowerCase().includes(q) ||
          sName.includes(q) ||
          r.teamName?.toLowerCase().includes(q) ||
          sAdm.includes(q) ||
          sChest.includes(q)
        );
      });
  }, [baseRegistrations, debouncedCandidateSearch, studentMapById, studentMapByChest]);

  useEffect(() => {
    setTablePage(1);
  }, [debouncedCandidateSearch]);

  const paginatedMasterRegistrations = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return filteredMasterRegistrations.slice(start, start + tablePageSize);
  }, [filteredMasterRegistrations, tablePage, tablePageSize]);

  // Candidate avatar initials helper
  const getInitials = (name?: string): string => {
    if (!name) return 'CD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Withdraw/Delete Registration Handler
  const handleWithdraw = (regId: string, name: string) => {
    if (confirm(`Withdraw registration for "${name}"? This will delete it from database.`)) {
      const res = withdrawRegistration(regId, currentUser.name, currentUser.role);
      if (res.success) {
        setSelectedIds(prev => prev.filter(id => id !== regId));
        setActionFeedback({ success: true, msg: `Registration for "${name}" removed.` });
        setTimeout(() => setActionFeedback(null), 3500);
      }
    }
  };

  // Export Spreadsheet
  const handleExportSpreadsheet = (format: 'csv' | 'xlsx' = 'xlsx') => {
    const listToExport = viewMode === 'TABLE' ? baseRegistrations : activeProgramRegistrations;
    exportRegistrationsToSpreadsheet(
      listToExport,
      format,
      `registrations_${activeProgram?.code || 'all'}_${Date.now()}`
    );
  };

  // Clear All Registrations
  const handleConfirmClearAll = async () => {
    setIsProcessing(true);
    try {
      const res = clearAllRegistrations(currentUser.name, currentUser.role);
      if (res.success) {
        setSelectedIds([]);
        setIsClearAllModalOpen(false);
        setActionFeedback({
          success: true,
          msg: `Successfully cleared all ${res.count} registrations!`
        });
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear Team Registrations
  const handleConfirmClearTeam = async () => {
    const targetTeamId = teamToClear || (selectedTeamFilter !== 'ALL' ? selectedTeamFilter : '');
    if (!targetTeamId) return;

    setIsProcessing(true);
    try {
      const targetTeamName = teams.find(t => t.id === targetTeamId)?.name || 'House';
      const res = clearRegistrationsByTeam(targetTeamId, currentUser.name, currentUser.role);
      if (res.success) {
        setIsClearTeamModalOpen(false);
        setActionFeedback({
          success: true,
          msg: `Successfully cleared ${res.count} registrations for ${targetTeamName}!`
        });
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Register Candidate Modal
  const handleRegisterSubmit = () => {
    if (!activeProgram || !selectedStudentForReg) return;
    const student = students.find(s => s.id === selectedStudentForReg);
    if (!student) return;

    setIsSubmittingReg(true);
    const res = registerIndividualStudent(
      student.id,
      activeProgram.id,
      currentUser.name,
      currentUser.role
    );
    setIsSubmittingReg(false);

    if (res.success) {
      setIsRegisterModalOpen(false);
      setSelectedStudentForReg('');
      setRegisterStudentSearch('');
      setActionFeedback({
        success: true,
        msg: `Successfully registered ${student.name} for ${activeProgram.name}!`
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      alert(res.error || 'Failed to register student.');
    }
  };

  // Eligible students for the Register Modal
  const modalEligibleStudents = useMemo(() => {
    if (!activeProgram) return [];
    const q = registerStudentSearch.toLowerCase().trim();
    return students.filter(s => {
      if (s.status !== 'ACTIVE') return false;
      if (!isCategoryMatch(s.category, activeProgram.category, categoryConfigs)) return false;

      // Duplicate check
      const isAlready = activeProgramRegistrations.some(
        r =>
          r.studentId === s.id ||
          (s.chestNumber && r.chestNumber && Number(r.chestNumber) === Number(s.chestNumber))
      );
      if (isAlready) return false;

      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.chestNumber && s.chestNumber.toString().includes(q)) ||
        (s.classNumber && s.classNumber.toLowerCase().includes(q))
      );
    });
  }, [students, activeProgram, categoryConfigs, activeProgramRegistrations, registerStudentSearch]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Registration Central Console
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {baseRegistrations.length} Total Registrations
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Browse and manage event registrations by program or master roster.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Program Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Master Table</span>
            </button>
          </div>

          {/* Export Dropdown */}
          <button
            type="button"
            onClick={() => handleExportSpreadsheet('xlsx')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Registrations</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between font-bold animate-in fade-in ${
            actionFeedback.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback.msg}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="underline opacity-80 hover:opacity-100 cursor-pointer ml-3 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 1: PROGRAM & CANDIDATE SPLIT VIEW (EXACT USER SCREENSHOT DESIGN) */}
      {/* ========================================================================= */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ============================================================ */}
          {/* LEFT PANEL: PROGRAMMES SIDEBAR                               */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4 sticky top-4">
            {/* Header: Title + Prev/Next */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Programmes
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevProgram}
                  disabled={currentProgramIndex <= 0}
                  className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors cursor-pointer"
                  title="Previous Program"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextProgram}
                  disabled={currentProgramIndex >= filteredPrograms.length - 1}
                  className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors cursor-pointer"
                  title="Next Program"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Input (Pill Shaped with search and filter icons) */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search programmes..."
                value={programSearch}
                onChange={e => setProgramSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-full bg-slate-50/90 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
              />
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter Chips Row 1: All, Open, Closed, Individual, Group */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'OPEN', 'CLOSED', 'INDIVIDUAL', 'GROUP'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setProgStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    progStatusFilter === tab
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ALL'
                    ? 'All'
                    : tab === 'OPEN'
                    ? 'Open'
                    : tab === 'CLOSED'
                    ? 'Closed'
                    : tab === 'INDIVIDUAL'
                    ? 'Individual'
                    : 'Group'}
                </button>
              ))}
            </div>

            {/* Filter Chips Row 2: Collections / Types */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setCollectionFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  collectionFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Collections
              </button>
              <button
                type="button"
                onClick={() => setCollectionFilter('NON_STAGE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  collectionFilter === 'NON_STAGE'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                NON-STAGE
              </button>
              <button
                type="button"
                onClick={() => setCollectionFilter('STAGE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  collectionFilter === 'STAGE'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                STAGE
              </button>
              {isSportsEnabled && (
                <button
                  type="button"
                  onClick={() => setCollectionFilter('SPORTS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    collectionFilter === 'SPORTS'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  SPORTS
                </button>
              )}
            </div>

            {/* Active Collection Filter Pill */}
            {collectionFilter !== 'ALL' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  <span>Collection: {collectionFilter}</span>
                  <button
                    type="button"
                    onClick={() => setCollectionFilter('ALL')}
                    className="hover:text-rose-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}

            {/* Programmes List */}
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredPrograms.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No programmes found matching filter.
                </div>
              ) : (
                filteredPrograms.map(prog => {
                  const isSelected = activeProgram?.id === prog.id;
                  const regCount = getProgramRegCount(prog);
                  const isOpen = prog.registrationOpen !== false;

                  return (
                    <div
                      key={prog.id}
                      onClick={() => {
                        setSelectedProgramId(prog.id);
                        setSelectedTeamFilter('ALL');
                        setCandidateSearch('');
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4
                            className={`text-sm font-black tracking-tight uppercase ${
                              isSelected ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {prog.name}
                          </h4>
                          <div className="text-[11px] font-mono text-slate-500 font-semibold uppercase">
                            {prog.code} • {prog.programType} • {prog.category}
                          </div>
                          <div className="text-xs text-slate-600 font-medium pt-0.5">
                            {regCount} registered
                          </div>
                        </div>

                        {/* Open / Closed Badge */}
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT PANEL: PROGRAM CANDIDATES VIEW                         */}
          {/* ============================================================ */}
          <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
            {activeProgram ? (
              <>
                {/* Header Row: Category breadcrumb + Big Title + Nav + Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                      {activeProgram.category} • {activeProgram.programType} • {activeProgram.section}
                    </div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                        {activeProgram.name}
                      </h2>
                      {/* Prev / Next Arrows */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevProgram}
                          disabled={currentProgramIndex <= 0}
                          className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextProgram}
                          disabled={currentProgramIndex >= filteredPrograms.length - 1}
                          className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Top Right Action Buttons */}
                  <div className="flex items-center gap-2">
                    {activeProgram.programType === 'INDIVIDUAL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentForReg('');
                          setRegisterStudentSearch('');
                          setIsRegisterModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleExportSpreadsheet('xlsx')}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Settings</span>
                    </button>
                  </div>
                </div>

                {/* Team Filter Chips (e.g. All 6, SEBAT 2, SARAHA 2, SAKAN 2) */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedTeamFilter === 'ALL'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All {activeProgramRegistrations.length}
                  </button>

                  {teams.map(team => {
                    const count = teamRegCounts[team.id] || 0;
                    const isSelected = selectedTeamFilter === team.id;
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => setSelectedTeamFilter(team.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: isSelected ? '#ffffff' : team.color || '#ef4444' }}
                        />
                        <span>{team.name} {count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Candidate Search within Active Program */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search candidate name, chest #, admission no..."
                    value={candidateSearch}
                    onChange={e => setCandidateSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-colors"
                  />
                </div>

                {/* Candidate Cards Grid (2-Columns Layout Matching Screenshot) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredActiveRegistrations.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600">
                        No candidate registrations found for {activeProgram.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click "+ Register" to add candidates from any house.
                      </p>
                    </div>
                  ) : (
                    paginatedActiveRegistrations.map(reg => {
                      const student = reg.studentId ? studentMapById.get(reg.studentId) : (reg.chestNumber ? studentMapByChest.get(Number(reg.chestNumber)) : undefined);
                      const displayName = reg.studentName || student?.name || reg.groupName || 'Candidate';
                      const initials = getInitials(displayName);
                      const isGroup = reg.programType === 'GROUP' || reg.programType === 'GENERAL';
                      const matchedTeam = teams.find(t => isTeamMatch(t, reg));
                      const displayTeamName = reg.teamName || matchedTeam?.name || 'House';
                      const displayTeamColor = reg.teamColor || matchedTeam?.color || '#ef4444';
                      const displayChestNo = reg.chestNumber || student?.chestNumber;
                      const displayCategory = reg.category || student?.category || activeProgram.category;

                      return (
                        <div
                          key={reg.id}
                          className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs space-y-3 relative group"
                        >
                          {/* Row 1: Avatar, Name, House, and Close/Delete '×' button */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Avatar Circle */}
                              <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 font-black text-xs flex items-center justify-center shrink-0 border border-rose-100">
                                {initials}
                              </div>

                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-slate-900 tracking-tight truncate uppercase">
                                  {displayName}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-bold uppercase">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: displayTeamColor }}
                                  />
                                  <span>{displayTeamName}</span>
                                </div>
                              </div>
                            </div>

                            {/* Delete / Withdraw × Button */}
                            <button
                              type="button"
                              onClick={() => handleWithdraw(reg.id, displayName)}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                              title="Withdraw / Remove Registration"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Row 2: Chest # / Category & Substitution Allowed Tag */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-mono">
                            <div className="flex items-center gap-3">
                              {displayChestNo && (
                                <span className="font-bold text-slate-800">
                                  {displayChestNo}
                                </span>
                              )}
                              <span className="text-slate-500 uppercase font-semibold">
                                {displayCategory}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-rose-500 font-bold">
                              {isGroup ? (
                                <button
                                  type="button"
                                  onClick={() => setInspectedGroup(reg)}
                                  className="underline hover:text-rose-700 cursor-pointer"
                                >
                                  {reg.groupMembers?.length || 0} Members
                                </button>
                              ) : (
                                <>
                                  <ArrowRightLeft className="w-3 h-3 text-rose-400" />
                                  <span>Substitution allowed</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Candidate Grid Pagination */}
                <Pagination
                  currentPage={cardsPage}
                  totalItems={filteredActiveRegistrations.length}
                  pageSize={cardsPageSize}
                  onPageChange={setCardsPage}
                  onPageSizeChange={setCardsPageSize}
                  itemLabel="candidates"
                  pageSizeOptions={[12, 24, 48, 96]}
                />
              </>
            ) : (
              <div className="py-24 text-center text-slate-400 text-xs">
                Select a programme from the sidebar to view registered candidates.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: MASTER TABLE VIEW                                            */}
      {/* ========================================================================= */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">
              All Registrations Registry ({baseRegistrations.length})
            </h3>
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search master registrations..."
                value={candidateSearch}
                onChange={e => setCandidateSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Program & Section</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">House</th>
                  <th className="py-3 px-4">Chest #</th>
                  <th className="py-3 px-4">Candidate / Group</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedMasterRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No registrations match your search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedMasterRegistrations.map(reg => {
                    const student = reg.studentId ? studentMapById.get(reg.studentId) : (reg.chestNumber ? studentMapByChest.get(Number(reg.chestNumber)) : undefined);
                    const displayName = reg.studentName || student?.name || reg.groupName || 'Candidate';
                    const matchedTeam = teams.find(t => isTeamMatch(t, reg));
                    const displayTeamName = reg.teamName || matchedTeam?.name || 'House';
                    const displayTeamColor = reg.teamColor || matchedTeam?.color || '#ef4444';
                    const displayChestNo = reg.chestNumber || student?.chestNumber;
                    const displayCategory = reg.category || student?.category || '—';
                    const displayAdm = reg.admissionNo || student?.admissionNo;

                    return (
                      <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{reg.programName}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{reg.section} • {reg.programType}</div>
                        </td>
                        <td className="py-3 px-4 uppercase font-bold text-slate-700">{displayCategory}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-bold uppercase text-slate-800">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: displayTeamColor }} />
                            <span>{displayTeamName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {displayChestNo ? `#${displayChestNo}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{displayName}</div>
                          {displayAdm && <div className="text-[10px] text-slate-400">Adm: {displayAdm}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {reg.timestamp ? new Date(reg.timestamp).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleWithdraw(reg.id, displayName)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Master Table Pagination */}
          <Pagination
            currentPage={tablePage}
            totalItems={filteredMasterRegistrations.length}
            pageSize={tablePageSize}
            onPageChange={setTablePage}
            onPageSizeChange={setTablePageSize}
            itemLabel="registrations"
            pageSizeOptions={[25, 50, 100, 250]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER CANDIDATE (ADMIN FAST REGISTER)                           */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && activeProgram && (
        <Modal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          title={`Register Candidate for ${activeProgram.name}`}
        >
          <div className="space-y-4">
            <div className="text-xs text-slate-600">
              Select an eligible student in category <strong className="text-rose-600 uppercase">{activeProgram.category}</strong> to register.
            </div>

            {/* Student Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate by name, chest #, admission no..."
                value={registerStudentSearch}
                onChange={e => setRegisterStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>

            {/* Candidates Picker List */}
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2">
              {modalEligibleStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No eligible candidates found in {activeProgram.category}.
                </div>
              ) : (
                modalEligibleStudents.map(student => {
                  const isSelected = selectedStudentForReg === student.id;
                  const team = teams.find(t => t.id === student.teamId);

                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentForReg(student.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 uppercase">{student.name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span>Chest #{student.chestNumber || '—'}</span>
                            <span>•</span>
                            <span>{team?.name || 'House'}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedStudentForReg || isSubmittingReg}
                onClick={handleRegisterSubmit}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isSubmittingReg ? 'Registering...' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GROUP MEMBERS INSPECT                                              */}
      {/* ========================================================================= */}
      {inspectedGroup && (
        <Modal
          isOpen={!!inspectedGroup}
          onClose={() => setInspectedGroup(null)}
          title={`Group Roster: ${inspectedGroup.groupName || inspectedGroup.teamName}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Program: <strong>{inspectedGroup.programName}</strong></span>
              <span>•</span>
              <span>House: <strong style={{ color: inspectedGroup.teamColor }}>{inspectedGroup.teamName}</strong></span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {inspectedGroup.groupMembers?.map((m, idx) => (
                <div key={m.studentId || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 uppercase">{m.name}</div>
                      <div className="text-[10px] text-slate-500">Adm: {m.admissionNo || '—'}</div>
                    </div>
                  </div>
                  {m.chestNumber && (
                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      #{m.chestNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLEAR ALL CONFIRMATION                                             */}
      {/* ========================================================================= */}
      {isClearAllModalOpen && (
        <Modal
          isOpen={isClearAllModalOpen}
          onClose={() => setIsClearAllModalOpen(false)}
          title="Clear Registrations Master"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>This will permanently delete all confirmed registrations from Supabase database.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmClearAll}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isProcessing ? 'Clearing...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
