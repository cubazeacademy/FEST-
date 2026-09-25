import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { SectionBadge, CategoryBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  ClipboardList,
  Search,
  Trash2,
  Printer,
  CheckCircle2
} from 'lucide-react';

export const RegistrationHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const { registrations, withdrawRegistration, settings, teams } = useFestData();

  const myTeam = teams.find(
    t =>
      t.id === currentUser.teamId ||
      t.name?.toLowerCase() === currentUser.teamId?.toLowerCase() ||
      t.code?.toLowerCase() === currentUser.teamId?.toLowerCase()
  );
  const teamColor = myTeam?.color || '#ef4444';

  const validTeamIdentifiers = new Set(
    [
      currentUser?.teamId,
      myTeam?.id,
      myTeam?.code,
      myTeam?.name
    ]
      .filter(Boolean)
      .map(s => String(s).toLowerCase().trim())
  );

  const myRegistrations = registrations.filter(
    r =>
      validTeamIdentifiers.has((r.teamId || '').toLowerCase().trim()) ||
      validTeamIdentifiers.has((r.teamName || '').toLowerCase().trim()) ||
      Boolean(myTeam && (r.teamId === myTeam.id || (r.teamName && r.teamName.toLowerCase() === myTeam.name.toLowerCase())))
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  const filteredRegistrations = myRegistrations.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      r.programName.toLowerCase().includes(q) ||
      r.studentName?.toLowerCase().includes(q) ||
      r.groupName?.toLowerCase().includes(q) ||
      (r.chestNumber && r.chestNumber.toString().includes(q))
    );
  });

  const handleOpenSlip = (reg: any) => {
    setSelectedSlip(reg);
    setIsSlipModalOpen(true);
  };

  const handleWithdraw = (regId: string, name: string) => {
    if (confirm(`Withdraw registration for "${name}"?`)) {
      withdrawRegistration(regId, currentUser.name, currentUser.role);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" style={{ color: teamColor }} />
            TEAM {myTeam?.name ? myTeam.name.toUpperCase() : 'SARAHA'} Registration Archive & Slips
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Confirmed entries for TEAM {myTeam?.name ? myTeam.name.toUpperCase() : 'SARAHA'}. View, print slips, or withdraw registrations.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by participant name, chest no, or program title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all"
          />
        </div>

        <span
          className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border shrink-0"
          style={{
            backgroundColor: `${teamColor}12`,
            borderColor: `${teamColor}30`,
            color: teamColor
          }}
        >
          {filteredRegistrations.length} Entries
        </span>
      </div>

      {/* Registrations List */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Chest #</th>
                <th className="py-3.5 px-4">Participant / Group Name</th>
                <th className="py-3.5 px-4">Program & Section</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Format</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No registrations found for your house yet.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold" style={{ color: teamColor }}>
                      {reg.chestNumber ? `#${reg.chestNumber}` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{reg.studentName || reg.groupName}</p>
                      {reg.admissionNo && <p className="text-[10px] font-mono text-slate-400">{reg.admissionNo}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <SectionBadge section={reg.section} />
                        <span className="font-medium text-slate-700">{reg.programName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={reg.category} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600 border border-slate-200">
                        {reg.programType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenSlip(reg)}
                          title="Print Entry Slip"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleWithdraw(reg.id, reg.studentName || reg.groupName || 'this registration')}
                          title="Withdraw Entry"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Printable Registration Slip */}
      <Modal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        title="Official Entry & Call Slip"
        subtitle="Verification badge for stage controller and judge inspection"
      >
        {selectedSlip && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white text-slate-900 border-2 border-slate-200 shadow-sm space-y-4 print-slip">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-bold text-base tracking-tight text-slate-900">{settings.festName} {settings.festYear}</h4>
                  <p className="text-xs text-slate-500">{settings.institutionName}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs">
                    {selectedSlip.section}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Participant / Group:</span>
                  <strong className="text-sm text-slate-900">{selectedSlip.studentName || selectedSlip.groupName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Chest Number:</span>
                  <strong className="text-base font-mono" style={{ color: teamColor }}>#{selectedSlip.chestNumber || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Program:</span>
                  <span className="font-medium text-slate-800">{selectedSlip.programName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Category & House:</span>
                  <span className="font-medium text-slate-800">{selectedSlip.category} • {selectedSlip.teamName}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <span>Entry ID: {selectedSlip.id}</span>
                <span>Authorized Signatory</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsSlipModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handlePrintSlip}
                className="px-4 py-2 rounded-2xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                style={{
                  backgroundColor: teamColor,
                  boxShadow: `0 4px 14px 0 ${teamColor}40`
                }}
              >
                <Printer className="w-3.5 h-3.5" />
                Print Call Slip
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

