import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  supabase,
  FEST_STATE_KEY,
  fetchFullRelationalData,
  saveFullRelationalData,
  saveStudentDb,
  saveStudentsBatchDb,
  deleteStudentDb,
  deleteStudentsBatchDb,
  saveTeamDb,
  deleteTeamDb,
  saveProgramDb,
  saveProgramsBatchDb,
  deleteProgramDb,
  deleteProgramsBatchDb,
  saveRegistrationDb,
  saveRegistrationsBatchDb,
  deleteRegistrationDb,
  deleteRegistrationsBatchDb,
  deleteRegistrationsByTeamDb,
  clearAllRegistrationsDb,
  saveResultDb,
  deleteResultDb,
  saveSettingsDb,
  saveCategoryConfigDb,
  deleteCategoryConfigDb,
  saveClassMappingDb,
  deleteClassMappingDb,
  saveScoringConfigsDb,
  saveAuditLogDb,
  saveLeaderboardCacheDb,
  saveResultCacheDb,
  submitProgramResultRpc,
  mapResultFromDb,
  mapProgramFromDb,
  mapRegistrationFromDb,
  mapSettingsFromDb
} from '../lib/supabase';
import {
  AuditLog,
  CategoryConfig,
  ClassCategoryMapping,
  FestCategory,
  FestSection,
  FestSettings,
  GradePointConfig,
  PositionPointConfig,
  Program,
  ProgramResult,
  ProgramType,
  Registration,
  ResultEntry,
  ScoringConfigMap,
  Student,
  StudentScoreBreakdown,
  Team,
  TeamScoreBreakdown,
  UserRole
} from '../types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CATEGORY_CONFIGS,
  INITIAL_CLASS_MAPPINGS,
  INITIAL_GRADE_CONFIGS,
  INITIAL_POSITION_CONFIGS,
  INITIAL_PROGRAMS,
  INITIAL_REGISTRATIONS,
  INITIAL_RESULTS,
  INITIAL_SCORING_CONFIGS,
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_TEAMS
} from '../utils/seedData';
import {
  calculateEntryPoints,
  calculateStudentScores,
  calculateTeamScores
} from '../utils/calculations';
import {
  resolveCategoryFromClass,
  validateClassCategoryMapping,
  validateGroupRegistration,
  validateIndividualRegistration
} from '../utils/validations';
import { generateChestNumbers, validateManualChestNumber } from '../utils/chestNumberGen';

interface FestDataContextType {
  // State
  settings: FestSettings;
  teams: Team[];
  students: Student[];
  categoryConfigs: CategoryConfig[];
  classMappings: ClassCategoryMapping[];
  programs: Program[];
  registrations: Registration[];
  results: ProgramResult[];
  scoringConfigs: ScoringConfigMap;
  gradeConfigs: GradePointConfig[];
  positionConfigs: PositionPointConfig[];
  auditLogs: AuditLog[];

