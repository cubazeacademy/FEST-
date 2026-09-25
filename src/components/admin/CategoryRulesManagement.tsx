import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryConfig } from '../../types';
import { CategoryBadge } from '../common/Badge';
import { useRegisterUnsavedChanges } from '../../context/UnsavedChangesContext';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  Layers,
  Award
} from 'lucide-react';

export const CategoryRulesManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { categoryConfigs, updateCategoryConfig } = useFestData();

  // Local draft state for editing rules per category
  const [rulesState, setRulesState] = useState<{ [id: string]: Partial<CategoryConfig> }>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ categoryId: string; success: boolean; msg: string } | null>(null);

  // Register dirty state to prevent accidental loss on deployment update / page navigation
  useRegisterUnsavedChanges('category_rules', Object.keys(rulesState).length > 0);

  // Helper to get active draft or saved config
  const getConfigValue = (config: CategoryConfig): CategoryConfig => {
    return {
      ...config,
      ...(rulesState[config.id] || {})
    };
  };

  const handleRuleChange = (
    configId: string,
    field: keyof CategoryConfig,
    value: number
  ) => {
    setRulesState(prev => ({
      ...prev,
      [configId]: {
        ...(prev[configId] || {}),
        [field]: Math.max(0, value)
      }
    }));
  };

  // Save specific category rule
  const handleSaveCategoryRule = async (config: CategoryConfig) => {
    const updated = getConfigValue(config);
    setFeedback(null);
    setSavingId(config.id);

    try {
      const stageMin = updated.minStagePrograms ?? 0;
      const stageMax = updated.maxStagePrograms !== undefined && updated.maxStagePrograms !== null ? updated.maxStagePrograms : 2;
      const nonStageMin = updated.minNonStagePrograms ?? 0;
      const nonStageMax = updated.maxNonStagePrograms !== undefined && updated.maxNonStagePrograms !== null ? updated.maxNonStagePrograms : 3;
      const sportsMin = updated.minSportsPrograms ?? 0;
      const sportsMax = updated.maxSportsPrograms !== undefined && updated.maxSportsPrograms !== null ? updated.maxSportsPrograms : 2;

      const fullConfig: CategoryConfig = {
        ...updated,
        minStagePrograms: stageMin,
        maxStagePrograms: stageMax,
        minNonStagePrograms: nonStageMin,
        maxNonStagePrograms: nonStageMax,
        minSportsPrograms: sportsMin,
        maxSportsPrograms: sportsMax,
        minIndividualProgramsPerStudent: Math.max(0, stageMin + nonStageMin + sportsMin),
        maxIndividualProgramsPerStudent: Math.max(1, stageMax + nonStageMax + sportsMax)
      };

      const res = updateCategoryConfig(
        fullConfig,
        undefined,
        currentUser.name,
        currentUser.role
      );

      if (res.success) {
        setFeedback({
          categoryId: config.id,
          success: true,
          msg: 'Saved successfully!'
        });
        // Clear local dirty state for this category
        setRulesState(prev => {
          const next = { ...prev };
          delete next[config.id];
          return next;
        });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({
          categoryId: config.id,
          success: false,
          msg: res.error || 'Failed to update rules.'
        });
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sliders className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
              Participation Quotas
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Candidate Participation Rules
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Set individual program minimum and maximum quotas per candidate across Stage, Non-Stage, and Sports.
          </p>
        </div>
      </div>

      {/* 3-Column Vertical Categories Grid (Bidaya, Uoola, Thaniyya, etc. side-by-side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryConfigs.map(cat => {
          const draft = getConfigValue(cat);
          const isDirty = !!rulesState[cat.id];
          const itemFeedback = feedback?.categoryId === cat.id ? feedback : null;

          const stageMax = draft.maxStagePrograms !== undefined && draft.maxStagePrograms !== null ? draft.maxStagePrograms : 2;
          const nonStageMax = draft.maxNonStagePrograms !== undefined && draft.maxNonStagePrograms !== null ? draft.maxNonStagePrograms : 3;
          const sportsMax = draft.maxSportsPrograms !== undefined && draft.maxSportsPrograms !== null ? draft.maxSportsPrograms : 2;
          const totalMax = stageMax + nonStageMax + sportsMax;

          return (
            <div
              key={cat.id}
              className={`flex flex-col justify-between p-4 rounded-2xl bg-white border transition-all duration-200 ${
                isDirty
                  ? 'border-indigo-400 ring-2 ring-indigo-500/10 shadow-sm'
                  : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
              }`}
            >
              {/* Category Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={cat.category} />
                      <h3 className="text-base font-bold text-slate-900">{cat.displayName}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Classes:{' '}
                      <span className="text-slate-700 font-semibold">
                        {cat.assignedClasses.length > 0 ? cat.assignedClasses.map(c => `Class ${c}`).join(', ') : 'None'}
                      </span>{' '}
                      • Chest: <span className="font-mono text-slate-700 font-semibold">#{cat.chestNoStart}–#{cat.chestNoEnd}</span>
                    </p>
                  </div>

                  <span className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-[10px] font-bold shrink-0">
                    Max: {totalMax}
                  </span>
                </div>

                {/* 3 Vertical Sections Inside Card (Stage, Non-Stage, Sports) */}
                <div className="space-y-2.5 pt-3">
                  {/* 1. STAGE */}
                  <div className="p-2.5 rounded-xl bg-purple-50/40 border border-purple-100/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        <span className="text-xs font-bold text-purple-950">Stage Programs</span>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded-md">
                        Arts
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-purple-900/70 block mb-0.5">
                          Min Stage
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={draft.minStagePrograms ?? 0}
                          onChange={e => handleRuleChange(cat.id, 'minStagePrograms', parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-purple-200 text-xs font-mono font-bold text-purple-950 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-400 shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-purple-900/70 block mb-0.5">
                          Max Stage *
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={draft.maxStagePrograms !== undefined && draft.maxStagePrograms !== null ? draft.maxStagePrograms : 2}
                          onChange={e => handleRuleChange(cat.id, 'maxStagePrograms', parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-purple-200 text-xs font-mono font-bold text-purple-950 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-400 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. NON-STAGE */}
                  <div className="p-2.5 rounded-xl bg-blue-50/40 border border-blue-100/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span className="text-xs font-bold text-blue-950">Non-Stage Programs</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded-md">
                        Arts
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-blue-900/70 block mb-0.5">
                          Min Non-Stage
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={draft.minNonStagePrograms ?? 0}
                          onChange={e => handleRuleChange(cat.id, 'minNonStagePrograms', parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-blue-200 text-xs font-mono font-bold text-blue-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-blue-900/70 block mb-0.5">
                          Max Non-Stage *
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={draft.maxNonStagePrograms !== undefined && draft.maxNonStagePrograms !== null ? draft.maxNonStagePrograms : 3}
                          onChange={e => handleRuleChange(cat.id, 'maxNonStagePrograms', parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-blue-200 text-xs font-mono font-bold text-blue-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. SPORTS */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span className="text-xs font-bold text-emerald-950">Sports Programs</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">
                        Sports
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-emerald-900/70 block mb-0.5">
                          Min Sports
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={draft.minSportsPrograms ?? 0}
                          onChange={e => handleRuleChange(cat.id, 'minSportsPrograms', parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-emerald-900/70 block mb-0.5">
                          Max Sports *
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={draft.maxSportsPrograms !== undefined && draft.maxSportsPrograms !== null ? draft.maxSportsPrograms : 2}
                          onChange={e => handleRuleChange(cat.id, 'maxSportsPrograms', parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  {itemFeedback && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 animate-in fade-in ${
                        itemFeedback.success
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {itemFeedback.success ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-rose-600" />}
                      {itemFeedback.msg}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  {isDirty && (
                    <button
                      type="button"
                      onClick={() => {
                        setRulesState(prev => {
                          const next = { ...prev };
                          delete next[cat.id];
                          return next;
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={savingId === cat.id}
                    onClick={() => handleSaveCategoryRule(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                      isDirty
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Save className={`w-3.5 h-3.5 ${savingId === cat.id ? 'animate-spin' : ''}`} />
                    {savingId === cat.id ? 'Saving...' : 'Save Rules'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
