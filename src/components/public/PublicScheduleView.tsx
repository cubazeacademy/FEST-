import React, { useState, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const PublicScheduleView: React.FC = () => {
  const { programs, results, settings, categoryConfigs } = useFestData();

  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'ARTS' | 'SPORTS'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const isArtsEnabled = settings.enableArtsSection ?? true;
  const isSportsEnabled = settings.enableSportsSection ?? true;

  // Derived categories strictly from admin active category configs
  const categories = useMemo(() => {
    if (categoryConfigs && categoryConfigs.length > 0) {
      const active = categoryConfigs.filter(c => c.status === 'ACTIVE' || !c.status);
      if (active.length > 0) {
        return active.map(c => c.displayName || c.category);
      }
    }
    return Array.from(new Set(programs.map(p => p.category))).filter(Boolean);
  }, [categoryConfigs, programs]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      if (!isArtsEnabled && p.section === 'ARTS') return false;
      if (!isSportsEnabled && p.section === 'SPORTS') return false;

      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.stageLocation && p.stageLocation.toLowerCase().includes(q));

      const matchSection = sectionFilter === 'ALL' || p.section === sectionFilter;
      const matchCategory =
        categoryFilter === 'ALL' ||
        p.category?.toLowerCase() === categoryFilter.toLowerCase();

      return matchQ && matchSection && matchCategory;
    });
  }, [programs, searchQuery, sectionFilter, categoryFilter, isArtsEnabled, isSportsEnabled]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl bg-linear-to-r from-red-600 via-rose-600 to-amber-600 text-white p-6 sm:p-8 shadow-xl shadow-red-600/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
            <Calendar className="w-3.5 h-3.5" />
            Official Fest Timetable
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Event & Competition Schedules
          </h1>
          <p className="text-sm text-rose-100 mt-2 font-medium">
            Explore stage venues, reporting times, and track live competition statuses across all Arts and Sports events.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events by name, code, or stage/venue..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {isArtsEnabled && isSportsEnabled && (
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-bold focus:outline-none focus:border-red-500"
            >
              <option value="ALL">All Sections</option>
              <option value="ARTS">Arts Stage</option>
              <option value="SPORTS">Sports Ground</option>
            </select>
          )}

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-bold focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <span className="text-xs font-mono font-bold px-3 py-2.5 rounded-2xl bg-slate-100 text-slate-700 shrink-0">
            {filteredPrograms.length} Events
          </span>
        </div>
      </div>

      {/* Program Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.map(prog => {
          const isResultPublished = results.some(r => r.programId === prog.id && r.status === 'PUBLISHED');

          return (
            <div
              key={prog.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-red-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-red-50 group-hover:text-red-700 transition-colors">
                    {prog.code}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isResultPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isResultPublished ? 'Completed & Published' : 'Scheduled / In Progress'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                  {prog.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Category: <strong className="text-slate-700">{prog.category}</strong> • {prog.programType} Event
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">Venue: <strong className="text-slate-800">{prog.stageLocation || 'Main Auditorium Stage'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Duration / Slot: <strong className="text-slate-800">10-15 Mins</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Max Per Team: <strong className="text-slate-800">{prog.maxParticipants || 2} candidates</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
