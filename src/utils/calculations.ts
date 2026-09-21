import {
  FestCategory,
  FestSection,
  GradePointConfig,
  PositionPointConfig,
  Program,
  ProgramResult,
  ResultEntry,
  Student,
  StudentScoreBreakdown,
  Team,
  TeamScoreBreakdown,
  AwardPosition,
  AwardGrade,
  ProgramType,
  ScoringConfigMap
} from '../types';

/**
 * Calculates points for a single result entry based on Admin's grade and position configs
 * for the specific ProgramType (INDIVIDUAL, GROUP, or GENERAL).
 */
export function calculateEntryPoints(
  position: AwardPosition,
  grade: AwardGrade,
  programType: ProgramType = 'INDIVIDUAL',
  scoringConfigs?: ScoringConfigMap,
  fallbackPositionConfigs?: PositionPointConfig[],
  fallbackGradeConfigs?: GradePointConfig[]
): { positionPoints: number; gradePoints: number; totalPoints: number } {
  let positionConfigs: PositionPointConfig[] = [];
  let gradeConfigs: GradePointConfig[] = [];

  if (scoringConfigs && scoringConfigs[programType]) {
    positionConfigs = scoringConfigs[programType].positionConfigs;
    gradeConfigs = scoringConfigs[programType].gradeConfigs;
  } else if (fallbackPositionConfigs && fallbackGradeConfigs) {
    positionConfigs = fallbackPositionConfigs;
    gradeConfigs = fallbackGradeConfigs;
  }

  const posConfig = positionConfigs.find(p => p.position === position && p.active);
  const positionPoints = posConfig ? posConfig.points : 0;

  const grdConfig = gradeConfigs.find(g => g.grade === grade && g.active);
  const gradePoints = grdConfig ? grdConfig.points : 0;

  return {
    positionPoints,
    gradePoints,
    totalPoints: positionPoints + gradePoints
  };
}

/**
 * Pure recalculation engine: Computes live Team Score Leaderboards strictly separating Arts & Sports
 */
export function calculateTeamScores(
  teams: Team[],
  programs: Program[],
  results: ProgramResult[],
  settings?: any
): TeamScoreBreakdown[] {
  const isArtsEnabled = settings?.enableArtsSection !== false;
  const isSportsEnabled = settings?.enableSportsSection !== false;
  const breakdownMap: Record<string, TeamScoreBreakdown> = {};

  // Initialize breakdown for each team with strict separation
  teams.forEach(team => {
    breakdownMap[team.id] = {
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      artsStagePoints: 0,
      artsNonStagePoints: 0,
      artsTotalPoints: 0,
      sportsTotalPoints: 0,
      categoryArtsPoints: {},
      categorySportsPoints: {},
      artsFirstCount: 0,
      artsSecondCount: 0,
      artsThirdCount: 0,
      sportsFirstCount: 0,
      sportsSecondCount: 0,
      sportsThirdCount: 0,
      firstCount: 0,
      secondCount: 0,
      thirdCount: 0,
      artsRank: 0,
      sportsRank: 0,
      rank: 0
    };
  });

  // Process published results (or submitted results if live view allows)
  results
    .filter(r => r.status === 'PUBLISHED' || r.status === 'SUBMITTED')
    .forEach(result => {
      const prog = programs.find(p => p.id === result.programId);
      if (!prog) return;

      const isArts = prog.section === 'ARTS';
      const isSports = prog.section === 'SPORTS';

      // If a section is toggled OFF by admin, do not process its points or medals
      if (isArts && !isArtsEnabled) return;
      if (isSports && !isSportsEnabled) return;

      const isStage = prog.subsection === 'STAGE';
      const isNonStage = prog.subsection === 'NON_STAGE';
      const category = prog.category;

      result.entries.forEach(entry => {
        const teamScore = breakdownMap[entry.teamId];
        if (!teamScore) return;

        const points = entry.totalPoints;

        if (isArts) {
          // Arts medals & points
          if (entry.position === 'FIRST') {
            teamScore.artsFirstCount += 1;
            teamScore.firstCount += 1;
          } else if (entry.position === 'SECOND') {
            teamScore.artsSecondCount += 1;
            teamScore.secondCount += 1;
          } else if (entry.position === 'THIRD') {
            teamScore.artsThirdCount += 1;
            teamScore.thirdCount += 1;
          }

          if (isStage) {
            teamScore.artsStagePoints += points;
          } else if (isNonStage) {
            teamScore.artsNonStagePoints += points;
          }
          teamScore.artsTotalPoints += points;
          if (category) {
            teamScore.categoryArtsPoints[category] = (teamScore.categoryArtsPoints[category] || 0) + points;
          }
        } else if (isSports) {
          // Sports medals & points
          if (entry.position === 'FIRST') {
            teamScore.sportsFirstCount += 1;
            teamScore.firstCount += 1;
          } else if (entry.position === 'SECOND') {
            teamScore.sportsSecondCount += 1;
            teamScore.secondCount += 1;
          } else if (entry.position === 'THIRD') {
            teamScore.sportsThirdCount += 1;
            teamScore.thirdCount += 1;
          }

          teamScore.sportsTotalPoints += points;
          if (category) {
            teamScore.categorySportsPoints[category] = (teamScore.categorySportsPoints[category] || 0) + points;
          }
        }
      });
    });

  const list = Object.values(breakdownMap);

  // Calculate separate Arts rank (purely based on Arts total points and Arts medals)
  const artsSorted = [...list].sort((a, b) => {
    if (b.artsTotalPoints !== a.artsTotalPoints) return b.artsTotalPoints - a.artsTotalPoints;
    if (b.artsFirstCount !== a.artsFirstCount) return b.artsFirstCount - a.artsFirstCount;
    if (b.artsSecondCount !== a.artsSecondCount) return b.artsSecondCount - a.artsSecondCount;
    return b.artsThirdCount - a.artsThirdCount;
  });
  artsSorted.forEach((t, idx) => {
    t.artsRank = idx + 1;
    t.rank = idx + 1;
  });

  // Calculate separate Sports rank (purely based on Sports total points and Sports medals)
  const sportsSorted = [...list].sort((a, b) => {
    if (b.sportsTotalPoints !== a.sportsTotalPoints) return b.sportsTotalPoints - a.sportsTotalPoints;
    if (b.sportsFirstCount !== a.sportsFirstCount) return b.sportsFirstCount - a.sportsFirstCount;
    if (b.sportsSecondCount !== a.sportsSecondCount) return b.sportsSecondCount - a.sportsSecondCount;
    return b.sportsThirdCount - a.sportsThirdCount;
  });
  sportsSorted.forEach((t, idx) => {
    t.sportsRank = idx + 1;
  });

  return artsSorted;
}

