import React, { useState, useMemo, useRef } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { useDebounce } from '../../hooks/useDebounce';
import { FestCategory, Program, Registration } from '../../types';
import {
  generateSampleGroupRegCSV,
  validateGroupRegCSVRows,
  triggerFileDownload,
  triggerExcelDownload,
  readSpreadsheetFileAsText,
  downloadGroupRegTemplate,
  ParsedGroupRegRow
} from '../../utils/csvHelpers';
import { isCategoryMatch } from '../../utils/validations';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
  X,
  Layers,
  Info,
  Plus,
  Award,
  Clock,
  UserCheck,
  Filter,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export const GroupRegistration: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    students,
    programs,
    teams,
    categoryConfigs,
    registrations,
    settings,
    registerGroupStudents,
    importGroupRegistrationsBatch,
    updateGroupStudents,
    deleteGroupRegistration
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

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedGroupRegRow[]>([]);
  const [csvValidCount, setCsvValidCount] = useState(0);
  const [csvErrorCount, setCsvErrorCount] = useState(0);
  const [csvFilterStatus, setCsvFilterStatus] = useState<'ALL' | 'VALID' | 'ERRORS'>('ALL');
  const [importNotification, setImportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    downloadGroupRegTemplate(format, programs, students, currentUser.teamId, selectedCategory, allCategories);
  };

  const handleDownloadSampleCSV = (allCategories: boolean = false) => {
    downloadGroupRegTemplate('xlsx', programs, students, currentUser.teamId, selectedCategory, allCategories);
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
        const result = validateGroupRegCSVRows(
          text,
          programs,
          students,
          currentUser.teamId || '',
          registrations,
          categoryConfigs
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
    const validRows = parsedRows.filter(r => r.isValid && r.resolvedProgram && r.resolvedStudents.length > 0);
    if (validRows.length === 0) {
      alert('No valid group rows found to import.');
      return;
    }

    const entriesToImport = validRows.map(r => ({
      programId: r.resolvedProgram!.id,
      groupName: r.groupName,
      studentIds: r.resolvedStudents.map(s => s.id)
    }));

    const result = importGroupRegistrationsBatch(
      entriesToImport,
      currentUser.teamId || '',
      currentUser.name,
      currentUser.role
    );

    if (result.success) {
      setIsImportModalOpen(false);
      setFeedback({
        success: true,
        msg: `🎉 Successfully imported ${result.count} group registrations via CSV for ${myTeam?.name || 'your house'}!`
      });
      setTimeout(() => setFeedback(null), 6000);
    } else {
      setImportNotification({
        type: 'error',
        message: result.error || 'Failed to import groups.'
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
  const debouncedProgramSearch = useDebounce(programSearch, 200);
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
        if (!r.category || !prog.category || prog.programType === 'GENERAL' || isCategoryMatch(r.category, prog.category, categoryConfigs)) {
          return true;
        }
      }

      return false;
    };
  }, [categoryConfigs]);

  // All Group Programs in the selected category (with strict deduplication)
  const allCategoryGroupPrograms = useMemo(() => {
    const list = programs.filter(p => {
      const isGroup = p.programType === 'GROUP' || p.programType === 'GENERAL';
      if (!isGroup) return false;
      if (settings.enableArtsSection === false && p.section === 'ARTS') return false;
      if (settings.enableSportsSection === false && p.section === 'SPORTS') return false;
      return p.programType === 'GENERAL' || isCategoryMatch(p.category, selectedCategory, categoryConfigs);
    });

    const seen = new Set<string>();
    const deduplicated: Program[] = [];
    for (const prog of list) {
      const codeKey = prog.code ? prog.code.toLowerCase().trim() : '';
      const nameKey = (prog.name || '').toLowerCase().trim();
      const catKey = (prog.category || '').toLowerCase().trim();
      const uniqueKey = codeKey ? `code:${codeKey}` : `name:${nameKey}|${catKey}`;

      if (!seen.has(uniqueKey) && !seen.has(prog.id)) {
        seen.add(uniqueKey);
        seen.add(prog.id);
        if (codeKey) seen.add(`name:${nameKey}|${catKey}`);
        deduplicated.push(prog);
      }
    }
    return deduplicated;
  }, [programs, selectedCategory, categoryConfigs, settings.enableArtsSection, settings.enableSportsSection]);

  // Filter Group Programs for the left sidebar
  const categoryGroupPrograms = useMemo(() => {
    return allCategoryGroupPrograms.filter(p => {
      // Search Query
      const q = debouncedProgramSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q);

      if (!matchQ) return false;

      // Section Filter from chip
      if (statusFilter === 'ARTS' && p.section !== 'ARTS') return false;
      if (statusFilter === 'SPORTS' && p.section !== 'SPORTS') return false;

      // Registration Status Filter
      const teamRegs = registrations.filter(
        r =>
          isProgramRegistration(r, p) &&
          isTeamRegistration(r) &&
          (r.programType === 'GROUP' || r.programType === 'GENERAL') &&
          r.status === 'CONFIRMED'
      );

      if (statusFilter === 'ENTERED' && teamRegs.length === 0) return false;
      if (statusFilter === 'NOT_ENTERED' && teamRegs.length > 0) return false;

      return true;
    });
  }, [allCategoryGroupPrograms, debouncedProgramSearch, statusFilter, registrations, isProgramRegistration, isTeamRegistration]);

  // Active Selected Program ID
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    const firstProg = programs.find(
      p => (p.programType === 'GROUP' || p.programType === 'GENERAL') && (p.programType === 'GENERAL' || p.category === (availableCategories[0]?.category || 'SENIOR'))
    );
    return firstProg?.id || '';
  });

  // Ensure active program
  const activeProgram = useMemo(() => {
    const found = categoryGroupPrograms.find(p => p.id === selectedProgramId || p.code === selectedProgramId);
    if (found) return found;
    return categoryGroupPrograms[0] || null;
  }, [categoryGroupPrograms, selectedProgramId]);

  // Next / Previous Navigation
  const currentProgramIndex = categoryGroupPrograms.findIndex(p => p.id === activeProgram?.id);
  const handlePrevProgram = () => {
    if (currentProgramIndex > 0) {
      setSelectedProgramId(categoryGroupPrograms[currentProgramIndex - 1].id);
      setFeedback(null);
    }
  };
  const handleNextProgram = () => {
    if (currentProgramIndex >= 0 && currentProgramIndex < categoryGroupPrograms.length - 1) {
      setSelectedProgramId(categoryGroupPrograms[currentProgramIndex + 1].id);
      setFeedback(null);
    }
  };

  // Group parameters for active program
  const maxGroupsAllowed = activeProgram?.maxGroupsPerTeam ?? 2;
  const requiredCandidatesCount =
    activeProgram?.requiredMembersPerGroup ?? activeProgram?.minParticipants ?? 3;

  // Existing registered groups for this team in active program
  const registeredTeamGroups = useMemo(() => {
    if (!activeProgram || !currentUser.teamId) return [];
    return registrations.filter(
      r =>
        isProgramRegistration(r, activeProgram) &&
        isTeamRegistration(r) &&
        (r.programType === 'GROUP' || r.programType === 'GENERAL') &&
        r.status === 'CONFIRMED'
    );
  }, [registrations, activeProgram, isProgramRegistration, isTeamRegistration]);

  const createdGroupsCount = registeredTeamGroups.length;
  const isMaxGroupsReached = createdGroupsCount >= maxGroupsAllowed;
  const nextGroupNumber = createdGroupsCount + 1;
  const isProgramRegistrationOpen = (settings.registrationOpen !== false) && (activeProgram?.registrationOpen !== false);

  // IDs of students registered in any existing group for this program
  const alreadyRegisteredStudentIds = useMemo(() => {
    const ids = new Set<string>();
    registeredTeamGroups.forEach(grp => {
      grp.groupMembers?.forEach(m => ids.add(m.studentId));
    });
    return ids;
  }, [registeredTeamGroups]);

  // Candidate Selection State for New Group
  const [candidateSlots, setCandidateSlots] = useState<string[]>([]);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const debouncedStudentSearchQuery = useDebounce(studentSearchQuery, 150);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Edit Group Modal State
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [editCandidateSlots, setEditCandidateSlots] = useState<string[]>([]);
  const [editGroupName, setEditGroupName] = useState('');
  const [editActiveSlotIndex, setEditActiveSlotIndex] = useState<number | null>(null);
  const [isEditStudentPickerOpen, setIsEditStudentPickerOpen] = useState(false);
  const [editStudentSearchQuery, setEditStudentSearchQuery] = useState('');
  const debouncedEditStudentSearchQuery = useDebounce(editStudentSearchQuery, 150);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  // Keep slots array synced with active program selection without resetting candidate selections on re-renders
  const prevActiveProgramIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (activeProgram) {
      const count = activeProgram.requiredMembersPerGroup ?? activeProgram.minParticipants ?? 3;
      const isProgramChanged = prevActiveProgramIdRef.current !== activeProgram.id;
      prevActiveProgramIdRef.current = activeProgram.id;

      setCandidateSlots(prev => {
        if (!isProgramChanged && prev.length === count) return prev;
        const newArr = new Array(count).fill('');
        for (let i = 0; i < Math.min(prev.length, count); i++) {
          newArr[i] = isProgramChanged ? '' : prev[i];
        }
        return newArr;
      });

      if (isProgramChanged) {
        setGroupNameInput(`${myTeam?.name || 'Team'} - Group ${registeredTeamGroups.length + 1}`);
      }
    }
  }, [activeProgram?.id, activeProgram?.requiredMembersPerGroup, activeProgram?.minParticipants, myTeam?.name]);

  // Eligible students for the active program (strictly from this leader's house matching active program category)
  const eligibleTeamStudents = useMemo(() => {
    if (!activeProgram) return [];
    return myStudents.filter(s => {
      if (activeProgram.programType === 'GENERAL') return true;
      return isCategoryMatch(s.category, activeProgram.category, categoryConfigs);
    });
  }, [myStudents, activeProgram, categoryConfigs]);

  // Helper to count registered groups for a program
  const getGroupRegisteredCount = (programId: string) => {
    const prog = programs.find(p => p.id === programId || p.code === programId);
    return registrations.filter(
      r =>
        (prog ? isProgramRegistration(r, prog) : (r.programId === programId)) &&
        isTeamRegistration(r) &&
        (r.programType === 'GROUP' || r.programType === 'GENERAL') &&
        r.status === 'CONFIRMED'
    ).length;
  };

  // Metrics calculation
  const groupCategoryStats = useMemo(() => {
    const totalCompetitions = allCategoryGroupPrograms.length;

    const enteredProgIds = new Set(
      allCategoryGroupPrograms
        .filter(p =>
          registrations.some(
            r =>
              isProgramRegistration(r, p) &&
              isTeamRegistration(r) &&
              (r.programType === 'GROUP' || r.programType === 'GENERAL') &&
              r.status === 'CONFIRMED'
          )
        )
        .map(p => p.id)
    );

    const enteredCompetitionsCount = enteredProgIds.size;
    const pendingCompetitionsCount = Math.max(0, totalCompetitions - enteredCompetitionsCount);

    const totalGroupsCount = registrations.filter(
      r =>
        isTeamRegistration(r) &&
        (isCategoryMatch(r.category, selectedCategory, categoryConfigs) || r.programType === 'GENERAL') &&
        (r.programType === 'GROUP' || r.programType === 'GENERAL') &&
        r.status === 'CONFIRMED'
    ).length;

    let totalSlottedMembers = 0;
    registrations
      .filter(
        r =>
          isTeamRegistration(r) &&
          (isCategoryMatch(r.category, selectedCategory, categoryConfigs) || r.programType === 'GENERAL') &&
          (r.programType === 'GROUP' || r.programType === 'GENERAL') &&
          r.status === 'CONFIRMED'
      )
      .forEach(r => {
        totalSlottedMembers += r.groupMembers?.length || 0;
      });

    return {
      totalCompetitions,
      enteredCompetitionsCount,
      pendingCompetitionsCount,
      totalGroupsCount,
      totalSlottedMembers
    };
  }, [allCategoryGroupPrograms, registrations, isTeamRegistration, isProgramRegistration, selectedCategory, categoryConfigs]);

  // Filtered students for picker modal (New Group)
  const filteredPickerStudents = useMemo(() => {
    const q = debouncedStudentSearchQuery.toLowerCase().trim();
    return eligibleTeamStudents.filter(s => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.chestNumber && s.chestNumber.toString().includes(q)) ||
        (s.classNumber && s.classNumber.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    });
  }, [eligibleTeamStudents, debouncedStudentSearchQuery]);

  // Filtered students for picker modal (Edit Group)
  const filteredEditPickerStudents = useMemo(() => {
    const q = debouncedEditStudentSearchQuery.toLowerCase().trim();
    return eligibleTeamStudents.filter(s => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.chestNumber && s.chestNumber.toString().includes(q)) ||
        (s.classNumber && s.classNumber.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    });
  }, [eligibleTeamStudents, debouncedEditStudentSearchQuery]);

  // Open slot picker for New Group
  const handleOpenSlotPicker = (slotIndex: number) => {
    if (!settings.registrationOpen) return;
    setActiveSlotIndex(slotIndex);
    setStudentSearchQuery('');
    setIsStudentPickerOpen(true);
  };

  // Assign student to slot in New Group
  const handleAssignStudentToSlot = (studentId: string) => {
    if (activeSlotIndex === null) return;
    const newSlots = [...candidateSlots];
    newSlots[activeSlotIndex] = studentId;
    setCandidateSlots(newSlots);
    setIsStudentPickerOpen(false);
    setActiveSlotIndex(null);
  };

  // Remove student from slot in New Group
  const handleClearSlot = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlots = [...candidateSlots];
    newSlots[slotIndex] = '';
    setCandidateSlots(newSlots);
  };

  // Submit New Group
  const handleSubmitNewGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram || !currentUser.teamId) return;

    if (!settings.registrationOpen) {
      setFeedback({ success: false, msg: 'Registration is closed. Submissions are locked.' });
      return;
    }

    if (isMaxGroupsReached) {
      setFeedback({
        success: false,
        msg: `Maximum group limit (${maxGroupsAllowed} ${maxGroupsAllowed === 1 ? 'group' : 'groups'}) reached for this program.`
      });
      return;
    }

    const filledCandidateIds = candidateSlots.filter(Boolean);
    if (filledCandidateIds.length !== requiredCandidatesCount) {
      setFeedback({
        success: false,
        msg: `Please select all ${requiredCandidatesCount} required candidates before submitting Group ${nextGroupNumber}.`
      });
      return;
    }

    // Duplicate check in candidate slots
    const uniqueIds = new Set(filledCandidateIds);
    if (uniqueIds.size !== filledCandidateIds.length) {
      setFeedback({
        success: false,
        msg: 'A student cannot be selected more than once in the same group.'
      });
      return;
    }

    // Cross-group check
    const duplicateCrossGroup = filledCandidateIds.find(id => alreadyRegisteredStudentIds.has(id));
    if (duplicateCrossGroup) {
      const st = students.find(s => s.id === duplicateCrossGroup);
      setFeedback({
        success: false,
        msg: `Candidate "${st?.name || duplicateCrossGroup}" is already registered in another group for this program.`
      });
      return;
    }

    const groupTitle = groupNameInput.trim() || `${myTeam?.name || 'Team'} - Group ${nextGroupNumber}`;

    const res = registerGroupStudents(
      currentUser.teamId,
      activeProgram.id,
      groupTitle,
      filledCandidateIds,
      currentUser.name,
      currentUser.role
    );

    if (res.success) {
      setFeedback({
        success: true,
        msg: `Group ${nextGroupNumber} ("${groupTitle}") has been successfully registered!`
      });
      // Reset candidate slots
      setCandidateSlots(new Array(requiredCandidatesCount).fill(''));
      setGroupNameInput(`${myTeam?.name || 'Team'} - Group ${nextGroupNumber + 1}`);
    } else {
      setFeedback({ success: false, msg: res.error || 'Failed to submit group.' });
    }
  };

  // Open Edit Group Modal
  const handleOpenEditGroup = (reg: Registration) => {
    if (!settings.registrationOpen) {
      alert('Registration is closed. You can no longer edit this group.');
      return;
    }
    setEditingRegistration(reg);
    const existingMemberIds = reg.groupMembers?.map(m => m.studentId) || [];
    const slots = [...existingMemberIds];
    while (slots.length < requiredCandidatesCount) {
      slots.push('');
    }
    setEditCandidateSlots(slots.slice(0, requiredCandidatesCount));
    setEditGroupName(reg.groupName || `${reg.teamName} Group`);
    setEditFeedback(null);
  };

  // Open slot picker for Edit Group
  const handleOpenEditSlotPicker = (slotIndex: number) => {
    setEditActiveSlotIndex(slotIndex);
    setEditStudentSearchQuery('');
    setIsEditStudentPickerOpen(true);
  };

  // Assign student to slot in Edit Group
  const handleAssignEditStudent = (studentId: string) => {
    if (editActiveSlotIndex === null) return;
    const newSlots = [...editCandidateSlots];
    newSlots[editActiveSlotIndex] = studentId;
    setEditCandidateSlots(newSlots);
    setIsEditStudentPickerOpen(false);
    setEditActiveSlotIndex(null);
  };

  // Clear slot in Edit Group
  const handleClearEditSlot = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlots = [...editCandidateSlots];
    newSlots[slotIndex] = '';
    setEditCandidateSlots(newSlots);
  };

  // Save Edited Group
  const handleSaveEditGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegistration || !activeProgram) return;

    if (!settings.registrationOpen) {
      setEditFeedback('Registration is closed. You cannot edit this group.');
      return;
    }

    const filledCandidateIds = editCandidateSlots.filter(Boolean);
    if (filledCandidateIds.length !== requiredCandidatesCount) {
      setEditFeedback(`Please assign exactly ${requiredCandidatesCount} candidates for this group.`);
      return;
    }

    const uniqueIds = new Set(filledCandidateIds);
    if (uniqueIds.size !== filledCandidateIds.length) {
      setEditFeedback('Duplicate candidate selected within the group.');
      return;
    }

    // Other groups' student IDs
    const otherGroupStudentIds = new Set<string>();
    registeredTeamGroups
      .filter(g => g.id !== editingRegistration.id)
      .forEach(g => {
        g.groupMembers?.forEach(m => otherGroupStudentIds.add(m.studentId));
      });

    const crossDuplicate = filledCandidateIds.find(id => otherGroupStudentIds.has(id));
    if (crossDuplicate) {
      const st = students.find(s => s.id === crossDuplicate);
      setEditFeedback(`Candidate "${st?.name || crossDuplicate}" is already assigned to another group in this event.`);
      return;
    }

    const res = updateGroupStudents(
      editingRegistration.id,
      editGroupName.trim() || editingRegistration.groupName || 'Group',
      filledCandidateIds,
      currentUser.name,
      currentUser.role
    );

    if (res.success) {
      setEditingRegistration(null);
      setFeedback({
        success: true,
        msg: `Group "${editGroupName}" details updated successfully!`
      });
    } else {
      setEditFeedback(res.error || 'Failed to update group.');
    }
  };

  // Delete Group
  const handleDeleteGroup = (reg: Registration) => {
    if (!settings.registrationOpen) {
      alert('Registration is closed. You can no longer withdraw this group.');
      return;
    }
    if (confirm(`Withdraw "${reg.groupName || 'this group'}"? All member slots will be released.`)) {
      const res = deleteGroupRegistration(reg.id, currentUser.name, currentUser.role);
      if (res.success) {
        setFeedback({ success: true, msg: `Withdrew "${reg.groupName || 'Group'}" successfully.` });
      } else {
        setFeedback({ success: false, msg: res.error || 'Failed to withdraw group.' });
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
              <Users className="w-3.5 h-3.5" /> Group Program Portal
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
            Group Program Registration
          </h2>
        </div>

        {/* Action Controls & Lock Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleDownloadSampleCSV(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
            title="Download CSV template containing all group programs across all categories"
          >
            <Download className="w-3.5 h-3.5" style={{ color: teamColor }} />
            Bulk Group List (All Categories)
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

          {/* Global Lock Warning Indicator */}
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
        {/* Card 1: Total Group Events */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Group Events</span>
            <Layers className="w-4 h-4" style={{ color: teamColor }} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {groupCategoryStats.totalCompetitions}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">in {selectedCategory}</span>
          </div>
        </div>

        {/* Card 2: Entered Competitions */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Entered Events</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {groupCategoryStats.enteredCompetitionsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">/ {groupCategoryStats.totalCompetitions}</span>
          </div>
        </div>

        {/* Card 3: Pending Competitions */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Events</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 font-mono">
              {groupCategoryStats.pendingCompetitionsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">remaining</span>
          </div>
        </div>

        {/* Card 4: Total Groups Submitted */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Groups Slotted</span>
            <Award className="w-4 h-4" style={{ color: teamColor }} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono" style={{ color: teamColor }}>
              {groupCategoryStats.totalGroupsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">groups</span>
          </div>
        </div>

        {/* Card 5: Total Slotted Member Students */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Enrolled Students</span>
            <UserCheck className="w-4 h-4" style={{ color: teamColor }} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono" style={{ color: teamColor }}>
              {groupCategoryStats.totalSlottedMembers}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">participants</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left (Programmes) & Right (Candidate Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: PROGRAMMES & CATEGORY SELECTOR                  */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col gap-4">
          
          {/* Header with Navigation Count & Arrows */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Group Events</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {categoryGroupPrograms.length}
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
                  disabled={currentProgramIndex >= categoryGroupPrograms.length - 1}
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

          {/* Scrollable Group Programmes List */}
          <div className="space-y-3 max-h-[calc(100vh-280px)] min-h-[420px] overflow-y-auto pr-1">
            {categoryGroupPrograms.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No group programmes match your current filter.
              </div>
            ) : (
              categoryGroupPrograms.map(prog => {
                const isSelected = activeProgram?.id === prog.id;
                const regCount = getGroupRegisteredCount(prog.id);
                const maxGroups = prog.maxGroupsPerTeam ?? 2;
                const reqCandidates = prog.requiredMembersPerGroup ?? prog.minParticipants ?? 3;
                const isEntered = regCount > 0;

                return (
                  <div
                    key={prog.id}
                    onClick={() => {
                      setSelectedProgramId(prog.id);
                      setFeedback(null);
                    }}
                    style={isSelected ? { borderColor: teamColor, backgroundColor: `${teamColor}08`, boxShadow: `0 0 0 1px ${teamColor}30` } : undefined}
                    className={`rounded-[22px] p-4.5 transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'bg-white border-2 shadow-sm'
                        : 'bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/40 shadow-2xs'
                    }`}
                  >
                    {/* Row 1: Program Name (Uppercase) + Capsule Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        style={isSelected ? { color: teamColor } : undefined}
                        className={`text-sm font-black tracking-tight uppercase line-clamp-1 ${
                          isSelected ? '' : 'text-slate-900'
                        }`}
                      >
                        {prog.name}
                      </h4>

                      <span
                        className={`text-[10px] font-bold px-3 py-0.5 rounded-full shrink-0 tracking-wider uppercase ${
                          isEntered
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100/90 text-slate-500 border border-slate-200/60'
                        }`}
                      >
                        {isEntered ? `${regCount}/${maxGroups} GROUPS` : 'NOT ENTERED'}
                      </span>
                    </div>

                    {/* Row 2: Code badge + GROUP • CATEGORY + Requirements */}
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
                      <span
                        style={{ color: teamColor, backgroundColor: `${teamColor}12`, borderColor: `${teamColor}30` }}
                        className="font-mono font-bold px-2 py-0.5 rounded-md text-[11px] border"
                      >
                        {prog.code}
                      </span>
                      <span className="text-slate-700 font-semibold text-xs tracking-tight">
                        GROUP • {prog.category}
                      </span>
                      <span className="text-slate-400 text-xs font-normal">
                        {regCount} registered
                      </span>
                    </div>

                    {/* Row 3: Slot Requirement & Venue */}
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>{reqCandidates} students / group</span>
                      <span>{prog.stageLocation ? `Venue: ${prog.stageLocation}` : 'Manual Result'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: GROUP CANDIDATE WORKSPACE                      */}
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
                    <span>GROUP</span>
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
                        disabled={currentProgramIndex >= categoryGroupPrograms.length - 1}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition-colors cursor-pointer"
                        title="Next Program"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quota Overview Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-right self-start sm:self-auto shrink-0">
                  <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-end gap-1">
                    {!isProgramRegistrationOpen && <Lock className="w-3 h-3 text-rose-500" />}
                    <span>House Group Status</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 font-mono">
                    {createdGroupsCount} / {maxGroupsAllowed} Groups Registered
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {!isProgramRegistrationOpen ? (
                      <span className="text-rose-600 font-bold">Registration Closed (Locked)</span>
                    ) : (
                      `Exact ${requiredCandidatesCount} candidates required per group`
                    )}
                  </div>
                </div>
              </div>

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
              {eligibleTeamStudents.length === 0 && myStudents.length > 0 && activeProgram?.programType !== 'GENERAL' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-amber-900">
                        No candidates in <span className="underline decoration-amber-400 decoration-2">{activeProgram.category}</span> for {myTeam?.name || 'your'} House
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

              {/* Info Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-amber-900 text-xs flex items-center gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1 font-medium">
                  <span className="font-bold">Max Groups:</span> {maxGroupsAllowed} •{' '}
                  <span className="font-bold">Exact Candidates per Group:</span> {requiredCandidatesCount} students •{' '}
                  <span className="font-bold">Venue:</span> {activeProgram.stageLocation || 'Auditorium'}
                </div>
              </div>

              {/* REGISTERED GROUPS ROSTER */}
              {registeredTeamGroups.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Registered Groups ({registeredTeamGroups.length} of {maxGroupsAllowed})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {registeredTeamGroups.map((reg, idx) => (
                      <div
                        key={reg.id}
                        className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase font-mono">
                              Group #{reg.groupNumber || idx + 1}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 mt-1">
                              {reg.groupName}
                            </h5>
                          </div>

                          {isProgramRegistrationOpen && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditGroup(reg)}
                                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                                title="Edit Group"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGroup(reg)}
                                className="p-1.5 rounded-lg bg-white hover:bg-rose-100 text-slate-400 hover:text-rose-600 border border-slate-200 cursor-pointer"
                                title="Withdraw Group"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Member Roster Chips */}
                        <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Assigned Candidates ({reg.groupMembers?.length || 0})
                          </span>
                          <div className="grid grid-cols-1 gap-1">
                            {reg.groupMembers?.map((m, mIdx) => (
                              <div
                                key={m.studentId || mIdx}
                                className="p-2 rounded-xl bg-white border border-emerald-100 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                                    {mIdx + 1}
                                  </span>
                                  <span className="font-bold text-slate-900 uppercase">{m.name}</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                                  <span>Adm: {m.admissionNo}</span>
                                  {m.chestNumber && (
                                    <span className="font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                                      #{m.chestNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW GROUP CANDIDATE SLOTS BUILDER / CLOSED STATE */}
              {!isProgramRegistrationOpen ? (
                registeredTeamGroups.length === 0 && (
                  <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Lock className="w-8 h-8 text-rose-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-700">
                      Registration is Closed for {activeProgram.name}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      No group teams were registered from {myTeam?.name || 'your'} House before registration closed.
                    </p>
                  </div>
                )
              ) : !isMaxGroupsReached ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                    <div>
                      <span
                        style={{ backgroundColor: `${teamColor}15`, color: teamColor, borderColor: `${teamColor}35` }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase font-mono"
                      >
                        Register Group {nextGroupNumber}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-1">
                        Select {requiredCandidatesCount} Candidates for Group {nextGroupNumber}
                      </h4>
                    </div>

                    <span
                      style={{ color: teamColor, borderColor: `${teamColor}30` }}
                      className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-xl border self-start sm:self-auto"
                    >
                      {candidateSlots.filter(Boolean).length} / {requiredCandidatesCount} Slots Assigned
                    </span>
                  </div>

                  <form onSubmit={handleSubmitNewGroup} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Group Identifier
                      </label>
                      <input
                        type="text"
                        value={groupNameInput}
                        onChange={e => setGroupNameInput(e.target.value)}
                        placeholder={`e.g. ${myTeam?.name || 'Team'} - Group ${nextGroupNumber}`}
                        className="mt-1 w-full max-w-sm px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-400"
                      />
                    </div>

                    {/* Candidate Slot Cards */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Candidate Slots (Exact {requiredCandidatesCount} Required) *
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {candidateSlots.map((studentId, slotIdx) => {
                          const assignedStudent = students.find(s => s.id === studentId);

                          return (
                            <div
                              key={slotIdx}
                              onClick={() => handleOpenSlotPicker(slotIdx)}
                              style={assignedStudent ? { backgroundColor: `${teamColor}08`, borderColor: `${teamColor}40` } : undefined}
                              className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                                assignedStudent
                                  ? 'hover:border-slate-400'
                                  : 'bg-white border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Slot {slotIdx + 1}
                                </span>
                                {assignedStudent && (
                                  <button
                                    type="button"
                                    onClick={e => handleClearSlot(slotIdx, e)}
                                    className="p-1 rounded-md bg-white hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Remove Candidate"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {assignedStudent ? (
                                <div>
                                  <p className="font-bold text-slate-900 text-xs uppercase">{assignedStudent.name}</p>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                                    <span>Adm: {assignedStudent.admissionNo}</span>
                                    {assignedStudent.chestNumber && (
                                      <span className="font-bold" style={{ color: teamColor }}>
                                        #{assignedStudent.chestNumber}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="py-2 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-1">
                                  <Plus className="w-3.5 h-3.5" /> Click to assign student
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          !settings.registrationOpen ||
                          candidateSlots.filter(Boolean).length !== requiredCandidatesCount
                        }
                        style={{ backgroundColor: teamColor, boxShadow: `0 4px 14px 0 ${teamColor}35` }}
                        className="px-6 py-2.5 rounded-2xl hover:opacity-95 disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        Submit Group {nextGroupNumber}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">
                    Maximum Group Limit Reached ({maxGroupsAllowed} / {maxGroupsAllowed})
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Your house has registered the maximum allowed groups for this competition.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">Select a Group Programme</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose a group competition from the left sidebar to assign candidate teams.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CANDIDATE SELECTOR MODAL FOR NEW GROUP */}
      {isStudentPickerOpen && (
        <Modal
          isOpen={isStudentPickerOpen}
          onClose={() => {
            setIsStudentPickerOpen(false);
            setActiveSlotIndex(null);
          }}
          title={`Assign Candidate for Slot ${(activeSlotIndex ?? 0) + 1} (${activeProgram?.category || ''} • ${myTeam?.name || 'My House'})`}
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate by name, admission no, chest #..."
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400"
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredPickerStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No candidates in {activeProgram?.category} category found for {myTeam?.name || 'your'} House.
                </div>
              ) : (
                filteredPickerStudents.map(st => {
                  const isCurrentSlotSelected =
                    activeSlotIndex !== null && candidateSlots[activeSlotIndex] === st.id;
                  const isAlreadyInNewGroup = candidateSlots.includes(st.id) && !isCurrentSlotSelected;
                  const isAlreadyInOtherGroup = alreadyRegisteredStudentIds.has(st.id);
                  const isUnavailable = isAlreadyInNewGroup || isAlreadyInOtherGroup;

                  return (
                    <div
                      key={st.id}
                      onClick={() => !isUnavailable && handleAssignStudentToSlot(st.id)}
                      style={isCurrentSlotSelected ? { backgroundColor: `${teamColor}10`, borderColor: teamColor, boxShadow: `0 0 0 2px ${teamColor}30` } : undefined}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isUnavailable
                          ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                          : isCurrentSlotSelected
                          ? 'cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs uppercase">{st.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase border bg-slate-100 text-slate-700 border-slate-200">
                            {st.category}
                          </span>
                          {st.chestNumber && (
                            <span
                              style={{ color: teamColor, backgroundColor: `${teamColor}12`, borderColor: `${teamColor}30` }}
                              className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border"
                            >
                              #{st.chestNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Adm: {st.admissionNo} • Class {st.classNumber}
                        </div>
                      </div>

                      {isAlreadyInNewGroup ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Selected in slot
                        </span>
                      ) : isAlreadyInOtherGroup ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Registered in other group
                        </span>
                      ) : isCurrentSlotSelected ? (
                        <span
                          style={{ color: teamColor, backgroundColor: `${teamColor}18`, borderColor: `${teamColor}40` }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded border"
                        >
                          Current Choice
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-600 hover:underline" style={{ color: teamColor }}>
                          Select Candidate →
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT GROUP MODAL */}
      {editingRegistration && (
        <Modal
          isOpen={true}
          onClose={() => setEditingRegistration(null)}
          title={`Edit Group: ${editingRegistration.groupName || 'Group'}`}
        >
          <form onSubmit={handleSaveEditGroup} className="space-y-4">
            {editFeedback && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {editFeedback}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Group Title
              </label>
              <input
                type="text"
                value={editGroupName}
                onChange={e => setEditGroupName(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Group Members (Exact {requiredCandidatesCount} Required)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {editCandidateSlots.map((studentId, slotIdx) => {
                  const assignedStudent = students.find(s => s.id === studentId);

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => handleOpenEditSlotPicker(slotIdx)}
                      style={assignedStudent ? { backgroundColor: `${teamColor}08`, borderColor: `${teamColor}40` } : undefined}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                        assignedStudent
                          ? 'hover:border-slate-400'
                          : 'bg-white border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Slot {slotIdx + 1}
                        </span>
                        {assignedStudent && (
                          <button
                            type="button"
                            onClick={e => handleClearEditSlot(slotIdx, e)}
                            className="p-1 rounded-md bg-white hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {assignedStudent ? (
                        <div>
                          <p className="font-bold text-slate-900 text-xs uppercase">{assignedStudent.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">Adm: {assignedStudent.admissionNo}</p>
                        </div>
                      ) : (
                        <div className="py-2 text-center text-slate-400 text-xs font-medium">
                          + Assign student
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRegistration(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editCandidateSlots.filter(Boolean).length !== requiredCandidatesCount}
                style={{ backgroundColor: teamColor, boxShadow: `0 4px 14px 0 ${teamColor}35` }}
                className="px-5 py-2 rounded-xl hover:opacity-95 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* SLOT PICKER FOR EDIT MODAL */}
      {isEditStudentPickerOpen && (
        <Modal
          isOpen={isEditStudentPickerOpen}
          onClose={() => {
            setIsEditStudentPickerOpen(false);
            setEditActiveSlotIndex(null);
          }}
          title={`Assign Candidate for Edit Slot ${(editActiveSlotIndex ?? 0) + 1} (${activeProgram?.category || ''} • ${myTeam?.name || 'My House'})`}
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate by name, admission no, chest #..."
                value={editStudentSearchQuery}
                onChange={e => setEditStudentSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400"
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredEditPickerStudents.map(st => {
                const isCurrentSlotSelected =
                  editActiveSlotIndex !== null && editCandidateSlots[editActiveSlotIndex] === st.id;
                const isAlreadyInEditGroup =
                  editCandidateSlots.includes(st.id) && !isCurrentSlotSelected;

                return (
                  <div
                    key={st.id}
                    onClick={() => !isAlreadyInEditGroup && handleAssignEditStudent(st.id)}
                    style={isCurrentSlotSelected ? { backgroundColor: `${teamColor}10`, borderColor: teamColor, boxShadow: `0 0 0 2px ${teamColor}30` } : undefined}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isAlreadyInEditGroup
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : isCurrentSlotSelected
                        ? 'cursor-pointer'
                        : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs uppercase">{st.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase border bg-slate-100 text-slate-700 border-slate-200">
                          {st.category}
                        </span>
                        {st.chestNumber && (
                          <span
                            style={{ color: teamColor, backgroundColor: `${teamColor}12`, borderColor: `${teamColor}30` }}
                            className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border"
                          >
                            #{st.chestNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Adm: {st.admissionNo} • Class {st.classNumber}
                      </div>
                    </div>

                    {isAlreadyInEditGroup ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Selected in slot
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold hover:underline" style={{ color: teamColor }}>
                        Select →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* CSV BATCH IMPORT MODAL (GROUP PROGRAM ENTRIES)              */}
      {/* ============================================================ */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Batch Import Group Event Registrations"
        subtitle={`Upload a CSV file to register groups and member contingents from ${myTeam?.name || 'your'} house.`}
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
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">Category</code>,{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200" style={{ color: teamColor }}>GroupName</code>,{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200" style={{ color: teamColor }}>StudentAdmissionNumbers</code> (or Chest Numbers: e.g. <span className="font-mono">1143;1146</span>)
                </p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: teamColor }}>
                  ✨ Auto-Detection: Enter admission numbers or chest numbers separated by semicolon, and student names are automatically detected!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0 self-start sm:self-auto">
              <button
                onClick={() => handleDownloadTemplate('xlsx', true)}
                style={{ backgroundColor: teamColor, boxShadow: `0 2px 8px 0 ${teamColor}35` }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer"
                title="Download bulk Excel (.xlsx) containing all group programs across all categories"
              >
                <Download className="w-3.5 h-3.5" />
                All (Excel)
              </button>
              <button
                onClick={() => handleDownloadTemplate('xlsx', false)}
                style={{ color: teamColor, borderColor: `${teamColor}40` }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold border shadow-2xs transition-colors cursor-pointer"
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
                  Validates required group member counts, house quotas, and student eligibility. Supports .csv and .xlsx.
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
                    All Groups ({parsedRows.length})
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
                  {csvValidCount} of {parsedRows.length} groups valid
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
                      <th className="py-2.5 px-3">Group Name</th>
                      <th className="py-2.5 px-3">Members ({'{'}Count{'}'})</th>
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
                            <span className="font-mono text-rose-600 font-bold">{row.programCode || '(Empty)'}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {row.category || row.resolvedProgram?.category || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">{row.groupName}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div>
                            <span className="font-bold text-slate-800">
                              {row.resolvedStudents.length} candidate(s)
                            </span>
                            {row.resolvedProgram && (
                              <span className="text-[10px] text-slate-500 block font-mono">
                                Req: {row.resolvedProgram.minParticipants || 1}-{row.resolvedProgram.maxParticipants || 10}
                              </span>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {row.resolvedStudents.map(s => (
                                <span
                                  key={s.id}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium flex items-center gap-1"
                                >
                                  <span>{s.name}</span>
                                  {s.chestNumber && <span className="font-bold" style={{ color: teamColor }}>#{s.chestNumber}</span>}
                                </span>
                              ))}
                            </div>
                          </div>
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
                  Confirm & Bulk Register ({csvValidCount} Groups)
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
