import React, { useState, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryConfig, FestCategory } from '../../types';
import { CategoryBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Layers,
  Plus,
  Trash2,
  AlertCircle,
  Sliders,
  ShieldCheck,
  BookOpen,
  Info,
  Check,
  X,
  Sparkles
} from 'lucide-react';

const STANDARD_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const CategoryClassMapping: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    categoryConfigs,
    classMappings,
    students,
    programs,
    addClassMapping,
    deleteClassMapping,
    addCategoryConfig,
    updateCategoryConfig,
    deleteCategoryConfig
  } = useFestData();

  // Quick Map Form State
  const [newClassNumber, setNewClassNumber] = useState('');
  const [newCategory, setNewCategory] = useState<FestCategory>(categoryConfigs[0]?.category || 'SUB_JUNIOR');
  const [newDescription, setNewDescription] = useState('');
  const [mappingError, setMappingError] = useState<string | null>(null);

  // Edit Category Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CategoryConfig | null>(null);
  const [editingSelectedClasses, setEditingSelectedClasses] = useState<string[]>([]);
  const [editCustomClassInput, setEditCustomClassInput] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);

  // Delete Category Confirmation Modal State
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryConfig | null>(null);

  // Create Category Modal State
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [createCategoryForm, setCreateCategoryForm] = useState({
    code: '',
    displayName: '',
    sectionScope: 'ALL' as 'ALL' | 'ARTS' | 'SPORTS',
    chestNoStart: 101,
    chestNoEnd: 199,
    maxIndividualProgramsPerStudent: 5
  });
  const [createSelectedClasses, setCreateSelectedClasses] = useState<string[]>([]);
  const [createCustomClassInput, setCreateCustomClassInput] = useState('');
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null);

  // Combined available classes (standard 1-12 + all existing mapped classes)
  const allKnownClasses = useMemo(() => {
    const set = new Set<string>(STANDARD_CLASSES);
    classMappings.forEach(m => set.add(m.classNumber));
    categoryConfigs.forEach(c => c.assignedClasses.forEach(cls => set.add(cls)));
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [classMappings, categoryConfigs]);

  // Quick single class mapping handler
  const handleAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    setMappingError(null);

    const result = addClassMapping(
      newClassNumber,
      newCategory,
      newDescription || undefined,
      currentUser.name,
      currentUser.role
    );

    if (result.success) {
      setNewClassNumber('');
      setNewDescription('');
    } else {
      setMappingError(result.error || 'Failed to add class mapping.');
    }
  };

  // Open Edit Category Modal
  const handleOpenConfigModal = (config: CategoryConfig) => {
    setEditingConfig({ ...config });
    setEditingSelectedClasses([...config.assignedClasses]);
    setEditCustomClassInput('');
    setConfigError(null);
    setIsConfigModalOpen(true);
  };

  // Toggle class selection for Edit Category
  const toggleEditClass = (cls: string) => {
    const clean = cls.trim();
    if (editingSelectedClasses.includes(clean)) {
      setEditingSelectedClasses(prev => prev.filter(c => c !== clean));
    } else {
      setEditingSelectedClasses(prev => [...prev, clean]);
    }
  };

  // Add custom class in Edit Modal
  const handleAddEditCustomClass = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editCustomClassInput.trim();
    if (!clean) return;
    if (!editingSelectedClasses.includes(clean)) {
      setEditingSelectedClasses(prev => [...prev, clean]);
    }
    setEditCustomClassInput('');
  };

  // Save Configured Category
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;
    setConfigError(null);

    const res = updateCategoryConfig(
      editingConfig,
      editingSelectedClasses,
      currentUser.name,
      currentUser.role
    );

    if (res.success) {
      setIsConfigModalOpen(false);
    } else {
      setConfigError(res.error || 'Failed to update category.');
    }
  };

  // Trigger Delete Confirmation Prompt
  const handlePromptDelete = (cat: CategoryConfig) => {
    setCategoryToDelete(cat);
  };

  // Confirm Delete Category
  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategoryConfig(categoryToDelete.id, currentUser.name, currentUser.role);
      setCategoryToDelete(null);
      setIsConfigModalOpen(false);
    }
  };

  // Open Create Category Modal
  const handleOpenCreateCategoryModal = () => {
    // Generate intelligent default chest range
    const maxChestEnd = categoryConfigs.reduce((max, c) => Math.max(max, c.chestNoEnd || 0), 0);
    const startRange = maxChestEnd > 0 ? maxChestEnd + 1 : 101;
    const endRange = startRange + 99;

    setCreateCategoryForm({
      code: '',
      displayName: '',
      sectionScope: 'ALL',
      chestNoStart: startRange,
      chestNoEnd: endRange,
      maxIndividualProgramsPerStudent: 5
    });
    setCreateSelectedClasses([]);
    setCreateCustomClassInput('');
    setCreateCategoryError(null);
    setIsCreateCategoryModalOpen(true);
  };

  // Toggle class selection for Create Category
  const toggleCreateClass = (cls: string) => {
    const clean = cls.trim();
    if (createSelectedClasses.includes(clean)) {
      setCreateSelectedClasses(prev => prev.filter(c => c !== clean));
    } else {
      setCreateSelectedClasses(prev => [...prev, clean]);
    }
  };

  // Add custom class in Create Modal
  const handleAddCreateCustomClass = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = createCustomClassInput.trim();
    if (!clean) return;
    if (!createSelectedClasses.includes(clean)) {
      setCreateSelectedClasses(prev => [...prev, clean]);
    }
    setCreateCustomClassInput('');
  };

  // Submit Create Category
  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCategoryError(null);

    const cleanCode = (createCategoryForm.code || createCategoryForm.displayName)
      .trim()
      .toUpperCase()
      .replace(/[\s-]/g, '_');

    if (!cleanCode) {
      setCreateCategoryError('Please enter a Category Code or Display Name.');
      return;
    }

    const res = addCategoryConfig(
      {
        category: cleanCode,
        displayName: createCategoryForm.displayName.trim() || cleanCode,
        sectionScope: createCategoryForm.sectionScope,
        assignedClasses: createSelectedClasses,
        maxIndividualProgramsPerStudent: Number(createCategoryForm.maxIndividualProgramsPerStudent) || 5,
        chestNoStart: Number(createCategoryForm.chestNoStart),
        chestNoEnd: Number(createCategoryForm.chestNoEnd),
        status: 'ACTIVE'
      },
      createSelectedClasses,
      currentUser.name,
      currentUser.role
    );

    if (res.success) {
      setIsCreateCategoryModalOpen(false);
    } else {
      setCreateCategoryError(res.error || 'Failed to create category.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" />
            Category & Class Mapping Engine
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Create custom categories, select classes for categories, and configure chest number ranges & event limits.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateCategoryModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Category
        </button>
      </div>

      {/* Category Configuration Cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            Active Categories & Rules ({categoryConfigs.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Click Configure to edit rules & select classes</span>
        </div>

        {categoryConfigs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-600 font-bold text-sm">No categories configured yet.</p>
            <p className="text-slate-400 text-xs mt-1 mb-4">Create your first category to map classes and enroll students.</p>
            <button
              onClick={handleOpenCreateCategoryModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryConfigs.map(cat => (
              <div
                key={cat.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <CategoryBadge category={cat.category} />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenConfigModal(cat)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-bold px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => handlePromptDelete(cat)}
                        title={`Delete Category "${cat.displayName}"`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{cat.displayName}</h4>
                  <div className="mt-3.5 space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Chest Range:</span>
                      <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                        #{cat.chestNoStart} - #{cat.chestNoEnd}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Max Events:</span>
                      <span className="font-mono text-slate-900 font-bold">{cat.maxIndividualProgramsPerStudent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Classes:</span>
                      <span className="text-indigo-700 font-bold truncate max-w-[130px] text-xs" title={cat.assignedClasses.map(c => `Cls ${c}`).join(', ')}>
                        {cat.assignedClasses.length > 0 ? cat.assignedClasses.map(c => `Cls ${c}`).join(', ') : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium">Scope: {cat.sectionScope}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                    ● {cat.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Class to Category Mappings Table & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapping Creator Form (1 col) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs h-fit">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Plus className="w-5 h-5 text-emerald-600" />
            Quick Class Mapper
          </h3>
          <p className="text-sm text-slate-500 mb-4 font-normal">
            Directly associate a specific class to any category.
          </p>

          <form onSubmit={handleAddMapping} className="space-y-4">
            {mappingError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{mappingError}</span>
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-slate-700">Class Identifier *</label>
              <input
                type="text"
                required
                placeholder="e.g. 1, 5, 10, UKG"
                value={newClassNumber}
                onChange={e => setNewClassNumber(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Target Category *</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as FestCategory)}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-bold transition-colors"
              >
                {categoryConfigs.map(c => (
                  <option key={c.id} value={c.category}>
                    {c.displayName} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Primary Standard 1"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all mt-2 cursor-pointer"
            >
              Confirm Class Mapping
            </button>
          </form>

          <div className="mt-5 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              When students are enrolled with this class, the category is auto-assigned and locked to eliminate mapping ambiguity.
            </span>
          </div>
        </div>

        {/* Mappings Table (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Active Class Mappings ({classMappings.length})
              </h3>
              <p className="text-sm text-slate-500">Enforced 1:1 relational mappings</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4" /> Zero Conflict Guaranteed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-5">Class</th>
                  <th className="py-4 px-5">Assigned Category</th>
                  <th className="py-4 px-5">Description</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {classMappings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 text-sm font-medium">
                      No classes mapped yet. Add mappings using the form on the left or by configuring categories above.
                    </td>
                  </tr>
                ) : (
                  classMappings.map(map => (
                    <tr key={map.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <span className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 font-mono font-bold text-indigo-700 text-sm">
                          Class {map.classNumber}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <CategoryBadge category={map.category} />
                      </td>
                      <td className="py-4 px-5 text-slate-600 font-medium text-sm">
                        {map.description || '-'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => deleteClassMapping(map.id, currentUser.name, currentUser.role)}
                          title="Remove Mapping"
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
      </div>

      {/* MODAL: Configure Category Rules & Select Classes */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Category Rules & Limits"
        subtitle={`Editing configuration for ${editingConfig?.displayName}`}
        maxWidth="2xl"
      >
        {editingConfig && (
          <form onSubmit={handleSaveConfig} className="space-y-5">
            {configError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Category Identifier / Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIDAYA, ULA, KIDS, SENIOR"
                  value={editingConfig.category}
                  onChange={e => setEditingConfig({ ...editingConfig, category: e.target.value.toUpperCase() })}
                  className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">Unique key for the category</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Display Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bidaya (Classes 1 - 2)"
                  value={editingConfig.displayName}
                  onChange={e => setEditingConfig({ ...editingConfig, displayName: e.target.value })}
                  className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">Human-friendly title</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Scope Section</label>
                <select
                  value={editingConfig.sectionScope || 'ALL'}
                  onChange={e => setEditingConfig({ ...editingConfig, sectionScope: e.target.value as any })}
                  className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="ALL">All (Arts & Sports)</option>
                  <option value="ARTS">Arts Only</option>
                  <option value="SPORTS">Sports Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Chest Start Range *</label>
                <input
                  type="number"
                  required
                  value={editingConfig.chestNoStart}
                  onChange={e => setEditingConfig({ ...editingConfig, chestNoStart: parseInt(e.target.value, 10) || 0 })}
                  className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Chest End Range *</label>
                <input
                  type="number"
                  required
                  value={editingConfig.chestNoEnd}
                  onChange={e => setEditingConfig({ ...editingConfig, chestNoEnd: parseInt(e.target.value, 10) || 0 })}
                  className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Max Individual Programs Per Student *</label>
              <input
                type="number"
                required
                min={1}
                max={20}
                value={editingConfig.maxIndividualProgramsPerStudent}
                onChange={e => setEditingConfig({ ...editingConfig, maxIndividualProgramsPerStudent: parseInt(e.target.value, 10) || 1 })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* Select Classes for Category Section */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                    Select Classes for this Category
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click to assign classes to this category ({editingSelectedClasses.length} selected).
                  </p>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {editingSelectedClasses.length} Selected
                </span>
              </div>

              {/* Class Chips Toggle Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {allKnownClasses.map(cls => {
                  const isSelected = editingSelectedClasses.includes(cls);
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleEditClass(cls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/30'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                      Class {cls}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Class input */}
              <div className="pt-2 border-t border-indigo-100/80 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom class (e.g. UKG, LKG, 13)..."
                  value={editCustomClassInput}
                  onChange={e => setEditCustomClassInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddEditCustomClass}
                  className="px-3 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  + Add & Select
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handlePromptDelete(editingConfig)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Category
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: Create New Category */}
      <Modal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        title="Create New Category"
        subtitle="Define a new student category, set chest ranges, and assign classes"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCategorySubmit} className="space-y-5">
          {createCategoryError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createCategoryError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Category Identifier / Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. BIDAYA, ULA, KIDS, SENIOR"
                value={createCategoryForm.code}
                onChange={e => setCreateCategoryForm({ ...createCategoryForm, code: e.target.value.toUpperCase() })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Unique key for the category</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Display Label *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bidaya (Classes 1 - 2)"
                value={createCategoryForm.displayName}
                onChange={e => setCreateCategoryForm({ ...createCategoryForm, displayName: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Human-friendly title</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Scope Section</label>
              <select
                value={createCategoryForm.sectionScope}
                onChange={e => setCreateCategoryForm({ ...createCategoryForm, sectionScope: e.target.value as any })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="ALL">All (Arts & Sports)</option>
                <option value="ARTS">Arts Only</option>
                <option value="SPORTS">Sports Only</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Chest Start Range *</label>
              <input
                type="number"
                required
                value={createCategoryForm.chestNoStart}
                onChange={e => setCreateCategoryForm({ ...createCategoryForm, chestNoStart: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Chest End Range *</label>
              <input
                type="number"
                required
                value={createCategoryForm.chestNoEnd}
                onChange={e => setCreateCategoryForm({ ...createCategoryForm, chestNoEnd: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Max Individual Programs Per Student *</label>
            <input
              type="number"
              required
              min={1}
              max={20}
              value={createCategoryForm.maxIndividualProgramsPerStudent}
              onChange={e => setCreateCategoryForm({ ...createCategoryForm, maxIndividualProgramsPerStudent: parseInt(e.target.value, 10) || 1 })}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Select Classes for New Category */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                  Select Classes for this Category
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click to assign classes to this new category ({createSelectedClasses.length} selected).
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                {createSelectedClasses.length} Selected
              </span>
            </div>

            {/* Class Chips Toggle Grid */}
            <div className="flex flex-wrap gap-2 pt-1">
              {allKnownClasses.map(cls => {
                const isSelected = createSelectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => toggleCreateClass(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/30'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                    Class {cls}
                  </button>
                );
              })}
            </div>

            {/* Add Custom Class */}
            <div className="pt-2 border-t border-indigo-100/80 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add custom class (e.g. UKG, LKG, 13)..."
                value={createCustomClassInput}
                onChange={e => setCreateCustomClassInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCreateCustomClass}
                className="px-3 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold transition-colors cursor-pointer"
              >
                + Add & Select
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateCategoryModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Create Category
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Delete Category Confirmation */}
      <Modal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        title="Delete Category"
        subtitle={`Confirm permanent removal of "${categoryToDelete?.displayName || ''}"`}
        maxWidth="md"
      >
        {categoryToDelete && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Warning: Irreversible Action</span>
              </div>
              <p className="text-rose-700 leading-relaxed">
                Deleting category <strong>{categoryToDelete.displayName} ({categoryToDelete.category})</strong> will permanently remove its configuration and unmap all its assigned classes.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-800">Impact Details:</div>
              <ul className="space-y-1.5 text-slate-600 pl-4 list-disc font-medium">
                <li>
                  <strong>{categoryToDelete.assignedClasses.length}</strong> assigned classes will be unmapped.
                </li>
                {students.filter(s => s.category === categoryToDelete.category).length > 0 && (
                  <li className="text-amber-700 font-bold">
                    <strong>{students.filter(s => s.category === categoryToDelete.category).length}</strong> student(s) currently belong to this category.
                  </li>
                )}
                {programs.filter(p => p.category === categoryToDelete.category).length > 0 && (
                  <li className="text-amber-700 font-bold">
                    <strong>{programs.filter(p => p.category === categoryToDelete.category).length}</strong> program(s) are configured for this category.
                  </li>
                )}
              </ul>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete Category
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