/**
 * Pure recalculation engine: Computes Individual Student Scores & Rankings
 */
export function calculateStudentScores(
  students: Student[],
  teams: Team[],
  programs: Program[],
  results: ProgramResult[],
  settings?: any
): StudentScoreBreakdown[] {
  const isArtsEnabled = settings?.enableArtsSection !== false;
  const isSportsEnabled = settings?.enableSportsSection !== false;
  const studentMap: Record<string, StudentScoreBreakdown> = {};

  const teamLookup = new Map(teams.map(t => [t.id, t]));

  students.forEach(st => {
    const t = teamLookup.get(st.teamId);
    studentMap[st.id] = {
      studentId: st.id,
      studentName: st.name,
      admissionNo: st.admissionNo,
      chestNumber: st.chestNumber,
      classNumber: st.classNumber,
      category: st.category,
      teamId: st.teamId,
      teamName: t ? t.name : 'Unknown',
      teamColor: t ? t.color : '#6b7280',
      artsIndividualPoints: 0,
      sportsIndividualPoints: 0,
      firstCount: 0,
      secondCount: 0,
      thirdCount: 0,
      gradeACount: 0,
      gradeBCount: 0,
      gradeCCount: 0,
      registeredCount: 0
    };
  });

  results
    .filter(r => r.status === 'PUBLISHED' || r.status === 'SUBMITTED')
    .forEach(result => {
      const prog = programs.find(p => p.id === result.programId);
      if (!prog) return;

      // Rule: Group & General programs DO NOT award points to individual students!
      if (prog.programType !== 'INDIVIDUAL') {
        return;
      }

      const isArts = prog.section === 'ARTS';
      const isSports = prog.section === 'SPORTS';

      // If a section is toggled OFF by admin, do not process its individual points or prizes
      if (isArts && !isArtsEnabled) return;
      if (isSports && !isSportsEnabled) return;

      result.entries.forEach(entry => {
        if (!entry.studentId) return;
        const stScore = studentMap[entry.studentId];
        if (!stScore) return;

        if (isArts) {
          stScore.artsIndividualPoints += entry.totalPoints;
        } else if (isSports) {
          stScore.sportsIndividualPoints += entry.totalPoints;
        }

        if (entry.position === 'FIRST') stScore.firstCount += 1;
        if (entry.position === 'SECOND') stScore.secondCount += 1;
        if (entry.position === 'THIRD') stScore.thirdCount += 1;

        if (entry.grade === 'A') stScore.gradeACount += 1;
        if (entry.grade === 'B') stScore.gradeBCount += 1;
        if (entry.grade === 'C') stScore.gradeCCount += 1;
      });
    });

  return Object.values(studentMap);
}

/**
 * Returns Category Champions (Individual Arts & Sports)
 */
export function getCategoryWinners(
  studentScores: StudentScoreBreakdown[],
  section: FestSection,
  category: FestCategory
): StudentScoreBreakdown[] {
  const filtered = studentScores.filter(s => s.category === category);
  const pointKey = section === 'ARTS' ? 'artsIndividualPoints' : 'sportsIndividualPoints';

  return filtered
    .filter(s => s[pointKey] > 0)
    .sort((a, b) => {
      if (b[pointKey] !== a[pointKey]) return b[pointKey] - a[pointKey];
      if (b.firstCount !== a.firstCount) return b.firstCount - a.firstCount;
      if (b.secondCount !== a.secondCount) return b.secondCount - a.secondCount;
      return b.gradeACount - a.gradeACount;
    });
}
