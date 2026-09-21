import React, { useState, useMemo, useRef } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { Program, FestSection, FestCategory, ProgramType, ProgramSubsection } from '../../types';
import {
  generateSampleProgramCSV,
  validateProgramCSVRows,
  triggerFileDownload,
  ParsedProgramRow
} from '../../utils/csvHelpers';
import { SectionBadge, CategoryBadge, Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  CalendarCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  Clock,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const ProgramManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { programs, categoryConfigs, settings, addProgram, importProgramsBatch, updateProgram, deleteProgram } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;
  const isController = currentUser.role === 'CONTROLLER';

  // Base programs list: for Controller, filter out disabled sections
  const basePrograms = useMemo(() => {
    if (!isController) return programs;
    return programs.filter(p => {
      if (p.section === 'ARTS' && !isArtsEnabled) return false;
      if (p.section === 'SPORTS' && !isSportsEnabled) return false;
      return true;
    });
  }, [programs, isController, isArtsEnabled, isSportsEnabled]);

  // Filters
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'ARTS' | 'SPORTS'>('ALL');
  const [subsectionFilter, setSubsectionFilter] = useState<'ALL' | 'STAGE' | 'NON_STAGE' | 'SPORTS_EVENT'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedProgramRows, setParsedProgramRows] = useState<ParsedProgramRow[]>([]);
  const [csvValidCount, setCsvValidCount] = useState(0);
  const [csvErrorCount, setCsvErrorCount] = useState(0);
  const [csvFilterStatus, setCsvFilterStatus] = useState<'ALL' | 'VALID' | 'ERRORS'>('ALL');
  const [importNotification, setImportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    section: 'ARTS' as FestSection,
    subsection: 'STAGE' as ProgramSubsection,
    category: 'SENIOR' as FestCategory,
    programType: 'INDIVIDUAL' as ProgramType,
    maxGroupsPerTeam: 2,
    requiredMembersPerGroup: 3,
    minParticipants: 1,
    maxParticipants: 1,
    registrationOpen: true,
    rules: '',
    stageLocation: '',
    scheduleTime: '',
    status: 'UPCOMING' as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  });

  const filteredPrograms = useMemo(() => {
    return basePrograms.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.stageLocation?.toLowerCase().includes(q);

      const matchSec = sectionFilter === 'ALL' || p.section === sectionFilter;
      const matchSub = subsectionFilter === 'ALL' || p.subsection === subsectionFilter;
      const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchType = typeFilter === 'ALL' || p.programType === typeFilter;

      return matchQ && matchSec && matchSub && matchCat && matchType;
    });
  }, [basePrograms, searchQuery, sectionFilter, subsectionFilter, categoryFilter, typeFilter]);

  const handleOpenAddIndividual = () => {
    setEditingProgram(null);
    setFormData({
      code: `IND-${Date.now().toString().slice(-4)}`,
      name: '',
      section: 'ARTS',
      subsection: 'STAGE',
      category: categoryConfigs[0]?.category || 'SENIOR',
      programType: 'INDIVIDUAL',
      maxGroupsPerTeam: 1,
      requiredMembersPerGroup: 1,
      minParticipants: 1,
      maxParticipants: 1,
      registrationOpen: true,
      rules: '',
      stageLocation: 'Main Auditorium',
      scheduleTime: 'Day 1 - 10:00 AM',
      status: 'UPCOMING' as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
    });
    setIsModalOpen(true);
  };

  const handleOpenAddGroup = () => {
    setEditingProgram(null);
    setFormData({
      code: `GRP-${Date.now().toString().slice(-4)}`,
      name: '',
      section: 'ARTS',
      subsection: 'STAGE',
      category: categoryConfigs[0]?.category || 'SENIOR',
      programType: 'GROUP',
      maxGroupsPerTeam: 2,
      requiredMembersPerGroup: 3,
      minParticipants: 3,
      maxParticipants: 3,
      registrationOpen: true,
      rules: '',
      stageLocation: 'Main Stage',
      scheduleTime: 'Day 1 - 02:00 PM',
      status: 'UPCOMING' as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = handleOpenAddIndividual;

  const handleOpenEdit = (prog: Program) => {
    setEditingProgram(prog);
    setFormData({
      code: prog.code,
      name: prog.name,
      section: prog.section,
      subsection: prog.subsection,
      category: prog.category,
      programType: prog.programType,
      maxGroupsPerTeam: prog.maxGroupsPerTeam ?? (prog.programType === 'GROUP' ? 2 : 1),
      requiredMembersPerGroup: prog.requiredMembersPerGroup ?? (prog.programType === 'GROUP' ? 3 : 1),
      minParticipants: prog.minParticipants,
      maxParticipants: prog.maxParticipants,
      registrationOpen: prog.registrationOpen,
      rules: prog.rules || '',
      stageLocation: prog.stageLocation || '',
      scheduleTime: prog.scheduleTime || '',
      status: prog.status
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProgram) {
      updateProgram(
        {
          ...editingProgram,
          ...formData,
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase()
        },
        currentUser.name,
        currentUser.role
      );
    } else {
      addProgram(
        {
          ...formData,
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          resultStatus: 'PENDING'
        },
        currentUser.name,
        currentUser.role
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete program "${name}"? This will delete all registrations and results associated with it.`)) {
      deleteProgram(id, currentUser.name, currentUser.role);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = generateSampleProgramCSV(categoryConfigs);
    triggerFileDownload(csvContent, 'programs_sample_template.csv');
  };

  const handleOpenImportModal = () => {
    setCsvFileName('');
    setParsedProgramRows([]);
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
        const result = validateProgramCSVRows(text, programs, categoryConfigs);
        setParsedProgramRows(result.rows);
        setCsvValidCount(result.validCount);
        setCsvErrorCount(result.errorCount);
      }
    };
    reader.readAsText(file);
  };

  const handleCommitCSVImport = () => {
    const validRows = parsedProgramRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid program rows found to import.');
      return;
    }

    const programsToImport: Omit<Program, 'id'>[] = validRows.map(row => ({
      code: row.code,
      name: row.name,
      section: row.section,
      subsection: row.subsection,
      category: row.category,
      programType: row.programType,
      minParticipants: row.minParticipants,
      maxParticipants: row.maxParticipants,
      stageLocation: row.stageLocation || 'Main Auditorium',
      scheduleTime: row.scheduleTime || 'Day 1',
      rules: row.rules || '',
      registrationOpen: true,
      status: 'UPCOMING',
      resultStatus: 'PENDING'
    }));

    const result = importProgramsBatch(programsToImport, currentUser.name, currentUser.role);
    if (result.success) {
      setIsImportModalOpen(false);
      setImportNotification({
        type: 'success',
        message: `Successfully imported ${result.count} competition programs into the registry!`
      });
      setTimeout(() => setImportNotification(null), 5000);
    } else {
      alert(result.error || 'Failed to import programs.');
    }
  };

  const visibleParsedRows = useMemo(() => {
    if (csvFilterStatus === 'VALID') return parsedProgramRows.filter(r => r.isValid);
    if (csvFilterStatus === 'ERRORS') return parsedProgramRows.filter(r => !r.isValid);
    return parsedProgramRows;
  }, [parsedProgramRows, csvFilterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-500">
              PROGRAM REGISTRY
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Program & Competition Events
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage Stage, Non-Stage, and Sports competitions, schedules, and thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleDownloadSampleCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title="Download CSV sample format template for program batch import"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Sample CSV
          </button>

          <button
            onClick={handleOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            Import CSV
          </button>

          <button
            onClick={handleOpenAddIndividual}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            + New Individual Event
          </button>

          <button
            onClick={handleOpenAddGroup}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            + New Group Event
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

      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-[22px] bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programs by name, code, venue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 shrink-0 font-medium">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 font-mono text-slate-800 font-bold text-xs">
              {filteredPrograms.length} of {basePrograms.length} Programs
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section</label>
            <select
              value={sectionFilter}
              onChange={e => {
                setSectionFilter(e.target.value as any);
                setSubsectionFilter('ALL');
              }}
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-rose-400"
            >
              {(!isController || (isArtsEnabled && isSportsEnabled)) && (
                <option value="ALL">All Sections (Arts + Sports)</option>
              )}
              {(!isController || isArtsEnabled) && <option value="ARTS">Arts Section Only</option>}
              {(!isController || isSportsEnabled) && <option value="SPORTS">Sports Section Only</option>}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subsection / Venue</label>
            <select
              value={subsectionFilter}
              onChange={e => setSubsectionFilter(e.target.value as any)}
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-rose-400"
            >
              <option value="ALL">All Subsections</option>
              {sectionFilter !== 'SPORTS' && (!isController || isArtsEnabled) && <option value="STAGE">Stage Programs</option>}
              {sectionFilter !== 'SPORTS' && (!isController || isArtsEnabled) && <option value="NON_STAGE">Non-Stage Programs</option>}
              {sectionFilter !== 'ARTS' && (!isController || isSportsEnabled) && <option value="SPORTS_EVENT">Sports Track & Field</option>}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-rose-400"
            >
              <option value="ALL">All Categories</option>
              {categoryConfigs.map(c => (
                <option key={c.id} value={c.category}>{c.displayName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Program Format</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:border-rose-400"
            >
              <option value="ALL">All Formats</option>
              <option value="INDIVIDUAL">Individual Event</option>
              <option value="GROUP">Group Event</option>
              <option value="GENERAL">General Event</option>
            </select>
          </div>
        </div>
      </div>

      {/* Programs Grid (Compact Small Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredPrograms.map(prog => (
          <div
            key={prog.id}
            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-rose-200 hover:shadow-md shadow-2xs flex flex-col justify-between transition-all group"
          >
            <div>
              {/* Header Badges: Section, Category & Code */}
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SectionBadge section={prog.section} />
                  <CategoryBadge category={prog.category} />
                </div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/70 shrink-0">
                  {prog.code}
                </span>
              </div>

              {/* Program Name */}
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight line-clamp-1 group-hover:text-rose-600 transition-colors">
                {prog.name}
              </h3>

              {/* Compact Meta Information */}
              <div className="mt-2.5 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Format & Type:</span>
                  <span className="font-semibold text-slate-700 text-[11px]">
                    {prog.programType} • {prog.subsection.replace('_', ' ')}
                  </span>
                </div>

                {prog.stageLocation && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Venue:</span>
                    <span className="text-slate-700 flex items-center gap-1 text-[11px] font-medium truncate max-w-[130px]">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{prog.stageLocation}</span>
                    </span>
                  </div>
                )}

                {prog.scheduleTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Time:</span>
                    <span className="text-slate-700 flex items-center gap-1 text-[11px] font-medium truncate max-w-[130px]">
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{prog.scheduleTime}</span>
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Participants:</span>
                  <span className="font-mono text-slate-800 font-bold text-[11px]">
                    {prog.programType === 'INDIVIDUAL'
                      ? '1 student'
                      : prog.programType === 'GROUP'
                      ? `${prog.requiredMembersPerGroup ?? prog.minParticipants ?? 3} members`
                      : `${prog.minParticipants}-${prog.maxParticipants} students`}
                  </span>
                </div>

                {prog.programType === 'GROUP' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Max Groups:</span>
                    <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold text-[10px]">
                      {prog.maxGroupsPerTeam ?? 2} groups
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer: Status & Edit/Delete */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  prog.resultStatus === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {prog.resultStatus || 'PENDING'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(prog)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Edit Program"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(prog.id, prog.name)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete Program"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Create / Edit Program */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProgram ? 'Edit Event Details' : 'Create New Competition Event'}
        subtitle="Configure rules, schedules, and participant thresholds"
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Event Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="mt-1 w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 uppercase font-mono focus:outline-none focus:border-rose-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Section *</label>
              <select
                value={formData.section}
                onChange={e => {
                  const sec = e.target.value as FestSection;
                  setFormData({
                    ...formData,
                    section: sec,
                    subsection: sec === 'ARTS' ? 'STAGE' : 'SPORTS_EVENT'
                  });
                }}
                className="mt-1 w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-400 shadow-2xs font-medium"
              >
                <option value="ARTS">Arts Section</option>
                <option value="SPORTS">Sports Section</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Program / Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Solo Classical Dance (Bharatanatyam)"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-400 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Subsection</label>
              <select
                value={formData.subsection}
                onChange={e => setFormData({ ...formData, subsection: e.target.value as ProgramSubsection })}
                className="mt-1 w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-400 shadow-2xs font-medium"
              >
                {formData.section === 'ARTS' ? (
                  <>
                    <option value="STAGE">Stage Program</option>
                    <option value="NON_STAGE">Non-Stage Program</option>
                  </>
                ) : (
                  <option value="SPORTS_EVENT">Sports Event</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as FestCategory })}
                className="mt-1 w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-400 shadow-2xs font-medium"
              >
                {categoryConfigs.map(c => (
                  <option key={c.id} value={c.category}>{c.displayName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Program Type *</label>
              <select
                value={formData.programType}
                onChange={e => {
                  const pType = e.target.value as ProgramType;
                  setFormData({
                    ...formData,
                    programType: pType,
                    minParticipants: pType === 'INDIVIDUAL' ? 1 : 3,
                    maxParticipants: pType === 'INDIVIDUAL' ? 1 : 8
                  });
                }}
                className="mt-1 w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-400 shadow-2xs font-medium"
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="GROUP">Group</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>

          {formData.programType === 'GROUP' ? (
            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/70 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  👥 Group Program Configuration
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Maximum Groups Per Team *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.maxGroupsPerTeam}
                    onChange={e => setFormData({ ...formData, maxGroupsPerTeam: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="mt-1 w-full px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs sm:text-sm text-slate-900 font-mono font-bold shadow-2xs focus:ring-2 focus:ring-rose-400/20"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Number of groups each team can register</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Required Members Per Group *</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={formData.requiredMembersPerGroup}
                    onChange={e => {
                      const req = Math.max(2, parseInt(e.target.value, 10) || 2);
                      setFormData({ 
                        ...formData, 
                        requiredMembersPerGroup: req,
                        minParticipants: req,
                        maxParticipants: req
                      });
                    }}
                    className="mt-1 w-full px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs sm:text-sm text-slate-900 font-mono font-bold shadow-2xs focus:ring-2 focus:ring-rose-400/20"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Exact student count required per group</p>
                </div>
              </div>
            </div>
          ) : formData.programType === 'GENERAL' ? (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <label className="text-xs font-bold text-slate-700">Min Group Participants</label>
                <input
                  type="number"
                  min={2}
                  value={formData.minParticipants}
                  onChange={e => setFormData({ ...formData, minParticipants: parseInt(e.target.value, 10) })}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Max Group Participants</label>
                <input
                  type="number"
                  min={formData.minParticipants}
                  value={formData.maxParticipants}
                  onChange={e => setFormData({ ...formData, maxParticipants: parseInt(e.target.value, 10) })}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 font-mono shadow-2xs"
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Venue / Stage Location</label>
              <input
                type="text"
                placeholder="e.g. Main Auditorium"
                value={formData.stageLocation}
                onChange={e => setFormData({ ...formData, stageLocation: e.target.value })}
                className="mt-1 w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Schedule Time / Day</label>
              <input
                type="text"
                placeholder="e.g. Day 1 - 10:00 AM"
                value={formData.scheduleTime}
                onChange={e => setFormData({ ...formData, scheduleTime: e.target.value })}
                className="mt-1 w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-400 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Program Rules & Notes</label>
            <textarea
              rows={2}
              placeholder="Time limit, dress codes, track rules..."
              value={formData.rules}
              onChange={e => setFormData({ ...formData, rules: e.target.value })}
              className="mt-1 w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-400 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              {editingProgram ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Program CSV Batch Import */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Competition Events from CSV"
        subtitle="Bulk create Stage Arts, Non-Stage Arts, and Sports programs"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {/* Instructions & Sample Download */}
          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 text-xs">
              <p className="font-bold text-rose-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-600" />
                CSV Format Instructions
              </p>
              <p className="text-slate-600 leading-relaxed">
                Required Columns: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200 font-bold text-rose-600">Code</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200 font-bold text-rose-600">Name</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200 font-bold text-rose-600">Section</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200 font-bold text-rose-600">Category</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200 font-bold text-rose-600">ProgramType</code>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-rose-600 border border-rose-200 text-xs font-semibold shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              Download Template
            </button>
          </div>

          {/* File Upload Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 border-2 border-dashed border-slate-200 hover:border-rose-400 rounded-3xl bg-slate-50/50 hover:bg-rose-50/20 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2.5"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {csvFileName ? `Selected: ${csvFileName}` : 'Click to select or drop your Program CSV file'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports UTF-8 formatted .csv files</p>
            </div>
          </div>

          {/* Parsed Rows Preview */}
          {parsedProgramRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Preview Parsed Records:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                    {parsedProgramRows.length} Total
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
                      csvFilterStatus === 'ALL' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    All ({parsedProgramRows.length})
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
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Event Name</th>
                      <th className="py-2 px-3">Section</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Venue / Schedule</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {visibleParsedRows.map(row => (
                      <tr
                        key={row.rowIndex}
                        className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}
                      >
                        <td className="py-2 px-3 font-mono font-bold text-slate-500">#{row.rowIndex}</td>
                        <td className="py-2 px-3 font-mono font-bold text-rose-600">{row.code}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.name || <span className="text-rose-500">Missing</span>}</td>
                        <td className="py-2 px-3">
                          <SectionBadge section={row.section} />
                        </td>
                        <td className="py-2 px-3">
                          <CategoryBadge category={row.category} />
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                            {row.programType}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {row.stageLocation} • {row.scheduleTime}
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
              Only valid event records ({csvValidCount}) will be inserted into the system.
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={csvValidCount === 0}
                onClick={handleCommitCSVImport}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Import {csvValidCount} Programs
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
