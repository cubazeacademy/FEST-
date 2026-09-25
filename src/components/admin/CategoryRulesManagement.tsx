import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryConfig, FestCategory } from '../../types';
import { CategoryBadge } from '../common/Badge';
import { useRegisterUnsavedChanges } from '../../context/UnsavedChangesContext';
import {
  Sliders,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export const CategoryRulesManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { categoryConfigs, updateCategoryConfig } = useFestData();

  // Local draft state for editing rules per category
  const [rulesState, setRulesState] = useState<{ [id: string]: Partial<CategoryConfig> }>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ categoryId: string; success: boolean; msg: string } | null>(null);
  const [batchFeedback, setBatchFeedback] = useState<{ success: boolean; msg: string } | null>(null);

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
          msg: `Rules for "${config.displayName}" saved to Supabase!`
        });
        // Clear local dirty state for this category
        setRulesState(prev => {
          const next = { ...prev };
          delete next[config.id];
          return next;
        });
        setTimeout(() => setFeedback(null), 3500);
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

  // Preset Applicator: Apply standard rules to all categories (e.g. Stage: 0-2, Non-Stage: 0-3, Sports: 0-2)
  const handleApplyPresetToAll = (
    minStage: number,
    maxStage: number,
    minNonStage: number,
    maxNonStage: number,
    minSports: number,
    maxSports: number,
    presetName: string
  ) => {
    if (!confirm(`Apply "${presetName}" rules preset to all ${categoryConfigs.length} categories?`)) return;

    setBatchFeedback(null);
    let successCount = 0;

    categoryConfigs.forEach(cat => {
      const updated: CategoryConfig = {
        ...cat,
        minStagePrograms: minStage,
        maxStagePrograms: maxStage,
        minNonStagePrograms: minNonStage,
        maxNonStagePrograms: maxNonStage,
        minSportsPrograms: minSports,
        maxSportsPrograms: maxSports,
        maxIndividualProgramsPerStudent: maxStage + maxNonStage + maxSports
      };
      const res = updateCategoryConfig(updated, undefined, currentUser.name, currentUser.role);
      if (res.success) successCount++;
    });

    setRulesState({});
    setBatchFeedback({
      success: true,
      msg: `Applied "${presetName}" preset to ${successCount} categories successfully!`
    });
    setTimeout(() => setBatchFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sliders className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Festival Policy & Quotas
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Candidate Participation Rules
          </h2>
          <p className="text-sm text-slate-500 font-normal mt-0.5">
            Set individual program minimum and maximum participation quotas per candidate for <span className="font-semibold text-purple-700">Stage</span>, <span className="font-semibold text-blue-700">Non-Stage</span>, and <span className="font-semibold text-emerald-700">Sports</span> sections.
          </p>
        </div>

        {/* Global Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleApplyPresetToAll(0, 2, 0, 3, 0, 2, 'Standard (Stage:2, Non-Stg:3, Sports:2)')}
            className="px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Apply Standard Preset
          </button>
          <button
            type="button"
            onClick={() => handleApplyPresetToAll(0, 3, 0, 4, 0, 3, 'Liberal (Stage:3, Non-Stg:4, Sports:3)')}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            Liberal Preset
          </button>
        </div>
      </div>

      {/* Batch Feedback */}
      {batchFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{batchFeedback.msg}</span>
        </div>
      )}

      {/* Categories Rules List */}
      <div className="space-y-4">
        {categoryConfigs.map(cat => {
          const draft = getConfigValue(cat);
          const isDirty = !!rulesState[cat.id];
          const itemFeedback = feedback?.categoryId === cat.id ? feedback : null;

          return (
            <div
              key={cat.id}
              className={`p-6 rounded-3xl bg-white border transition-all ${
                isDirty ? 'border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm' : 'border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <CategoryBadge category={cat.category} />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{cat.displayName}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Assigned Classes:{' '}
                      <span className="text-indigo-700 font-bold">
                        {cat.assignedClasses.length > 0 ? cat.assignedClasses.map(c => `Class ${c}`).join(', ') : 'None'}
                      </span>{' '}
                      • Chest Range: <span className="font-mono font-bold">#{cat.chestNoStart} - #{cat.chestNoEnd}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {itemFeedback && (
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 animate-in fade-in ${
                        itemFeedback.success
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {itemFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                      {itemFeedback.msg}
                    </span>
                  )}

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
                      className="px-3 py-2 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={savingId === cat.id}
                    onClick={() => handleSaveCategoryRule(cat)}
                    className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Save className={`w-4 h-4 ${savingId === cat.id ? 'animate-spin' : ''}`} />
                    {savingId === cat.id ? 'Saving...' : `Save ${cat.displayName} Rules`}
                  </button>
                </div>
              </div>

              {/* 3 Section Rules Cards (Stage, Non-Stage, Sports) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
                {/* 1. STAGE PROGRAMS */}
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-4 ring-purple-100"></span>
                      <h4 className="text-sm font-bold text-purple-950">Stage Programs</h4>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                      Arts - Stage
                    </span>
                  </div>

                  <p className="text-[11px] text-purple-800/80">
                    Individual stage performances (e.g. Speech, Monoact, Song, Recitation).
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-purple-900 block mb-1">
                        Min Stage
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={draft.minStagePrograms ?? 0}
                        onChange={e => handleRuleChange(cat.id, 'minStagePrograms', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-sm font-mono font-bold text-purple-950 focus:outline-none focus:border-purple-500 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-purple-900 block mb-1">
                        Max Stage *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={draft.maxStagePrograms !== undefined && draft.maxStagePrograms !== null ? draft.maxStagePrograms : 2}
                        onChange={e => handleRuleChange(cat.id, 'maxStagePrograms', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-sm font-mono font-bold text-purple-950 focus:outline-none focus:border-purple-500 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. NON-STAGE PROGRAMS */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
                      <h4 className="text-sm font-bold text-blue-950">Non-Stage Programs</h4>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
                      Arts - Non Stage
                    </span>
                  </div>

                  <p className="text-[11px] text-blue-800/80">
                    Off-stage creative items (e.g. Essay Writing, Drawing, Pencil Art, Quiz).
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-blue-900 block mb-1">
                        Min Non-Stage
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={draft.minNonStagePrograms ?? 0}
                        onChange={e => handleRuleChange(cat.id, 'minNonStagePrograms', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-sm font-mono font-bold text-blue-950 focus:outline-none focus:border-blue-500 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-blue-900 block mb-1">
                        Max Non-Stage *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={draft.maxNonStagePrograms !== undefined && draft.maxNonStagePrograms !== null ? draft.maxNonStagePrograms : 3}
                        onChange={e => handleRuleChange(cat.id, 'maxNonStagePrograms', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-sm font-mono font-bold text-blue-950 focus:outline-none focus:border-blue-500 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SPORTS PROGRAMS */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></span>
                      <h4 className="text-sm font-bold text-emerald-950">Sports Programs</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      Sports / Athletics
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800/80">
                    Athletics & sports competitions (e.g. 100m, 200m, Long Jump, Badminton).
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-emerald-900 block mb-1">
                        Min Sports
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={draft.minSportsPrograms ?? 0}
                        onChange={e => handleRuleChange(cat.id, 'minSportsPrograms', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-200 text-sm font-mono font-bold text-emerald-950 focus:outline-none focus:border-purple-500 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-900 block mb-1">
                        Max Sports *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={draft.maxSportsPrograms !== undefined && draft.maxSportsPrograms !== null ? draft.maxSportsPrograms : 2}
                        onChange={e => handleRuleChange(cat.id, 'maxSportsPrograms', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-200 text-sm font-mono font-bold text-emerald-950 focus:outline-none focus:border-purple-500 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
