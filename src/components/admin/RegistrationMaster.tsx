import React, { useState, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { SectionBadge, CategoryBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Registration } from '../../types';
import { exportRegistrationsToSpreadsheet } from '../../utils/csvHelpers';
import {
  FileCheck2,
  Search,
  Download,
  Trash2,
  Users,
  Eye,
  AlertTriangle,
  CheckSquare,
  Square,
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const RegistrationMaster: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    registrations,
    teams,
    categoryConfigs,
    settings,
    withdrawRegistration,
    clearAllRegistrations,
    clearRegistrationsByTeam,
    deleteRegistrationsBatch
  } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;
  const isController = currentUser.role === 'CONTROLLER';
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Base registrations: for Controller, exclude registrations of disabled sections
  const baseRegistrations = useMemo(() => {
    if (!isController) return registrations;
    return registrations.filter(r => {
      if (r.section === 'ARTS' && !isArtsEnabled) return false;
      if (r.section === 'SPORTS' && !isSportsEnabled) return false;
      return true;
    });
  }, [registrations, isController, isArtsEnabled, isSportsEnabled]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Selected Group details modal
  const [inspectedGroup, setInspectedGroup] = useState<Registration | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Confirmation Modals State
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearTeamModalOpen, setIsClearTeamModalOpen] = useState(false);
  const [teamToClear, setTeamToClear] = useState<string>('');
  const [isDeleteBatchModalOpen, setIsDeleteBatchModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredRegistrations = useMemo(() => {
    return baseRegistrations.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        r.programName.toLowerCase().includes(q) ||
        r.studentName?.toLowerCase().includes(q) ||
        r.groupName?.toLowerCase().includes(q) ||
        r.admissionNo?.toLowerCase().includes(q) ||
        (r.chestNumber && r.chestNumber.toString().includes(q)) ||
        r.groupMembers?.some(
          m =>
            m.name.toLowerCase().includes(q) ||
            m.admissionNo.toLowerCase().includes(q) ||
            (m.chestNumber && m.chestNumber.toString().includes(q))
        );

      const matchTeam = selectedTeam === 'ALL' || r.teamId === selectedTeam;
      const matchCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
      const matchSection = selectedSection === 'ALL' || r.section === selectedSection;
      const matchType = selectedType === 'ALL' || r.programType === selectedType;

      return matchQ && matchTeam && matchCategory && matchSection && matchType;
    });
  }, [baseRegistrations, searchQuery, selectedTeam, selectedCategory, selectedSection, selectedType]);

  // Selected team object
  const activeSelectedTeamObj = useMemo(() => {
    return teams.find(t => t.id === selectedTeam);
  }, [teams, selectedTeam]);

  // Number of registrations in currently selected team
  const selectedTeamRegCount = useMemo(() => {
    if (selectedTeam === 'ALL') return 0;
    return registrations.filter(r => r.teamId === selectedTeam).length;
  }, [registrations, selectedTeam]);

  // Handle multi-select checkboxes
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredRegistrations.length && filteredRegistrations.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRegistrations.map(r => r.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportSpreadsheet = (format: 'csv' | 'xlsx' = 'xlsx') => {
    exportRegistrationsToSpreadsheet(filteredRegistrations, format, `fest_registrations_master_${Date.now()}`);
  };

  const handleWithdraw = (regId: string, name: string) => {
    if (confirm(`Withdraw registration for "${name}"? This will delete it from Supabase database.`)) {
      const res = withdrawRegistration(regId, currentUser.name, currentUser.role);
      if (res.success) {
        setSelectedIds(prev => prev.filter(id => id !== regId));
        setActionFeedback({ success: true, msg: `Registration for "${name}" deleted from database.` });
        setTimeout(() => setActionFeedback(null), 3500);
      }
    }
  };

  // Perform Clear All Registrations
  const handleConfirmClearAll = async () => {
    setIsProcessing(true);
    try {
      const res = clearAllRegistrations(currentUser.name, currentUser.role);
      if (res.success) {
        setSelectedIds([]);
        setIsClearAllModalOpen(false);
        setActionFeedback({
          success: true,
          msg: `Successfully cleared all ${res.count} registrations from database!`
        });
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(res.error || 'Failed to clear registrations.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform Clear Team Registrations
  const handleConfirmClearTeam = async () => {
    const targetTeamId = teamToClear || (selectedTeam !== 'ALL' ? selectedTeam : '');
    if (!targetTeamId) return;

    setIsProcessing(true);
    try {
      const targetTeamName = teams.find(t => t.id === targetTeamId)?.name || 'House';
      const res = clearRegistrationsByTeam(targetTeamId, currentUser.name, currentUser.role);
      if (res.success) {
        setSelectedIds(prev => prev.filter(id => !registrations.find(r => r.id === id && r.teamId === targetTeamId)));
        setIsClearTeamModalOpen(false);
        setActionFeedback({
          success: true,
          msg: `Successfully cleared ${res.count} registrations for ${targetTeamName} from database!`
        });
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(res.error || 'Failed to clear team registrations.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform Batch Delete Selected
  const handleConfirmDeleteBatch = async () => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      const res = deleteRegistrationsBatch(selectedIds, currentUser.name, currentUser.role);
      if (res.success) {
        setActionFeedback({
          success: true,
          msg: `Successfully deleted ${res.count} selected registrations from database!`
        });
        setSelectedIds([]);
        setIsDeleteBatchModalOpen(false);
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(res.error || 'Failed to delete selected registrations.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-indigo-600" />
            Institutional Registrations Master
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Complete centralized registry of individual and group event entries across all houses.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {isAdmin && (
            <>
              {/* Clear Team Registrations Button */}
              <button
                type="button"
                onClick={() => {
                  setTeamToClear(selectedTeam !== 'ALL' ? selectedTeam : (teams[0]?.id || ''));
                  setIsClearTeamModalOpen(true);
                }}
                disabled={baseRegistrations.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-900 border border-amber-200 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Clear all registrations for a selected house/team"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                {selectedTeam !== 'ALL' && activeSelectedTeamObj
                  ? `Clear ${activeSelectedTeamObj.name} (${selectedTeamRegCount})`
                  : 'Clear Team Entries...'}
              </button>

              {/* Clear All Registrations Button */}
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(true)}
                disabled={baseRegistrations.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-800 border border-rose-200 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Permanently delete all registrations from the database"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Clear All Registrations ({baseRegistrations.length})
              </button>
            </>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => handleExportSpreadsheet('xlsx')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold shadow-2xs border border-emerald-200/60 transition-all cursor-pointer"
              title="Export all filtered registrations to Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Export Excel (XLSX)
            </button>
            <button
              onClick={() => handleExportSpreadsheet('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs border border-slate-200 transition-all cursor-pointer"
              title="Export all filtered registrations to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between font-bold animate-in fade-in ${
            actionFeedback.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs font-mono underline hover:opacity-75 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Multi-Select Floating / Sticky Bar */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-sm">
              {selectedIds.length}
            </span>
            <div>
              <p className="font-bold text-sm">
                {selectedIds.length} of {filteredRegistrations.length} registrations selected
              </p>
              <p className="text-xs text-slate-400">
                Bulk action will apply only to selected entries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteBatchModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search participant, group title, member, chest no, or event..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0 font-medium">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-mono text-slate-800 font-bold text-xs">
              {filteredRegistrations.length} of {baseRegistrations.length} Entries
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">House / Team</label>
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Houses</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {categoryConfigs.map(c => (
                <option key={c.id} value={c.category}>{c.displayName || c.category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            >
              {(!isController || (isArtsEnabled && isSportsEnabled)) && <option value="ALL">All Sections</option>}
              {(!isController || isArtsEnabled) && <option value="ARTS">Arts</option>}
              {(!isController || isSportsEnabled) && <option value="SPORTS">Sports</option>}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Format</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Formats</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="GROUP">Group</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-4 w-12 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="p-1 rounded text-slate-500 hover:text-indigo-600 cursor-pointer"
                    title={selectedIds.length === filteredRegistrations.length && filteredRegistrations.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                  >
                    {selectedIds.length === filteredRegistrations.length && filteredRegistrations.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-5">Program & Section</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5">House</th>
                <th className="py-4 px-5">Chest #</th>
                <th className="py-4 px-5">Participant / Group Roster</th>
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium text-sm">
                    No registrations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map(reg => {
                  const isChecked = selectedIds.includes(reg.id);

                  return (
                    <tr
                      key={reg.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(reg.id)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <SectionBadge section={reg.section} />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{reg.programName}</p>
                            <span className="text-xs text-slate-500 uppercase font-mono font-bold">{reg.programType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <CategoryBadge category={reg.category} />
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 font-medium text-slate-700 text-sm">
                          <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: reg.teamColor }} />
                          <span>{reg.teamName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {reg.chestNumber ? (
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-sm">
                            #{reg.chestNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {reg.programType === 'INDIVIDUAL' ? (
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{reg.studentName}</p>
                            <p className="text-xs font-mono text-slate-500">Adm: {reg.admissionNo}</p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm">{reg.groupName}</p>
                              {reg.groupNumber && (
                                <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  Group #{reg.groupNumber}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500 font-normal">
                                {reg.groupMembers?.length || 0} Members
                              </span>
                              <button
                                onClick={() => setInspectedGroup(reg)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 cursor-pointer underline"
                              >
                                <Eye className="w-3 h-3" /> View Roster
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-500 text-xs font-medium">
                        {new Date(reg.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() =>
                            handleWithdraw(
                              reg.id,
                              reg.studentName || reg.groupName || 'this registration'
                            )
                          }
                          title="Withdraw Registration"
                          className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
      </div>

      {/* 1. Clear All Registrations Confirmation Modal */}
      {isClearAllModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isProcessing && setIsClearAllModalOpen(false)}
          title="Clear All Registrations"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-bold">Irreversible Action: Clear Entire Registry</p>
                <p className="text-xs text-rose-800 leading-relaxed font-normal">
                  Are you absolutely sure you want to permanently delete all <strong>{baseRegistrations.length}</strong> candidate and group registrations?
                  This will remove every single entry from both the <strong>Supabase database</strong> and local state.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600 font-medium">
              <p>• Total Registrations to Delete: <strong className="text-slate-900 font-bold">{baseRegistrations.length}</strong></p>
              <p>• Affected Houses: <strong className="text-slate-900 font-bold">{teams.length} Houses</strong></p>
              <p>• Candidates will be free to register again immediately.</p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmClearAll}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                {isProcessing ? 'Clearing Database...' : `Yes, Clear All ${baseRegistrations.length} Entries`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Clear Team Registrations Confirmation Modal */}
      {isClearTeamModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isProcessing && setIsClearTeamModalOpen(false)}
          title="Clear House / Team Registrations"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-bold">Delete Registrations for Specific House</p>
                <p className="text-xs text-amber-800 leading-relaxed font-normal">
                  Select a house/team below to wipe all its candidate and group entries from the <strong>Supabase database</strong>.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase">
                Select House / Team to Clear:
              </label>
              <select
                value={teamToClear}
                onChange={e => setTeamToClear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
              >
                {teams.map(t => {
                  const cnt = registrations.filter(r => r.teamId === t.id).length;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} ({cnt} registrations)
                    </option>
                  );
                })}
              </select>
            </div>

            {(() => {
              const targetTeam = teams.find(t => t.id === teamToClear);
              const targetCount = registrations.filter(r => r.teamId === teamToClear).length;

              return (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600 font-medium">
                  <p>• Selected House: <strong className="text-slate-900 font-bold">{targetTeam?.name || 'None'}</strong></p>
                  <p>• Registrations to Delete: <strong className="text-rose-600 font-bold">{targetCount} entries</strong></p>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsClearTeamModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing || !teamToClear}
                onClick={handleConfirmClearTeam}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                {isProcessing ? 'Clearing Team...' : 'Clear House Registrations'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Batch Delete Selected Confirmation Modal */}
      {isDeleteBatchModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isProcessing && setIsDeleteBatchModalOpen(false)}
          title="Delete Selected Registrations"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3">
              <Trash2 className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-bold">Delete Selected Entries</p>
                <p className="text-xs text-rose-800 leading-relaxed font-normal">
                  Are you sure you want to delete the <strong>{selectedIds.length}</strong> selected candidate registrations from the database?
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsDeleteBatchModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDeleteBatch}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                {isProcessing ? 'Deleting...' : `Delete ${selectedIds.length} Registrations`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Group Member Inspection Modal */}
      {inspectedGroup && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedGroup(null)}
          title={`Group Roster: ${inspectedGroup.groupName || 'Group Details'}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Program</span>
                <span className="font-bold text-slate-900">{inspectedGroup.programName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">House / Team</span>
                <span className="font-bold text-slate-900">{inspectedGroup.teamName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Category</span>
                <CategoryBadge category={inspectedGroup.category} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Registered Members ({inspectedGroup.groupMembers?.length || 0})
              </h4>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {inspectedGroup.groupMembers?.map((member, idx) => (
                  <div
                    key={member.studentId || idx}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-sm shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900">{member.name}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs text-slate-600">
                      <span>Adm: <strong>{member.admissionNo}</strong></span>
                      {member.chestNumber && (
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          #{member.chestNumber}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedGroup(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer transition-colors"
              >
                Close Roster
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
