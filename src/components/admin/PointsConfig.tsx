import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { AwardGrade, AwardPosition, ProgramType } from '../../types';
import { PositionBadge, GradeBadge } from '../common/Badge';
import {
  Sliders,
  Trophy,
  Award,
  User,
  Users,
  Globe,
  CheckCircle2,
  BarChart2
} from 'lucide-react';

export const PointsConfig: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    scoringConfigs,
    updateProgramTypePositionConfig,
    updateProgramTypeGradeConfig
  } = useFestData();

  const [activeTab, setActiveTab] = useState<ProgramType>('INDIVIDUAL');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const currentTabConfig = scoringConfigs[activeTab];

  const handlePositionPointChange = (posId: string, position: AwardPosition, label: string, newPoints: number) => {
    updateProgramTypePositionConfig(
      activeTab,
      { id: posId, position, label, points: newPoints, active: true },
      currentUser.name,
      currentUser.role
    );
    showFeedback();
  };

  const handleGradePointChange = (grdId: string, grade: AwardGrade, label: string, newPoints: number) => {
    updateProgramTypeGradeConfig(
      activeTab,
      { id: grdId, grade, label, points: newPoints, active: true },
      currentUser.name,
      currentUser.role
    );
    showFeedback();
  };

  const showFeedback = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Sliders className="w-6 h-6 text-indigo-600" />
            Points Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Set point values for positions and grades. Changes apply automatically to all scores.
          </p>
        </div>

        {savedFeedback && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Points Saved
          </div>
        )}
      </div>

      {/* Clean Format Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('INDIVIDUAL')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'INDIVIDUAL'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          Individual Events
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('GROUP')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'GROUP'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Group Events
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('GENERAL')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'GENERAL'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          General Events
        </button>
      </div>

      {/* Two Clean Column Cards: Position Points & Grade Points */}
      {currentTabConfig && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Position Points Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Position Points
                </h3>
                <p className="text-xs text-slate-400 font-medium">Rank & Podium points</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {currentTabConfig.positionConfigs.map(pos => (
                <div
                  key={pos.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PositionBadge position={pos.position} />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {pos.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pos.points}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          handlePositionPointChange(pos.id, pos.position, pos.label, val);
                        }
                      }}
                      className="w-16 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-bold font-mono text-center text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                    <span className="text-xs font-bold text-slate-400 font-mono">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Points Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Grade Points
                </h3>
                <p className="text-xs text-slate-400 font-medium">Performance quality points</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {currentTabConfig.gradeConfigs.map(grd => (
                <div
                  key={grd.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GradeBadge grade={grd.grade} />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {grd.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={grd.points}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          handleGradePointChange(grd.id, grd.grade, grd.label, val);
                        }
                      }}
                      className="w-16 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-bold font-mono text-center text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                    <span className="text-xs font-bold text-slate-400 font-mono">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Simple Cross-Program Summary Matrix */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Points Summary Matrix
          </h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Award Tier</th>
                <th className="py-3 px-4">Individual</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">General</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4 font-bold text-slate-800">1st Place (Gold)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-600">
                  {scoringConfigs.INDIVIDUAL?.positionConfigs.find(p => p.position === 'FIRST')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-600">
                  {scoringConfigs.GROUP?.positionConfigs.find(p => p.position === 'FIRST')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-600">
                  {scoringConfigs.GENERAL?.positionConfigs.find(p => p.position === 'FIRST')?.points || 0} pts
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4 font-bold text-slate-800">2nd Place (Silver)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                  {scoringConfigs.INDIVIDUAL?.positionConfigs.find(p => p.position === 'SECOND')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                  {scoringConfigs.GROUP?.positionConfigs.find(p => p.position === 'SECOND')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                  {scoringConfigs.GENERAL?.positionConfigs.find(p => p.position === 'SECOND')?.points || 0} pts
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4 font-bold text-slate-800">3rd Place (Bronze)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-800">
                  {scoringConfigs.INDIVIDUAL?.positionConfigs.find(p => p.position === 'THIRD')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-800">
                  {scoringConfigs.GROUP?.positionConfigs.find(p => p.position === 'THIRD')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-800">
                  {scoringConfigs.GENERAL?.positionConfigs.find(p => p.position === 'THIRD')?.points || 0} pts
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70 bg-slate-50/40">
                <td className="py-2.5 px-4 font-bold text-slate-800">Grade A</td>
                <td className="py-2.5 px-4 font-mono font-bold text-emerald-600">
                  {scoringConfigs.INDIVIDUAL?.gradeConfigs.find(g => g.grade === 'A')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-emerald-600">
                  {scoringConfigs.GROUP?.gradeConfigs.find(g => g.grade === 'A')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-emerald-600">
                  {scoringConfigs.GENERAL?.gradeConfigs.find(g => g.grade === 'A')?.points || 0} pts
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70 bg-slate-50/40">
                <td className="py-2.5 px-4 font-bold text-slate-800">Grade B</td>
                <td className="py-2.5 px-4 font-mono font-bold text-blue-600">
                  {scoringConfigs.INDIVIDUAL?.gradeConfigs.find(g => g.grade === 'B')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-blue-600">
                  {scoringConfigs.GROUP?.gradeConfigs.find(g => g.grade === 'B')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-blue-600">
                  {scoringConfigs.GENERAL?.gradeConfigs.find(g => g.grade === 'B')?.points || 0} pts
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70 bg-slate-50/40">
                <td className="py-2.5 px-4 font-bold text-slate-800">Grade C</td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-600">
                  {scoringConfigs.INDIVIDUAL?.gradeConfigs.find(g => g.grade === 'C')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-600">
                  {scoringConfigs.GROUP?.gradeConfigs.find(g => g.grade === 'C')?.points || 0} pts
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-600">
                  {scoringConfigs.GENERAL?.gradeConfigs.find(g => g.grade === 'C')?.points || 0} pts
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
