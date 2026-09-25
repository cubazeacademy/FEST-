import {
  CategoryConfig,
  ClassCategoryMapping,
  FestCategory,
  Program,
  Registration,
  Student
} from '../types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates whether a class can be mapped to a category without conflicts
 */
export function validateClassCategoryMapping(
  classNumber: string,
  targetCategory: FestCategory,
  existingMappings: ClassCategoryMapping[],
  currentMappingId?: string
): ValidationResult {
  const trimmedClass = classNumber.trim();
  if (!trimmedClass) {
    return { valid: false, error: 'Class number cannot be empty.' };
  }

  const conflict = existingMappings.find(
    m => m.classNumber.toLowerCase() === trimmedClass.toLowerCase() && m.id !== currentMappingId
  );

  if (conflict) {
    return {
      valid: false,
      error: `Class ${trimmedClass} is already assigned to category "${conflict.category}". A class cannot belong to multiple categories.`
    };
  }

  return { valid: true };
}

/**
 * Automatically resolves the category for a given class number
 */
export function resolveCategoryFromClass(
  classNumber: string,
  mappings: ClassCategoryMapping[]
): FestCategory | null {
  const trimmed = classNumber.trim().toLowerCase();
  const match = mappings.find(m => m.classNumber.toLowerCase() === trimmed);
  return match ? match.category : null;
}

/**
 * Normalizes category names to handle phonetic & spelling variations, spaces, and punctuation
 */
export function normalizeCategoryName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_\-()\/]/g, '')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/ee/g, 'i')
    .replace(/^th/, 's')
    .replace(/th/g, 's')
    .replace(/h$/, '')
    .replace(/yy/g, 'y');
}

/**
 * Flexible check to see if two categories match (handling codes, display names, and phonetic aliases)
 */
export function isCategoryMatch(
  catA?: string,
  catB?: string,
  categoryConfigs?: CategoryConfig[]
): boolean {
  if (!catA || !catB) return false;
  const cleanA = catA.trim().toUpperCase();
  const cleanB = catB.trim().toUpperCase();
  if (cleanA === cleanB) return true;

  const normA = normalizeCategoryName(catA);
  const normB = normalizeCategoryName(catB);
  if (normA && normB && normA === normB) return true;

  if (categoryConfigs && categoryConfigs.length > 0) {
    const configA = categoryConfigs.find(
      c =>
        c.category.toUpperCase() === cleanA ||
        c.id.toUpperCase() === cleanA ||
        normalizeCategoryName(c.displayName || '') === normA ||
        normalizeCategoryName(c.category) === normA
    );
    const configB = categoryConfigs.find(
      c =>
        c.category.toUpperCase() === cleanB ||
        c.id.toUpperCase() === cleanB ||
        normalizeCategoryName(c.displayName || '') === normB ||
        normalizeCategoryName(c.category) === normB
    );
    if (configA && configB && configA.id === configB.id) return true;
  }

  return false;
}

export interface StudentParticipationBreakdown {
  totalIndividual: number;
  stageCount: number;
  nonStageCount: number;
  sportsCount: number;
}

/**
 * Calculates current confirmed individual participation count broken down by type
 */
export function getStudentParticipationBreakdown(
  studentId: string,
  registrations: Registration[]
): StudentParticipationBreakdown {
  const studentRegs = registrations.filter(
    r => r.studentId === studentId && r.programType === 'INDIVIDUAL' && r.status === 'CONFIRMED'
  );

  let stageCount = 0;
  let nonStageCount = 0;
  let sportsCount = 0;

  studentRegs.forEach(r => {
    if (r.section === 'SPORTS' || r.subsection === 'SPORTS_EVENT') {
      sportsCount++;
    } else if (r.subsection === 'STAGE') {
      stageCount++;
    } else if (r.subsection === 'NON_STAGE') {
      nonStageCount++;
    } else {
      stageCount++;
    }
  });

  return {
    totalIndividual: studentRegs.length,
    stageCount,
    nonStageCount,
    sportsCount
  };
}

/**
 * Validates individual student registration against category, duplicate entries, and participation limits (overall, stage, non-stage, sports)
 */
