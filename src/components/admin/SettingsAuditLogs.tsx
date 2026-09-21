import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Clock,
  CheckCircle2,
  Search,
  Sliders,
  Award,
  Flame,
  AlertCircle
} from 'lucide-react';

export const SettingsAuditLogs: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    settings,
    updateSettings,
    auditLogs,
    resetToDefaultData,
    exportDatabaseJSON,
    importDatabaseJSON
  } = useFestData();

  const [settingsForm, setSettingsForm] = useState({
    festName: settings.festName,
    festTagline: settings.festTagline,
    festYear: settings.festYear,
    institutionName: settings.institutionName,
    registrationOpen: settings.registrationOpen,
    registrationOpensAt: settings.registrationOpensAt,
    registrationClosesAt: settings.registrationClosesAt,
    allowCombinedLeaderboard: settings.allowCombinedLeaderboard,
    showPublicLiveScores: settings.showPublicLiveScores,
    enableArtsSection: settings.enableArtsSection !== false,
    enableSportsSection: settings.enableSportsSection !== false
  });

  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm, currentUser.name, currentUser.role);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fest_state_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    const result = importDatabaseJSON(importJsonText);
    if (result.success) {
      setImportStatus({ success: true, msg: 'Database state successfully restored!' });
      setImportJsonText('');
    } else {
      setImportStatus({ success: false, msg: result.error || 'Failed to parse JSON backup.' });
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data back to the default demonstration seed dataset? Any custom entries will be replaced.')) {
      resetToDefaultData();
    }
  };

  const filteredLogs = auditLogs.filter(l => {
    const q = logSearchQuery.toLowerCase().trim();
    return (
      !q ||
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.performedBy.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-600" />
          Fest Settings, Backup & Audit Logs
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Global fest configuration, registration window controls, JSON state migration, and tamper-evident audit logs.
        </p>
      </div>

      {/* Global Configuration Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-600" />
          Global Event Parameters
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Fest Name *</label>
              <input
                type="text"
                required
                value={settingsForm.festName}
                onChange={e => setSettingsForm({ ...settingsForm, festName: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Fest Edition Year *</label>
              <input
                type="text"
                required
                value={settingsForm.festYear}
                onChange={e => setSettingsForm({ ...settingsForm, festYear: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono shadow-xs focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Institution / Academy Name *</label>
              <input
                type="text"
                required
                value={settingsForm.institutionName}
                onChange={e => setSettingsForm({ ...settingsForm, institutionName: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Tagline / Motto</label>
              <input
                type="text"
                value={settingsForm.festTagline}
                onChange={e => setSettingsForm({ ...settingsForm, festTagline: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Registration Window & Toggle */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Student Registration Window Status</p>
                <p className="text-xs text-slate-500 font-medium">Controls whether Team Leaders can submit new registrations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.registrationOpen}
                  onChange={e => setSettingsForm({ ...settingsForm, registrationOpen: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Opening Date & Time</label>
                <input
                  type="datetime-local"
                  value={settingsForm.registrationOpensAt}
                  onChange={e => setSettingsForm({ ...settingsForm, registrationOpensAt: e.target.value })}
                  className="mt-1.5 w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Closing Date & Time</label>
                <input
                  type="datetime-local"
                  value={settingsForm.registrationClosesAt}
                  onChange={e => setSettingsForm({ ...settingsForm, registrationClosesAt: e.target.value })}
                  className="mt-1.5 w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Festival Competition Sections ON/OFF Toggles */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Festival Sections & Active Modules</p>
              <p className="text-xs text-slate-500 font-medium">Enable or disable Arts and Sports sections independently. When a section is OFF, all related results, leaderboards, and programs are hidden from public view.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
              {/* Arts Section Toggle */}
              <div className="p-4 rounded-2xl bg-white border border-fuchsia-200 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0 border border-fuchsia-100">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Arts Section</span>
                    <span className="text-[11px] text-slate-500 font-medium">Cultural, Stage & Non-Stage Events</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.enableArtsSection}
                    onChange={e => setSettingsForm({ ...settingsForm, enableArtsSection: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-600" />
                </label>
              </div>

              {/* Sports Section Toggle */}
              <div className="p-4 rounded-2xl bg-white border border-sky-200 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Sports Section</span>
                    <span className="text-[11px] text-slate-500 font-medium">Athletics, Track & Field, Games</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.enableSportsSection}
                    onChange={e => setSettingsForm({ ...settingsForm, enableSportsSection: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              Save Global Settings
            </button>
          </div>
        </form>
      </div>

      {/* Public Homepage Banner Slider Manager */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-red-600" />
              Public Homepage Auto-Sliding Banners & Posters
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Upload custom event posters, arts fest banners, and promotional slides displayed on the public landing page.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
            {(settings.bannerSlides || []).length} Active Slides
          </span>
        </div>

        {/* Upload Form */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Upload Poster File (from Device)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    const newSlide = {
                      id: 'slide_' + Date.now(),
                      imageUrl: reader.result,
                      title: 'Fest Banner',
                      subtitle: 'Darul Huda Arts & Sports Fest',
                      isActive: true
                    };
                    const updated = [...(settings.bannerSlides || []), newSlide];
                    updateSettings({ ...settings, bannerSlides: updated }, currentUser.name, currentUser.role);
                  }
                };
                reader.readAsDataURL(file);
              }}
              className="w-full text-xs text-slate-600 file:mr-2 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Or Paste Direct Image Web URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://example.com/fest-banner-poster.jpg"
                id="banner_url_input"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('banner_url_input') as HTMLInputElement;
                  if (!input || !input.value) return;
                  const newSlide = {
                    id: 'slide_' + Date.now(),
                    imageUrl: input.value.trim(),
                    title: 'Fest Banner',
                    subtitle: 'Arts & Sports Event',
                    isActive: true
                  };
                  const updated = [...(settings.bannerSlides || []), newSlide];
                  updateSettings({ ...settings, bannerSlides: updated }, currentUser.name, currentUser.role);
                  input.value = '';
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Add Banner URL
              </button>
            </div>
          </div>
        </div>

        {/* Current Active Banners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(settings.bannerSlides || []).map((slide, idx) => (
            <div
              key={slide.id}
              className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-16/9 shadow-xs"
            >
              <img
                src={slide.imageUrl}
                alt={slide.title || 'Banner'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">
                  Slide #{idx + 1}
                </span>
                <p className="text-xs font-bold text-white line-clamp-1">{slide.title || 'Untitled Banner'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = (settings.bannerSlides || []).filter(s => s.id !== slide.id);
                  updateSettings({ ...settings, bannerSlides: updated }, currentUser.name, currentUser.role);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                title="Remove Banner"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Database Backup & Restore & Reset Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup & Reset */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              JSON Database Export & Migration
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Download a full snapshot of your fest database including students, class mappings, programs, chest numbers, and results.
            </p>

            <div className="mt-5 space-y-2">
              <button
                onClick={handleDownloadBackup}
                className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Download Complete JSON Snapshot
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-rose-600 mb-1">Danger Zone</h4>
            <p className="text-xs text-slate-500 mb-3 font-medium">Reset data state back to initial factory demo seed data.</p>
            <button
              onClick={handleResetData}
              className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Factory Demo Seed
            </button>
          </div>
        </div>

        {/* Restore from JSON */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Restore Database from JSON
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Paste an exported backup JSON to restore all system configurations and scores.
          </p>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            {importStatus && (
              <div
                className={`p-3.5 rounded-2xl border text-sm flex items-center gap-2 ${
                  importStatus.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{importStatus.msg}</span>
              </div>
            )}

            <textarea
              rows={4}
              placeholder="Paste JSON database snapshot content here..."
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs focus:bg-white"
            />

            <button
              type="submit"
              disabled={!importJsonText.trim()}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-purple-500/20 transition-colors cursor-pointer"
            >
              Validate & Restore Database
            </button>
          </form>
        </div>
      </div>

      {/* Audit Logs Viewer */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Tamper-Evident System Audit Trail ({auditLogs.length} Events)
            </h3>
            <p className="text-sm text-slate-500 font-medium">Chronological history of administrative actions and score updates</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={logSearchQuery}
              onChange={e => setLogSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Action</th>
                <th className="py-3.5 px-5">Entity</th>
                <th className="py-3.5 px-5">Details</th>
                <th className="py-3.5 px-5">Operator</th>
                <th className="py-3.5 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-mono text-indigo-700 font-bold text-sm">{log.action}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                      {log.entity}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-700 font-medium text-sm">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">
                    <p className="font-bold text-slate-900 text-sm">{log.performedBy}</p>
                    <p className="text-xs text-slate-400 font-medium">{log.role}</p>
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-500 font-mono text-xs font-medium">
                    {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
