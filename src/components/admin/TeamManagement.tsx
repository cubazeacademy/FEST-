import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { Team } from '../../types';
import { Modal } from '../common/Modal';
import {
  Users2,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  AlertTriangle
} from 'lucide-react';

export const TeamManagement: React.FC = () => {
  const { currentUser, allUsers, addUser, updateUser, deleteUser, syncTeamUsers } = useAuth();
  const { teams, students, teamLeaderboard, addTeam, updateTeam, deleteTeam } = useFestData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#ef4444',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    motto: ''
  });

  const handleOpenAdd = () => {
    setEditingTeam(null);
    setFormData({
      name: '',
      code: '',
      color: '#8b5cf6',
      leaderName: '',
      leaderEmail: '',
      leaderPhone: '',
      motto: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      code: team.code,
      color: team.color,
      leaderName: team.leaderName,
      leaderEmail: team.leaderEmail,
      leaderPhone: team.leaderPhone || '',
      motto: team.motto || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (team: Team) => {
    setTeamToDelete(team);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!teamToDelete) return;
    deleteTeam(teamToDelete.id, currentUser.name, currentUser.role);
    const associatedUser = allUsers.find(
      u =>
        u.role === 'TEAM_LEADER' &&
        (u.teamId === teamToDelete.id ||
          u.teamId?.toLowerCase() === teamToDelete.code.toLowerCase() ||
          u.teamId?.toLowerCase() === teamToDelete.name.toLowerCase() ||
          (u.username && u.username.toLowerCase().includes(teamToDelete.code.toLowerCase())))
    );
    if (associatedUser) {
      deleteUser(associatedUser.id);
    }
    setIsDeleteModalOpen(false);
    setTeamToDelete(null);
    if (isModalOpen && editingTeam?.id === teamToDelete.id) {
      setIsModalOpen(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeam) {
      const updatedTeamObj = {
        ...editingTeam,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        color: formData.color,
        leaderName: formData.leaderName.trim(),
        leaderEmail: formData.leaderEmail.trim(),
        leaderPhone: formData.leaderPhone.trim() || undefined,
        motto: formData.motto.trim() || undefined
      };
      updateTeam(updatedTeamObj, currentUser.name, currentUser.role);

      const targetUsername = `leader_${updatedTeamObj.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const associatedUser = allUsers.find(
        u =>
          u.role === 'TEAM_LEADER' &&
          (u.teamId === editingTeam.id ||
            u.teamId?.toLowerCase() === editingTeam.code.toLowerCase() ||
            u.teamId?.toLowerCase() === editingTeam.name.toLowerCase() ||
            (u.username &&
              (u.username.toLowerCase().includes(editingTeam.code.toLowerCase()) ||
                u.username.toLowerCase().includes(editingTeam.name.toLowerCase()))))
      );
      if (associatedUser) {
        updateUser({
          ...associatedUser,
          name: updatedTeamObj.leaderName || `${updatedTeamObj.name} Leader`,
          email: updatedTeamObj.leaderEmail || `${updatedTeamObj.code.toLowerCase()}@festportal.edu`,
          teamId: updatedTeamObj.id,
          username: associatedUser.username.startsWith('leader_team17') ? targetUsername : associatedUser.username
        });
      }
    } else {
      const newTeamCode = formData.code.trim().toUpperCase();
      const newTeamName = formData.name.trim();
      const newTeamLeaderName = formData.leaderName.trim() || `${newTeamName} Leader`;
      const newTeamLeaderEmail = formData.leaderEmail.trim() || `${newTeamCode.toLowerCase()}@festportal.edu`;
      const newTeamId = 'team_' + Date.now();

      addTeam(
        {
          name: newTeamName,
          code: newTeamCode,
          color: formData.color,
          bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          borderClass: 'border-indigo-500',
          leaderId: 'lead_' + Date.now(),
          leaderName: newTeamLeaderName,
          leaderEmail: newTeamLeaderEmail,
          leaderPhone: formData.leaderPhone.trim() || undefined,
          motto: formData.motto.trim() || undefined,
          status: 'ACTIVE'
        },
        currentUser.name,
        currentUser.role
      );

      addUser({
        id: `usr_tl_${newTeamId}`,
        username: `leader_${newTeamCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        password: 'password123',
        name: newTeamLeaderName,
        email: newTeamLeaderEmail,
        role: 'TEAM_LEADER',
        teamId: newTeamId,
        isActive: true
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Users2 className="w-6 h-6 text-indigo-600" />
            House & Team Command
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage house captains, student rosters, color themes, and house mottos.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-[0_4px_14px_rgba(99,102,241,0.30)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.40)] transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New House
        </button>
      </div>

      {/* House Cards Grid (4 in 1 row on desktops) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {teams.map(team => {
          const roster = students.filter(s => s.teamId === team.id);
          const score = teamLeaderboard.find(t => t.teamId === team.id);

          return (
            <div
              key={team.id}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 flex flex-col justify-between transition-all duration-200 group"
            >
              <div>
                {/* Team Top Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-[0_4px_12px_rgba(0,0,0,0.15)] shrink-0"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.code.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">{team.name}</h3>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {team.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-[170px]" title={team.motto}>
                        "{team.motto || 'Striving for fest excellence'}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(team)}
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-slate-200/60"
                      title="Edit Team"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(team)}
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border border-slate-200/60 hover:border-rose-200"
                      title="Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Captain Info */}
                <div className="mt-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Captain</span>
                    <span className="font-bold text-indigo-700 text-xs truncate max-w-[130px]">{team.leaderName}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 truncate" title={team.leaderEmail}>
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{team.leaderEmail}</span>
                    </span>
                    {team.leaderPhone && (
                      <span className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{team.leaderPhone}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Roster Stats */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-2 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <p className="text-[10px] uppercase font-bold text-slate-400 truncate">Roster</p>
                    <p className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">{roster.length}</p>
                  </div>
                  <div className="p-2 rounded-2xl bg-fuchsia-50/80 border border-fuchsia-200">
                    <p className="text-[10px] uppercase font-bold text-fuchsia-700 truncate">Arts</p>
                    <p className="text-xs sm:text-sm font-black text-fuchsia-800 font-mono mt-0.5">{score?.artsTotalPoints || 0}</p>
                  </div>
                  <div className="p-2 rounded-2xl bg-sky-50/80 border border-sky-200">
                    <p className="text-[10px] uppercase font-bold text-sky-700 truncate">Sports</p>
                    <p className="text-xs sm:text-sm font-black text-sky-800 font-mono mt-0.5">{score?.sportsTotalPoints || 0}</p>
                  </div>
                </div>
              </div>

              {/* Medals Tally Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span>Arts: <strong className="text-fuchsia-700 font-mono font-bold">#{score?.artsRank || '-'}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Sports: <strong className="text-sky-700 font-mono font-bold">#{score?.sportsRank || '-'}</strong></span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-slate-700">
                  <span title="Gold Medals">🥇 {score?.firstCount || 0}</span>
                  <span title="Silver Medals">🥈 {score?.secondCount || 0}</span>
                  <span title="Bronze Medals">🥉 {score?.thirdCount || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Create / Edit Team */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeam ? 'Edit House / Team' : 'Create New House'}
        subtitle="Manage house parameters and color identification"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">House / Team Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ruby Phoenix"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700">Short Code *</label>
              <input
                type="text"
                required
                placeholder="RUBY"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 uppercase font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">House Theme Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-white border border-slate-200 p-0.5"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700">Captain / Team Leader *</label>
              <input
                type="text"
                required
                placeholder="Leader Name"
                value={formData.leaderName}
                onChange={e => setFormData({ ...formData, leaderName: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Leader Email *</label>
              <input
                type="email"
                required
                placeholder="leader@festportal.edu"
                value={formData.leaderEmail}
                onChange={e => setFormData({ ...formData, leaderEmail: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">House Motto</label>
            <input
              type="text"
              placeholder="e.g. Rising Fierce from the Ashes"
              value={formData.motto}
              onChange={e => setFormData({ ...formData, motto: e.target.value })}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {editingTeam ? (
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  handleOpenDelete(editingTeam);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold transition-colors cursor-pointer border border-rose-200"
              >
                <Trash2 className="w-4 h-4" />
                Delete House
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
              >
                {editingTeam ? 'Update House' : 'Create House'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: Delete Team Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTeamToDelete(null);
        }}
        title="Delete House / Team"
        subtitle="Confirm removal of house from the fest system"
      >
        {teamToDelete && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-sm text-rose-900">
                <p className="font-bold">Are you sure you want to delete this house?</p>
                <p className="mt-1 text-rose-700 text-xs leading-relaxed">
                  This action cannot be undone. All assigned students will become unassigned, and any registered team slots for this house will be removed.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs"
                  style={{ backgroundColor: teamToDelete.color }}
                >
                  {teamToDelete.code.slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">{teamToDelete.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">Code: {teamToDelete.code} • Captain: {teamToDelete.leaderName}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                <span>Enrolled Students in Roster:</span>
                <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {students.filter(s => s.teamId === teamToDelete.id).length} Students
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTeamToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete House
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