export function validateIndividualRegistration(
  student: Student,
  program: Program,
  registrations: Registration[],
  categoryConfigs: CategoryConfig[],
  defaultLimit: number = 5,
  allowCrossCategory: boolean = true
): ValidationResult {
  if (program.programType !== 'INDIVIDUAL') {
    return { valid: false, error: 'This is not an individual program.' };
  }

  // 1. Category match check (with flexible matching)
  const isMatch = isCategoryMatch(student.category, program.category, categoryConfigs);
  if (!isMatch && !allowCrossCategory) {
    return {
      valid: false,
      error: `Student belongs to "${student.category}" category, but this program is for "${program.category}".`
    };
  }

  // 2. Duplicate registration check for the same program
  const alreadyRegistered = registrations.some(
    r =>
      r.programId === program.id &&
      r.studentId === student.id &&
      r.status === 'CONFIRMED'
  );

  if (alreadyRegistered) {
    return {
      valid: false,
      error: `Student ${student.name} is already registered for "${program.name}".`
    };
  }

  // 3. Participation limit checks
  const catConfig = categoryConfigs.find(c => isCategoryMatch(c.category, student.category, categoryConfigs));
  const maxTotalAllowed = catConfig?.maxIndividualProgramsPerStudent ?? defaultLimit;

  const breakdown = getStudentParticipationBreakdown(student.id, registrations);

  // 3.1 Overall Total Limit Check
  if (breakdown.totalIndividual >= maxTotalAllowed) {
    return {
      valid: false,
      error: `Candidate "${student.name}" has reached the maximum overall limit (${maxTotalAllowed} programs) for category "${catConfig?.displayName || student.category}".`
    };
  }

  // 3.2 Specific Program Type Maximum Check
  const isSports = program.section === 'SPORTS' || program.subsection === 'SPORTS_EVENT';
  const isStage = !isSports && program.subsection === 'STAGE';
  const isNonStage = !isSports && program.subsection === 'NON_STAGE';

  if (isStage && catConfig?.maxStagePrograms !== undefined) {
    if (breakdown.stageCount >= catConfig.maxStagePrograms) {
      return {
        valid: false,
        error: `Candidate "${student.name}" has reached the maximum Stage program limit (${catConfig.maxStagePrograms} max) for category "${catConfig.displayName}".`
      };
    }
  }

  if (isNonStage && catConfig?.maxNonStagePrograms !== undefined) {
    if (breakdown.nonStageCount >= catConfig.maxNonStagePrograms) {
      return {
        valid: false,
        error: `Candidate "${student.name}" has reached the maximum Non-Stage program limit (${catConfig.maxNonStagePrograms} max) for category "${catConfig.displayName}".`
      };
    }
  }

  if (isSports && catConfig?.maxSportsPrograms !== undefined) {
    if (breakdown.sportsCount >= catConfig.maxSportsPrograms) {
      return {
        valid: false,
        error: `Candidate "${student.name}" has reached the maximum Sports program limit (${catConfig.maxSportsPrograms} max) for category "${catConfig.displayName}".`
      };
    }
  }

  // 4. Team Quota Check: Candidates Per Team (Independent quota per house)
  const candidatesPerTeam = program.maxParticipants || 1;
  const existingTeamCount = registrations.filter(
    r =>
      r.programId === program.id &&
      r.teamId === student.teamId &&
      r.programType === 'INDIVIDUAL' &&
      r.status === 'CONFIRMED'
  ).length;

  if (existingTeamCount >= candidatesPerTeam) {
    return {
      valid: false,
      error: `Maximum ${candidatesPerTeam} candidate${candidatesPerTeam > 1 ? 's are' : ' is'} allowed from your team for this program.`
    };
  }

  return { valid: true };
}

export interface CandidateMinComplianceResult {
  isCompliant: boolean;
  warnings: string[];
}

/**
 * Checks if candidate satisfies configured minimum participation thresholds
 */
