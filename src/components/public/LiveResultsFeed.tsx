import React, { useState, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { SectionBadge, CategoryBadge, PositionBadge, GradeBadge } from '../common/Badge';
import { PublicHeroSlider } from './PublicHeroSlider';
import { PublicStatCounters } from './PublicStatCounters';
import {
  Radio,
  Search,
  Clock
} from 'lucide-react';

export const LiveResultsFeed: React.FC = () => {
  const { results, settings, categoryConfigs } = useFestData();

  const isArtsEnabled = settings.enableArtsSection ?? true;
  const isSportsEnabled = settings.enableSportsSection ?? true;

  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'ARTS' | 'SPORTS'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const publishedResults = useMemo(() => {
    return results.filter(r => {
      if (r.status !== 'PUBLISHED') return false;
      if (!isArtsEnabled && r.section === 'ARTS') return false;
      if (!isSportsEnabled && r.section === 'SPORTS') return false;
      return true;
    }).sort((a, b) => {
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [results, isArtsEnabled, isSportsEnabled]);

  const filteredResults = useMemo(() => {
    return publishedResults.filter(res => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        res.programName.toLowerCase().includes(q) ||
        res.entries.some(
          e =>
            e.studentName?.toLowerCase().includes(q) ||
            e.groupName?.toLowerCase().includes(q) ||
            (e.chestNumber && e.chestNumber.toString().includes(q))
        );

      const matchSec = sectionFilter === 'ALL' || res.section === sectionFilter;
      const matchCat = categoryFilter === 'ALL' || res.category === categoryFilter;

      return matchQ && matchSec && matchCat;
    });
  }, [publishedResults, searchQuery, sectionFilter, categoryFilter]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Hero Auto-Sliding Banner Carousel */}
      <PublicHeroSlider />

      {/* 2. Fest Stat Counters (Programs, Participants, Teams, Venues) */}
      <PublicStatCounters />

      {/* 3. Live Scoreboard Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-rose-500/10 via-purple-50 to-indigo-50 border border-indigo-100 p-6 sm:p-7 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                LIVE RESULTS BROADCAST
              </span>
              <span className="text-xs text-slate-500 font-bold">Official Jury Feed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {settings.festName} Live Scoreboard
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl font-medium">
              Real-time published standings, podium rankings, and grade certificates for Arts & Sports competitions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-right">
              <span className="text-xs uppercase font-bold text-slate-400 block">Published Results</span>
              <span className="text-2xl font-black font-mono text-emerald-600">{publishedResults.length} Events</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by event title, student name, or chest number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-all focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {isArtsEnabled && isSportsEnabled && (
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value as any)}
              className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="ALL">All Sections (Arts & Sports)</option>
              <option value="ARTS">Arts Events</option>
              <option value="SPORTS">Sports Events</option>
            </select>
          )}

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
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

      {/* Published Result Cards */}
      <div className="space-y-5">
        {filteredResults.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-3">
            <Radio className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No Live Results Found</h3>
            <p className="text-sm text-slate-500 font-medium">
              Check back shortly as event controllers evaluate and publish live competition scores.
            </p>
          </div>
        ) : (
          filteredResults.map(res => {
            // Sort entries: First -> Second -> Third -> Other
            const sortedEntries = [...res.entries].sort((a, b) => {
              const posRank: Record<string, number> = { FIRST: 1, SECOND: 2, THIRD: 3, OTHER: 4, NO_PRIZE: 5 };
              const rankA = posRank[a.position] || 99;
              const rankB = posRank[b.position] || 99;
              if (rankA !== rankB) return rankA - rankB;
              return b.totalPoints - a.totalPoints;
            });

            return (
              <div
                key={res.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md space-y-4 transition-all"
              >
                {/* Event Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <SectionBadge section={res.section} />
                    <CategoryBadge category={res.category} />
                    <span className="text-base sm:text-lg font-black text-slate-900">{res.programName}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-medium">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      {res.publishedAt ? new Date(res.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Live'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      OFFICIAL
                    </span>
                  </div>
                </div>

                {/* Podium & Winners Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedEntries.map(ent => {
                    const isGold = ent.position === 'FIRST';
                    const isSilver = ent.position === 'SECOND';
                    const isBronze = ent.position === 'THIRD';

                    return (
                      <div
                        key={ent.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between ${isGold
                            ? 'bg-amber-50/60 border-amber-200'
                            : isSilver
                              ? 'bg-slate-50 border-slate-200'
                              : isBronze
                                ? 'bg-amber-100/30 border-amber-200/60'
                                : 'bg-slate-50/40 border-slate-100'
                          }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <PositionBadge position={ent.position} />
                          <div>
                            <div className="flex items-center gap-2">
                              {ent.chestNumber && (
                                <span className="font-mono font-bold text-indigo-700 text-sm">
                                  #{ent.chestNumber}
                                </span>
                              )}
                              <p className="font-bold text-slate-900 text-sm">{ent.studentName || ent.groupName}</p>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">{ent.teamName}</p>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <GradeBadge grade={ent.grade} />
                          <p className="font-mono font-black text-amber-700 text-sm">+{ent.totalPoints} pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Jury Remarks */}
                {res.remarks && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic font-medium">
                    "Official Remarks: {res.remarks}"
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
