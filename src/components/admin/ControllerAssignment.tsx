import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import {
  UserCog,
  Plus,
  Trash2,
  Mail
} from 'lucide-react';

export const ControllerAssignment: React.FC = () => {
  const { allUsers, currentUser } = useAuth();
  const { programs, updateProgram } = useFestData();

  const controllers = allUsers.filter(u => u.role === 'CONTROLLER');

  const [selectedController, setSelectedController] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProgramToAssign, setSelectedProgramToAssign] = useState('');

  const handleOpenAssignModal = (ctrl: any) => {
    setSelectedController(ctrl);
    const unassigned = programs.filter(p => p.assignedControllerId !== ctrl.id);
    setSelectedProgramToAssign(unassigned[0]?.id || '');
    setIsAssignModalOpen(true);
  };

  const handleAssign = () => {
    if (!selectedController || !selectedProgramToAssign) return;
    const prog = programs.find(p => p.id === selectedProgramToAssign);
    if (!prog) return;

    updateProgram(
      {
        ...prog,
        assignedControllerId: selectedController.id,
        assignedControllerName: selectedController.name
      },
      currentUser.name,
      currentUser.role
    );

    setIsAssignModalOpen(false);
  };

  const handleUnassign = (progId: string) => {
    const prog = programs.find(p => p.id === progId);
    if (!prog) return;

    updateProgram(
      {
        ...prog,
        assignedControllerId: undefined,
        assignedControllerName: undefined
      },
      currentUser.name,
      currentUser.role
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <UserCog className="w-6 h-6 text-indigo-600" />
          Event Controller Assignments & Scoping
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Designate controllers for specific stage, non-stage, and athletics events to grant result-entry privileges.
        </p>
      </div>

      {/* Controllers Workload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {controllers.map(ctrl => {
          const assignedProgs = programs.filter(p => p.assignedControllerId === ctrl.id);
          const completedCount = assignedProgs.filter(p => p.resultStatus === 'PUBLISHED').length;
          const pendingCount = assignedProgs.length - completedCount;

          return (
            <div
              key={ctrl.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {ctrl.avatarUrl ? (
                        <img src={ctrl.avatarUrl} alt={ctrl.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-700 text-lg">
                          {ctrl.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{ctrl.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {ctrl.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Mini Bar */}
                <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm">
                  <div className="flex items-center justify-between text-slate-700 mb-2">
                    <span className="font-bold text-slate-600">Assigned Events:</span>
                    <span className="font-mono font-bold text-slate-900 text-base">{assignedProgs.length} Total</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">✓ {completedCount} Published</span>
                    <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">⏳ {pendingCount} Pending</span>
                  </div>
                </div>

                {/* Assigned Programs List */}
                <div className="mt-5 space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {assignedProgs.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center italic font-medium">No events assigned yet.</p>
                  ) : (
                    assignedProgs.map(prog => (
                      <div
                        key={prog.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-sm"
                      >
                        <div className="truncate mr-2">
                          <p className="font-bold text-slate-900 truncate text-sm">{prog.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{prog.section}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-600 font-medium">{prog.category}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnassign(prog.id)}
                          title="Unassign Controller"
                          className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 shrink-0 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100">
                <button
                  onClick={() => handleOpenAssignModal(ctrl)}
                  className="w-full py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Assign Program
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Assign Program */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Event to Controller"
        subtitle={`Assigning to ${selectedController?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">Select Unassigned Program</label>
            <select
              value={selectedProgramToAssign}
              onChange={e => setSelectedProgramToAssign(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
            >
              {programs
                .filter(p => p.assignedControllerId !== selectedController?.id)
                .map(prog => (
                  <option key={prog.id} value={prog.id}>
                    [{prog.section}] {prog.name} ({prog.category})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
