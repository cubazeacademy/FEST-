import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Hash,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Sliders,
  Check,
  Edit2
} from 'lucide-react';

export const ChestNumberGenerator: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    students,
    categoryConfigs,
    teams,
    runChestNumberGenerator,
    assignManualChestNumber
  } = useFestData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Generation feedback
  const [genReport, setGenReport] = useState<{
    assigned: number;
    skipped: number;
    errors: string[];
    show: boolean;
  }>({ assigned: 0, skipped: 0, errors: [], show: false });

  // Manual chest override modal
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [manualChestInput, setManualChestInput] = useState<number | ''>('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const handleGenerate = (preserveExisting: boolean) => {
    const res = runChestNumberGenerator(preserveExisting, currentUser.name, currentUser.role);
    setGenReport({
      assigned: res.assigned,
      skipped: res.skipped,
      errors: res.errors,
      show: true
    });
  };

  const handleOpenManual = (st: any) => {
    setSelectedStudent(st);
    setManualChestInput(st.chestNumber ? Number(st.chestNumber) : '');
    setManualError(null);
    setIsManualModalOpen(true);
  };

  const handleSaveManual = () => {
    if (!selectedStudent || manualChestInput === '') return;
    const res = assignManualChestNumber(selectedStudent.id, Number(manualChestInput), currentUser.name, currentUser.role);
    if (res.success) {
      setIsManualModalOpen(false);
    } else {
      setManualError(res.error || 'Assignment error.');
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const matchQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      (s.chestNumber && s.chestNumber.toString().includes(q));

    const matchCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchQ && matchCat;
  });

  const assignedCount = students.filter(s => s.chestNumber).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-500">
              CHEST NUMBER ALLOCATION
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Chest Number Generator
          </h2>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80 font-bold">
            {assignedCount} / {students.length} Assigned
          </span>
        </div>
      </div>

      {/* Generator Trigger Card & Range Capacities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Simple Action Card (1 col) */}
        <div className="p-5 rounded-[22px] bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center text-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Auto Allocation</h3>
            </div>
            <p className="text-xs text-slate-500">
              Sequential chest numbers assigned per category scope.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => handleGenerate(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Unassigned
            </button>

            <button
              onClick={() => {
                if (confirm('Reassign chest numbers for ALL students?')) {
                  handleGenerate(false);
                }
              }}
              className="w-full py-2 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate All
            </button>
          </div>

          {/* Feedback */}
          {genReport.show && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Done
                </span>
                <button
                  onClick={() => setGenReport(prev => ({ ...prev, show: false }))}
                  className="text-emerald-700 hover:text-emerald-900 text-[10px] font-bold"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-emerald-700">
                Assigned: <strong className="text-emerald-900">{genReport.assigned}</strong> | Preserved: <strong className="text-emerald-900">{genReport.skipped}</strong>
              </p>
              {genReport.errors.length > 0 && (
                <div className="text-rose-600 text-[11px] pt-1">
                  {genReport.errors.map((err, idx) => (
                    <p key={idx}>⚠️ {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Range Capacities Simple Cards (2 cols) */}
        <div className="lg:col-span-2 rounded-[22px] bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-500" />
                Category Ranges & Capacity
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {categoryConfigs.length} Categories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryConfigs.map(cat => {
                const countAssigned = students.filter(s => s.category === cat.category && s.chestNumber).length;
                const totalStudents = students.filter(s => s.category === cat.category).length;
                const rangeCapacity = cat.chestNoEnd - cat.chestNoStart + 1;
                const percentUsed = Math.min(100, Math.round((countAssigned / rangeCapacity) * 100));

                return (
                  <div key={cat.id} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{cat.displayName || cat.category}</span>
                      <span className="font-mono text-[11px] font-bold text-rose-600 bg-white px-2 py-0.5 rounded-lg border border-rose-100 shadow-2xs">
                        #{cat.chestNoStart} - #{cat.chestNoEnd}
                      </span>
                    </div>

                    {/* Simple Progress Bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 my-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{countAssigned}/{totalStudents} enrolled</span>
                      <span className="font-mono text-slate-600 font-semibold">{percentUsed}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Students Chest Number Matrix Table */}
      <div className="rounded-[22px] bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, chest no, admission..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 shadow-2xs transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:border-rose-400 shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categoryConfigs.map(cat => (
                <option key={cat.id} value={cat.category}>
                  {cat.displayName || cat.category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Chest No</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">House / Team</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.map(st => {
                const team = teams.find(t => t.id === st.teamId);
                return (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      {st.chestNumber ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 font-mono font-bold text-rose-600 text-xs">
                          #{st.chestNumber}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-medium">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{st.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{st.admissionNo}</p>
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={st.category} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        {team && (
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                        )}
                        <span>{team?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                      Class {st.classNumber}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenManual(st)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Manual Override */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Manual Chest Number Override"
        subtitle={`Student: ${selectedStudent?.name} (${selectedStudent?.category})`}
      >
        <div className="space-y-4">
          {manualError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{manualError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Chest Number</label>
            <input
              type="number"
              placeholder="e.g. 205"
              value={manualChestInput}
              onChange={e => setManualChestInput(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-rose-400 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveManual}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Confirm Override
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
