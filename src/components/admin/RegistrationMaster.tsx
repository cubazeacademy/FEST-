import React, { useState, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { SectionBadge, CategoryBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Registration } from '../../types';
import {
  FileCheck2,
  Search,
  Download,
  Trash2,
  Users,
  Eye
} from 'lucide-react';

export const RegistrationMaster: React.FC = () => {
  const { currentUser } = useAuth();
  const { registrations, teams, categoryConfigs, settings, withdrawRegistration } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;
  const isController = currentUser.role === 'CONTROLLER';

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

  const handleExportCSV = () => {
    const headers = [
      'Registration ID',
      'Section',
      'Category',
      'Program',
      'Type',
      'House',
      'Chest No',
      'Participant/Group',
      'Adm No',
      'Members Count',
      'Group Members Details',
      'Timestamp'
    ];
    const rows = filteredRegistrations.map(r => [
      r.id,
      r.section,
      r.category,
      `"${r.programName}"`,
      r.programType,
      `"${r.teamName}"`,
      r.chestNumber || '-',
      `"${r.studentName || r.groupName}"`,
      r.admissionNo || '-',
      r.groupMembers ? r.groupMembers.length : 1,
      r.groupMembers
        ? `"${r.groupMembers.map(m => `${m.name} (${m.admissionNo}${m.chestNumber ? ` #${m.chestNumber}` : ''})`).join('; ')}"`
        : '-',
      r.timestamp
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fest_registrations_master_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWithdraw = (regId: string, name: string) => {
    if (confirm(`Withdraw registration for "${name}"?`)) {
      withdrawRegistration(regId, currentUser.name, currentUser.role);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-indigo-600" />
            Institutional Registrations Master
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Complete centralized registry of individual and group event entries across all houses.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Export CSV Registry
        </button>
      </div>

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
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium text-sm">
                    No registrations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