  // Computed / Derived Leaderboards (Strictly Separated)
  teamLeaderboard: TeamScoreBreakdown[];
  studentScores: StudentScoreBreakdown[];
  artsOverallWinner: TeamScoreBreakdown | null;
  sportsOverallWinner: TeamScoreBreakdown | null;

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'createdDate'>, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  importStudentsBatch: (studentsList: Omit<Student, 'id' | 'createdDate'>[], performedBy: string, role: UserRole) => { success: boolean; count: number; error?: string };
  updateStudent: (student: Student, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  deleteStudent: (studentId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  deleteStudentsBatch: (studentIds: string[], performedBy: string, role: UserRole) => { success: boolean; count: number; error?: string };
  transferStudentTeam: (studentId: string, targetTeamId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };

  // Class & Category Mapping Actions
  addClassMapping: (classNumber: string, category: FestCategory, description: string | undefined, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  deleteClassMapping: (mappingId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  addCategoryConfig: (categoryData: Omit<CategoryConfig, 'id'>, assignedClasses: string[], performedBy: string, role: UserRole) => { success: boolean; config?: CategoryConfig; error?: string };
  updateCategoryConfig: (config: CategoryConfig, newAssignedClasses?: string[], performedBy?: string, role?: UserRole) => { success: boolean; error?: string };
  deleteCategoryConfig: (categoryId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };

  // Chest Number Actions
  runChestNumberGenerator: (preserveExisting: boolean, performedBy: string, role: UserRole) => { success: boolean; assigned: number; skipped: number; errors: string[] };
  assignManualChestNumber: (studentId: string, chestNumber: number, performedBy: string, role: UserRole) => { success: boolean; error?: string };

  // Program Actions
  addProgram: (program: Omit<Program, 'id'>, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  importProgramsBatch: (programsList: Omit<Program, 'id'>[], performedBy: string, role: UserRole) => { success: boolean; count: number; error?: string };
  updateProgram: (program: Program, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  deleteProgram: (programId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  deleteProgramsBatch: (programIds: string[], performedBy: string, role: UserRole) => { success: boolean; count: number; error?: string };

  // Team Actions
  addTeam: (team: Omit<Team, 'id'>, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  updateTeam: (team: Team, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  deleteTeam: (teamId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };

  // Registration Actions
  registerIndividualStudent: (studentId: string, programId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  importIndividualRegistrationsBatch: (entries: { studentId: string; programId: string }[], performedBy: string, role: UserRole) => { success: boolean; count: number; error?: string };
  registerGroupStudents: (teamId: string, programId: string, groupName: string, selectedStudentIds: string[], performedBy: string, role: UserRole) => { success: boolean; error?: string };
  importGroupRegistrationsBatch: (entries: { programId: string; groupName: string; studentIds: string[] }[], teamId: string, performedBy: string, role: UserRole) => { success: boolean; count: number; error?: string };
  updateGroupStudents: (registrationId: string, groupName: string, selectedStudentIds: string[], performedBy: string, role: UserRole) => { success: boolean; error?: string };
  deleteGroupRegistration: (registrationId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  withdrawRegistration: (registrationId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  clearAllRegistrations: (performedBy: string, role: UserRole) => { success: boolean; count: number; error?: string };
  clearRegistrationsByTeam: (teamId: string, performedBy: string, role: UserRole) => { success: boolean; count: number; error?: string };
  deleteRegistrationsBatch: (registrationIds: string[], performedBy: string, role: UserRole) => { success: boolean; count: number; error?: string };

  // Result Actions
  saveOrSubmitResult: (result: Omit<ProgramResult, 'id'> & { id?: string }, isPublish: boolean, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  unpublishResult: (programId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };
  deleteResult: (programId: string, performedBy: string, role: UserRole) => { success: boolean; error?: string };

  // Settings & Scoring Config Actions
  updateProgramTypePositionConfig: (programType: ProgramType, config: PositionPointConfig, performedBy: string, role: UserRole) => void;
  updateProgramTypeGradeConfig: (programType: ProgramType, config: GradePointConfig, performedBy: string, role: UserRole) => void;
  updateGradeConfig: (config: GradePointConfig, performedBy: string, role: UserRole) => void;
  updatePositionConfig: (config: PositionPointConfig, performedBy: string, role: UserRole) => void;
  updateSettings: (newSettings: Partial<FestSettings>, performedBy: string, role: UserRole) => void;

  // Supabase Cloud Sync
  cloudStatus: 'connected' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: string | null;
  syncWithCloud: () => Promise<void>;

  // Utilities
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => { success: boolean; error?: string };
}

const FestDataContext = createContext<FestDataContextType | undefined>(undefined);

const STORAGE_PREFIX = 'fest_app_state_v2_';

const CLIENT_INSTANCE_ID = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

export function deduplicateProgramsList(progList: Program[]): Program[] {
  if (!Array.isArray(progList)) return [];
  const seen = new Set<string>();
  const result: Program[] = [];

  for (const p of progList) {
    if (!p) continue;
    const codeKey = p.code ? p.code.toLowerCase().trim() : '';
    const nameKey = (p.name || '').toLowerCase().trim();
    const catKey = (p.category || '').toLowerCase().trim();
    const typeKey = (p.programType || '').toLowerCase().trim();
    const uniqueKey = codeKey ? `code:${codeKey}` : `name:${nameKey}|${catKey}|${typeKey}`;

    if (!seen.has(uniqueKey) && !seen.has(p.id)) {
      seen.add(uniqueKey);
      seen.add(p.id);
      if (codeKey) seen.add(`name:${nameKey}|${catKey}|${typeKey}`);
      result.push(p);
    }
  }
  return result;
}

export const FestDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safe LocalStorage loader
  const loadState = <T,>(key: string, defaultVal: T): T => {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      console.error(`Error loading state for ${key}`, e);
      return defaultVal;
    }
  };

  const [settings, setSettings] = useState<FestSettings>(() => loadState('settings', INITIAL_SETTINGS));
  const [teams, setTeams] = useState<Team[]>(() => loadState('teams', INITIAL_TEAMS));
  const [students, setStudents] = useState<Student[]>(() => loadState('students', INITIAL_STUDENTS));
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>(() => loadState('categoryConfigs', INITIAL_CATEGORY_CONFIGS));
  const [classMappings, setClassMappings] = useState<ClassCategoryMapping[]>(() => loadState('classMappings', INITIAL_CLASS_MAPPINGS));
  const [programs, setPrograms] = useState<Program[]>(() => deduplicateProgramsList(loadState('programs', INITIAL_PROGRAMS)));
  const [registrations, setRegistrations] = useState<Registration[]>(() => loadState('registrations', INITIAL_REGISTRATIONS));
  const [results, setResults] = useState<ProgramResult[]>(() => loadState('results', INITIAL_RESULTS));
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfigMap>(() => loadState('scoringConfigs', INITIAL_SCORING_CONFIGS));
  const [gradeConfigs, setGradeConfigs] = useState<GradePointConfig[]>(() => scoringConfigs?.INDIVIDUAL?.gradeConfigs || INITIAL_GRADE_CONFIGS);
  const [positionConfigs, setPositionConfigs] = useState<PositionPointConfig[]>(() => scoringConfigs?.INDIVIDUAL?.positionConfigs || INITIAL_POSITION_CONFIGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('auditLogs', INITIAL_AUDIT_LOGS));

  // Cloud Sync State
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const isRemoteUpdatingRef = useRef(false);
  const isInitialLoadDoneRef = useRef(false);

  // Debounced non-blocking Sync to LocalStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
        localStorage.setItem(STORAGE_PREFIX + 'teams', JSON.stringify(teams));
        localStorage.setItem(STORAGE_PREFIX + 'students', JSON.stringify(students));
        localStorage.setItem(STORAGE_PREFIX + 'categoryConfigs', JSON.stringify(categoryConfigs));
        localStorage.setItem(STORAGE_PREFIX + 'classMappings', JSON.stringify(classMappings));
        localStorage.setItem(STORAGE_PREFIX + 'programs', JSON.stringify(programs));
        localStorage.setItem(STORAGE_PREFIX + 'registrations', JSON.stringify(registrations));
        localStorage.setItem(STORAGE_PREFIX + 'results', JSON.stringify(results));
        localStorage.setItem(STORAGE_PREFIX + 'scoringConfigs', JSON.stringify(scoringConfigs));
        localStorage.setItem(STORAGE_PREFIX + 'gradeConfigs', JSON.stringify(gradeConfigs));
        localStorage.setItem(STORAGE_PREFIX + 'positionConfigs', JSON.stringify(positionConfigs));
        localStorage.setItem(STORAGE_PREFIX + 'auditLogs', JSON.stringify(auditLogs.slice(0, 50)));
      } catch (e) {
        // Silently handle quota exceeded if data exceeds browser localStorage limit
        console.warn('LocalStorage save deferred or full', e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [settings, teams, students, categoryConfigs, classMappings, programs, registrations, results, scoringConfigs, gradeConfigs, positionConfigs, auditLogs]);

  // Initial Fetch from Supabase & Focused Realtime Subscriptions
  useEffect(() => {
    let isMounted = true;

    async function loadCloudState() {
      try {
        setCloudStatus('syncing');
        const cloudData = await fetchFullRelationalData();
        if (!isMounted) return;

        if (cloudData && typeof cloudData === 'object') {
          isRemoteUpdatingRef.current = true;
          if (cloudData.settings) setSettings(cloudData.settings);
          if (cloudData.teams) setTeams(cloudData.teams);
          if (cloudData.students) setStudents(cloudData.students);
          if (cloudData.categoryConfigs) setCategoryConfigs(cloudData.categoryConfigs);
          if (cloudData.classMappings) setClassMappings(cloudData.classMappings);
          if (cloudData.programs) setPrograms(deduplicateProgramsList(cloudData.programs));
          if (cloudData.registrations) setRegistrations(cloudData.registrations);
          if (cloudData.results) setResults(cloudData.results);
          if (cloudData.scoringConfigs) {
            setScoringConfigs(cloudData.scoringConfigs);
            if (cloudData.scoringConfigs.INDIVIDUAL) {
              setGradeConfigs(cloudData.scoringConfigs.INDIVIDUAL.gradeConfigs || INITIAL_GRADE_CONFIGS);
              setPositionConfigs(cloudData.scoringConfigs.INDIVIDUAL.positionConfigs || INITIAL_POSITION_CONFIGS);
            }
          }
          if (cloudData.auditLogs) setAuditLogs(cloudData.auditLogs);

          setCloudStatus('connected');
          setLastSyncedAt(new Date().toLocaleTimeString());
          setTimeout(() => {
            isRemoteUpdatingRef.current = false;
          }, 300);
        } else {
          // Seed initial state to relational tables if completely empty
          const payload = {
            settings,
            teams,
            students,
            categoryConfigs,
            classMappings,
            programs,
            registrations,
            results,
            scoringConfigs,
            auditLogs
          };
          const res = await saveFullRelationalData(payload);
          if (res.success) {
            setCloudStatus('connected');
            setLastSyncedAt(new Date().toLocaleTimeString());
          } else {
            setCloudStatus('error');
          }
        }
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
        setCloudStatus('offline');
      } finally {
        isInitialLoadDoneRef.current = true;
      }
    }

    loadCloudState();

    // High-performance focused Realtime channel subscriptions
    const channel = supabase
      .channel('public:focused_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'results' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id || (payload.old as any)?.program_id;
            if (deletedId) {
              setResults(prev => prev.filter(r => r.id !== deletedId && r.programId !== deletedId));
            }
          } else if (payload.new) {
            const updatedResult = mapResultFromDb(payload.new);
            setResults(prev => {
              const idx = prev.findIndex(r => r.id === updatedResult.id || r.programId === updatedResult.programId);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updatedResult;
                return next;
              }
              return [...prev, updatedResult];
            });

            // Keep program result status in sync
            setPrograms(prev => prev.map(p => {
              if (p.id === updatedResult.programId) {
                return {
                  ...p,
                  resultStatus: updatedResult.status,
                  status: updatedResult.status === 'PUBLISHED' ? 'COMPLETED' : p.status
                };
              }
              return p;
            }));
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'programs' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setPrograms(prev => prev.filter(p => p.id !== deletedId));
            }
          } else if (payload.new) {
            const updatedProg = mapProgramFromDb(payload.new);
            setPrograms(prev => {
              const idx = prev.findIndex(p => p.id === updatedProg.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updatedProg;
                return deduplicateProgramsList(next);
              }
              return deduplicateProgramsList([...prev, updatedProg]);
            });
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setRegistrations(prev => prev.filter(r => r.id !== deletedId));
            }
          } else if (payload.new) {
            const updatedReg = mapRegistrationFromDb(payload.new);
            setRegistrations(prev => {
              const idx = prev.findIndex(r => r.id === updatedReg.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updatedReg;
                return next;
              }
              return [...prev, updatedReg];
            });
          }
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fest_settings' },
        (payload) => {
          if (payload.new) {
            const updatedSettings = mapSettingsFromDb(payload.new);
            setSettings(updatedSettings);
            setLastSyncedAt(new Date().toLocaleTimeString());
          }
        }
      )
      .subscribe((status) => {
        if (!isMounted) return;
        if (status === 'SUBSCRIBED') {
          setCloudStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setCloudStatus('offline');
        }
      });

    // Auto-resync when browser comes back online
    const handleOnline = () => {
      loadCloudState();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper for recording audit logs with discrete database save
  const logAudit = (action: string, entity: AuditLog['entity'], details: string, performedBy: string, role: UserRole, entityId?: string) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      action,
      entity,
      entityId,
      details,
      performedBy,
      role,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 99)]);
    saveAuditLogDb(newLog).catch(e => console.error('Audit log persist error:', e));
  };

  // Pure Leaderboards (Filtered by active sections in Settings)
  const teamLeaderboard = useMemo(() => {
    return calculateTeamScores(teams, programs, results, settings);
  }, [teams, programs, results, settings]);

  const studentScores = useMemo(() => {
    return calculateStudentScores(students, teams, programs, results, settings);
  }, [students, teams, programs, results, settings]);

  const artsOverallWinner = useMemo(() => {
    if (settings.enableArtsSection === false || teamLeaderboard.length === 0) return null;
    const sorted = [...teamLeaderboard].sort((a, b) => b.artsTotalPoints - a.artsTotalPoints);
    return sorted[0]?.artsTotalPoints > 0 ? sorted[0] : null;
  }, [teamLeaderboard, settings.enableArtsSection]);

  const sportsOverallWinner = useMemo(() => {
    if (settings.enableSportsSection === false || teamLeaderboard.length === 0) return null;
    const sorted = [...teamLeaderboard].sort((a, b) => b.sportsTotalPoints - a.sportsTotalPoints);
    return sorted[0]?.sportsTotalPoints > 0 ? sorted[0] : null;
  }, [teamLeaderboard, settings.enableSportsSection]);

  // Keep live public JSONB result cache synchronized in Postgres
  useEffect(() => {
    if (!isInitialLoadDoneRef.current || isRemoteUpdatingRef.current) return;
    const timer = setTimeout(() => {
      // 1. Overall Team Leaderboard
      saveResultCacheDb('team_leaderboard_overall', teamLeaderboard).catch(console.error);

      // 2. Arts Team Leaderboard
      const artsSorted = [...teamLeaderboard].sort((a, b) => b.artsTotalPoints - a.artsTotalPoints);
      saveResultCacheDb('team_leaderboard_arts', artsSorted).catch(console.error);

      // 3. Sports Team Leaderboard
      const sportsSorted = [...teamLeaderboard].sort((a, b) => b.sportsTotalPoints - a.sportsTotalPoints);
      saveResultCacheDb('team_leaderboard_sports', sportsSorted).catch(console.error);

      // 4. Public Summary Card
      const summary = {
        totalCompetitions: programs.length,
        publishedCompetitions: results.filter(r => r.status === 'PUBLISHED').length,
        totalStudents: students.length,
        topArtsTeam: artsSorted[0] || null,
        topSportsTeam: sportsSorted[0] || null,
        updatedAt: new Date().toISOString()
      };
      saveResultCacheDb('public_summary', summary).catch(console.error);
    }, 1000);

    return () => clearTimeout(timer);
  }, [teamLeaderboard, programs.length, results, students.length]);

  // Manual full sync trigger
  const syncWithCloud = useCallback(async () => {
    setCloudStatus('syncing');
    const payload = {
      settings,
      teams,
      students,
      categoryConfigs,
      classMappings,
      programs,
      registrations,
      results,
      scoringConfigs,
      auditLogs
    };
    const res = await saveFullRelationalData(payload);
    if (res.success) {
      setCloudStatus('connected');
      setLastSyncedAt(new Date().toLocaleTimeString());
    } else {
      setCloudStatus('error');
    }
  }, [settings, teams, students, categoryConfigs, classMappings, programs, registrations, results, scoringConfigs, gradeConfigs, positionConfigs, auditLogs]);

  // Student Actions
  const addStudent = (studentData: Omit<Student, 'id' | 'createdDate'>, performedBy: string, role: UserRole) => {
    // 1. Resolve or verify category
    const category = studentData.category || resolveCategoryFromClass(studentData.classNumber, classMappings);
    if (!category) {
      return { success: false, error: `Please select a Category for Class ${studentData.classNumber} or configure Class Mapping first.` };
    }

    // 2. Duplicate admission number check
    if (students.some(s => s.admissionNo.toLowerCase() === studentData.admissionNo.trim().toLowerCase())) {
      return { success: false, error: `A student with Admission No. "${studentData.admissionNo}" already exists.` };
    }

    // 3. Duplicate chest number check (if provided)
    if (studentData.chestNumber) {
      const numericChest = Number(studentData.chestNumber);
      if (students.some(s => s.chestNumber && Number(s.chestNumber) === numericChest)) {
        return { success: false, error: `Chest Number #${numericChest} is already assigned to another student.` };
      }
    }

    const newStudent: Student = {
      ...studentData,
      id: 'st_' + Date.now(),
      category,
      chestNumber: studentData.chestNumber ? Number(studentData.chestNumber) : undefined,
      status: 'ACTIVE',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setStudents(prev => [...prev, newStudent]);
    saveStudentDb(newStudent).catch(console.error);
    logAudit('CREATE_STUDENT', 'STUDENT', `Enrolled student ${newStudent.name} (Adm: ${newStudent.admissionNo}, Class: ${newStudent.classNumber}, Cat: ${newStudent.category}${newStudent.chestNumber ? `, Chest: #${newStudent.chestNumber}` : ''})`, performedBy, role, newStudent.id);
    return { success: true };
  };

  const importStudentsBatch = (
    studentsList: Omit<Student, 'id' | 'createdDate'>[],
    performedBy: string,
    role: UserRole
  ) => {
    if (!studentsList || studentsList.length === 0) {
      return { success: false, count: 0, error: 'No student records provided for import.' };
    }

    const createdDate = new Date().toISOString().split('T')[0];
    const newStudents: Student[] = studentsList.map((st, idx) => ({
      ...st,
      id: 'st_imp_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5),
      chestNumber: st.chestNumber ? Number(st.chestNumber) : undefined,
      status: st.status || 'ACTIVE',
      createdDate
    }));

    setStudents(prev => [...prev, ...newStudents]);
    saveStudentsBatchDb(newStudents).catch(console.error);
    logAudit(
      'IMPORT_STUDENTS_CSV',
      'STUDENT',
      `Batch imported ${newStudents.length} students via CSV.`,
      performedBy,
      role
    );

    return { success: true, count: newStudents.length };
  };

  const updateStudent = (student: Student, performedBy: string, role: UserRole) => {
    const category = student.category || resolveCategoryFromClass(student.classNumber, classMappings);
    if (!category) {
      return { success: false, error: `Please select a Category for Class ${student.classNumber}.` };
    }

    if (student.chestNumber) {
      const numericChest = Number(student.chestNumber);
      if (students.some(s => s.id !== student.id && s.chestNumber && Number(s.chestNumber) === numericChest)) {
        return { success: false, error: `Chest Number #${numericChest} is already assigned to another student.` };
      }
    }

    const updated: Student = {
      ...student,
      category,
      chestNumber: student.chestNumber ? Number(student.chestNumber) : undefined
    };

    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    saveStudentDb(updated).catch(console.error);
    logAudit('UPDATE_STUDENT', 'STUDENT', `Updated student details for ${student.name} (${student.admissionNo})`, performedBy, role, student.id);
    return { success: true };
  };

  const deleteStudent = (studentId: string, performedBy: string, role: UserRole) => {
    const target = students.find(s => s.id === studentId);
    if (!target) return { success: false, error: 'Student not found.' };

    setStudents(prev => prev.filter(s => s.id !== studentId));
    // Also remove orphaned registrations
    setRegistrations(prev => prev.filter(r => r.studentId !== studentId));
    deleteStudentDb(studentId).catch(console.error);
    logAudit('DELETE_STUDENT', 'STUDENT', `Deleted student ${target.name} (Adm: ${target.admissionNo})`, performedBy, role, studentId);
    return { success: true };
  };

  const deleteStudentsBatch = (studentIds: string[], performedBy: string, role: UserRole) => {
    if (!studentIds || studentIds.length === 0) {
      return { success: false, count: 0, error: 'No students selected for deletion.' };
    }
    const idSet = new Set(studentIds);
    const affectedStudents = students.filter(s => idSet.has(s.id));
    if (affectedStudents.length === 0) {
      return { success: false, count: 0, error: 'No matching students found.' };
    }

    setStudents(prev => prev.filter(s => !idSet.has(s.id)));
    setRegistrations(prev => prev.filter(r => !idSet.has(r.studentId)));
    deleteStudentsBatchDb(studentIds).catch(console.error);

    const namesSample = affectedStudents.slice(0, 3).map(s => s.name).join(', ');
    const moreText = affectedStudents.length > 3 ? ` and ${affectedStudents.length - 3} more` : '';
    logAudit(
      'DELETE_STUDENT',
      'STUDENT',
      `Bulk deleted ${affectedStudents.length} students: ${namesSample}${moreText}`,
      performedBy,
      role
    );
    return { success: true, count: affectedStudents.length };
  };

  const transferStudentTeam = (studentId: string, targetTeamId: string, performedBy: string, role: UserRole) => {
    const student = students.find(s => s.id === studentId);
    const targetTeam = teams.find(t => t.id === targetTeamId);
    if (!student || !targetTeam) return { success: false, error: 'Student or Team not found.' };

    const updatedStudent = { ...student, teamId: targetTeamId };
    setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
    
    // Update active registrations
    const updatedRegs = registrations
      .filter(r => r.studentId === studentId)
      .map(r => ({ ...r, teamId: targetTeamId, teamName: targetTeam.name, teamColor: targetTeam.color }));

    setRegistrations(prev => prev.map(r => r.studentId === studentId ? { ...r, teamId: targetTeamId, teamName: targetTeam.name, teamColor: targetTeam.color } : r));
    
    saveStudentDb(updatedStudent).catch(console.error);
    if (updatedRegs.length > 0) {
      saveRegistrationsBatchDb(updatedRegs).catch(console.error);
    }
    
    logAudit('TRANSFER_STUDENT_TEAM', 'STUDENT', `Transferred ${student.name} to team ${targetTeam.name}`, performedBy, role, studentId);
    return { success: true };
  };

  // Class & Category Mapping
  const addClassMapping = (classNumber: string, category: FestCategory, description: string | undefined, performedBy: string, role: UserRole) => {
    const validation = validateClassCategoryMapping(classNumber, category, classMappings);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newMapping: ClassCategoryMapping = {
      id: 'map_' + Date.now(),
      classNumber: classNumber.trim(),
      category,
      description
    };

    setClassMappings(prev => [...prev, newMapping]);
    saveClassMappingDb(newMapping).catch(console.error);

    // Update Category Config assignedClasses
    setCategoryConfigs(prev => {
      const next = prev.map(c => {
        if (c.category === category) {
          const updated = {
            ...c,
            assignedClasses: Array.from(new Set([...c.assignedClasses, classNumber.trim()]))
          };
          saveCategoryConfigDb(updated).catch(console.error);
          return updated;
        }
        const filtered = {
          ...c,
          assignedClasses: c.assignedClasses.filter(cls => cls !== classNumber.trim())
        };
        saveCategoryConfigDb(filtered).catch(console.error);
        return filtered;
      });
      return next;
    });

    // Auto update existing students in this class
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.classNumber.trim() === classNumber.trim()) {
          const u = { ...s, category };
          saveStudentDb(u).catch(console.error);
          return u;
        }
        return s;
      });
      return updated;
    });

    logAudit('ADD_CLASS_MAPPING', 'SETTING', `Mapped Class ${classNumber} to Category ${category}`, performedBy, role);
    return { success: true };
  };

  const deleteClassMapping = (mappingId: string, performedBy: string, role: UserRole) => {
    const target = classMappings.find(m => m.id === mappingId);
    if (!target) return { success: false, error: 'Mapping not found.' };

    setClassMappings(prev => prev.filter(m => m.id !== mappingId));
    deleteClassMappingDb(mappingId).catch(console.error);

    setCategoryConfigs(prev => prev.map(c => {
      if (c.category === target.category) {
        const updated = {
          ...c,
          assignedClasses: c.assignedClasses.filter(cls => cls !== target.classNumber)
        };
        saveCategoryConfigDb(updated).catch(console.error);
        return updated;
      }
      return c;
    }));

    logAudit('DELETE_CLASS_MAPPING', 'SETTING', `Removed mapping for Class ${target.classNumber}`, performedBy, role);
    return { success: true };
  };

  const addCategoryConfig = (
    categoryData: Omit<CategoryConfig, 'id'>,
    assignedClasses: string[],
    performedBy: string,
    role: UserRole
  ) => {
    const cleanCategoryCode = (categoryData.category || categoryData.displayName)
      .trim()
      .toUpperCase()
      .replace(/[\s-]/g, '_') as FestCategory;

    if (!cleanCategoryCode) {
      return { success: false, error: 'Category code or name is required.' };
    }

    if (categoryConfigs.some(c => c.category === cleanCategoryCode)) {
      return { success: false, error: `Category "${cleanCategoryCode}" already exists.` };
    }

    const cleanClasses = Array.from(new Set(assignedClasses.map(c => c.trim()))).filter(Boolean);

    const newConfig: CategoryConfig = {
      ...categoryData,
      id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      category: cleanCategoryCode,
      displayName: categoryData.displayName.trim() || cleanCategoryCode,
      assignedClasses: cleanClasses,
      status: 'ACTIVE'
    };

    setCategoryConfigs(prev => [...prev, newConfig]);
    saveCategoryConfigDb(newConfig).catch(console.error);

    if (cleanClasses.length > 0) {
      const classSet = new Set(cleanClasses);
      const newMappings: ClassCategoryMapping[] = cleanClasses.map(cls => ({
        id: 'map_' + Date.now() + '_' + cls,
        classNumber: cls,
        category: cleanCategoryCode,
        description: `${newConfig.displayName} (Class ${cls})`
      }));

      setClassMappings(prev => [
        ...prev.filter(m => !classSet.has(m.classNumber)),
        ...newMappings
      ]);
      newMappings.forEach(m => saveClassMappingDb(m).catch(console.error));

      setStudents(prev => {
        const updated = prev.map(s => {
          if (classSet.has(s.classNumber.trim())) {
            const u = { ...s, category: cleanCategoryCode };
            saveStudentDb(u).catch(console.error);
            return u;
          }
          return s;
        });
        return updated;
      });
    }

    logAudit('CREATE_CATEGORY', 'SETTING', `Created Category "${newConfig.displayName}" (${newConfig.category}) with ${cleanClasses.length} assigned classes`, performedBy, role);
    return { success: true, config: newConfig };
  };

  const deleteCategoryConfig = (categoryId: string, performedBy: string, role: UserRole) => {
    const target = categoryConfigs.find(c => c.id === categoryId);
    if (!target) return { success: false, error: 'Category not found.' };

    setCategoryConfigs(prev => prev.filter(c => c.id !== categoryId));
    deleteCategoryConfigDb(categoryId).catch(console.error);
    setClassMappings(prev => prev.filter(m => m.category !== target.category));
    logAudit('DELETE_CATEGORY', 'SETTING', `Deleted Category "${target.displayName}"`, performedBy, role);
    return { success: true };
  };

  const updateCategoryConfig = (
    config: CategoryConfig,
    newAssignedClasses?: string[],
    performedBy = 'Administrator',
    role: UserRole = 'ADMIN'
  ) => {
    const existing = categoryConfigs.find(c => c.id === config.id);
    const oldCategoryCode = existing?.category;
    const newCategoryCode = (config.category || config.displayName)
      .trim()
      .toUpperCase()
      .replace(/[\s-]/g, '_') as FestCategory;

    const cleanClasses = newAssignedClasses !== undefined 
      ? Array.from(new Set(newAssignedClasses.map(c => c.trim()))).filter(Boolean)
      : config.assignedClasses;

    const updatedConfig: CategoryConfig = {
      ...config,
      category: newCategoryCode,
      displayName: config.displayName.trim() || newCategoryCode,
      sectionScope: config.sectionScope || 'ALL',
      assignedClasses: cleanClasses
    };

    setCategoryConfigs(prev => {
      const next = prev.map(c => c.id === config.id ? updatedConfig : c);
      saveCategoryConfigDb(updatedConfig, next).catch(console.error);
      return next;
    });

    // If category code changed, cascade updates to classMappings, students, programs, registrations
    if (oldCategoryCode && oldCategoryCode !== newCategoryCode) {
      setClassMappings(prev => prev.map(m => m.category === oldCategoryCode ? { ...m, category: newCategoryCode } : m));
      setStudents(prev => prev.map(s => s.category === oldCategoryCode ? { ...s, category: newCategoryCode } : s));
      setPrograms(prev => prev.map(p => p.category === oldCategoryCode ? { ...p, category: newCategoryCode } : p));
      setRegistrations(prev => prev.map(r => r.category === oldCategoryCode ? { ...r, category: newCategoryCode } : r));
    }

    if (newAssignedClasses !== undefined) {
      const assignedSet = new Set(cleanClasses);
      const newMappings: ClassCategoryMapping[] = cleanClasses.map(cls => ({
        id: 'map_' + Date.now() + '_' + cls,
        classNumber: cls,
        category: newCategoryCode,
        description: `${updatedConfig.displayName} (Class ${cls})`
      }));

      setClassMappings(prev => {
        const otherMappings = prev.filter(m => m.category !== newCategoryCode && !assignedSet.has(m.classNumber));
        return [...otherMappings, ...newMappings];
      });
      newMappings.forEach(m => saveClassMappingDb(m).catch(console.error));

      setStudents(prev => prev.map(s => {
        if (assignedSet.has(s.classNumber.trim())) {
          const u = { ...s, category: newCategoryCode };
          saveStudentDb(u).catch(console.error);
          return u;
        }
        return s;
      }));
    }

    logAudit('UPDATE_CATEGORY_CONFIG', 'SETTING', `Updated config & classes for category "${updatedConfig.displayName}"`, performedBy, role);
    return { success: true };
  };

  // Chest Number Generator
  const runChestNumberGenerator = (preserveExisting: boolean, performedBy: string, role: UserRole) => {
    const genResult = generateChestNumbers(students, categoryConfigs, preserveExisting);
    if (genResult.errors.length > 0 && genResult.assignedCount === 0) {
      return {
        success: false,
        assigned: 0,
        skipped: genResult.skippedCount,
        errors: genResult.errors
      };
    }

    setStudents(genResult.updatedStudents);
    saveStudentsBatchDb(genResult.updatedStudents).catch(console.error);
    logAudit(
      'GENERATE_CHEST_NUMBERS',
      'CHEST_NUMBER',
      `Auto-generated chest numbers. Assigned: ${genResult.assignedCount}, Preserved: ${genResult.skippedCount}.`,
      performedBy,
      role
    );

    return {
      success: true,
      assigned: genResult.assignedCount,
      skipped: genResult.skippedCount,
      errors: genResult.errors
    };
  };

  const assignManualChestNumber = (studentId: string, chestNumber: number, performedBy: string, role: UserRole) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { success: false, error: 'Student not found.' };

    const validation = validateManualChestNumber(chestNumber, studentId, student.category, students, categoryConfigs);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const updated = { ...student, chestNumber };
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    saveStudentDb(updated).catch(console.error);

    // Update in active registrations
    setRegistrations(prev => {
      const nextRegs = prev.map(r => r.studentId === studentId ? { ...r, chestNumber } : r);
      const studentRegs = nextRegs.filter(r => r.studentId === studentId);
      if (studentRegs.length > 0) {
        saveRegistrationsBatchDb(studentRegs).catch(console.error);
      }
      return nextRegs;
    });

    logAudit('ASSIGN_CHEST_NO', 'CHEST_NUMBER', `Manually assigned Chest #${chestNumber} to ${student.name}`, performedBy, role, studentId);
    return { success: true };
  };

  // Program Actions
  const addProgram = (progData: Omit<Program, 'id'>, performedBy: string, role: UserRole) => {
    const newProg: Program = {
      ...progData,
      id: 'prog_' + Date.now()
    };
    setPrograms(prev => [...prev, newProg]);
    saveProgramDb(newProg).catch(console.error);
    logAudit('CREATE_PROGRAM', 'PROGRAM', `Created program: "${newProg.name}" (${newProg.section} - ${newProg.category})`, performedBy, role, newProg.id);
    return { success: true };
  };

  const importProgramsBatch = (
    programsList: Omit<Program, 'id'>[],
    performedBy: string,
    role: UserRole
  ) => {
    if (!programsList || programsList.length === 0) {
      return { success: false, count: 0, error: 'No program records provided for import.' };
    }

    const newPrograms: Program[] = programsList.map((prog, idx) => ({
      ...prog,
      id: 'prog_imp_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5),
      status: prog.status || 'UPCOMING',
      resultStatus: prog.resultStatus || 'PENDING'
    }));

    setPrograms(prev => [...prev, ...newPrograms]);
    saveProgramsBatchDb(newPrograms).catch(console.error);
    logAudit(
      'IMPORT_PROGRAMS_CSV',
      'PROGRAM',
      `Batch imported ${newPrograms.length} competition programs via CSV.`,
      performedBy,
      role
    );

    return { success: true, count: newPrograms.length };
  };

  const updateProgram = (program: Program, performedBy: string, role: UserRole) => {
    setPrograms(prev => prev.map(p => p.id === program.id ? program : p));
    saveProgramDb(program).catch(console.error);
    logAudit('UPDATE_PROGRAM', 'PROGRAM', `Updated program details: "${program.name}"`, performedBy, role, program.id);
    return { success: true };
  };

  const deleteProgram = (programId: string, performedBy: string, role: UserRole) => {
    const prog = programs.find(p => p.id === programId);
    if (!prog) return { success: false, error: 'Program not found.' };

    setPrograms(prev => prev.filter(p => p.id !== programId));
    setRegistrations(prev => prev.filter(r => r.programId !== programId));
    setResults(prev => prev.filter(r => r.programId !== programId));
    deleteProgramDb(programId).catch(console.error);
    logAudit('DELETE_PROGRAM', 'PROGRAM', `Deleted program: "${prog.name}"`, performedBy, role, programId);
    return { success: true };
  };

  const deleteProgramsBatch = (programIds: string[], performedBy: string, role: UserRole) => {
    if (!programIds || programIds.length === 0) {
      return { success: false, count: 0, error: 'No programs selected for deletion.' };
    }
    const idSet = new Set(programIds);
    setPrograms(prev => prev.filter(p => !idSet.has(p.id)));
    setRegistrations(prev => prev.filter(r => !idSet.has(r.programId)));
    setResults(prev => prev.filter(r => !idSet.has(r.programId)));
    deleteProgramsBatchDb(programIds).catch(console.error);
    logAudit(
      'DELETE_PROGRAM',
      'PROGRAM',
      `Bulk deleted ${programIds.length} programs`,
      performedBy,
      role
    );
    return { success: true, count: programIds.length };
  };

  // Team Actions
  const addTeam = (teamData: Omit<Team, 'id'>, performedBy: string, role: UserRole) => {
    const newTeam: Team = {
      ...teamData,
      id: 'team_' + Date.now()
    };
    setTeams(prev => [...prev, newTeam]);
    saveTeamDb(newTeam).catch(console.error);
    logAudit('CREATE_TEAM', 'TEAM', `Created team: ${newTeam.name} (${newTeam.code})`, performedBy, role, newTeam.id);
    return { success: true };
  };

  const updateTeam = (team: Team, performedBy: string, role: UserRole) => {
    setTeams(prev => prev.map(t => t.id === team.id ? team : t));
    saveTeamDb(team).catch(console.error);
    logAudit('UPDATE_TEAM', 'TEAM', `Updated team: ${team.name}`, performedBy, role, team.id);
    return { success: true };
  };

  const deleteTeam = (teamId: string, performedBy: string, role: UserRole) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found.' };

    setTeams(prev => prev.filter(t => t.id !== teamId));
    setStudents(prev => prev.map(s => s.teamId === teamId ? { ...s, teamId: '' } : s));
    setRegistrations(prev => prev.filter(r => r.teamId !== teamId));
    deleteTeamDb(teamId).catch(console.error);

    logAudit('DELETE_TEAM', 'TEAM', `Deleted house/team "${team.name}" (${team.code})`, performedBy, role, teamId);
    return { success: true };
  };

  // Registration Actions
  const registerIndividualStudent = (studentId: string, programId: string, performedBy: string, role: UserRole) => {
    if (!settings.registrationOpen && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, error: 'Registration is currently closed by the Admin.' };
    }

    const student = students.find(s => s.id === studentId);
    const program = programs.find(p => p.id === programId);
    if (!student || !program) {
      return { success: false, error: 'Student or Program not found.' };
    }

    if (!student.chestNumber) {
      return { success: false, error: `Student "${student.name}" does not have a chest number assigned yet.` };
    }

    const team = teams.find(t => t.id === student.teamId);

    // Business validation
    const validation = validateIndividualRegistration(student, program, registrations, categoryConfigs, settings.maxIndividualProgramsDefault);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newReg: Registration = {
      id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      programId: program.id,
      programName: program.name,
      section: program.section,
      subsection: program.subsection,
      category: program.category,
      programType: 'INDIVIDUAL',
      teamId: student.teamId,
      teamName: team ? team.name : 'Unknown Team',
      teamColor: team ? team.color : '#6b7280',
      studentId: student.id,
      studentName: student.name,
      admissionNo: student.admissionNo,
      chestNumber: student.chestNumber,
      classNumber: student.classNumber,
      registeredBy: performedBy,
      registeredRole: role,
      timestamp: new Date().toISOString(),
      status: 'CONFIRMED'
    };

    setRegistrations(prev => [...prev, newReg]);
    saveRegistrationDb(newReg).catch(console.error);
    logAudit('REGISTER_INDIVIDUAL', 'REGISTRATION', `Registered ${student.name} (Chest #${student.chestNumber}) for "${program.name}"`, performedBy, role, newReg.id);
    return { success: true };
  };

