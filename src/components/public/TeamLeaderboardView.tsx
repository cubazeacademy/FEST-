import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import {
  Trophy,
  Crown,
  Award,
  Flame,
  ShieldCheck,
  Columns
} from 'lucide-react';

export const TeamLeaderboardView: React.FC = () => {
  const { teamLeaderboard, settings } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;

  const [viewMode, setViewMode] = useState<'ARTS' | 'SPORTS' | 'DUAL'>(() => {
    if (isArtsEnabled && !isSportsEnabled) return 'ARTS';
    if (!isArtsEnabled && isSportsEnabled) return 'SPORTS';
    return 'ARTS';
  });

  // Strictly sorted lists
  const artsSortedTeams = [...teamLeaderboard].sort((a, b) => {
    if (b.artsTotalPoints !== a.artsTotalPoints) return b.artsTotalPoints - a.artsTotalPoints;
    if (b.artsFirstCount !== a.artsFirstCount) return b.artsFirstCount - a.artsFirstCount;
    if (b.artsSecondCount !== a.artsSecondCount) return b.artsSecondCount - a.artsSecondCount;
    return b.artsThirdCount - a.artsThirdCount;
  });

  const sportsSortedTeams = [...teamLeaderboard].sort((a, b) => {
    if (b.sportsTotalPoints !== a.sportsTotalPoints) return b.sportsTotalPoints - a.sportsTotalPoints;
    if (b.sportsFirstCount !== a.sportsFirstCount) return b.sportsFirstCount - a.sportsFirstCount;
    if (b.sportsSecondCount !== a.sportsSecondCount) return b.sportsSecondCount - a.sportsSecondCount;
    return b.sportsThirdCount - a.sportsThirdCount;
  });

  const isArts = (isArtsEnabled && viewMode === 'ARTS') || !isSportsEnabled;
  const activeTeams = !isArts && isSportsEnabled ? sportsSortedTeams : artsSortedTeams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Strictly Separated Standings
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-500" />
            House Championship Leaderboard
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Arts and Sports points are completely independent and never added together.
          </p>
        </div>

        {/* View Switcher (Only show when both are enabled) */}
        {isArtsEnabled && isSportsEnabled && (
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              onClick={() => setViewMode('ARTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'ARTS'
                  ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Arts Championship
            </button>
            <button
              onClick={() => setViewMode('SPORTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'SPORTS'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Sports Championship
            </button>
            <button
              onClick={() => setViewMode('DUAL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'DUAL'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Dual Standings View
            </button>
          </div>
        )}
      </div>

      {viewMode !== 'DUAL' ? (
        <>
          {/* Podium Top 3 Houses for Single Active Mode (Arts or Sports) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
            {/* 2nd Place */}
            {activeTeams[1] && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-3.5 order-2 md:order-1 hover:shadow-md transition-all">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                  2
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400">
                    {isArts ? 'Arts Runner-Up' : 'Sports Runner-Up'}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 flex items-center justify-center gap-2 mt-0.5">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: activeTeams[1].teamColor }} />
                    {activeTeams[1].teamName}
                  </h3>
                </div>
                <div className="pt-3 border-t border-slate-100 text-sm font-mono">
                  {isArts ? (
                    <div>
                      <p className="text-fuchsia-700 font-black text-lg">{activeTeams[1].artsTotalPoints} pts</p>
                      <p className="text-xs text-slate-400 mt-0.5">Stage: {activeTeams[1].artsStagePoints} | Non-Stage: {activeTeams[1].artsNonStagePoints}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sky-700 font-black text-lg">{activeTeams[1].sportsTotalPoints} pts</p>
                      <p className="text-xs text-slate-400 mt-0.5">Athletics & Games Score</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 1st Place (Champion) */}
            {activeTeams[0] && (
              <div className={`p-7 rounded-3xl border-2 text-center space-y-4 shadow-sm order-1 md:order-2 hover:shadow-md transition-all ${
                isArts
                  ? 'bg-gradient-to-b from-fuchsia-500/10 via-fuchsia-50/40 to-white border-fuchsia-300'
                  : 'bg-gradient-to-b from-sky-500/10 via-sky-50/40 to-white border-sky-300'
              }`}>
                <Crown className={`w-9 h-9 mx-auto animate-bounce ${isArts ? 'text-fuchsia-600' : 'text-sky-600'}`} />
                <div className={`w-16 h-16 rounded-full border-2 font-black text-2xl flex items-center justify-center mx-auto shadow-sm ${
                  isArts
                    ? 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900 shadow-fuchsia-200'
                    : 'bg-sky-100 border-sky-400 text-sky-900 shadow-sky-200'
                }`}>
                  1
                </div>
                <div>
                  <span className={`text-xs uppercase font-black tracking-wider ${isArts ? 'text-fuchsia-700' : 'text-sky-700'}`}>
                    {isArts ? 'Arts Champion Leader' : 'Sports Champion Leader'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 flex items-center justify-center gap-2.5 mt-0.5">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: activeTeams[0].teamColor }} />
                    {activeTeams[0].teamName}
                  </h3>
                </div>
                <div className={`pt-3.5 border-t text-sm font-mono ${isArts ? 'border-fuchsia-200/60' : 'border-sky-200/60'}`}>
                  {isArts ? (
                    <div>
                      <p className="text-fuchsia-700 font-black text-2xl">{activeTeams[0].artsTotalPoints} pts</p>
                      <p className="text-xs text-slate-500 mt-0.5">Stage: {activeTeams[0].artsStagePoints} • Non-Stage: {activeTeams[0].artsNonStagePoints}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sky-700 font-black text-2xl">{activeTeams[0].sportsTotalPoints} pts</p>
                      <p className="text-xs text-slate-500 mt-0.5">Athletics & Track & Field Points</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {activeTeams[2] && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-3.5 order-3 hover:shadow-md transition-all">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-black text-xl flex items-center justify-center mx-auto">
                  3
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400">
                    {isArts ? 'Arts Third Place' : 'Sports Third Place'}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 flex items-center justify-center gap-2 mt-0.5">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: activeTeams[2].teamColor }} />
                    {activeTeams[2].teamName}
                  </h3>
                </div>
                <div className="pt-3 border-t border-slate-100 text-sm font-mono">
                  {isArts ? (
                    <div>
                      <p className="text-fuchsia-700 font-black text-lg">{activeTeams[2].artsTotalPoints} pts</p>
                      <p className="text-xs text-slate-400 mt-0.5">Stage: {activeTeams[2].artsStagePoints} | Non-Stage: {activeTeams[2].artsNonStagePoints}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sky-700 font-black text-lg">{activeTeams[2].sportsTotalPoints} pts</p>
                      <p className="text-xs text-slate-400 mt-0.5">Athletics & Games Score</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Standings Table for Active Section */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {isArts ? (
                  <>
                    <Award className="w-5 h-5 text-fuchsia-600" />
                    Arts Festival Official House Standings
                  </>
                ) : (
                  <>
                    <Flame className="w-5 h-5 text-sky-600" />
                    Sports Meet Official House Standings
                  </>
                )}
              </h3>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                isArts ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                {isArts ? 'Arts Points Only' : 'Sports Points Only'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-5">Rank</th>
                    <th className="py-4 px-5">House / Team</th>
                    {isArts ? (
                      <>
                        <th className="py-4 px-5 text-center">Stage Points</th>
                        <th className="py-4 px-5 text-center">Non-Stage Points</th>
                        <th className="py-4 px-5 text-center font-bold text-fuchsia-700">Total Arts Points</th>
                        <th className="py-4 px-5 text-right">Arts Medals (🥇/🥈/🥉)</th>
                      </>
                    ) : (
                      <>
                        <th className="py-4 px-5 text-center font-bold text-sky-700">Total Sports Points</th>
                        <th className="py-4 px-5 text-right">Sports Medals (🥇/🥈/🥉)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeTeams.map((team, idx) => (
                    <tr key={team.teamId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5 font-mono font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-50 text-slate-500'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3 font-bold text-slate-900 text-sm">
                          <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: team.teamColor }} />
                          <span>{team.teamName}</span>
                        </div>
                      </td>

                      {isArts ? (
                        <>
                          <td className="py-4 px-5 text-center font-mono text-slate-600">
                            {team.artsStagePoints} pts
                          </td>
                          <td className="py-4 px-5 text-center font-mono text-slate-600">
                            {team.artsNonStagePoints} pts
                          </td>
                          <td className="py-4 px-5 text-center font-mono font-black text-fuchsia-700 bg-fuchsia-50/50 text-base">
                            {team.artsTotalPoints} pts
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold">
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                🥇 {team.artsFirstCount}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                🥈 {team.artsSecondCount}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                                🥉 {team.artsThirdCount}
                              </span>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-4 px-5 text-center font-mono font-black text-sky-700 bg-sky-50/50 text-base">
                            {team.sportsTotalPoints} pts
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold">
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                🥇 {team.sportsFirstCount}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                🥈 {team.sportsSecondCount}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                                🥉 {team.sportsThirdCount}
                              </span>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* DUAL VIEW: Side-by-side Arts & Sports Tables */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arts Table */}
          <div className="rounded-3xl bg-white border border-fuchsia-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-fuchsia-100 bg-fuchsia-50/40 flex items-center justify-between">
              <h3 className="text-base font-bold text-fuchsia-950 flex items-center gap-2">
                <Award className="w-5 h-5 text-fuchsia-600" />
                Arts Standings
              </h3>
              <span className="text-xs font-mono font-bold text-fuchsia-700 bg-white px-2.5 py-1 rounded-lg border border-fuchsia-200">
                Stage + Non-Stage
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">House</th>
                    <th className="py-3.5 px-4 text-center">Arts Total</th>
                    <th className="py-3.5 px-4 text-right">Medals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {artsSortedTeams.map((team, idx) => (
                    <tr key={team.teamId} className="hover:bg-fuchsia-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.teamColor }} />
                          <span>{team.teamName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-fuchsia-700 text-sm">
                        {team.artsTotalPoints} pts
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-slate-600">
                        🥇{team.artsFirstCount} 🥈{team.artsSecondCount} 🥉{team.artsThirdCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sports Table */}
          <div className="rounded-3xl bg-white border border-sky-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-sky-100 bg-sky-50/40 flex items-center justify-between">
              <h3 className="text-base font-bold text-sky-950 flex items-center gap-2">
                <Flame className="w-5 h-5 text-sky-600" />
                Sports Standings
              </h3>
              <span className="text-xs font-mono font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border border-sky-200">
                Athletics & Games
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">House</th>
                    <th className="py-3.5 px-4 text-center">Sports Total</th>
                    <th className="py-3.5 px-4 text-right">Medals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sportsSortedTeams.map((team, idx) => (
                    <tr key={team.teamId} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.teamColor }} />
                          <span>{team.teamName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-sky-700 text-sm">
                        {team.sportsTotalPoints} pts
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-slate-600">
                        🥇{team.sportsFirstCount} 🥈{team.sportsSecondCount} 🥉{team.sportsThirdCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
