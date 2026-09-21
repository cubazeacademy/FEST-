import React from 'react';
import { useFestData } from '../../context/FestDataContext';
import { getCategoryWinners } from '../../utils/calculations';
import { CategoryBadge } from '../common/Badge';
import {
  Award,
  Trophy,
  Crown,
  ShieldCheck,
  Medal
} from 'lucide-react';

export const ArtsChampionship: React.FC = () => {
  const { teamLeaderboard, studentScores, settings, categoryConfigs } = useFestData();

  if (settings.enableArtsSection === false) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200/90 rounded-3xl space-y-4 max-w-xl mx-auto shadow-xs">
        <Award className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Arts Section is Currently Disabled</h2>
        <p className="text-sm text-slate-500 font-medium">
          The Arts Championship module has been disabled by the Festival Administrator in Global Settings.
        </p>
      </div>
    );
  }

  // Sort teams strictly by Arts Total Points
  const artsTeams = [...teamLeaderboard].sort((a, b) => b.artsTotalPoints - a.artsTotalPoints);
  const championTeam = artsTeams[0];

  return (
    <div className="space-y-6">
      {/* Arts Championship Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-500/10 via-purple-50 to-pink-50 border border-fuchsia-200 p-7 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200">
                <Award className="w-4 h-4 text-fuchsia-600" />
                ARTS FESTIVAL CHAMPIONSHIP
              </span>
              <span className="text-xs text-slate-500 font-bold">Stage & Non-Stage Cumulative</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {settings.festName} Arts Tally
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl font-medium">
              Official Arts leaderboard incorporating all Stage and Non-Stage competitions. Sports points are strictly excluded per institutional rules.
            </p>
          </div>

          {/* Arts Champion Trophy Card */}
          {championTeam && (
            <div className="p-5 rounded-3xl bg-white border border-fuchsia-200 shadow-xs flex items-center gap-4 shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-amber-500 p-0.5 flex items-center justify-center shadow-md shadow-fuchsia-100">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-500 animate-bounce" />
                </div>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-600">Arts Overall Champion</span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: championTeam.teamColor }} />
                  {championTeam.teamName}
                </h3>
                <p className="text-sm font-mono font-bold text-fuchsia-600 mt-0.5">
                  {championTeam.artsTotalPoints} Cumulative Arts Points
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category-Wise Arts Champions (Kalathilakam / Kalaprathibha) */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Individual Category Champions (Arts)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryConfigs.map(cat => {
            const winners = getCategoryWinners(studentScores, 'ARTS', cat.category);
            return (
              <CategoryChampionCard
                key={cat.id}
                categoryName={cat.displayName || cat.category}
                category={cat.category}
                topStudent={winners[0]}
              />
            );
          })}
        </div>
      </div>

      {/* House Arts Points Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-fuchsia-600" />
              House Arts Points Table & Stage vs Non-Stage Breakdown
            </h3>
            <p className="text-xs text-slate-500 font-medium">Strictly isolated from Sports scores</p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4" /> Rule 1 Guaranteed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-5">Rank</th>
                <th className="py-4 px-5">House / Team</th>
                <th className="py-4 px-5 text-center">Stage Programs</th>
                <th className="py-4 px-5 text-center">Non-Stage Programs</th>
                <th className="py-4 px-5 text-center">Sub Junior</th>
                <th className="py-4 px-5 text-center">Junior</th>
                <th className="py-4 px-5 text-center">Senior</th>
                <th className="py-4 px-5 text-center">Super Senior</th>
                <th className="py-4 px-5 text-right font-bold text-fuchsia-700">Total Arts Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {artsTeams.map((team, idx) => (
                <tr key={team.teamId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-mono font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : idx === 1
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                      <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: team.teamColor }} />
                      <span>{team.teamName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-center font-mono text-slate-800 font-bold">{team.artsStagePoints}</td>
                  <td className="py-4 px-5 text-center font-mono text-slate-800 font-bold">{team.artsNonStagePoints}</td>
                  <td className="py-4 px-5 text-center font-mono text-slate-600">{team.categoryArtsPoints.SUB_JUNIOR}</td>
                  <td className="py-4 px-5 text-center font-mono text-slate-600">{team.categoryArtsPoints.JUNIOR}</td>
                  <td className="py-4 px-5 text-center font-mono text-slate-600">{team.categoryArtsPoints.SENIOR}</td>
                  <td className="py-4 px-5 text-center font-mono text-slate-600">{team.categoryArtsPoints.SUPER_SENIOR}</td>
                  <td className="py-4 px-5 text-right">
                    <span className="px-3.5 py-1.5 rounded-xl bg-fuchsia-50 border border-fuchsia-200 font-mono font-black text-fuchsia-700 text-base">
                      {team.artsTotalPoints} pts
                    </span>
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

const CategoryChampionCard: React.FC<{
  categoryName: string;
  category: any;
  topStudent?: any;
}> = ({ categoryName, category, topStudent }) => {
  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
      <div>
        <div className="flex items-center justify-between mb-2">
          <CategoryBadge category={category} />
          <Medal className="w-5 h-5 text-amber-500" />
        </div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{categoryName}</h4>

        {topStudent ? (
          <div className="mt-3.5 space-y-1">
            <div className="flex items-center gap-2">
              {topStudent.chestNumber && (
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  #{topStudent.chestNumber}
                </span>
              )}
              <h3 className="text-base font-bold text-slate-900 truncate">{topStudent.studentName}</h3>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topStudent.teamColor }} />
              {topStudent.teamName} (Class {topStudent.classNumber})
            </p>
          </div>
        ) : (
          <div className="mt-5 py-4 text-center text-slate-400 text-xs italic font-medium">
            Awaiting completed events
          </div>
        )}
      </div>

      {topStudent && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Individual Points:</span>
          <span className="font-mono font-black text-fuchsia-700 text-base">
            {topStudent.artsIndividualPoints} pts
          </span>
        </div>
      )}
    </div>
  );
};
