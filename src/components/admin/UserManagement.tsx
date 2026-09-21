import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFestData } from '../../context/FestDataContext';
import { User, UserRole } from '../../types';
import { Modal } from '../common/Modal';
import {
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Check,
  Eye,
  EyeOff,
  Copy,
  Lock,
  ShieldCheck,
  Shield,
  Sparkles
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const {
    currentUser,
    allUsers,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword,
    syncTeamUsers
  } = useAuth();

  const { teams, programs } = useFestData();

  // Auto-sync team leader accounts for all active teams
  useEffect(() => {
    if (teams && teams.length > 0) {
      syncTeamUsers(teams);
    }
  }, [teams]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Password visibility & copy states
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'TEAM_LEADER' as UserRole,
    teamId: teams[0]?.id || '',
    assignedProgramIds: [] as string[],
    isActive: true
  });

  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchQ && matchRole;
    });
  }, [allUsers, searchQuery, roleFilter]);

  const handleOpenAdd = () => {
    setModalError(null);
    setFormData({
      name: '',
      username: '',
      password: 'password123',
      email: '',
      role: 'TEAM_LEADER',
      teamId: teams[0]?.id || '',
      assignedProgramIds: [],
      isActive: true
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setModalError(null);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      email: user.email,
      role: user.role,
      teamId: user.teamId || teams[0]?.id || '',
      assignedProgramIds: user.assignedProgramIds || [],
      isActive: user.isActive !== false
    });
    setIsEditModalOpen(true);
  };

  const handleOpenResetPass = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setModalError(null);
    setIsResetPassModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const res = addUser({
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase(),
      password: formData.password.trim(),
      email: formData.email.trim() || `${formData.username}@festportal.edu`,
      role: formData.role,
      teamId: formData.role === 'TEAM_LEADER' ? formData.teamId : undefined,
      assignedProgramIds: formData.role === 'CONTROLLER' ? formData.assignedProgramIds : undefined,
      isActive: formData.isActive
    });

    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setModalError(res.error || 'Failed to create user.');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setModalError(null);

    const res = updateUser({
      ...selectedUser,
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase(),
      password: formData.password.trim() || selectedUser.password || 'password123',
      email: formData.email.trim(),
      role: formData.role,
      teamId: formData.role === 'TEAM_LEADER' ? formData.teamId : undefined,
      assignedProgramIds: formData.role === 'CONTROLLER' ? formData.assignedProgramIds : undefined,
      isActive: formData.isActive
    });

    if (res.success) {
      setIsEditModalOpen(false);
    } else {
      setModalError(res.error || 'Failed to update user.');
    }
  };

  const handleResetPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setModalError(null);

    const res = resetUserPassword(selectedUser.id, newPassword);
    if (res.success) {
      setIsResetPassModalOpen(false);
    } else {
      setModalError(res.error || 'Password reset failed.');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(prev => (prev === key ? null : prev));
    }, 2000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const isPasswordVisible = (userId: string) => {
    return showAllPasswords || !!revealedPasswords[userId];
  };

  const handleDelete = (user: User) => {
    if (confirm(`Are you sure you want to delete user account "${user.username}" (${user.name})?`)) {
      const res = deleteUser(user.id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const toggleProgramAssignment = (progId: string) => {
    setFormData(prev => {
      const exists = prev.assignedProgramIds.includes(progId);
      return {
        ...prev,
        assignedProgramIds: exists
          ? prev.assignedProgramIds.filter(id => id !== progId)
          : [...prev.assignedProgramIds, progId]
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            User Accounts, Credentials & Roles
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage authenticated user access, view usernames and passwords, and share login credentials with Team Leaders & Controllers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAllPasswords(prev => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
              showAllPasswords
                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showAllPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAllPasswords ? 'Hide All Passwords' : 'Show All Passwords'}
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Create User Account
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="TEAM_LEADER">Team Leader</option>
            <option value="CONTROLLER">Event Controller</option>
          </select>
          <span className="text-xs font-mono font-bold px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 shrink-0">
            {filteredUsers.length} Users
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-5">User Account</th>
                <th className="py-4 px-5">Username</th>
                <th className="py-4 px-5">Password</th>
                <th className="py-4 px-5">Role & Privileges</th>
                <th className="py-4 px-5">Affiliation / Scope</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.map(user => {
                const team = teams.find(
                  t =>
                    t.id === user.teamId ||
                    t.name.toLowerCase() === user.teamId?.toLowerCase() ||
                    t.code.toLowerCase() === user.teamId?.toLowerCase() ||
                    (user.username &&
                      (user.username.toLowerCase().includes(t.code.toLowerCase()) ||
                        user.username.toLowerCase().includes(t.name.toLowerCase())))
                );
                const isCurrent = currentUser.id === user.id;
                const userPassword = user.password || 'password123';
                const userPassVisible = isPasswordVisible(user.id);
                const isUserCopied = copiedKey === `tbl-user-${user.id}`;
                const isPassCopied = copiedKey === `tbl-pass-${user.id}`;
                const isAllCopied = copiedKey === `tbl-all-${user.id}`;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                            {isCurrent && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Username Column */}
                    <td className="py-4 px-5">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-700 text-sm px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200">
                          {user.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(user.username, `tbl-user-${user.id}`)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Copy Username"
                        >
                          {isUserCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Password Column */}
                    <td className="py-4 px-5">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 text-sm px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 min-w-[90px] text-center">
                          {userPassVisible ? userPassword : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title={userPassVisible ? 'Hide Password' : 'Show Password'}
                        >
                          {userPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(userPassword, `tbl-pass-${user.id}`)}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Copy Password"
                        >
                          {isPassCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : user.role === 'TEAM_LEADER'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      {user.role === 'TEAM_LEADER' && team ? (
                        <div className="flex items-center gap-2 font-medium text-slate-700 text-sm">
                          <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: team.color }} />
                          <span>{team.name}</span>
                        </div>
                      ) : user.role === 'CONTROLLER' ? (
                        <span className="text-emerald-700 font-bold text-sm bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                          Global Event Controller
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm">Institutional System</span>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-colors border cursor-pointer ${
                          user.isActive !== false
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {user.isActive !== false ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {user.isActive !== false ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `Username: ${user.username} | Password: ${userPassword}`,
                              `tbl-all-${user.id}`
                            )
                          }
                          title="Copy Full Login (Username & Password)"
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            isAllCopied
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'
                          }`}
                        >
                          {isAllCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenResetPass(user)}
                          title="Reset Password"
                          className="p-2 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Edit User"
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(user)}
                            title="Delete User"
                            className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create User */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Authorized User Account"
        subtitle="Provision username, password, and portal permissions"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Jenkins"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700">Username *</label>
              <input
                type="text"
                required
                placeholder="sarah_j"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Password *</label>
              <input
                type="text"
                required
                placeholder="password123"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                placeholder="user@festportal.edu"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Role Designation *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
              >
                <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                <option value="TEAM_LEADER">Team Leader (House Captain)</option>
                <option value="CONTROLLER">Event Controller (Judge)</option>
              </select>
            </div>
          </div>

          {formData.role === 'TEAM_LEADER' && (
            <div>
              <label className="text-sm font-bold text-slate-700">Assigned House / Team *</label>
              <select
                value={formData.teamId}
                onChange={e => setFormData({ ...formData, teamId: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'CONTROLLER' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              Event Controllers have universal judging privileges to evaluate, score, and certify any Arts and Sports program across the fest.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
            >
              Save Account
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit User */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile & Role"
        subtitle={`Updating details for @${selectedUser?.username}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700">Username *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Password</label>
              <input
                type="text"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep existing"
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Role Designation</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="TEAM_LEADER">Team Leader</option>
                <option value="CONTROLLER">Event Controller</option>
              </select>
            </div>
          </div>

          {formData.role === 'TEAM_LEADER' && (
            <div>
              <label className="text-sm font-bold text-slate-700">Assigned House</label>
              <select
                value={formData.teamId}
                onChange={e => setFormData({ ...formData, teamId: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
            >
              Update Account
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Reset Password */}
      <Modal
        isOpen={isResetPassModalOpen}
        onClose={() => setIsResetPassModalOpen(false)}
        title="Reset User Password"
        subtitle={`Set a new password for @${selectedUser?.username}`}
      >
        <form onSubmit={handleResetPassSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-slate-700">New Password *</label>
            <input
              type="text"
              required
              placeholder="Enter new password (min 4 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResetPassModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
