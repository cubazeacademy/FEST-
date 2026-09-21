import React, { useState, useMemo } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { CategoryBadge, PositionBadge, GradeBadge } from '../common/Badge';
import {
  Search,
  User,
  QrCode,
  Trophy,
  Award,
  Medal,
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Users,
  Camera,
  Layers
} from 'lucide-react';

interface ParticipantSearchProps {
  setActiveTab?: (tab: string) => void;
}

export const ParticipantSearch: React.FC<ParticipantSearchProps> = ({ setActiveTab }) => {
  const { students, teams, programs, registrations, results, studentScores, settings } = useFestData();

  const isArtsEnabled = settings.enableArtsSection !== false;
  const isSportsEnabled = settings.enableSportsSection !== false;

  const [searchMode, setSearchMode] = useState<'MANUAL' | 'QR'>('MANUAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Handle Search Submission
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    setSubmittedQuery(q);
    setSelectedStudentId(null);
  };

  // Find matching students based on submittedQuery or live typed query
  const matchingStudents = useMemo(() => {
    const q = (submittedQuery || searchQuery).toLowerCase().trim();
    if (!q) return [];

    return students.filter(s => {
      const matchChest = s.chestNumber && s.chestNumber.toString() === q;
      const matchChestContains = s.chestNumber && s.chestNumber.toString().includes(q);
      const matchName = s.name.toLowerCase().includes(q);
      const matchAdm = s.admissionNo.toLowerCase().includes(q);
      return matchChest || matchChestContains || matchName || matchAdm;
    });
  }, [students, submittedQuery, searchQuery]);

  // Determine currently active/selected student profile
  const activeStudent = useMemo(() => {
    if (selectedStudentId) {
      return students.find(s => s.id === selectedStudentId) || null;
    }
    if (matchingStudents.length === 1) {
      return matchingStudents[0];
    }
    return null;
  }, [students, selectedStudentId, matchingStudents]);

  // Active student's calculated score breakdown
  const activeStudentScore = useMemo(() => {
    if (!activeStudent) return null;
    return studentScores.find(s => s.studentId === activeStudent.id) || null;
  }, [activeStudent, studentScores]);

  // Active student's team
  const activeStudentTeam = useMemo(() => {
    if (!activeStudent) return null;
    return teams.find(t => t.id === activeStudent.teamId) || null;
  }, [activeStudent, teams]);

  // All registrations / programs for this student
  const studentRegistrations = useMemo(() => {
    if (!activeStudent) return [];

    // Individual registrations
    const individualRegs = registrations.filter(
      r => r.studentId === activeStudent.id && r.status !== 'WITHDRAWN'
    );

    // Group registrations where student is a member
    const groupRegs = registrations.filter(
      r =>
        r.status !== 'WITHDRAWN' &&
        r.groupMembers?.some(m => m.studentId === activeStudent.id)
    );

    const allRegs = [...individualRegs, ...groupRegs];

    return allRegs
      .filter(reg => {
        const prog = programs.find(p => p.id === reg.programId);
        const sec = prog?.section || reg.section;
        if (!isArtsEnabled && sec === 'ARTS') return false;
        if (!isSportsEnabled && sec === 'SPORTS') return false;
        return true;
      })
      .map(reg => {
        const prog = programs.find(p => p.id === reg.programId);
        const pubResult = results.find(
          r => r.programId === reg.programId && r.status === 'PUBLISHED'
        );

        let resultEntry = undefined;
        if (pubResult) {
          resultEntry = pubResult.entries.find(
            e =>
              e.studentId === activeStudent.id ||
              e.registrationId === reg.id ||
              e.groupMembers?.some(m => m.studentId === activeStudent.id)
          );
        }

        return {
          registration: reg,
          program: prog,
          result: pubResult,
          entry: resultEntry
        };
      });
  }, [activeStudent, registrations, programs, results, isArtsEnabled, isSportsEnabled]);

  const handleReset = () => {
    setSearchQuery('');
    setSubmittedQuery('');
    setSelectedStudentId(null);
  };

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      {/* Top Main Search Card matching screenshot */}
      <div className="p-7 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 text-center space-y-6">
        {/* Avatar Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-50/80 border-2 border-red-100 flex items-center justify-center mx-auto text-red-500 shadow-inner">
          <User className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 stroke-[1.8]" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Enter chest NO.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
            Search student scorecard, enrolled programs & certified results by chest number or name
          </p>
        </div>

        {/* Mode Switcher Toggle: Manual Entry vs QR Code */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs max-w-xs w-full">
          <button
            type="button"
            onClick={() => setSearchMode('MANUAL')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              searchMode === 'MANUAL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('QR')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              searchMode === 'QR'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
        </div>

        {searchMode === 'MANUAL' ? (
          /* Manual Input Search Form */
          <form onSubmit={handleSearch} className="max-w-md mx-auto space-y-3.5">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter chest number (e.g. 101) or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:bg-white font-medium transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded-md hover:bg-slate-200/60"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-base shadow-lg shadow-red-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* QR Code Scanner Mode */
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-red-200 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100/70 text-red-600 flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Scan Participant Badge QR</h4>
              <p className="text-xs text-slate-500 mt-1">
                Point your device camera at the candidate ID card or chest number badge QR code.
              </p>
            </div>
            {/* Quick quick sample chest selector */}
            <div className="pt-2 border-t border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Or Quick Test Available Chests:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {students.slice(0, 6).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(s.chestNumber ? s.chestNumber.toString() : s.name);
                      setSubmittedQuery(s.chestNumber ? s.chestNumber.toString() : s.name);
                      setSelectedStudentId(s.id);
                      setSearchMode('MANUAL');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 hover:border-red-300 hover:text-red-600 cursor-pointer shadow-2xs"
                  >
                    #{s.chestNumber || s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multiple Matching Students Picker (if query matched > 1 student and none clicked yet) */}
      {!activeStudent && matchingStudents.length > 1 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Found {matchingStudents.length} Matching Participants
            </h3>
            <span className="text-xs text-slate-500 font-medium">Click to select candidate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {matchingStudents.map(student => {
              const team = teams.find(t => t.id === student.teamId);
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-red-50/50 border border-slate-200 hover:border-red-300 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-800 text-sm shrink-0 group-hover:border-red-300">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        {student.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Chest #{student.chestNumber || '—'} • {team?.name || 'House'} • Class {student.classNumber}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No Students Found State */}
      {(submittedQuery || searchQuery) && matchingStudents.length === 0 && (
        <div className="p-10 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Participant Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No registered candidate matches "{submittedQuery || searchQuery}". Please check the chest number or try searching by candidate name.
          </p>
        </div>
      )}

      {/* ACTIVE SELECTED STUDENT PROFILE & FULL SCORECARD */}
      {activeStudent && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Profile Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-600 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md shadow-red-500/20">
                  {activeStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      {activeStudent.name}
                    </h3>
                    {activeStudent.chestNumber && (
                      <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-mono font-black text-sm shadow-xs">
                        Chest #{activeStudent.chestNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 flex flex-wrap items-center gap-2">
                    {activeStudentTeam && (
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: activeStudentTeam.color }}
                        />
                        {activeStudentTeam.name}
                      </span>
                    )}
                    <span>•</span>
                    <span>Class {activeStudent.classNumber}</span>
                    <span>•</span>
                    <span>Adm: {activeStudent.admissionNo}</span>
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                <CategoryBadge category={activeStudent.category} />
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Search Other
                </button>
              </div>
            </div>

            {/* Points Summary Stats Grid */}
            <div className={`grid gap-3.5 ${
              isArtsEnabled && isSportsEnabled
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-3'
            }`}>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 via-red-50/40 to-white border border-red-200 text-center">
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">
                  Total Points
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-red-600 block mt-1">
                  {(isArtsEnabled ? (activeStudentScore?.artsIndividualPoints || 0) : 0) +
                    (isSportsEnabled ? (activeStudentScore?.sportsIndividualPoints || 0) : 0)}{' '}
                  <span className="text-xs font-bold font-sans">pts</span>
                </span>
              </div>

              {isArtsEnabled && (
                <div className="p-4 rounded-2xl bg-fuchsia-50/60 border border-fuchsia-200 text-center">
                  <span className="text-[11px] font-bold text-fuchsia-700 uppercase tracking-wider block">
                    Arts Score
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-fuchsia-700 block mt-1">
                    {activeStudentScore?.artsIndividualPoints || 0}{' '}
                    <span className="text-xs font-bold font-sans">pts</span>
                  </span>
                </div>
              )}

              {isSportsEnabled && (
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 text-center">
                  <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
                    Sports Score
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-sky-700 block mt-1">
                    {activeStudentScore?.sportsIndividualPoints || 0}{' '}
                    <span className="text-xs font-bold font-sans">pts</span>
                  </span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-center flex flex-col justify-center">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Medals Won
                </span>
                <div className="flex items-center justify-center gap-2 mt-1.5 font-mono text-xs font-bold">
                  <span title="Gold / First">🥇 {activeStudentScore?.firstCount || 0}</span>
                  <span title="Silver / Second">🥈 {activeStudentScore?.secondCount || 0}</span>
                  <span title="Bronze / Third">🥉 {activeStudentScore?.thirdCount || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enrolled Events & Scorecard Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Competitions & Certified Results
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  All registered individual & group events with published evaluation scores
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700">
                {studentRegistrations.length} Events Enrolled
              </span>
            </div>

            {studentRegistrations.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200">
                No event registrations recorded for this student.
              </div>
            ) : (
              <div className="space-y-3.5">
                {studentRegistrations.map((item, idx) => {
                  const hasPublishedResult = !!item.result && !!item.entry;
                  const isFirst = item.entry?.position === 'FIRST';
                  const isSecond = item.entry?.position === 'SECOND';
                  const isThird = item.entry?.position === 'THIRD';

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border transition-all space-y-3 ${
                        hasPublishedResult
                          ? isFirst
                            ? 'bg-gradient-to-r from-amber-500/10 via-amber-50/30 to-white border-amber-300'
                            : 'bg-slate-50 border-slate-200'
                          : 'bg-white border-slate-200/90'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/60">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 uppercase">
                              {item.program?.section || item.registration.section} •{' '}
                              {item.program?.category || item.registration.category}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                              {item.program?.programType || item.registration.programType}
                            </span>
                            {item.registration.groupName && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                                Group: {item.registration.groupName}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-900">
                            {item.program?.name || item.registration.programName}
                          </h4>
                        </div>

                        {/* Result Status Badge */}
                        <div className="self-start sm:self-auto">
                          {hasPublishedResult ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Certified Result
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Pending Evaluation
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Performance / Points / Medals Details */}
                      {hasPublishedResult && item.entry ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <div className="flex flex-wrap items-center gap-2">
                            <PositionBadge position={item.entry.position} />
                            {item.entry.grade !== 'NONE' && (
                              <GradeBadge grade={item.entry.grade} />
                            )}
                            <span className="text-xs text-slate-500 font-medium">
                              (Pos: +{item.entry.positionPoints} pts, Grade: +{item.entry.gradePoints} pts)
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black font-mono text-red-600">
                              +{item.entry.totalPoints} Points Earned
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          This competition is either upcoming or results are currently being compiled by the controllers.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Auxiliary Links matching screenshot */}
      <div className="text-center space-y-3 pt-2">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Looking for something else?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('public_results')}
            className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200/90 hover:border-red-300 hover:text-red-600 text-slate-800 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <span>View All Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('public_results')}
            className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200/90 hover:border-red-300 hover:text-red-600 text-slate-800 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Browse Candidates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