export function checkCandidateMinCompliance(
  student: Student,
  registrations: Registration[],
  categoryConfigs: CategoryConfig[]
): CandidateMinComplianceResult {
  const catConfig = categoryConfigs.find(c => isCategoryMatch(c.category, student.category, categoryConfigs));
  if (!catConfig) return { isCompliant: true, warnings: [] };

  const breakdown = getStudentParticipationBreakdown(student.id, registrations);
  const warnings: string[] = [];

  if (catConfig.minIndividualProgramsPerStudent && breakdown.totalIndividual < catConfig.minIndividualProgramsPerStudent) {
    warnings.push(`Min total: ${breakdown.totalIndividual}/${catConfig.minIndividualProgramsPerStudent}`);
  }
  if (catConfig.minStagePrograms && breakdown.stageCount < catConfig.minStagePrograms) {
    warnings.push(`Min Stage: ${breakdown.stageCount}/${catConfig.minStagePrograms}`);
  }
  if (catConfig.minNonStagePrograms && breakdown.nonStageCount < catConfig.minNonStagePrograms) {
    warnings.push(`Min Non-Stage: ${breakdown.nonStageCount}/${catConfig.minNonStagePrograms}`);
  }
  if (catConfig.minSportsPrograms && breakdown.sportsCount < catConfig.minSportsPrograms) {
    warnings.push(`Min Sports: ${breakdown.sportsCount}/${catConfig.minSportsPrograms}`);
  }

  return {
    isCompliant: warnings.length === 0,
    warnings
  };
}

/**
 * Validates group registration: team matching, category homogeneity, exact student limits, duplicates within/across groups, and team group limits
 */
export function validateGroupRegistration(
  teamId: string,
  selectedStudents: Student[],
  program: Program,
  registrations: Registration[],
  existingRegistrationId?: string
): ValidationResult {
  if (program.programType !== 'GROUP' && program.programType !== 'GENERAL') {
    return { valid: false, error: 'This program does not accept group registration.' };
  }

  // 1. Check Maximum Groups Allowed Per Team
  const maxAllowedGroups = program.maxGroupsPerTeam ?? 1;
  const currentTeamGroups = registrations.filter(
    r =>
      r.programId === program.id &&
      r.teamId === teamId &&
      r.status === 'CONFIRMED' &&
      r.id !== existingRegistrationId
  );

  if (currentTeamGroups.length >= maxAllowedGroups) {
    return {
      valid: false,
      error: `Maximum group limit (${maxAllowedGroups} ${maxAllowedGroups === 1 ? 'group' : 'groups'}) reached for this program.`
    };
  }

  // 2. Exact / Min / Max Count check
  const count = selectedStudents.length;
  if (program.requiredMembersPerGroup && count !== program.requiredMembersPerGroup) {
    return {
      valid: false,
      error: `This group must contain exactly ${program.requiredMembersPerGroup} students.`
    };
  }

  if (count < program.minParticipants) {
    return {
      valid: false,
      error: `Group participant count (${count}) is below the minimum required (${program.minParticipants} participants).`
    };
  }

  if (count > program.maxParticipants) {
    return {
      valid: false,
      error: `Group participant count (${count}) exceeds the maximum allowed (${program.maxParticipants} participants).`
    };
  }

  // 3. Duplicate students within the same group
  const uniqueIds = new Set(selectedStudents.map(s => s.id));
  if (uniqueIds.size !== selectedStudents.length) {
    return {
      valid: false,
      error: 'Duplicate students selected within the same group.'
    };
  }

  // 4. Team ownership check (flexible ID / code comparison)
  const foreignStudent = selectedStudents.find(s => {
    if (!s.teamId || !teamId) return false;
    return s.teamId.toLowerCase() !== teamId.toLowerCase();
  });
  if (foreignStudent) {
    return {
      valid: false,
      error: `Student "${foreignStudent.name}" belongs to another team and cannot be added.`
    };
  }

  // 5. Category match check (unless General allows mixed, with phonetic/config matching)
  if (program.programType === 'GROUP') {
    const wrongCategory = selectedStudents.find(
      s => !isCategoryMatch(s.category, program.category)
    );
    if (wrongCategory) {
      return {
        valid: false,
        error: `Participant "${wrongCategory.name}" is in ${wrongCategory.category.replace('_', ' ')} category, but this program is for ${program.category.replace('_', ' ')}.`
      };
    }
  }

  // 6. Duplicate group member in same program across team groups
  const otherProgramRegistrations = registrations.filter(
    r =>
      r.programId === program.id &&
      r.status === 'CONFIRMED' &&
      r.id !== existingRegistrationId
  );

  for (const st of selectedStudents) {
    const isMemberOfOtherGroup = otherProgramRegistrations.some(r =>
      r.groupMembers?.some(m => m.studentId === st.id)
    );
    if (isMemberOfOtherGroup) {
      return {
        valid: false,
        error: `Student "${st.name}" is already registered in another group for this event.`
      };
    }
  }

  return { valid: true };
}
