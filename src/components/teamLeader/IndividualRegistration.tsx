import React, { useState, useMemo, useRef } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { FestCategory, Program, Registration } from '../../types';
import { Modal } from '../common/Modal';
import {
  generateSampleIndividualRegCSV,
  validateIndividualRegCSVRows,
  triggerFileDownload,
  triggerExcelDownload,
  readSpreadsheetFileAsText,
  downloadIndividualRegTemplate,
  ParsedIndividualRegRow
} from '../../utils/csvHelpers';
import { isCategoryMatch, getStudentParticipationBreakdown } from '../../utils/validations';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  Lock,
  Layers,
  Info,
  Award,
  Clock,
  Users,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  UserCheck,
  LayoutGrid,
  Table,
  ArrowRightLeft
} from 'lucide-react';

export const IndividualRegistration: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    students,
    programs,
    teams,
    registrations,
    categoryConfigs,
    settings,
    registerIndividualStudent,
    importIndividualRegistrationsBatch,
    withdrawRegistration
  } = useFestData();

  // Current Team Leader's House (Flexible matching by ID, Code, Name)
  const myTeam = useMemo(() => {
    if (!currentUser?.teamId) return undefined;
    const currentTeamId = currentUser.teamId.toLowerCase();
    return teams.find(
      t =>
        t.id.toLowerCase() === currentTeamId ||
        t.code?.toLowerCase() === currentTeamId ||
        t.name?.toLowerCase() === currentTeamId
    );
  }, [teams, currentUser]);

  // Derived fixed team brand color
  const teamColor = myTeam?.color || '#ef4444';

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedIndividualRegRow[]>([]);
  const [csvValidCount, setCsvValidCount] = useState(0);
  const [csvErrorCount, setCsvErrorCount] = useState(0);
  const [csvFilterStatus, setCsvFilterStatus] = useState<'ALL' | 'VALID' | 'ERRORS'>('ALL');
  const [importNotification, setImportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active students belonging to the Team Leader's house (matches team ID, code, or name)
  const myStudents = useMemo(() => {
    if (!currentUser?.teamId) return [];
    const validTeamIdentifiers = new Set(
      [
        currentUser.teamId.toLowerCase(),
        myTeam?.id?.toLowerCase(),
        myTeam?.code?.toLowerCase(),
        myTeam?.name?.toLowerCase()
      ].filter(Boolean) as string[]
    );

    return students.filter(s => {
      if (s.status !== 'ACTIVE') return false;
      const sTeam = (s.teamId || '').toLowerCase();
      return validTeamIdentifiers.has(sTeam);
    });
  }, [students, currentUser?.teamId, myTeam]);

  // Distribution of House Candidates across categories
  const houseCategoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    myStudents.forEach(st => {
      const cat = st.category || 'UNASSIGNED';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [myStudents]);

  // Active categories configured by Admin
  const availableCategories = useMemo(() => {
    return categoryConfigs.filter(c => c.status !== 'INACTIVE');
  }, [categoryConfigs]);

  // Selected Category (Left Panel)
  const [selectedCategory, setSelectedCategory] = useState<FestCategory>(
    availableCategories[0]?.category || 'SENIOR'
  );

  // Template Downloads (CSV & Excel)
  const handleDownloadTemplate = (format: 'csv' | 'xlsx', allCategories: boolean = false) => {
    downloadIndividualRegTemplate(format, programs, students, currentUser.teamId, selectedCategory, allCategories);
  };

  const handleDownloadSampleCSV = (allCategories: boolean = false) => {
    downloadIndividualRegTemplate('xlsx', programs, students, currentUser.teamId, selectedCategory, allCategories);
  };

  const handleOpenImportModal = () => {
    setCsvFileName('');
    setParsedRows([]);
    setCsvValidCount(0);
    setCsvErrorCount(0);
    setCsvFilterStatus('ALL');
    setImportNotification(null);
    setIsImportModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    try {
      const text = await readSpreadsheetFileAsText(file);
      if (text) {
        const result = validateIndividualRegCSVRows(
          text,
          programs,
          students,
          currentUser.teamId || '',
          registrations,
          categoryConfigs,
          settings.maxIndividualProgramsDefault
        );
        setParsedRows(result.rows);
        setCsvValidCount(result.validCount);
        setCsvErrorCount(result.errorCount);
      }
    } catch (err: any) {
      alert('Failed to read spreadsheet file: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleCommitCSVImport = () => {
    const validRows = parsedRows.filter(r => r.isValid && r.resolvedProgram && r.resolvedStudent);
    if (validRows.length === 0) {
      alert('No valid registration rows found to import.');
      return;
    }

    const entriesToImport = validRows.map(r => ({
      studentId: r.resolvedStudent!.id,
      programId: r.resolvedProgram!.id
    }));

    const result = importIndividualRegistrationsBatch(
      entriesToImport,
      currentUser.name,
      currentUser.role
    );

    if (result.success) {
      setIsImportModalOpen(false);
      setFeedback({
        success: true,
        msg: `🎉 Successfully imported ${result.count} individual candidate registrations via CSV!`
      });
      setTimeout(() => setFeedback(null), 6000);
    } else {
      setImportNotification({
        type: 'error',
        message: result.error || 'Failed to import registrations.'
      });
    }
  };

  const visibleParsedRows = useMemo(() => {
    if (csvFilterStatus === 'VALID') return parsedRows.filter(r => r.isValid);
    if (csvFilterStatus === 'ERRORS') return parsedRows.filter(r => !r.isValid);
    return parsedRows;
  }, [parsedRows, csvFilterStatus]);

  // Filter State (Left Panel)
  const [programSearch, setProgramSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_ENTERED' | 'ENTERED' | 'ARTS' | 'SPORTS'>('ALL');

  // Set of all valid team identifiers for current user/team
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

  // Helper to check if a registration belongs to this Team Leader's house
  const isTeamRegistration = useMemo(() => {
    return (r: Registration): boolean => {
      if (!r) return false;
      const rTeamId = (r.teamId || '').toLowerCase().trim();
      const rTeamName = (r.teamName || '').toLowerCase().trim();
      return (
        validTeamIdentifiers.has(rTeamId) ||
        validTeamIdentifiers.has(rTeamName) ||
        Boolean(myTeam && (rTeamId === myTeam.id.toLowerCase() || rTeamName === myTeam.name.toLowerCase()))
      );
    };
  }, [validTeamIdentifiers, myTeam]);

  // Helper to check if a registration matches a specific Program
  const isProgramRegistration = useMemo(() => {
    return (r: Registration, prog: Program): boolean => {
      if (!r || !prog) return false;
      const rProgId = (r.programId || '').toLowerCase().trim();
      const pId = (prog.id || '').toLowerCase().trim();
      const pCode = (prog.code || '').toLowerCase().trim();
      const rProgName = (r.programName || '').toLowerCase().trim();
      const pName = (prog.name || '').toLowerCase().trim();

      // Direct ID or Code match
      if (rProgId && (rProgId === pId || rProgId === pCode)) return true;
      if ((r as any).programCode && (((r as any).programCode).toLowerCase().trim() === pCode || ((r as any).programCode).toLowerCase().trim() === pId)) return true;

      // Match by Name + Category
      if (rProgName && pName && rProgName === pName) {
        if (!r.category || !prog.category || isCategoryMatch(r.category, prog.category, categoryConfigs)) {
          return true;
        }
      }

      return false;
    };
  }, [categoryConfigs]);

  // All Individual Programs in the selected category
  const allCategoryIndividualPrograms = useMemo(() => {
    return programs.filter(p => {
      if (p.programType !== 'INDIVIDUAL' || !isCategoryMatch(p.category, selectedCategory, categoryConfigs)) return false;
      if (settings.enableArtsSection === false && p.section === 'ARTS') return false;
      if (settings.enableSportsSection === false && p.section === 'SPORTS') return false;
      return true;
    });
  }, [programs, selectedCategory, categoryConfigs, settings.enableArtsSection, settings.enableSportsSection]);

  // Filter Individual Programs for the left sidebar
  const categoryIndividualPrograms = useMemo(() => {
    return allCategoryIndividualPrograms.filter(p => {
      // Search Query
      const q = programSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q);

      if (!matchQ) return false;

      // Section Filter from chip
      if (statusFilter === 'ARTS' && p.section !== 'ARTS') return false;
      if (statusFilter === 'SPORTS' && p.section !== 'SPORTS') return false;

      // Registration Status Filter
      const isRegistered = registrations.some(
        r =>
          isProgramRegistration(r, p) &&
          isTeamRegistration(r) &&
          r.programType === 'INDIVIDUAL' &&
          r.status === 'CONFIRMED'
      );

      if (statusFilter === 'ENTERED' && !isRegistered) return false;
      if (statusFilter === 'NOT_ENTERED' && isRegistered) return false;

      return true;
    });
  }, [allCategoryIndividualPrograms, programSearch, statusFilter, registrations, isProgramRegistration, isTeamRegistration]);

  // Active Selected Program ID
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    const firstProg = programs.find(
      p => p.programType === 'INDIVIDUAL' && p.category === (availableCategories[0]?.category || 'SENIOR')
    );
    return firstProg?.id || '';
  });

  // Ensure an active program is selected when category changes
  const activeProgram = useMemo(() => {
    const found = categoryIndividualPrograms.find(p => p.id === selectedProgramId || p.code === selectedProgramId);
    if (found) return found;
    return categoryIndividualPrograms[0] || null;
  }, [categoryIndividualPrograms, selectedProgramId]);

  // Candidate Search & Filter (Right Panel)
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateFilterStatus, setCandidateFilterStatus] = useState<'ALL' | 'REGISTERED' | 'ELIGIBLE'>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Select Program with Auto-Priority for Registered Candidates
  const selectProgram = (progId: string) => {
    setSelectedProgramId(progId);
    setCandidateSearch('');
    setFeedback(null);
    const count = getProgramRegisteredCount(progId);
    setCandidateFilterStatus(count > 0 ? 'REGISTERED' : 'ALL');
  };

  // Next / Previous Program Navigation
  const currentProgramIndex = categoryIndividualPrograms.findIndex(p => p.id === activeProgram?.id);
  const handlePrevProgram = () => {
    if (currentProgramIndex > 0) {
      selectProgram(categoryIndividualPrograms[currentProgramIndex - 1].id);
    }
  };
  const handleNextProgram = () => {
    if (currentProgramIndex >= 0 && currentProgramIndex < categoryIndividualPrograms.length - 1) {
      selectProgram(categoryIndividualPrograms[currentProgramIndex + 1].id);
    }
  };

  // Candidate avatar initials helper
  const getInitials = (name?: string): string => {
    if (!name) return 'CD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Category Configuration for Quotas
  const currentCategoryConfig = useMemo(() => {
    return categoryConfigs.find(c => isCategoryMatch(c.category, selectedCategory, categoryConfigs));
  }, [categoryConfigs, selectedCategory]);

  const maxIndividualLimit =
    currentCategoryConfig?.maxIndividualProgramsPerStudent ??
    settings.maxIndividualProgramsDefault ??
    5;

  const isCurrentSports = !!activeProgram && (activeProgram.section === 'SPORTS' || activeProgram.subsection === 'SPORTS_EVENT');
  const isCurrentStage = !!activeProgram && !isCurrentSports && activeProgram.subsection === 'STAGE';
  const isCurrentNonStage = !!activeProgram && !isCurrentSports && activeProgram.subsection === 'NON_STAGE';

  const activeProgramTypeLimit = useMemo(() => {
    if (!currentCategoryConfig) return maxIndividualLimit;
    if (isCurrentStage && currentCategoryConfig.maxStagePrograms !== undefined) {
      return currentCategoryConfig.maxStagePrograms;
    }
    if (isCurrentNonStage && currentCategoryConfig.maxNonStagePrograms !== undefined) {
      return currentCategoryConfig.maxNonStagePrograms;
    }
    if (isCurrentSports && currentCategoryConfig.maxSportsPrograms !== undefined) {
      return currentCategoryConfig.maxSportsPrograms;
    }
    return maxIndividualLimit;
  }, [currentCategoryConfig, isCurrentStage, isCurrentNonStage, isCurrentSports, maxIndividualLimit]);

  const activeProgramTypeLabel = isCurrentStage ? 'Stage' : isCurrentNonStage ? 'Non-Stage' : isCurrentSports ? 'Sports' : 'Items';

  // Students belonging to this Leader's House for the selected category (with phonetic/alias category match)
  const eligibleTeamStudents = useMemo(() => {
    return myStudents.filter(s => isCategoryMatch(s.category, selectedCategory, categoryConfigs));
  }, [myStudents, selectedCategory, categoryConfigs]);

  // Registrations for the active program in this house
  const activeProgramRegistrations = useMemo(() => {
    if (!activeProgram) return [];
    return registrations.filter(
      r =>
        isProgramRegistration(r, activeProgram) &&
        isTeamRegistration(r) &&
        r.programType === 'INDIVIDUAL' &&
        r.status === 'CONFIRMED'
    );
  }, [registrations, activeProgram, isProgramRegistration, isTeamRegistration]);

  // Quota for active program for this house (Candidates Per Team)
  const allowedCandidatesPerTeam = activeProgram?.maxParticipants || 1;
  const registeredTeamCandidates = activeProgramRegistrations.length;
  const remainingTeamCandidates = Math.max(0, allowedCandidatesPerTeam - registeredTeamCandidates);
  const isTeamQuotaFull = registeredTeamCandidates >= allowedCandidatesPerTeam;

  // Helper to count student's confirmed individual registrations
  const getStudentIndividualCount = (studentId: string, studentChest?: number | string, studentAdm?: string) => {
    return registrations.filter(
      r =>
        (r.studentId === studentId ||
          (studentChest && r.chestNumber && Number(r.chestNumber) === Number(studentChest)) ||
          (studentAdm && r.admissionNo && r.admissionNo.toLowerCase() === studentAdm.toLowerCase())) &&
        r.programType === 'INDIVIDUAL' &&
        r.status === 'CONFIRMED'
    ).length;
  };

  // Helper to count total registrations for any program by this team
  const getProgramRegisteredCount = (programId: string) => {
    const prog = programs.find(p => p.id === programId || p.code === programId);
    return registrations.filter(
      r =>
        (prog ? isProgramRegistration(r, prog) : (r.programId === programId)) &&
        isTeamRegistration(r) &&
        r.programType === 'INDIVIDUAL' &&
        r.status === 'CONFIRMED'
    ).length;
  };

  // Metrics calculation
  const categoryStats = useMemo(() => {
    const totalEvents = allCategoryIndividualPrograms.length;

    const enteredProgIds = new Set(
      allCategoryIndividualPrograms
        .filter(p =>
          registrations.some(
            r =>
              isProgramRegistration(r, p) &&
              isTeamRegistration(r) &&
              r.programType === 'INDIVIDUAL' &&
              r.status === 'CONFIRMED'
          )
        )
        .map(p => p.id)
    );

    const enteredEventsCount = enteredProgIds.size;
    const pendingEventsCount = Math.max(0, totalEvents - enteredEventsCount);

    const totalEntriesCount = registrations.filter(
      r =>
        isTeamRegistration(r) &&
        isCategoryMatch(r.category, selectedCategory, categoryConfigs) &&
        r.programType === 'INDIVIDUAL' &&
        r.status === 'CONFIRMED'
    ).length;

    const candidatesCount = eligibleTeamStudents.length;

    const participatingStudentsCount = eligibleTeamStudents.filter(
      s => getStudentIndividualCount(s.id, s.chestNumber, s.admissionNo) > 0
    ).length;

    return {
      totalEvents,
      enteredEventsCount,
      pendingEventsCount,
      totalEntriesCount,
      candidatesCount,
      participatingStudentsCount
    };
  }, [allCategoryIndividualPrograms, registrations, isTeamRegistration, isProgramRegistration, selectedCategory, categoryConfigs, eligibleTeamStudents]);

  const isProgramRegistrationOpen = (settings.registrationOpen !== false) && (activeProgram?.registrationOpen !== false);

  // Filtered candidate list for Right Panel (strictly from this Leader's House for selected category)
  const filteredCandidates = useMemo(() => {
    const q = candidateSearch.toLowerCase().trim();
    const list = eligibleTeamStudents.filter(s => {
      const isReg = activeProgramRegistrations.some(
        r =>
          r.studentId === s.id ||
          (s.chestNumber && r.chestNumber && Number(r.chestNumber) === Number(s.chestNumber)) ||
          (s.admissionNo && r.admissionNo && r.admissionNo.toLowerCase() === s.admissionNo.toLowerCase())
      );

      // If registration is closed, STRICTLY show ONLY registered candidates
      if (!isProgramRegistrationOpen) {
        return isReg;
      }

      if (candidateFilterStatus === 'REGISTERED' && !isReg) return false;
      if (candidateFilterStatus === 'ELIGIBLE' && isReg) return false;

      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.chestNumber && s.chestNumber.toString().includes(q)) ||
        (s.classNumber && s.classNumber.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    });

    // Sort registered candidates to appear first
    return list.sort((a, b) => {
      const aReg = activeProgramRegistrations.some(
        r => r.studentId === a.id || (a.chestNumber && r.chestNumber && Number(r.chestNumber) === Number(a.chestNumber))
      );
      const bReg = activeProgramRegistrations.some(
        r => r.studentId === b.id || (b.chestNumber && r.chestNumber && Number(r.chestNumber) === Number(b.chestNumber))
      );
      if (aReg && !bReg) return -1;
      if (!aReg && bReg) return 1;
      return (Number(a.chestNumber) || 9999) - (Number(b.chestNumber) || 9999);
    });
  }, [eligibleTeamStudents, candidateSearch, candidateFilterStatus, activeProgramRegistrations, isProgramRegistrationOpen]);

  // Register Handler
  const handleRegister = (studentId: string, studentName: string) => {
    if (!activeProgram) return;
    setFeedback(null);

    const res = registerIndividualStudent(
      studentId,
      activeProgram.id,
      currentUser.name,
      currentUser.role
    );

    if (res.success) {
      setFeedback({
        success: true,
        msg: `Successfully registered "${studentName}" for "${activeProgram.name}"!`
      });
    } else {
      setFeedback({
        success: false,
        msg: res.error || 'Failed to register student.'
      });
    }
  };

  // Withdraw Handler
  const handleWithdraw = (registrationId: string, studentName: string) => {
    if (!settings.registrationOpen) {
      setFeedback({ success: false, msg: 'Registration is closed. Cannot withdraw candidates.' });
      return;
    }

    if (confirm(`Withdraw registration for "${studentName}"?`)) {
      setFeedback(null);
      const res = withdrawRegistration(registrationId, currentUser.name, currentUser.role);
      if (res.success) {
        setFeedback({
          success: true,
          msg: `Successfully withdrew "${studentName}" from "${activeProgram?.name}".`
        });
      } else {
        setFeedback({
          success: false,
          msg: res.error || 'Failed to withdraw student.'
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5"
              style={{ backgroundColor: `${teamColor}12`, color: teamColor, borderColor: `${teamColor}30` }}
            >
              <UserPlus className="w-3.5 h-3.5" /> Individual Participant Portal
            </span>
            {myTeam && (
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white shadow-xs"
                style={{ backgroundColor: teamColor }}
              >
                TEAM {myTeam.name ? myTeam.name.toUpperCase() : 'SARAHA'}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Program & Candidate Registration
          </h2>
        </div>

        {/* Action Controls & Lock Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleDownloadSampleCSV(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
            title="Download CSV template containing all programs across all categories"
          >
            <Download className="w-3.5 h-3.5" style={{ color: teamColor }} />
            Bulk Program List (All Categories)
          </button>

          <button
            onClick={() => handleDownloadSampleCSV(false)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200 shadow-2xs transition-all cursor-pointer"
            title={`Download template for ${selectedCategory} category only`}
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            {selectedCategory} Template
          </button>

          <button
            onClick={handleOpenImportModal}
            disabled={!settings.registrationOpen && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN'}
            style={{ backgroundColor: teamColor, boxShadow: `0 4px 14px 0 ${teamColor}35` }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV / Excel
          </button>

          {/* Global Registration Lock Badge */}
          {!settings.registrationOpen ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              Locked
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Open
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SMALL METRICS STAT CARDS ROW                                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Category Events */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Events</span>
            <Layers className="w-4 h-4" style={{ color: teamColor }} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {categoryStats.totalEvents}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">in {selectedCategory}</span>
          </div>
        </div>

        {/* Card 2: Entered Events */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Entered Events</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {categoryStats.enteredEventsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">/ {categoryStats.totalEvents}</span>
          </div>
        </div>

        {/* Card 3: Pending / Not Entered */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Events</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 font-mono">
              {categoryStats.pendingEventsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">remaining</span>
          </div>
        </div>

        {/* Card 4: Total Registrations */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Registered</span>
            <Award className="w-4 h-4" style={{ color: teamColor }} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono" style={{ color: teamColor }}>
              {categoryStats.totalEntriesCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">entries</span>
          </div>
        </div>

        {/* Card 5: House Candidates */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">House Candidates</span>
            <Users className="w-4 h-4" style={{ color: teamColor }} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono" style={{ color: teamColor }}>
              {categoryStats.participatingStudentsCount} / {categoryStats.candidatesCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">in {selectedCategory}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            {myStudents.length} total candidates in house
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left (Programmes) & Right (Candidates Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: PROGRAMMES & CATEGORY SELECTOR                  */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col gap-4">
          
          {/* Header with Navigation Count & Arrows */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Programmes</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {categoryIndividualPrograms.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Category Dropdown Selector */}
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value as FestCategory);
                  setProgramSearch('');
                  setFeedback(null);
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.category}>
                    {cat.displayName || cat.category}
                  </option>
                ))}
              </select>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevProgram}
                  disabled={currentProgramIndex <= 0}
                  className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextProgram}
                  disabled={currentProgramIndex >= categoryIndividualPrograms.length - 1}
                  className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Programme Input (Pill Shaped with Filter icon) */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programme"
              value={programSearch}
              onChange={e => setProgramSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-full bg-slate-50/90 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors shadow-2xs"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={statusFilter === 'ALL' ? { backgroundColor: teamColor, color: '#ffffff', boxShadow: `0 2px 8px 0 ${teamColor}35` } : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'text-white'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NOT_ENTERED')}
              style={statusFilter === 'NOT_ENTERED' ? { backgroundColor: teamColor, color: '#ffffff', boxShadow: `0 2px 8px 0 ${teamColor}35` } : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'NOT_ENTERED'
                  ? 'text-white'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              Not Entered
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ENTERED')}
              style={statusFilter === 'ENTERED' ? { backgroundColor: teamColor, color: '#ffffff', boxShadow: `0 2px 8px 0 ${teamColor}35` } : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'ENTERED'
                  ? 'text-white'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              Entered
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'ARTS' ? 'ALL' : 'ARTS')}
              style={statusFilter === 'ARTS' ? { backgroundColor: teamColor, color: '#ffffff', boxShadow: `0 2px 8px 0 ${teamColor}35` } : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'ARTS'
                  ? 'text-white'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              Arts
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'SPORTS' ? 'ALL' : 'SPORTS')}
              style={statusFilter === 'SPORTS' ? { backgroundColor: teamColor, color: '#ffffff', boxShadow: `0 2px 8px 0 ${teamColor}35` } : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'SPORTS'
                  ? 'text-white'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              Sports
            </button>
          </div>

          {/* Programme Cards List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {categoryIndividualPrograms.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                No individual programmes found for {selectedCategory}.
              </div>
            ) : (
              categoryIndividualPrograms.map(prog => {
                const isSelected = activeProgram?.id === prog.id;
                const regCount = getProgramRegisteredCount(prog.id);
                const isEntered = regCount > 0;

                return (
                  <div
                    key={prog.id}
                    onClick={() => selectProgram(prog.id)}
                    style={isSelected ? { borderColor: teamColor, backgroundColor: `${teamColor}08`, boxShadow: `0 0 0 1px ${teamColor}30` } : undefined}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Row 1: Program Name & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        style={isSelected ? { color: teamColor } : undefined}
                        className={`text-sm font-black tracking-tight uppercase ${
                          isSelected ? '' : 'text-slate-900'
                        }`}
                      >
                        {prog.name}
                      </h4>

                      {isEntered ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Entered
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                          Not Entered
                        </span>
                      )}
                    </div>

                    {/* Row 2: Code, Type, and Registered Count */}
                    <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium">
                      <span
                        style={{ color: teamColor, backgroundColor: `${teamColor}12`, borderColor: `${teamColor}30` }}
                        className="font-mono font-bold px-1.5 py-0.5 rounded border text-[11px]"
                      >
                        {prog.code}
                      </span>
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        {prog.programType}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-slate-800 text-[11px]">{prog.category}</span>
                      <span>•</span>
                      <span className="text-[11px] font-mono font-bold text-slate-700">
                        {regCount}/{prog.maxParticipants || 1} candidates
                      </span>
                    </div>

                    {/* Row 3: Manual Result / Venue Subtitle */}
                    <div className="mt-2 text-xs text-slate-400 font-medium flex items-center justify-between">
                      <span>{prog.stageLocation ? `Venue: ${prog.stageLocation}` : 'Manual Result'}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Quota: {prog.maxParticipants || 1}/team
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: CANDIDATE WORKSPACE                           */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          {activeProgram ? (
            <>
              {/* Active Program Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div
                    style={{ color: teamColor }}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1"
                  >
                    <span>{activeProgram.category}</span>
                    <span>•</span>
                    <span>{activeProgram.programType}</span>
                    <span>•</span>
                    <span className="text-slate-600">{activeProgram.section}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                      {activeProgram.name}
                    </h2>

                    {/* Prev / Next Program Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrevProgram}
                        disabled={currentProgramIndex <= 0}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition-colors cursor-pointer"
                        title="Previous Program"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextProgram}
                        disabled={currentProgramIndex >= categoryIndividualPrograms.length - 1}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition-colors cursor-pointer"
                        title="Next Program"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quota Overview Card on Right */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/90 text-right self-start sm:self-auto shrink-0 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-end gap-1.5">
                    <span>{selectedCategory} Limits</span>
                    <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">{activeProgramTypeLabel}</span>
                  </div>
                  <div className="text-xs font-black text-slate-900 font-mono mt-1">
                    Total Max: <span className="text-indigo-600">{maxIndividualLimit}</span> • {activeProgramTypeLabel} Max: <span className="text-purple-600">{activeProgramTypeLimit}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-end gap-1.5 font-mono">
                    <span>Stg: {currentCategoryConfig?.maxStagePrograms ?? maxIndividualLimit}</span>
                    <span>|</span>
                    <span>Non-Stg: {currentCategoryConfig?.maxNonStagePrograms ?? maxIndividualLimit}</span>
                    <span>|</span>
                    <span>Sports: {currentCategoryConfig?.maxSportsPrograms ?? maxIndividualLimit}</span>
                  </div>
                </div>
              </div>

              {/* Team Program Quota Status Banner / Registration Closed Banner */}
              {!isProgramRegistrationOpen ? (
                <div className="p-4 rounded-2xl border bg-rose-50/70 border-rose-200 text-rose-950 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          Registration Closed
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                          Locked
                        </span>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-5 mt-2 flex-wrap font-mono text-xs">
                        <div>
                          <span className="text-slate-600 font-medium">Enrolled Candidates: </span>
                          <strong className="text-slate-900 font-black text-sm">
                            {registeredTeamCandidates} / {allowedCandidatesPerTeam}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-rose-800 bg-white/90 border border-rose-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Registration for this programme is closed. Candidate roster is locked.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isTeamQuotaFull
                      ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                      : 'bg-slate-50/90 border-slate-200/90 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                          {myTeam?.name ? `${myTeam.name.toUpperCase()} HOUSE` : 'YOUR TEAM'} CANDIDATE QUOTA
                        </span>
                        {isTeamQuotaFull ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                            Quota Reached
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {remainingTeamCandidates} Slot{remainingTeamCandidates > 1 ? 's' : ''} Remaining
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 sm:gap-5 mt-2 flex-wrap font-mono text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">Allowed Candidates: </span>
                          <strong className="text-slate-900 font-black text-sm">{allowedCandidatesPerTeam}</strong>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div>
                          <span className="text-slate-500 font-medium">Registered: </span>
                          <strong className="text-emerald-700 font-black text-sm">{registeredTeamCandidates}</strong>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div>
                          <span className="text-slate-500 font-medium">Remaining: </span>
                          <strong className={`font-black text-sm ${remainingTeamCandidates > 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            {remainingTeamCandidates}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {isTeamQuotaFull && (
                      <div className="text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3.5 py-2 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Maximum {allowedCandidatesPerTeam} candidate{allowedCandidatesPerTeam > 1 ? 's are' : ' is'} allowed from your team for this program.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between font-bold animate-in fade-in ${
                    feedback.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
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
                    className="underline opacity-80 hover:opacity-100 cursor-pointer ml-3 text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Category Mismatch / Empty Category Notice */}
              {eligibleTeamStudents.length === 0 && myStudents.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-amber-900">
                        No candidates in <span className="underline decoration-amber-400 decoration-2">{selectedCategory}</span> for {myTeam?.name || 'your'} House
                      </div>
                      <div className="text-[11px] text-amber-800/90 mt-0.5">
                        Your house has candidates in other categories:{' '}
                        {Object.entries(houseCategoryDistribution).map(([cat, cnt]) => (
                          <span key={cat} className="inline-block font-semibold bg-amber-100/90 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300/60 mr-1 text-[10px]">
                            {cat}: {cnt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap">
                    {Object.entries(houseCategoryDistribution).map(([cat]) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat as FestCategory)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                      >
                        Switch to {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules & Program Details Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-amber-900 text-xs flex items-center gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1 font-medium">
                  <span className="font-bold">Venue:</span> {activeProgram.stageLocation || 'Auditorium'} •{' '}
                  <span className="font-bold">Schedule:</span> {activeProgram.scheduleTime || 'Day 1'} •{' '}
                  <span className="font-bold">Rules:</span> {activeProgram.rules || 'Standard fest competition guidelines apply.'}
                </div>
              </div>

              {/* Search Candidates Bar & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search candidates by name, chest number, admission no, or class..."
                    value={candidateSearch}
                    onChange={e => setCandidateSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Filter Tabs */}
                  {isProgramRegistrationOpen ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setCandidateFilterStatus('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          candidateFilterStatus === 'ALL'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All ({eligibleTeamStudents.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCandidateFilterStatus('REGISTERED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          candidateFilterStatus === 'REGISTERED'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Registered ({activeProgramRegistrations.length})
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Registered ({activeProgramRegistrations.length})
                      </span>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-rose-600" /> Closed
                      </span>
                    </div>
                  )}

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 ml-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('CARDS')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'CARDS'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Cards View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('TABLE')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'TABLE'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Table View"
                    >
                      <Table className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* CANDIDATES 2-COLUMN CARDS GRID (USER REFERENCE DESIGN)     */}
              {/* ========================================================= */}
              {viewMode === 'CARDS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredCandidates.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      {!isProgramRegistrationOpen ? (
                        <>
                          <Lock className="w-8 h-8 text-rose-400 mx-auto mb-1" />
                          <p className="text-xs font-bold text-slate-700">
                            Registration is Closed for {activeProgram.name}
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            No candidates from {myTeam?.name || 'your'} House were registered for this programme before registration closed.
                          </p>
                        </>
                      ) : (
                        <>
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                          <p className="text-xs font-bold text-slate-600">
                            {myStudents.length === 0
                              ? `No active candidates registered under ${myTeam?.name || 'your'} House yet.`
                              : `No candidates found matching the current filter in ${myTeam?.name || 'your'} House.`}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredCandidates.map(student => {
                      const regEntry = activeProgramRegistrations.find(
                        r =>
                          r.studentId === student.id ||
                          (student.chestNumber && r.chestNumber && Number(r.chestNumber) === Number(student.chestNumber)) ||
                          (student.admissionNo && r.admissionNo && r.admissionNo.toLowerCase() === student.admissionNo.toLowerCase())
                      );
                      const isRegistered = !!regEntry;
                      const breakdown = getStudentParticipationBreakdown(student.id, registrations);
                      const currentTotal = breakdown.totalIndividual;
                      const currentTypeCount = isCurrentStage
                        ? breakdown.stageCount
                        : isCurrentNonStage
                        ? breakdown.nonStageCount
                        : isCurrentSports
                        ? breakdown.sportsCount
                        : currentTotal;

                      const isTotalQuotaReached = currentTotal >= maxIndividualLimit;
                      const isTypeQuotaReached = currentTypeCount >= activeProgramTypeLimit;
                      const isQuotaReached = isTotalQuotaReached || isTypeQuotaReached;
                      const initials = getInitials(student.name);

                      return (
                        <div
                          key={student.id}
                          className={`p-4 rounded-2xl border transition-all shadow-2xs hover:shadow-xs space-y-3 relative group ${
                            isRegistered
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : isQuotaReached || isTeamQuotaFull
                              ? 'border-slate-200 bg-slate-50/60 opacity-80'
                              : 'border-slate-200/90 bg-white hover:border-slate-300'
                          }`}
                        >
                          {/* Row 1: Avatar, Name, House, and Action */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Avatar Circle */}
                              <div
                                style={{
                                  backgroundColor: `${teamColor}15`,
                                  color: teamColor,
                                  borderColor: `${teamColor}30`
                                }}
                                className="w-9 h-9 rounded-full font-black text-xs flex items-center justify-center shrink-0 border"
                              >
                                {initials}
                              </div>

                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-slate-900 tracking-tight truncate uppercase">
                                  {student.name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-bold uppercase">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: teamColor }}
                                  />
                                  <span>{myTeam?.name || 'House'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Top Right Action Button */}
                            {isRegistered ? (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Check className="w-3 h-3" /> Registered
                                </span>
                                {isProgramRegistrationOpen && (
                                  <button
                                    type="button"
                                    onClick={() => handleWithdraw(regEntry.id, student.name)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Withdraw Candidate"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : isProgramRegistrationOpen ? (
                              <button
                                type="button"
                                onClick={() => handleRegister(student.id, student.name)}
                                disabled={isQuotaReached || isTeamQuotaFull}
                                style={
                                  isTeamQuotaFull || isQuotaReached
                                    ? undefined
                                    : { backgroundColor: teamColor }
                                }
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                  isTeamQuotaFull || isQuotaReached
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                    : 'text-white hover:opacity-90 shadow-2xs'
                                }`}
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>{isTeamQuotaFull ? 'Full' : 'Register'}</span>
                              </button>
                            ) : null}
                          </div>

                          {/* Row 2: Chest # / Category & Substitution Allowed Tag */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-mono">
                            <div className="flex items-center gap-2.5">
                              {student.chestNumber ? (
                                <span className="font-bold text-slate-800 font-mono">
                                  {student.chestNumber}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                              <span className="text-slate-500 uppercase font-semibold">
                                {student.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-600">
                                {activeProgramTypeLabel}: <strong className="text-slate-900">{currentTypeCount}/{activeProgramTypeLimit}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* CANDIDATES TABLE VIEW (DETAILED MATRIX)                   */}
              {/* ========================================================= */}
              {viewMode === 'TABLE' && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Candidate</th>
                          <th className="py-3 px-4">Chest No</th>
                          <th className="py-3 px-4">Class</th>
                          <th className="py-3 px-4">Participation Breakdown</th>
                          <th className="py-3 px-4 text-right">Registration Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredCandidates.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium">
                              {!isProgramRegistrationOpen ? (
                                <div className="space-y-1">
                                  <span className="flex items-center justify-center gap-2 text-rose-700 font-bold">
                                    <Lock className="w-4 h-4 text-rose-600" /> Registration is Closed for {activeProgram.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block">
                                    No candidates from {myTeam?.name || 'your'} House were registered before closure.
                                  </span>
                                </div>
                              ) : myStudents.length === 0 ? (
                                `No active candidates registered under ${myTeam?.name || 'your'} House yet.`
                              ) : (
                                `No candidates found matching the current filter in ${myTeam?.name || 'your'} House.`
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredCandidates.map(student => {
                            const regEntry = activeProgramRegistrations.find(
                              r =>
                                r.studentId === student.id ||
                                (student.chestNumber && r.chestNumber && Number(r.chestNumber) === Number(student.chestNumber)) ||
                                (student.admissionNo && r.admissionNo && r.admissionNo.toLowerCase() === student.admissionNo.toLowerCase())
                            );
                            const isRegistered = !!regEntry;
                            const breakdown = getStudentParticipationBreakdown(student.id, registrations);
                            const currentTotal = breakdown.totalIndividual;
                            const currentTypeCount = isCurrentStage
                              ? breakdown.stageCount
                              : isCurrentNonStage
                              ? breakdown.nonStageCount
                              : isCurrentSports
                              ? breakdown.sportsCount
                              : currentTotal;

                            const isTotalQuotaReached = currentTotal >= maxIndividualLimit;
                            const isTypeQuotaReached = currentTypeCount >= activeProgramTypeLimit;
                            const isQuotaReached = isTotalQuotaReached || isTypeQuotaReached;
                            const isCatMatching = isCategoryMatch(student.category, activeProgram.category, categoryConfigs);

                            let limitBadge = null;
                            if (isTotalQuotaReached) {
                              limitBadge = 'TOTAL MAX';
                            } else if (isTypeQuotaReached) {
                              limitBadge = `${activeProgramTypeLabel.toUpperCase()} MAX`;
                            }

                            return (
                              <tr
                                key={student.id}
                                className={`transition-colors ${
                                  isRegistered
                                    ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                                    : isQuotaReached || isTeamQuotaFull
                                    ? 'bg-amber-50/30 hover:bg-amber-50/50'
                                    : 'hover:bg-slate-50/80'
                                }`}
                              >
                                {/* Candidate Info */}
                                <td className="py-3.5 px-4">
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-900 text-xs uppercase">
                                        {student.name}
                                      </span>
                                      <span
                                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                                          isCatMatching
                                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}
                                      >
                                        {student.category}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                                      Adm: {student.admissionNo}
                                    </span>
                                  </div>
                                </td>

                                {/* Chest No */}
                                <td className="py-3.5 px-4">
                                  {student.chestNumber ? (
                                    <span
                                      style={{ backgroundColor: `${teamColor}12`, color: teamColor, borderColor: `${teamColor}30` }}
                                      className="font-mono font-bold px-2 py-0.5 rounded border"
                                    >
                                      #{student.chestNumber}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>

                                {/* Class */}
                                <td className="py-3.5 px-4 font-mono text-slate-600">
                                  Class {student.classNumber}
                                </td>

                                {/* Quota Progress */}
                                <td className="py-3.5 px-4">
                                  <div className="w-36 space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span
                                        className={`font-mono ${
                                          isQuotaReached ? 'text-amber-700' : 'text-slate-700'
                                        }`}
                                      >
                                        {activeProgramTypeLabel}: {currentTypeCount}/{activeProgramTypeLimit}
                                      </span>
                                      {limitBadge && (
                                        <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1 rounded border border-amber-300">
                                          {limitBadge}
                                        </span>
                                      )}
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="h-1.5 rounded-full transition-all"
                                        style={{
                                          backgroundColor: isQuotaReached ? '#f59e0b' : teamColor,
                                          width: `${Math.min(
                                            100,
                                            (currentTypeCount / Math.max(1, activeProgramTypeLimit)) * 100
                                          )}%`
                                        }}
                                      />
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      Total: {currentTotal}/{maxIndividualLimit} (Stg:{breakdown.stageCount}, Non:{breakdown.nonStageCount}, Sp:{breakdown.sportsCount})
                                    </div>
                                  </div>
                                </td>

                                {/* Action Button */}
                                <td className="py-3.5 px-4 text-right">
                                  {isRegistered ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-200">
                                        <Check className="w-3.5 h-3.5" /> Registered
                                      </span>
                                      {isProgramRegistrationOpen && (
                                        <button
                                          type="button"
                                          onClick={() => handleWithdraw(regEntry.id, student.name)}
                                          className="p-1.5 rounded-xl hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                          title="Withdraw Candidate"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ) : isProgramRegistrationOpen ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRegister(student.id, student.name)}
                                      disabled={isQuotaReached || isTeamQuotaFull}
                                      style={
                                        isTeamQuotaFull || isQuotaReached
                                          ? undefined
                                          : { backgroundColor: teamColor, boxShadow: `0 3px 10px 0 ${teamColor}35` }
                                      }
                                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer ${
                                        isTeamQuotaFull || isQuotaReached
                                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                          : 'text-white hover:opacity-90'
                                      }`}
                                      title={
                                        isTeamQuotaFull
                                          ? `Maximum ${allowedCandidatesPerTeam} candidate(s) are allowed from your team for this program.`
                                          : isTotalQuotaReached
                                          ? 'Candidate has reached the overall maximum limit'
                                          : isTypeQuotaReached
                                          ? `Candidate has reached the maximum ${activeProgramTypeLabel} program limit`
                                          : undefined
                                      }
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                      {isTeamQuotaFull ? 'Quota Full' : 'Register'}
                                    </button>
                                  ) : null}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">Select a Programme</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose an individual competition from the left sidebar to enroll candidates from your house.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CSV BATCH IMPORT MODAL (INDIVIDUAL CANDIDATES)              */}
      {/* ============================================================ */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Batch Import Individual Candidate Registrations"
        subtitle={`Upload a CSV file to enroll candidates from ${myTeam?.name || 'your'} house into their respective events.`}
        maxWidth="4xl"
      >
        <div className="space-y-5">
          {importNotification && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
                importNotification.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {importNotification.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{importNotification.message}</span>
              </div>
              <button
                onClick={() => setImportNotification(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Instructions and Download Template Bar */}
          <div
            style={{ backgroundColor: `${teamColor}08`, borderColor: `${teamColor}30` }}
            className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <FileSpreadsheet className="w-5 h-5 shrink-0 mt-0.5" style={{ color: teamColor }} />
              <div>
                <p className="font-bold text-slate-900">CSV & Excel Spreadsheet Requirements</p>
                <p className="text-slate-600 mt-0.5">
                  Columns: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200" style={{ color: teamColor }}>ProgramCode</code>,{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">ProgramName</code>,{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">Category</code>,{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">AllottedLimit</code>,{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200" style={{ color: teamColor }}>Candidate_1</code>,{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200" style={{ color: teamColor }}>Candidate_2</code>...
                </p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: teamColor }}>
                  ✨ Auto-Detection: Simply enter candidate Chest Numbers (e.g. 101, 104) or Admission Numbers in Candidate 1, Candidate 2 columns. Student names are automatically detected!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0 self-start sm:self-auto">
              <button
                onClick={() => handleDownloadTemplate('xlsx', true)}
                style={{ backgroundColor: teamColor, boxShadow: `0 2px 8px 0 ${teamColor}35` }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-bold transition-colors cursor-pointer"
                title="Download bulk Excel (.xlsx) containing all individual programs"
              >
                <Download className="w-3.5 h-3.5" />
                All (Excel)
              </button>
              <button
                onClick={() => handleDownloadTemplate('xlsx', false)}
                style={{ color: teamColor, borderColor: `${teamColor}40` }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 font-semibold border shadow-2xs transition-colors cursor-pointer"
                title={`Download Excel template for ${selectedCategory}`}
              >
                <Download className="w-3.5 h-3.5" />
                {selectedCategory} (Excel)
              </button>
              <button
                onClick={() => handleDownloadTemplate('csv', true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                title="Download CSV format template"
              >
                <Download className="w-3 h-3 text-slate-500" />
                CSV
              </button>
            </div>
          </div>

          {/* Upload Input Area */}
          <div className="relative border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-3xl p-6 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2 pointer-events-none">
              <div
                style={{ color: teamColor }}
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center mx-auto"
              >
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {csvFileName ? `Selected: ${csvFileName}` : 'Click or drag & drop a .CSV or Excel (.xlsx) file here'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instant validation: verifies student quotas, category eligibility, and house entry limits. Supports .csv and .xlsx.
                </p>
              </div>
            </div>
          </div>

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              {/* Summary Stats & Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCsvFilterStatus('ALL')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      csvFilterStatus === 'ALL'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All Rows ({parsedRows.length})
                  </button>

                  <button
                    onClick={() => setCsvFilterStatus('VALID')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      csvFilterStatus === 'VALID'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Ready to Register ({csvValidCount})
                  </button>

                  {csvErrorCount > 0 && (
                    <button
                      onClick={() => setCsvFilterStatus('ERRORS')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        csvFilterStatus === 'ERRORS'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Issues Found ({csvErrorCount})
                    </button>
                  )}
                </div>

                <span className="text-xs font-medium text-slate-500">
                  {csvValidCount} of {parsedRows.length} rows valid
                </span>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/80 sticky top-0 z-10 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Program</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Allotted Limit</th>
                      <th className="py-2.5 px-3">Chest No</th>
                      <th className="py-2.5 px-3">Admission No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Validation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {visibleParsedRows.map(row => (
                      <tr key={row.rowIndex} className={row.isValid ? 'hover:bg-slate-50/60' : 'bg-rose-50/40 hover:bg-rose-50/70'}>
                        <td className="py-2.5 px-3 font-mono text-slate-400 font-semibold">{row.rowIndex}</td>
                        <td className="py-2.5 px-3">
                          {row.resolvedProgram ? (
                            <div>
                              <span className="font-bold text-slate-900">{row.resolvedProgram.name}</span>
                              <span className="font-mono text-[10px] text-slate-400 block">{row.resolvedProgram.code}</span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900">{row.programName || '-'}</span>
                              <span className="font-mono text-rose-600 font-bold block">{row.programCode || '(Empty)'}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {row.category || row.resolvedProgram?.category || row.resolvedStudent?.category || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                            Max {row.maxCandidates || row.resolvedProgram?.maxParticipants || 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {row.chestNo ? (
                            <span className="font-bold" style={{ color: teamColor }}>#{row.chestNo}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {row.admissionNo || <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          {row.resolvedStudent ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{row.resolvedStudent.name}</span>
                              <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                Auto-detected
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-rose-600 font-semibold">{row.studentName || 'Not identified'}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Ready
                            </span>
                          ) : (
                            <div className="space-y-0.5 max-w-xs">
                              {row.errors.map((err, ei) => (
                                <p key={ei} className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                  {err}
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commit / Submit Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCommitCSVImport}
                  disabled={csvValidCount === 0}
                  style={{ backgroundColor: teamColor, boxShadow: `0 4px 14px 0 ${teamColor}35` }}
                  className="px-5 py-2.5 rounded-2xl hover:opacity-95 disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Bulk Register ({csvValidCount} Candidates)
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
