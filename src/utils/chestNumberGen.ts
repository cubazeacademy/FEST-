import { CategoryConfig, FestCategory, Student } from '../types';

export interface ChestNoGenResult {
  updatedStudents: Student[];
  assignedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Generates chest numbers category-wise within designated numeric ranges
 */
export function generateChestNumbers(
  students: Student[],
  categoryConfigs: CategoryConfig[],
  preserveExisting: boolean = true
): ChestNoGenResult {
  const errors: string[] = [];
  let assignedCount = 0;
  let skippedCount = 0;

  // Clone students to ensure immutability
  const updatedStudents: Student[] = students.map(s => ({ ...s }));

  // Collect set of all currently used chest numbers if preserving
  const usedNumbers = new Set<number>();
  if (preserveExisting) {
    updatedStudents.forEach(s => {
      if (s.chestNumber) {
        const num = Number(s.chestNumber);
        if (!isNaN(num)) usedNumbers.add(num);
      }
    });
  }

  // Active configurations
  const activeConfigs = categoryConfigs.filter(c => c.status !== 'INACTIVE');

  // Check for any students assigned to an unconfigured category
  const studentCategories = Array.from(new Set(updatedStudents.map(s => s.category).filter(Boolean)));
  studentCategories.forEach(cat => {
    const configExists = activeConfigs.some(c => c.category === cat);
    if (!configExists) {
      errors.push(`Missing chest number configuration for category: ${cat}`);
    }
  });

  // Process category by category using configured category parameters
  activeConfigs.forEach(config => {
    const cat = config.category;
    const { chestNoStart, chestNoEnd } = config;

    if (chestNoStart >= chestNoEnd) {
      errors.push(`Invalid range (${chestNoStart} - ${chestNoEnd}) for category: ${config.displayName || cat}`);
      return;
    }

    let currentPointer = chestNoStart;

    // Filter students belonging to this category, sorted deterministically by Admission Number / Name
    const catStudents = updatedStudents
      .filter(s => s.category === cat)
      .sort((a, b) => (a.admissionNo || '').localeCompare(b.admissionNo || ''));

    catStudents.forEach(st => {
      // If student already has a valid chest number and preserveExisting is true, keep it
      if (preserveExisting && st.chestNumber) {
        skippedCount++;
        return;
      }

      // Find the next free number in the range
      while (currentPointer <= chestNoEnd && usedNumbers.has(currentPointer)) {
        currentPointer++;
      }

      if (currentPointer > chestNoEnd) {
        errors.push(
          `Exceeded range capacity (${chestNoStart}-${chestNoEnd}) for category "${config.displayName || cat}". Cannot assign for ${st.name} (Adm: ${st.admissionNo}).`
        );
        return;
      }

      st.chestNumber = currentPointer;
      usedNumbers.add(currentPointer);
      currentPointer++;
      assignedCount++;
    });
  });

  return {
    updatedStudents,
    assignedCount,
    skippedCount,
    errors
  };
}

/**
 * Validates a single manually inputted chest number
 */
export function validateManualChestNumber(
  chestNumber: number,
  studentId: string,
  category: FestCategory,
  allStudents: Student[],
  categoryConfigs: CategoryConfig[]
): { valid: boolean; error?: string } {
  if (isNaN(chestNumber) || chestNumber <= 0) {
    return { valid: false, error: 'Chest number must be a positive integer.' };
  }

  // 1. Collision check
  const duplicate = allStudents.find(
    s => s.id !== studentId && Number(s.chestNumber) === chestNumber
  );

  if (duplicate) {
    return {
      valid: false,
      error: `Chest number ${chestNumber} is already assigned to "${duplicate.name}" (Adm: ${duplicate.admissionNo}).`
    };
  }

  // 2. Category range advisory
  const config = categoryConfigs.find(c => c.category === category);
  if (config) {
    if (chestNumber < config.chestNoStart || chestNumber > config.chestNoEnd) {
      return {
        valid: false,
        error: `Chest number ${chestNumber} is outside the configured range (${config.chestNoStart} - ${config.chestNoEnd}) for category "${category}".`
      };
    }
  }

  return { valid: true };
}
