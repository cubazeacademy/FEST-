import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { Student, FestCategory } from '../../types';
import { resolveCategoryFromClass } from '../../utils/validations';
import {
  generateSampleStudentCSV,
  validateStudentCSVRows,
  triggerFileDownload,
  ParsedStudentRow
} from '../../utils/csvHelpers';
import { CategoryBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Search,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Hash,
  GraduationCap,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  CheckSquare,
  Sparkles,
  X
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    students,
    teams,
    classMappings,
    categoryConfigs,
    addStudent,
    importStudentsBatch,
    updateStudent,
    deleteStudent,
    deleteStudentsBatch,
    transferStudentTeam,
    assignManualChestNumber,
    runChestNumberGenerator
  } = useFestData();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [chestNoFilter, setChestNoFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

  // Selection & Bulk Actions State
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<'SELECTED' | 'FILTERED' | 'ALL'>('SELECTED');
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isChestModalOpen, setIsChestModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedStudentRows, setParsedStudentRows] = useState<ParsedStudentRow[]>([]);
  const [csvValidCount, setCsvValidCount] = useState(0);
  const [csvErrorCount, setCsvErrorCount] = useState(0);
  const [csvFilterStatus, setCsvFilterStatus] = useState<'ALL' | 'VALID' | 'ERRORS'>('ALL');
  const [importNotification, setImportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Selected student
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    admissionNo: '',
    classNumber: '1',
    sectionLetter: 'A',
    category: 'SUB_JUNIOR' as FestCategory,
    chestNumber: undefined as number | undefined,
    teamId: teams[0]?.id || '',
    avatarUrl: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER'
  });

  const [transferTeamId, setTransferTeamId] = useState('');
  const [manualChestInput, setManualChestInput] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);

  const computedFormCategory = useMemo(() => {
    return resolveCategoryFromClass(formData.classNumber, classMappings);
  }, [formData.classNumber, classMappings]);

  const availableClasses = useMemo(() => {
    return Array.from(new Set(classMappings.map(m => m.classNumber))).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [classMappings]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.admissionNo.toLowerCase().includes(query) ||
        student.classNumber.toLowerCase().includes(query) ||
        student.category.toLowerCase().includes(query) ||
        (student.chestNumber && student.chestNumber.toString().includes(query));

      const matchTeam = selectedTeamFilter === 'ALL' || student.teamId === selectedTeamFilter;
      const matchCategory = selectedCategoryFilter === 'ALL' || student.category === selectedCategoryFilter;
      const matchClass = selectedClassFilter === 'ALL' || student.classNumber === selectedClassFilter;
      const matchChest =
        chestNoFilter === 'ALL' ||
        (chestNoFilter === 'ASSIGNED' && Boolean(student.chestNumber)) ||
        (chestNoFilter === 'UNASSIGNED' && !student.chestNumber);

      return matchSearch && matchTeam && matchCategory && matchClass && matchChest;
    });
  }, [students, searchQuery, selectedTeamFilter, selectedCategoryFilter, selectedClassFilter, chestNoFilter]);

  const openAddModal = () => {
    setFormError(null);
    const defaultClass = availableClasses[0] || '1';
    const defaultCat = (resolveCategoryFromClass(defaultClass, classMappings) || 'SUB_JUNIOR') as FestCategory;
    setFormData({
      name: '',
      admissionNo: `ADM-${Date.now().toString().slice(-4)}`,
      classNumber: defaultClass,
      sectionLetter: 'A',
      category: defaultCat,
      chestNumber: undefined,
      teamId: teams[0]?.id || '',
      avatarUrl: '',
      gender: 'MALE'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (st: Student) => {
    setSelectedStudent(st);
    setFormError(null);
    setFormData({
      name: st.name,
      admissionNo: st.admissionNo,
      classNumber: st.classNumber,
      sectionLetter: st.sectionLetter || 'A',
      category: st.category,
      chestNumber: st.chestNumber ? Number(st.chestNumber) : undefined,
      teamId: st.teamId,
      avatarUrl: st.avatarUrl || '',
      gender: st.gender || 'MALE'
    });
    setIsEditModalOpen(true);
  };

  const openTransferModal = (st: Student) => {
    setSelectedStudent(st);
    setTransferTeamId(st.teamId);
    setFormError(null);
    setIsTransferModalOpen(true);
  };

  const openChestModal = (st: Student) => {
    setSelectedStudent(st);
    setManualChestInput(st.chestNumber ? Number(st.chestNumber) : '');
    setFormError(null);
    setIsChestModalOpen(true);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = addStudent(
      {
        name: formData.name.trim(),
        admissionNo: formData.admissionNo.trim(),
        classNumber: formData.classNumber.trim(),
        sectionLetter: formData.sectionLetter,
        category: formData.category,
        chestNumber: formData.chestNumber,
        teamId: formData.teamId,
        avatarUrl: formData.avatarUrl.trim() || undefined,
        gender: formData.gender,
        status: 'ACTIVE'
      },
      currentUser.name,
      currentUser.role
    );

    if (result.success) {
      setIsAddModalOpen(false);
    } else {
      setFormError(result.error || 'Failed to add student.');
    }
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormError(null);

    const result = updateStudent(
      {
        ...selectedStudent,
        name: formData.name.trim(),
        admissionNo: formData.admissionNo.trim(),
        classNumber: formData.classNumber.trim(),
        sectionLetter: formData.sectionLetter,
        category: formData.category,
        chestNumber: formData.chestNumber,
        teamId: formData.teamId,
        avatarUrl: formData.avatarUrl.trim() || undefined,
        gender: formData.gender
      },
      currentUser.name,
      currentUser.role
    );

    if (result.success) {
      setIsEditModalOpen(false);
    } else {
      setFormError(result.error || 'Failed to update student.');
    }
  };

  const handleTransfer = () => {
    if (!selectedStudent || !transferTeamId) return;
    const res = transferStudentTeam(selectedStudent.id, transferTeamId, currentUser.name, currentUser.role);
    if (res.success) {
      setIsTransferModalOpen(false);
    } else {
      setFormError(res.error || 'Transfer failed.');
    }
  };

  const handleSaveManualChest = () => {
    if (!selectedStudent || manualChestInput === '') return;
    const res = assignManualChestNumber(selectedStudent.id, Number(manualChestInput), currentUser.name, currentUser.role);
    if (res.success) {
      setIsChestModalOpen(false);
    } else {
      setFormError(res.error || 'Chest assignment failed.');
    }
  };

  // Selection Handlers
  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every(st => selectedStudentIds.has(st.id));
  }, [filteredStudents, selectedStudentIds]);

  const isSomeFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    const selectedInFiltered = filteredStudents.filter(st => selectedStudentIds.has(st.id)).length;
    return selectedInFiltered > 0 && selectedInFiltered < filteredStudents.length;
  }, [filteredStudents, selectedStudentIds]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeFilteredSelected;
    }
  }, [isSomeFilteredSelected]);

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        filteredStudents.forEach(st => next.delete(st.id));
        return next;
      });
    } else {
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        filteredStudents.forEach(st => next.add(st.id));
        return next;
      });
    }
  };

  const selectAllStudentsInDirectory = () => {
    const allIds = new Set(students.map(s => s.id));
    setSelectedStudentIds(allIds);
  };

  const clearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  // Bulk Delete Modal Handlers
  const openDeleteSelectedModal = () => {
    if (selectedStudentIds.size === 0) return;
    setBulkDeleteTarget('SELECTED');
    setIsBulkDeleteModalOpen(true);
  };

  const openDeleteFilteredModal = () => {
    if (filteredStudents.length === 0) return;
    setBulkDeleteTarget('FILTERED');
    setIsBulkDeleteModalOpen(true);
  };

  const openDeleteAllDirectoryModal = () => {
    if (students.length === 0) return;
    setBulkDeleteTarget('ALL');
    setIsBulkDeleteModalOpen(true);
  };

  const studentsPendingDeletion = useMemo(() => {
    if (bulkDeleteTarget === 'SELECTED') {
      return students.filter(s => selectedStudentIds.has(s.id));
    }
    if (bulkDeleteTarget === 'FILTERED') {
      return filteredStudents;
    }
    return students;
  }, [bulkDeleteTarget, students, selectedStudentIds, filteredStudents]);

  const handleConfirmBulkDelete = () => {
    const idsToDelete = studentsPendingDeletion.map(s => s.id);
    if (idsToDelete.length === 0) {
      setIsBulkDeleteModalOpen(false);
      return;
    }

    const res = deleteStudentsBatch(idsToDelete, currentUser.name, currentUser.role);
    if (res.success) {
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        idsToDelete.forEach(id => next.delete(id));
        return next;
      });
      setIsBulkDeleteModalOpen(false);
      setImportNotification({
        type: 'success',
        message: `Successfully deleted ${res.count} student(s) from the directory.`
      });
      setTimeout(() => setImportNotification(null), 5000);
    } else {
      alert(res.error || 'Failed to delete students.');
    }
  };

  const handleDeleteStudent = (studentId: string, name: string) => {
    if (confirm(`Are you sure you want to delete student "${name}"? This will also remove any event registrations.`)) {
      deleteStudent(studentId, currentUser.name, currentUser.role);
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      setImportNotification({
        type: 'success',
        message: `Deleted student "${name}".`
      });
      setTimeout(() => setImportNotification(null), 4000);
    }
  };

  const unassignedChestCount = useMemo(() => {
    return students.filter(s => !s.chestNumber).length;
  }, [students]);

  const handleRunAutoChestGen = () => {
    const res = runChestNumberGenerator(true, currentUser.name, currentUser.role);
    if (res.success) {
      setImportNotification({
        type: 'success',
        message: `Generated chest numbers successfully! Assigned ${res.assigned} new chest numbers (Preserved ${res.skipped} existing).`
      });
      setTimeout(() => setImportNotification(null), 6000);
    } else {
      setImportNotification({
        type: 'error',
        message: res.errors && res.errors.length > 0 ? res.errors[0] : 'Failed to generate chest numbers.'
      });
      setTimeout(() => setImportNotification(null), 6000);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = generateSampleStudentCSV(categoryConfigs, teams);
    triggerFileDownload(csvContent, 'candidate_upload_template.csv');
  };

  const handleOpenImportModal = () => {
    setCsvFileName('');
    setParsedStudentRows([]);
    setCsvValidCount(0);
    setCsvErrorCount(0);
    setCsvFilterStatus('ALL');
    setIsImportModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        const result = validateStudentCSVRows(text, students, teams, classMappings, categoryConfigs);
        setParsedStudentRows(result.rows);
        setCsvValidCount(result.validCount);
        setCsvErrorCount(result.errorCount);
      }
    };
    reader.readAsText(file);
  };

  const handleCommitCSVImport = () => {
    const validRows = parsedStudentRows.filter(r => r.isValid && r.resolvedCategory && r.resolvedTeamId);
    if (validRows.length === 0) {
      alert('No valid student rows found to import.');
      return;
    }

    const studentsToImport: Omit<Student, 'id' | 'createdDate'>[] = validRows.map(row => ({
      name: row.name,
      admissionNo: row.admissionNo,
      classNumber: row.classNumber,
      sectionLetter: row.sectionLetter || 'A',
      category: row.resolvedCategory as FestCategory,
      teamId: row.resolvedTeamId as string,
      gender: row.gender,
      chestNumber: row.chestNumber,
      status: 'ACTIVE'
    }));

    const result = importStudentsBatch(studentsToImport, currentUser.name, currentUser.role);
    if (result.success) {
      setIsImportModalOpen(false);
      setImportNotification({
        type: 'success',
        message: `Successfully imported ${result.count} students into the directory!`
      });
      setTimeout(() => setImportNotification(null), 5000);
    } else {
      alert(result.error || 'Failed to import students.');
    }
  };

  const visibleParsedRows = useMemo(() => {
    if (csvFilterStatus === 'VALID') return parsedStudentRows.filter(r => r.isValid);
    if (csvFilterStatus === 'ERRORS') return parsedStudentRows.filter(r => !r.isValid);
    return parsedStudentRows;
  }, [parsedStudentRows, csvFilterStatus]);

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            Student Master Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage student roster, house affiliations, chest numbers, and auto-resolved category classifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {selectedStudentIds.size > 0 && (
            <>
              <button
                onClick={openDeleteSelectedModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer animate-in fade-in"
                title={`Delete ${selectedStudentIds.size} selected student records`}
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedStudentIds.size})
              </button>

              <button
                onClick={clearSelection}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all cursor-pointer"
                title="Clear selected students"
              >
                <X className="w-4 h-4 text-slate-500" />
                Deselect
              </button>
            </>
          )}

          {filteredStudents.length > 0 && selectedStudentIds.size === 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={openDeleteFilteredModal}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold border border-rose-200 transition-all cursor-pointer"
                title="Bulk delete all students currently matching active search and filters"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                {filteredStudents.length === students.length ? `Delete All (${students.length})` : `Delete Filtered (${filteredStudents.length})`}
              </button>
              {filteredStudents.length !== students.length && (
                <button
                  onClick={openDeleteAllDirectoryModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200/80 transition-all cursor-pointer"
                  title="Bulk delete all students in the entire master directory"
                >
                  Delete All ({students.length})
                </button>
              )}
            </div>
          )}

          {unassignedChestCount > 0 && (
            <button
              onClick={handleRunAutoChestGen}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-bold border border-amber-300 shadow-xs transition-all cursor-pointer animate-in fade-in"
              title={`Auto-generate chest numbers for ${unassignedChestCount} candidates currently missing chest numbers`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              Generate Chest # ({unassignedChestCount})
            </button>
          )}

          <button
            onClick={handleDownloadSampleCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold border border-slate-200 shadow-xs transition-all cursor-pointer"
            title="Download CSV sample format template for candidate batch upload"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Sample CSV
          </button>

          <button
            onClick={handleOpenImportModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-bold border border-emerald-200 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Import CSV
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Import Toast Notification */}
      {importNotification && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between font-bold animate-in fade-in slide-in-from-top-2 ${
            importNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {importNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{importNotification.message}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-xs text-slate-500 hover:text-slate-900 underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Name, Admission No, Chest No, Class, Category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0 flex-wrap">
            {selectedStudentIds.size > 0 && (
              <span className="px-3.5 py-2 rounded-xl bg-indigo-50 font-bold text-indigo-800 border border-indigo-200 text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                {selectedStudentIds.size} Selected
              </span>
            )}
            <span className="px-3.5 py-2 rounded-xl bg-slate-100 font-mono font-bold text-slate-800 border border-slate-200 text-xs">
              {filteredStudents.length} of {students.length} Students
            </span>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-slate-100">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">House / Team</label>
            <select
              value={selectedTeamFilter}
              onChange={e => setSelectedTeamFilter(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Houses / Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {categoryConfigs.map(c => (
                <option key={c.id} value={c.category}>{c.displayName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class</label>
            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chest Number Status</label>
            <select
              value={chestNoFilter}
              onChange={e => setChestNoFilter(e.target.value as any)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Students</option>
              <option value="ASSIGNED">Assigned Chest No</option>
              <option value="UNASSIGNED">Missing Chest No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-xs">
                <th className="py-4 px-3 sm:px-4 w-12 text-center">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    title={isAllFilteredSelected ? 'Deselect all visible' : 'Select all visible'}
                  />
                </th>
                <th className="py-4 px-4 sm:px-5">Chest #</th>
                <th className="py-4 px-4 sm:px-5">Student & Adm</th>
                <th className="py-4 px-4 sm:px-5">Class</th>
                <th className="py-4 px-4 sm:px-5">Auto Category</th>
                <th className="py-4 px-4 sm:px-5">House</th>
                <th className="py-4 px-4 sm:px-5">Status</th>
                <th className="py-4 px-4 sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No students match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(st => {
                  const team = teams.find(t => t.id === st.teamId);
                  const isSelected = selectedStudentIds.has(st.id);
                  return (
                    <tr
                      key={st.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/70 hover:bg-indigo-100/60'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-4 px-3 sm:px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(st.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          title={isSelected ? `Deselect ${st.name}` : `Select ${st.name}`}
                        />
                      </td>
                      <td className="py-4 px-4 sm:px-5">
                        {st.chestNumber ? (
                          <button
                            onClick={() => openChestModal(st)}
                            title="Click to override chest number"
                            className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 font-mono font-bold text-indigo-700 hover:bg-indigo-100 transition-colors text-sm"
                          >
                            #{st.chestNumber}
                          </button>
                        ) : (
                          <button
                            onClick={() => openChestModal(st)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Unassigned
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase text-sm shrink-0">
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm sm:text-base">{st.name}</p>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">{st.admissionNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-5">
                        <span className="font-semibold text-slate-800">
                          Class {st.classNumber} {st.sectionLetter ? `(${st.sectionLetter})` : ''}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-5">
                        <CategoryBadge category={st.category} />
                      </td>
                      <td className="py-4 px-4 sm:px-5">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: team?.color || '#6b7280' }} />
                          <span>{team?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openChestModal(st)}
                            title="Assign Chest Number"
                            className="p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Hash className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openTransferModal(st)}
                            title="Transfer House/Team"
                            className="p-2 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(st)}
                            title="Edit Student"
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st.id, st.name)}
                            title="Delete Student"
                            className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedStudentIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              {selectedStudentIds.size}
            </div>
            <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">
              {selectedStudentIds.size} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isAllFilteredSelected ? (
              <button
                onClick={toggleSelectAllFiltered}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                Select All Filtered ({filteredStudents.length})
              </button>
            ) : selectedStudentIds.size < students.length ? (
              <button
                onClick={selectAllStudentsInDirectory}
                className="px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 text-xs font-medium text-indigo-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                Select All In Directory ({students.length})
              </button>
            ) : (
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                Deselect All
              </button>
            )}

            <button
              onClick={openDeleteSelectedModal}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedStudentIds.size})
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Add / Enroll Student */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Student"
        subtitle="Category will be determined automatically from Institutional Class Mapping"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Full Student Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Liam Parker"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Admission Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. ADM2026-104"
                value={formData.admissionNo}
                onChange={e => setFormData({ ...formData, admissionNo: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Class *</label>
              <select
                value={formData.classNumber}
                onChange={e => {
                  const newClass = e.target.value;
                  const autoCat = resolveCategoryFromClass(newClass, classMappings);
                  setFormData({
                    ...formData,
                    classNumber: newClass,
                    category: autoCat || formData.category
                  });
                }}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono focus:bg-white"
              >
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Section Division</label>
              <input
                type="text"
                placeholder="A / B / C"
                value={formData.sectionLetter}
                onChange={e => setFormData({ ...formData, sectionLetter: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 uppercase focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Category Selection *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as FestCategory })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
              {categoryConfigs.map(c => (
                <option key={c.id} value={c.category}>{c.displayName}</option>
              ))}
            </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">
                Chest Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 101 (Leave empty to auto-generate)"
                value={formData.chestNumber ?? ''}
                onChange={e => setFormData({ ...formData, chestNumber: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Assign House / Team *</label>
            <select
              value={formData.teamId}
              onChange={e => setFormData({ ...formData, teamId: e.target.value })}
              className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!computedFormCategory}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Save Student
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Student */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Details"
        subtitle={`Updating information for ${selectedStudent?.name}`}
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Full Student Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Admission Number *</label>
              <input
                type="text"
                required
                value={formData.admissionNo}
                onChange={e => setFormData({ ...formData, admissionNo: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Class *</label>
              <select
                value={formData.classNumber}
                onChange={e => {
                  const newClass = e.target.value;
                  const autoCat = resolveCategoryFromClass(newClass, classMappings);
                  setFormData({
                    ...formData,
                    classNumber: newClass,
                    category: autoCat || formData.category
                  });
                }}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Section Division</label>
              <input
                type="text"
                value={formData.sectionLetter}
                onChange={e => setFormData({ ...formData, sectionLetter: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 uppercase focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Category Selection *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as FestCategory })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
              {categoryConfigs.map(c => (
                <option key={c.id} value={c.category}>{c.displayName}</option>
              ))}
            </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">
                Chest Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 101 (Leave empty to auto-generate)"
                value={formData.chestNumber ?? ''}
                onChange={e => setFormData({ ...formData, chestNumber: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!computedFormCategory}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Update Student
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Transfer Student House */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Student House / Team"
        subtitle={`Select new house for ${selectedStudent?.name}`}
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Target House</label>
            <select
              value={transferTeamId}
              onChange={e => setTransferTeamId(e.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-slate-500">
            Note: Transferring house will automatically update all existing event registrations for this student.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20"
            >
              Confirm Transfer
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Manual Chest Number Override */}
      <Modal
        isOpen={isChestModalOpen}
        onClose={() => setIsChestModalOpen(false)}
        title="Assign / Override Chest Number"
        subtitle={`Student: ${selectedStudent?.name} (${selectedStudent?.category})`}
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Chest Number (Positive Integer)</label>
            <input
              type="number"
              placeholder="e.g. 101"
              value={manualChestInput}
              onChange={e => setManualChestInput(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="mt-1 w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {selectedStudent && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Category Range Advisory:</p>
              {(() => {
                const conf = categoryConfigs.find(c => c.category === selectedStudent.category);
                return conf ? (
                  <p>
                    Configured range for <span className="text-indigo-700 font-bold">{conf.displayName}</span>: <span className="font-mono font-bold text-slate-900">#{conf.chestNoStart} - #{conf.chestNoEnd}</span>
                  </p>
                ) : null;
              })()}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsChestModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveManualChest}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Save Chest Number
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Student CSV Batch Import */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Students from CSV"
        subtitle="Bulk enroll students with automated category detection from class mapping"
        maxWidth="4xl"
      >
        <div className="space-y-5">
          {/* Instructions & Sample Download */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 text-xs">
              <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Candidate CSV Format Instructions
              </p>
              <div className="text-slate-600 leading-relaxed font-medium space-y-1">
                <p>
                  Supported Columns: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold text-indigo-700">Sl No</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-slate-700 font-semibold">Chest No</code> <i>(optional)</i>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold text-indigo-700">Admission No</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold text-indigo-700">Candidate Name</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-slate-700 font-semibold">class ( optional)</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold text-indigo-700">Team / House</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold text-indigo-700">Category</code>
                </p>
                <p className="text-slate-500 text-[11px]">
                  💡 <strong>Chest Number & Class are optional:</strong> If candidates are uploaded without chest numbers, you can generate chest numbers automatically anytime using the <strong>Generate Chest #</strong> tool.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              Download Template
            </button>
          </div>

          {/* File Upload Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl bg-slate-50/50 hover:bg-indigo-50/20 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {csvFileName ? `Selected: ${csvFileName}` : 'Click to select or drop your Candidate CSV file'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Supports UTF-8 formatted .csv files</p>
            </div>
          </div>

          {/* Parsed Rows Preview */}
          {parsedStudentRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700">Preview Parsed Candidates:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                    {parsedStudentRows.length} Total
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> {csvValidCount} Valid
                  </span>
                  {csvErrorCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" /> {csvErrorCount} Errors
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setCsvFilterStatus('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                      csvFilterStatus === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    All ({parsedStudentRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvFilterStatus('VALID')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                      csvFilterStatus === 'VALID' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Valid ({csvValidCount})
                  </button>
                  {csvErrorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setCsvFilterStatus('ERRORS')}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                        csvFilterStatus === 'ERRORS' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Errors ({csvErrorCount})
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 text-xs custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Sl No</th>
                      <th className="py-2.5 px-3">Chest #</th>
                      <th className="py-2.5 px-3">Adm #</th>
                      <th className="py-2.5 px-3">Candidate Name</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">House / Team</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {visibleParsedRows.map(row => (
                      <tr
                        key={row.rowIndex}
                        className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}
                      >
                        <td className="py-2 px-3 font-mono font-bold text-slate-500">#{row.rowIndex}</td>
                        <td className="py-2 px-3 font-mono">
                          {row.chestNumber ? (
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              #{row.chestNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Auto-Gen</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700">{row.admissionNo || '-'}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.name || <span className="text-rose-500">Missing</span>}</td>
                        <td className="py-2 px-3">
                          {row.classNumber && row.classNumber !== '-' ? `Class ${row.classNumber}` : <span className="text-slate-400 italic">Optional</span>}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-800">{row.resolvedTeamName || row.teamCode}</span>
                        </td>
                        <td className="py-2 px-3">
                          {row.resolvedCategory ? (
                            <CategoryBadge category={row.resolvedCategory} />
                          ) : (
                            <span className="text-rose-600 font-bold">Unassigned</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Valid
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-rose-700 font-bold"
                              title={row.errors.join(', ')}
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> {row.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Only valid student records ({csvValidCount}) will be inserted into the system.
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={csvValidCount === 0}
                onClick={handleCommitCSVImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Import {csvValidCount} Students
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: Bulk / Selected Delete Confirmation */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title={
          bulkDeleteTarget === 'SELECTED'
            ? `Delete ${selectedStudentIds.size} Selected Student${selectedStudentIds.size > 1 ? 's' : ''}`
            : bulkDeleteTarget === 'FILTERED'
            ? `Bulk Delete ${filteredStudents.length} Filtered Students`
            : `Bulk Delete All ${students.length} Students`
        }
        subtitle="Permanent action warning and deletion summary"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Warning: Permanent Deletion</span>
            </div>
            <p className="font-medium text-slate-800">
              You are about to delete <strong className="text-rose-700 font-bold">{studentsPendingDeletion.length}</strong> student record{studentsPendingDeletion.length > 1 ? 's' : ''} from the master directory.
            </p>
            <p className="text-rose-700 leading-relaxed">
              • All associated event registrations will be removed.<br />
              • Assigned chest numbers will be revoked.<br />
              • This action cannot be undone.
            </p>
          </div>

          {/* Student list preview */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Target Students Preview ({studentsPendingDeletion.length})
            </label>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50 p-2 custom-scrollbar">
              {studentsPendingDeletion.slice(0, 50).map(st => {
                const team = teams.find(t => t.id === st.teamId);
                return (
                  <div key={st.id} className="py-2 px-2.5 flex items-center justify-between text-xs hover:bg-white rounded-lg transition-colors">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-slate-800 truncate">{st.name}</span>
                      <span className="font-mono text-slate-500 text-[11px]">({st.admissionNo})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                        Cls {st.classNumber} {st.sectionLetter ? `(${st.sectionLetter})` : ''}
                      </span>
                      {team && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs" style={{ backgroundColor: team.color }}>
                          {team.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {studentsPendingDeletion.length > 50 && (
                <div className="py-2.5 text-center text-xs font-bold text-slate-500 bg-white/60 rounded-lg">
                  + {studentsPendingDeletion.length - 50} more student records
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDelete}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Confirm & Delete ({studentsPendingDeletion.length})
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