  const registerGroupStudents = (
    teamId: string,
    programId: string,
    groupName: string,
    selectedStudentIds: string[],
    performedBy: string,
    role: UserRole
  ) => {
    if (!settings.registrationOpen && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, error: 'Registration is currently closed by the Admin.' };
    }

    const program = programs.find(p => p.id === programId);
    const team = teams.find(t => t.id === teamId);
    if (!program || !team) return { success: false, error: 'Program or Team not found.' };

    const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));
    if (selectedStudents.length !== selectedStudentIds.length) {
      return { success: false, error: 'Some selected students were not found.' };
    }

    const validation = validateGroupRegistration(teamId, selectedStudents, program, registrations);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Auto-calculate sequential group number within this team for this program
    const existingTeamGroups = registrations.filter(
      r => r.programId === programId && r.teamId === teamId && r.status === 'CONFIRMED'
    );
    const existingGroupNumbers = existingTeamGroups.map(g => g.groupNumber || 1);
    let nextGroupNumber = 1;
    while (existingGroupNumbers.includes(nextGroupNumber)) {
      nextGroupNumber++;
    }

    const finalGroupName = groupName.trim() || `${team.name} - Group ${nextGroupNumber}`;
    const generatedGroupId = `GRP-${team.code}-${program.code || program.id.slice(-4)}-G${nextGroupNumber}`;

    const newReg: Registration = {
      id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      programId: program.id,
      programName: program.name,
      section: program.section,
      subsection: program.subsection,
      category: program.category,
      programType: program.programType,
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      groupId: generatedGroupId,
      groupNumber: nextGroupNumber,
      groupName: finalGroupName,
      groupMembers: selectedStudents.map(s => ({
        studentId: s.id,
        name: s.name,
        chestNumber: s.chestNumber,
        admissionNo: s.admissionNo,
        classNumber: s.classNumber
      })),
      registeredBy: performedBy,
      registeredRole: role,
      timestamp: new Date().toISOString(),
      status: 'CONFIRMED'
    };

    setRegistrations(prev => [...prev, newReg]);
    saveRegistrationDb(newReg).catch(console.error);
    logAudit('REGISTER_GROUP', 'REGISTRATION', `Registered group "${newReg.groupName}" (${selectedStudents.length} members) for "${program.name}"`, performedBy, role, newReg.id);
    return { success: true };
  };

  const updateGroupStudents = (
    registrationId: string,
    groupName: string,
    selectedStudentIds: string[],
    performedBy: string,
    role: UserRole
  ) => {
    if (!settings.registrationOpen && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, error: 'Registration is closed. You can no longer edit this registration.' };
    }

    const existingReg = registrations.find(r => r.id === registrationId);
    if (!existingReg) return { success: false, error: 'Group registration not found.' };

    const program = programs.find(p => p.id === existingReg.programId);
    if (!program) return { success: false, error: 'Program not found.' };

    const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));
    if (selectedStudents.length !== selectedStudentIds.length) {
      return { success: false, error: 'Some selected students were not found.' };
    }

    const validation = validateGroupRegistration(
      existingReg.teamId,
      selectedStudents,
      program,
      registrations,
      registrationId
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const finalGroupName = groupName.trim() || existingReg.groupName || `${existingReg.teamName} Group`;

    const updatedReg: Registration = {
      ...existingReg,
      groupName: finalGroupName,
      groupMembers: selectedStudents.map(s => ({
        studentId: s.id,
        name: s.name,
        chestNumber: s.chestNumber,
        admissionNo: s.admissionNo,
        classNumber: s.classNumber
      }))
    };

    setRegistrations(prev =>
      prev.map(r => r.id === registrationId ? updatedReg : r)
    );
    saveRegistrationDb(updatedReg).catch(console.error);

    logAudit(
      'UPDATE_GROUP' as any,
      'REGISTRATION',
      `Updated members for group "${finalGroupName}" in "${program.name}"`,
      performedBy,
      role,
      registrationId
    );

    return { success: true };
  };

  const deleteGroupRegistration = (
    registrationId: string,
    performedBy: string,
    role: UserRole
  ) => {
    return withdrawRegistration(registrationId, performedBy, role);
  };

  const withdrawRegistration = (registrationId: string, performedBy: string, role: UserRole) => {
    if (!settings.registrationOpen && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, error: 'Registration is closed. You can no longer modify or withdraw registrations.' };
    }

    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) return { success: false, error: 'Registration not found.' };

    setRegistrations(prev => prev.filter(r => r.id !== registrationId));
    deleteRegistrationDb(registrationId).catch(console.error);
    logAudit('WITHDRAW_REGISTRATION', 'REGISTRATION', `Withdrew registration for "${reg.programName}" (${reg.studentName || reg.groupName})`, performedBy, role, registrationId);
    return { success: true };
  };

  const clearAllRegistrations = (performedBy: string, role: UserRole): { success: boolean; count: number; error?: string } => {
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, count: 0, error: 'Only Administrators can clear all registrations.' };
    }

    const count = registrations.length;
    setRegistrations([]);
    clearAllRegistrationsDb().catch(console.error);
    logAudit('CLEAR_ALL_REGISTRATIONS', 'REGISTRATION', `Cleared all ${count} registrations across all houses`, performedBy, role);
    return { success: true, count };
  };

  const clearRegistrationsByTeam = (teamId: string, performedBy: string, role: UserRole): { success: boolean; count: number; error?: string } => {
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, count: 0, error: 'Only Administrators can clear house registrations.' };
    }

    const team = teams.find(t => t.id === teamId);
    const affected = registrations.filter(r => r.teamId === teamId);
    const count = affected.length;

    setRegistrations(prev => prev.filter(r => r.teamId !== teamId));
    deleteRegistrationsByTeamDb(teamId).catch(console.error);
    logAudit('CLEAR_TEAM_REGISTRATIONS', 'REGISTRATION', `Cleared ${count} registrations for house "${team?.name || teamId}"`, performedBy, role);
    return { success: true, count };
  };

  const deleteRegistrationsBatch = (registrationIds: string[], performedBy: string, role: UserRole): { success: boolean; count: number; error?: string } => {
    if (!settings.registrationOpen && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, count: 0, error: 'Registration is closed.' };
    }

    if (!registrationIds.length) return { success: true, count: 0 };

    const idSet = new Set(registrationIds);
    setRegistrations(prev => prev.filter(r => !idSet.has(r.id)));
    deleteRegistrationsBatchDb(registrationIds).catch(console.error);
    logAudit('BATCH_DELETE_REGISTRATIONS', 'REGISTRATION', `Deleted ${registrationIds.length} selected registrations`, performedBy, role);
    return { success: true, count: registrationIds.length };
  };

  const importIndividualRegistrationsBatch = (
    entries: { studentId: string; programId: string }[],
    performedBy: string,
    role: UserRole
  ): { success: boolean; count: number; error?: string } => {
    if (!settings.registrationOpen && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, count: 0, error: 'Registration is currently closed by the Admin.' };
    }

    if (!entries.length) {
      return { success: false, count: 0, error: 'No registrations provided to import.' };
    }

    const newRegs: Registration[] = [];
    let importedCount = 0;
    const batchTeamProgramCounts = new Map<string, number>();

    for (const ent of entries) {
      const student = students.find(s => s.id === ent.studentId);
      const program = programs.find(p => p.id === ent.programId);
      if (!student || !program) continue;

      const team = teams.find(t => t.id === student.teamId);
      const teamId = student.teamId || '';
      const pairKey = `${program.id}_${teamId}`;

      // Enforce duplicate check
      const alreadyRegistered = registrations.some(
        r => r.programId === program.id && r.studentId === student.id && r.status === 'CONFIRMED'
      ) || newRegs.some(r => r.programId === program.id && r.studentId === student.id);
      if (alreadyRegistered) continue;

      // Enforce team candidate quota for individual programs
      const maxAllowed = program.maxParticipants || 1;
      const existingTeamCount = registrations.filter(
        r => r.programId === program.id && r.teamId === teamId && r.programType === 'INDIVIDUAL' && r.status === 'CONFIRMED'
      ).length;
      const currentBatchCount = batchTeamProgramCounts.get(pairKey) || 0;

      if (existingTeamCount + currentBatchCount >= maxAllowed) {
        continue; // Skip entries exceeding team quota
      }

      batchTeamProgramCounts.set(pairKey, currentBatchCount + 1);

      const newReg: Registration = {
        id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + importedCount,
        programId: program.id,
        programName: program.name,
        section: program.section,
        subsection: program.subsection,
        category: program.category,
        programType: 'INDIVIDUAL',
        teamId: student.teamId,
        teamName: team ? team.name : 'Unknown Team',
        teamColor: team ? team.color : '#6b7280',
        studentId: student.id,
        studentName: student.name,
        admissionNo: student.admissionNo,
        chestNumber: student.chestNumber,
        classNumber: student.classNumber,
        registeredBy: performedBy,
        registeredRole: role,
        timestamp: new Date().toISOString(),
        status: 'CONFIRMED'
      };

      newRegs.push(newReg);
      importedCount++;
    }

    if (newRegs.length > 0) {
      setRegistrations(prev => [...prev, ...newRegs]);
      saveRegistrationsBatchDb(newRegs).catch(console.error);
      logAudit(
        'REGISTER_INDIVIDUAL',
        'REGISTRATION',
        `Bulk imported ${newRegs.length} individual candidate registrations via CSV`,
        performedBy,
        role
      );
    }

    return { success: true, count: importedCount };
  };

  const importGroupRegistrationsBatch = (
    entries: { programId: string; groupName: string; studentIds: string[] }[],
    teamId: string,
    performedBy: string,
    role: UserRole
  ): { success: boolean; count: number; error?: string } => {
    if (!settings.registrationOpen && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { success: false, count: 0, error: 'Registration is currently closed by the Admin.' };
    }

    if (!entries.length) {
      return { success: false, count: 0, error: 'No group registrations provided to import.' };
    }

    const team = teams.find(t => t.id === teamId);
    if (!team) return { success: false, count: 0, error: 'Team not found.' };

    const newRegs: Registration[] = [];
    let importedCount = 0;

    for (const ent of entries) {
      const program = programs.find(p => p.id === ent.programId);
      if (!program) continue;

      const groupStudents = students.filter(s => ent.studentIds.includes(s.id));
      if (!groupStudents.length) continue;

      const existingTeamGroups = [...registrations, ...newRegs].filter(
        r => r.programId === program.id && r.teamId === teamId && r.status === 'CONFIRMED'
      );
      const existingGroupNumbers = existingTeamGroups.map(g => g.groupNumber || 1);
      let nextGroupNumber = 1;
      while (existingGroupNumbers.includes(nextGroupNumber)) {
        nextGroupNumber++;
      }

      const finalGroupName = ent.groupName.trim() || `${team.name} - Group ${nextGroupNumber}`;
      const generatedGroupId = `GRP-${team.code}-${program.code || program.id.slice(-4)}-G${nextGroupNumber}`;

      const newReg: Registration = {
        id: 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + importedCount,
        programId: program.id,
        programName: program.name,
        section: program.section,
        subsection: program.subsection,
        category: program.category,
        programType: program.programType,
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        groupId: generatedGroupId,
        groupNumber: nextGroupNumber,
        groupName: finalGroupName,
        groupMembers: groupStudents.map(s => ({
          studentId: s.id,
          name: s.name,
          chestNumber: s.chestNumber,
          admissionNo: s.admissionNo,
          classNumber: s.classNumber
        })),
        registeredBy: performedBy,
        registeredRole: role,
        timestamp: new Date().toISOString(),
        status: 'CONFIRMED'
      };

      newRegs.push(newReg);
      importedCount++;
    }

    if (newRegs.length > 0) {
      setRegistrations(prev => [...prev, ...newRegs]);
      saveRegistrationsBatchDb(newRegs).catch(console.error);
      logAudit(
        'REGISTER_GROUP',
        'REGISTRATION',
        `Bulk imported ${newRegs.length} group registrations via CSV for ${team.name}`,
        performedBy,
        role
      );
    }

    return { success: true, count: importedCount };
  };

  // Result Actions with Atomic Point Recalculation
  const saveOrSubmitResult = (
    resultData: Omit<ProgramResult, 'id'> & { id?: string },
    isPublish: boolean,
    performedBy: string,
    role: UserRole
  ) => {
    const program = programs.find(p => p.id === resultData.programId);
    if (!program) return { success: false, error: 'Program not found.' };

    const progType = program.programType || 'INDIVIDUAL';

    // Atomic recalculation for every entry based on current Grade & Position configs for this ProgramType
    const computedEntries: ResultEntry[] = resultData.entries.map(ent => {
      const calc = calculateEntryPoints(ent.position, ent.grade, progType, scoringConfigs);
      return {
        ...ent,
        positionPoints: calc.positionPoints,
        gradePoints: calc.gradePoints,
        totalPoints: calc.totalPoints
      };
    });

    const resultId = resultData.id || ('res_' + Date.now());
    const finalResult: ProgramResult = {
      ...resultData,
      id: resultId,
      programType: progType,
      entries: computedEntries,
      status: isPublish ? 'PUBLISHED' : (resultData.status || 'DRAFT'),
      submittedBy: performedBy,
      submittedAt: resultData.submittedAt || new Date().toISOString(),
      publishedAt: isPublish ? new Date().toISOString() : resultData.publishedAt
    };

    // Replace or insert locally
    setResults(prev => {
      const existingIdx = prev.findIndex(r => r.programId === finalResult.programId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = finalResult;
        return next;
      }
      return [...prev, finalResult];
    });

    // Update program status
    setPrograms(prev => prev.map(p => {
      if (p.id === finalResult.programId) {
        return {
          ...p,
          resultStatus: finalResult.status,
          status: isPublish ? 'COMPLETED' : p.status
        };
      }
      return p;
    }));

    // Save directly to relational table in Supabase
    saveResultDb(finalResult).catch(console.error);

    logAudit(
      isPublish ? 'PUBLISH_RESULT' : 'SUBMIT_RESULT',
      'RESULT',
      `${isPublish ? 'Published' : 'Saved'} result for "${finalResult.programName}" (${progType}) with ${computedEntries.length} evaluated participants.`,
      performedBy,
      role,
      resultId
    );

    return { success: true };
  };

  const unpublishResult = (programId: string, performedBy: string, role: UserRole) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return { success: false, error: 'Program not found.' };

    const targetResult = results.find(r => r.programId === programId);

    setResults(prev => prev.map(r => {
      if (r.programId === programId) {
        return {
          ...r,
          status: 'DRAFT',
          publishedAt: undefined
        };
      }
      return r;
    }));

    setPrograms(prev => prev.map(p => {
      if (p.id === programId) {
        return {
          ...p,
          resultStatus: 'DRAFT',
          status: 'ONGOING'
        };
      }
      return p;
    }));

    if (targetResult) {
      saveResultDb({
        ...targetResult,
        status: 'DRAFT',
        publishedAt: undefined
      }).catch(console.error);
    }

    logAudit(
      'UNPUBLISH_RESULT' as any,
      'RESULT',
      `Unpublished result for "${program.name}". Reverted to draft.`,
      performedBy,
      role,
      programId
    );

    return { success: true };
  };

  const deleteResult = (programId: string, performedBy: string, role: UserRole) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return { success: false, error: 'Program not found.' };

    setResults(prev => prev.filter(r => r.programId !== programId));

    setPrograms(prev => prev.map(p => {
      if (p.id === programId) {
        return {
          ...p,
          resultStatus: 'PENDING',
          status: 'ONGOING'
        };
      }
      return p;
    }));

    deleteResultDb(programId).catch(console.error);

    logAudit(
      'DELETE_RESULT' as any,
      'RESULT',
      `Removed result record for "${program.name}". Reset to pending evaluation.`,
      performedBy,
      role,
      programId
    );

    return { success: true };
  };

  // Program Type Specific Scoring Config Actions
  const updateProgramTypePositionConfig = (
    progType: ProgramType,
    config: PositionPointConfig,
    performedBy: string,
    role: UserRole
  ) => {
    const currentProgConfig = scoringConfigs[progType] || INITIAL_SCORING_CONFIGS[progType];
    const updatedPositions = currentProgConfig.positionConfigs.map(c => c.id === config.id ? config : c);
    const nextScoringConfigs: ScoringConfigMap = {
      ...scoringConfigs,
      [progType]: {
        ...currentProgConfig,
        positionConfigs: updatedPositions
      }
    };

    setScoringConfigs(nextScoringConfigs);
    saveScoringConfigsDb(nextScoringConfigs).catch(console.error);

    if (progType === 'INDIVIDUAL') {
      setPositionConfigs(updatedPositions);
    }

    // Trigger atomic recalculation across existing results matching this program type
    setResults(prevResults =>
      prevResults.map(r => {
        const prog = programs.find(p => p.id === r.programId);
        const rProgType = prog?.programType || r.programType || 'INDIVIDUAL';
        if (rProgType !== progType) return r;

        const updatedResult = {
          ...r,
          entries: r.entries.map(ent => {
            const calc = calculateEntryPoints(ent.position, ent.grade, rProgType, nextScoringConfigs);
            return {
              ...ent,
              positionPoints: calc.positionPoints,
              gradePoints: calc.gradePoints,
              totalPoints: calc.totalPoints
            };
          })
        };
        saveResultDb(updatedResult).catch(console.error);
        return updatedResult;
      })
    );

    logAudit('UPDATE_POSITION_CONFIG', 'SETTING', `Updated [${progType}] Position ${config.position} points to ${config.points}`, performedBy, role);
  };

  const updateProgramTypeGradeConfig = (
    progType: ProgramType,
    config: GradePointConfig,
    performedBy: string,
    role: UserRole
  ) => {
    const currentProgConfig = scoringConfigs[progType] || INITIAL_SCORING_CONFIGS[progType];
    const updatedGrades = currentProgConfig.gradeConfigs.map(c => c.id === config.id ? config : c);
    const nextScoringConfigs: ScoringConfigMap = {
      ...scoringConfigs,
      [progType]: {
        ...currentProgConfig,
        gradeConfigs: updatedGrades
      }
    };

    setScoringConfigs(nextScoringConfigs);
    saveScoringConfigsDb(nextScoringConfigs).catch(console.error);

    if (progType === 'INDIVIDUAL') {
      setGradeConfigs(updatedGrades);
    }

    // Trigger atomic recalculation across existing results matching this program type
    setResults(prevResults =>
      prevResults.map(r => {
        const prog = programs.find(p => p.id === r.programId);
        const rProgType = prog?.programType || r.programType || 'INDIVIDUAL';
        if (rProgType !== progType) return r;

        const updatedResult = {
          ...r,
          entries: r.entries.map(ent => {
            const calc = calculateEntryPoints(ent.position, ent.grade, rProgType, nextScoringConfigs);
            return {
              ...ent,
              positionPoints: calc.positionPoints,
              gradePoints: calc.gradePoints,
              totalPoints: calc.totalPoints
            };
          })
        };
        saveResultDb(updatedResult).catch(console.error);
        return updatedResult;
      })
    );

    logAudit('UPDATE_GRADE_CONFIG', 'SETTING', `Updated [${progType}] Grade ${config.grade} points to ${config.points}`, performedBy, role);
  };

  // Backward compatible actions
  const updateGradeConfig = (config: GradePointConfig, performedBy: string, role: UserRole) => {
    updateProgramTypeGradeConfig('INDIVIDUAL', config, performedBy, role);
  };

  const updatePositionConfig = (config: PositionPointConfig, performedBy: string, role: UserRole) => {
    updateProgramTypePositionConfig('INDIVIDUAL', config, performedBy, role);
  };

  const updateSettings = (newSettings: Partial<FestSettings>, performedBy: string, role: UserRole) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettingsDb(updated).catch(console.error);
    logAudit('UPDATE_SETTINGS', 'SETTING', `Updated general fest settings`, performedBy, role);
  };

  // Utilities
  const resetToDefaultData = () => {
    localStorage.clear();
    setSettings(INITIAL_SETTINGS);
    setTeams(INITIAL_TEAMS);
    setStudents(INITIAL_STUDENTS);
    setCategoryConfigs(INITIAL_CATEGORY_CONFIGS);
    setClassMappings(INITIAL_CLASS_MAPPINGS);
    setPrograms(INITIAL_PROGRAMS);
    setRegistrations(INITIAL_REGISTRATIONS);
    setResults(INITIAL_RESULTS);
    setScoringConfigs(INITIAL_SCORING_CONFIGS);
    setGradeConfigs(INITIAL_GRADE_CONFIGS);
    setPositionConfigs(INITIAL_POSITION_CONFIGS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
  };

  const exportDatabaseJSON = () => {
    const backup = {
      settings,
      teams,
      students,
      categoryConfigs,
      classMappings,
      programs,
      registrations,
      results,
      scoringConfigs,
      gradeConfigs,
      positionConfigs,
      auditLogs,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings && data.teams && data.students && data.programs) {
        setSettings(data.settings);
        setTeams(data.teams);
        setStudents(data.students);
        if (data.categoryConfigs) setCategoryConfigs(data.categoryConfigs);
        if (data.classMappings) setClassMappings(data.classMappings);
        if (data.programs) setPrograms(data.programs);
        if (data.registrations) setRegistrations(data.registrations);
        if (data.results) setResults(data.results);
        if (data.scoringConfigs) {
          setScoringConfigs(data.scoringConfigs);
          if (data.scoringConfigs.INDIVIDUAL) {
            setGradeConfigs(data.scoringConfigs.INDIVIDUAL.gradeConfigs);
            setPositionConfigs(data.scoringConfigs.INDIVIDUAL.positionConfigs);
          }
        } else {
          if (data.gradeConfigs) setGradeConfigs(data.gradeConfigs);
          if (data.positionConfigs) setPositionConfigs(data.positionConfigs);
        }
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        return { success: true };
      }
      return { success: false, error: 'Invalid backup file structure.' };
    } catch (e) {
      return { success: false, error: 'JSON parsing failed. Ensure the file is valid.' };
    }
  };

  return (
    <FestDataContext.Provider
      value={{
        settings,
        teams,
        students,
        categoryConfigs,
        classMappings,
        programs,
        registrations,
        results,
        scoringConfigs,
        gradeConfigs,
        positionConfigs,
        auditLogs,
        teamLeaderboard,
        studentScores,
        artsOverallWinner,
        sportsOverallWinner,
        addStudent,
        importStudentsBatch,
        updateStudent,
        deleteStudent,
        deleteStudentsBatch,
        transferStudentTeam,
        addClassMapping,
        deleteClassMapping,
        addCategoryConfig,
        updateCategoryConfig,
        deleteCategoryConfig,
        runChestNumberGenerator,
        assignManualChestNumber,
        addProgram,
        importProgramsBatch,
        updateProgram,
        deleteProgram,
        deleteProgramsBatch,
        addTeam,
        updateTeam,
        deleteTeam,
        registerIndividualStudent,
        importIndividualRegistrationsBatch,
        registerGroupStudents,
        importGroupRegistrationsBatch,
        updateGroupStudents,
        deleteGroupRegistration,
        withdrawRegistration,
        clearAllRegistrations,
        clearRegistrationsByTeam,
        deleteRegistrationsBatch,
        saveOrSubmitResult,
        unpublishResult,
        deleteResult,
        updateProgramTypePositionConfig,
        updateProgramTypeGradeConfig,
        updateGradeConfig,
        updatePositionConfig,
        updateSettings,
        resetToDefaultData,
        exportDatabaseJSON,
        importDatabaseJSON,
        cloudStatus,
        lastSyncedAt,
        syncWithCloud
      }}
    >
      {children}
    </FestDataContext.Provider>
  );
};

export const useFestData = () => {
  const context = useContext(FestDataContext);
  if (!context) {
    throw new Error('useFestData must be used within a FestDataProvider');
  }
  return context;
};
