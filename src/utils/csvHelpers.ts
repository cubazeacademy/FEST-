import { Student, Program, Team, ClassCategoryMapping, CategoryConfig, FestSection, FestCategory, ProgramType, ProgramSubsection, Registration } from '../types';
import { resolveCategoryFromClass } from './validations';

/**
 * Universal CSV line parser handling commas, quotes, and whitespace
 */
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  const rawLines = csvText.split(/\r?\n/);

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) continue;

    const row: string[] = [];
    let insideQuotes = false;
    let currentField = '';

    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      const nextChar = rawLine[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    lines.push(row);
  }

  return lines;
}

/**
 * Download helper creating an in-browser blob download
 */
export function triggerFileDownload(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   STUDENT CSV TEMPLATES & VALIDATION
   ========================================================================== */

export const STUDENT_CSV_HEADERS = [
  'Sl No',
  'Chest No',
  'Admission No',
  'Candidate Name',
  'class ( optional)',
  'Team / House',
  'Category'
];

export function generateSampleStudentCSV(
  categoryConfigs?: CategoryConfig[],
  teams?: Team[]
): string {
  const headers = STUDENT_CSV_HEADERS.join(',');
  
  const sampleCandidates = [
    { name: 'AIMAN SAHDIY P', adm: '1143', house: 'SARAHA', chest: 101, class: '' },
    { name: 'SAHD SALMI MUKKATTIL', adm: '1144', house: 'SEBAT', chest: 102, class: '' },
    { name: 'MUHAMMED BIN SIDHIQ', adm: '1145', house: 'SEBAT', chest: undefined, class: '' },
    { name: 'MUHAMMED NIHAD', adm: '1146', house: 'SEBAT', chest: undefined, class: 'Class 4' },
    { name: 'MUHAMMAD RISHAN', adm: '1147', house: 'SAKAN', chest: 105, class: '' },
    { name: 'MUHAMMAD FADHIL PK', adm: '1148', house: 'SEBAT', chest: 106, class: '' },
    { name: 'MUHAMMED NAJIZ T', adm: '1149', house: 'SEBAT', chest: 107, class: '' },
    { name: 'MUHAMMED RAZEEN', adm: '1150', house: 'SEBAT', chest: 108, class: '' },
    { name: 'HADI AFNAN', adm: '1151', house: 'SEBAT', chest: 109, class: '' },
    { name: 'SAHL ABDU SAMAD', adm: '1152', house: 'SARAHA', chest: 110, class: '' },
    { name: 'HIDAYATHUL HAQ K', adm: '1153', house: 'SEBAT', chest: 111, class: '' },
    { name: 'MUHAMMED FALAH', adm: '1154', house: 'SAKAN', chest: 112, class: '' },
    { name: 'MUHAMMED SABITH', adm: '1155', house: 'SAKAN', chest: 113, class: '' },
    { name: 'MUHAMMAD MT', adm: '1156', house: 'SAKAN', chest: 114, class: '' },
    { name: 'MUHAMMED FAHEEM T', adm: '1157', house: 'SARAHA', chest: 115, class: '' },
    { name: 'MUHAMMAD', adm: '1158', house: 'SARAHA', chest: 116, class: '' },
    { name: 'MIDHLAJ', adm: '1159', house: 'SAKAN', chest: 117, class: '' }
  ];

  const defaultCategory = categoryConfigs && categoryConfigs.length > 0
    ? categoryConfigs[0].displayName || categoryConfigs[0].category
    : 'SUB_JUNIOR';

  const teamList = teams && teams.length > 0 ? teams : [];

  const rows = sampleCandidates.map((c, idx) => {
    const slNo = idx + 1;
    const houseName = teamList.length > 0 
      ? teamList[idx % teamList.length].name 
      : c.house;
    const catName = categoryConfigs && categoryConfigs.length > 0
      ? categoryConfigs[idx % categoryConfigs.length].displayName || categoryConfigs[idx % categoryConfigs.length].category
      : defaultCategory;
    const chestStr = c.chest ? c.chest.toString() : '';
    const classStr = c.class || '';

    return `${slNo},${chestStr},${c.adm},${c.name},${classStr},${houseName},${catName}`;
  });

  return `${headers}\n${rows.join('\n')}\n`;
}

export interface ParsedStudentRow {
  rowIndex: number;
  name: string;
  admissionNo: string;
  classNumber: string;
  sectionLetter?: string;
  teamCode: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  chestNumber?: number;
  resolvedCategory?: FestCategory;
  resolvedTeamId?: string;
  resolvedTeamName?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function parseCategoryString(catStr: string, categoryConfigs?: CategoryConfig[]): FestCategory | undefined {
  if (!catStr || !catStr.trim()) return undefined;
  const raw = catStr.trim();
  const clean = raw.toUpperCase().replace(/[\s-]/g, '_');
  const cleanAlpha = raw.toLowerCase().replace(/[\s_\-()\/]/g, '');

  if (categoryConfigs && categoryConfigs.length > 0) {
    const matched = categoryConfigs.find(c => {
      const cCat = c.category.toUpperCase().replace(/[\s-]/g, '_');
      const cDisp = c.displayName.trim().toUpperCase().replace(/[\s-]/g, '_');
      const cAlpha = (c.displayName || c.category).toLowerCase().replace(/[\s_\-()\/]/g, '');
      return cCat === clean || cDisp === clean || cAlpha === cleanAlpha;
    });
    if (matched) return matched.category;
  }
  if (clean === 'SUB_JUNIOR' || clean === 'SUBJUNIOR') return 'SUB_JUNIOR';
  if (clean === 'JUNIOR') return 'JUNIOR';
  if (clean === 'SENIOR') return 'SENIOR';
  if (clean === 'SUPER_SENIOR' || clean === 'SUPERSENIOR') return 'SUPER_SENIOR';
  return clean as FestCategory;
}

export function validateStudentCSVRows(
  csvText: string,
  existingStudents: Student[],
  teams: Team[],
  classMappings: ClassCategoryMapping[],
  categoryConfigs?: CategoryConfig[]
): { rows: ParsedStudentRow[]; validCount: number; errorCount: number } {
  const parsedGrid = parseCSV(csvText);
  if (parsedGrid.length < 2) {
    return { rows: [], validCount: 0, errorCount: 0 };
  }

  const rawHeaders = parsedGrid[0].map(h => h.trim().toLowerCase().replace(/[\s_\-()\/]/g, ''));
  
  // Header detection with full support for new format & flexible synonyms
  const nameIdx = rawHeaders.findIndex(h =>
    h === 'candidatename' || h === 'studentname' || h === 'name' || h === 'candidate' || h === 'student'
  );
  const admIdx = rawHeaders.findIndex(h =>
    h === 'admissionno' || h === 'admno' || h === 'admissionnumber' || h === 'adm' || h === 'admission' || h === 'admnumber'
  );
  const classIdx = rawHeaders.findIndex(h =>
    h === 'classoptional' || h === 'class' || h === 'classnumber' || h === 'std' || h === 'standard' || h === 'grade'
  );
  const catIdx = rawHeaders.findIndex(h =>
    h === 'category' || h === 'cat' || h === 'festcategory'
  );
  const teamIdx = rawHeaders.findIndex(h =>
    h === 'teamhouse' || h === 'house' || h === 'team' || h === 'teamcode' || h === 'teamname' || h === 'housename' || h === 'teamhouseoptional'
  );
  const chestIdx = rawHeaders.findIndex(h =>
    h === 'chestno' || h === 'chestnumber' || h === 'chest' || h === 'chestnum' || h === 'chestn'
  );
  const secIdx = rawHeaders.findIndex(h =>
    h === 'sectionletter' || h === 'section' || h === 'sec'
  );
  const genIdx = rawHeaders.findIndex(h =>
    h === 'gender' || h === 'sex'
  );

  // Fallback positional detection if headers are custom
  // Format: Sl No (0), Chest No (1), Admission No (2), Candidate Name (3), class (4), Team/House (5), Category (6)
  const isCustomCandidateLayout = nameIdx === -1 && admIdx === -1 && parsedGrid[0].length >= 4;

  const resolvedNameIdx = nameIdx >= 0 ? nameIdx : isCustomCandidateLayout ? 3 : 0;
  const resolvedAdmIdx = admIdx >= 0 ? admIdx : isCustomCandidateLayout ? 2 : 1;
  const resolvedChestIdx = chestIdx >= 0 ? chestIdx : isCustomCandidateLayout ? 1 : 7;
  const resolvedClassIdx = classIdx >= 0 ? classIdx : isCustomCandidateLayout ? 4 : 2;
  const resolvedTeamIdx = teamIdx >= 0 ? teamIdx : isCustomCandidateLayout ? 5 : 5;
  const resolvedCatIdx = catIdx >= 0 ? catIdx : isCustomCandidateLayout ? 6 : 3;

  const rows: ParsedStudentRow[] = [];
  const seenAdmissionNos = new Set<string>(existingStudents.map(s => s.admissionNo.toLowerCase().trim()));
  const seenChestNumbers = new Set<number>(
    existingStudents.filter(s => s.chestNumber).map(s => Number(s.chestNumber))
  );
  const csvSeenAdmNos = new Set<string>();
  const csvSeenChestNos = new Set<number>();

  for (let i = 1; i < parsedGrid.length; i++) {
    const rawRow = parsedGrid[i];
    if (rawRow.length === 0 || (rawRow.length === 1 && !rawRow[0])) continue;

    const name = (resolvedNameIdx >= 0 && resolvedNameIdx < rawRow.length ? rawRow[resolvedNameIdx] : '') || '';
    const admissionNo = (resolvedAdmIdx >= 0 && resolvedAdmIdx < rawRow.length ? rawRow[resolvedAdmIdx] : '') || '';
    const classNumber = (resolvedClassIdx >= 0 && resolvedClassIdx < rawRow.length ? rawRow[resolvedClassIdx] : '') || '';
    const categoryRaw = (resolvedCatIdx >= 0 && resolvedCatIdx < rawRow.length ? rawRow[resolvedCatIdx] : '') || '';
    const sectionLetter = (secIdx >= 0 && secIdx < rawRow.length ? rawRow[secIdx] : '') || 'A';
    const teamCode = (resolvedTeamIdx >= 0 && resolvedTeamIdx < rawRow.length ? rawRow[resolvedTeamIdx] : '') || '';
    const genderRaw = (genIdx >= 0 && genIdx < rawRow.length ? rawRow[genIdx] : 'OTHER').toUpperCase();
    const chestRaw = (resolvedChestIdx >= 0 && resolvedChestIdx < rawRow.length ? rawRow[resolvedChestIdx] : '') || '';

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Candidate Name validation
    if (!name.trim()) {
      errors.push('Candidate name is required');
    }

    // 2. Admission No validation
    const cleanAdm = admissionNo.trim();
    if (!cleanAdm) {
      errors.push('Admission number is required');
    } else if (seenAdmissionNos.has(cleanAdm.toLowerCase())) {
      errors.push(`Admission No "${cleanAdm}" already exists in directory`);
    } else if (csvSeenAdmNos.has(cleanAdm.toLowerCase())) {
      errors.push(`Duplicate Admission No "${cleanAdm}" in CSV file`);
    } else {
      csvSeenAdmNos.add(cleanAdm.toLowerCase());
    }

    // 3. Category & Class resolution (Class is OPTIONAL)
    let cleanClass = classNumber.trim();
    if (cleanClass.toLowerCase().startsWith('class')) {
      const stripped = cleanClass.replace(/class/i, '').trim();
      if (stripped) cleanClass = stripped;
    }

    let resolvedCategory: FestCategory | undefined;

    // A. Check Category column from CSV first
    if (categoryRaw.trim()) {
      resolvedCategory = parseCategoryString(categoryRaw, categoryConfigs);
    }

    // B. If category not found from CSV, try resolving from class mapping
    if (!resolvedCategory && cleanClass && cleanClass !== '-') {
      resolvedCategory = resolveCategoryFromClass(cleanClass, classMappings);
    }

    // C. If Category is resolved but class was left blank (class is optional!)
    if (resolvedCategory && !cleanClass) {
      const config = categoryConfigs?.find(c => c.category === resolvedCategory);
      if (config && config.assignedClasses && config.assignedClasses.length > 0) {
        cleanClass = config.assignedClasses[0];
      } else {
        cleanClass = '-';
      }
    }

    // D. Default fallback if category could not be resolved
    if (!resolvedCategory) {
      if (categoryConfigs && categoryConfigs.length > 0) {
        resolvedCategory = categoryConfigs[0].category;
        cleanClass = cleanClass || categoryConfigs[0].assignedClasses?.[0] || '-';
        warnings.push(`Category "${categoryRaw || 'Unspecified'}" not found. Defaulted to "${categoryConfigs[0].displayName || categoryConfigs[0].category}".`);
      } else {
        errors.push('Category is required. Please specify Category in CSV.');
      }
    }

    // 4. Team / House Resolution
    const cleanTeam = teamCode.trim().toLowerCase().replace(/[\s_\-()\/]/g, '');
    let matchedTeam = teams.find(t => {
      const tName = t.name.toLowerCase().replace(/[\s_\-()\/]/g, '');
      const tCode = t.code.toLowerCase().replace(/[\s_\-()\/]/g, '');
      const tId = t.id.toLowerCase().replace(/[\s_\-()\/]/g, '');
      return tName === cleanTeam || tCode === cleanTeam || tId === cleanTeam ||
             (cleanTeam.length >= 3 && (tName.includes(cleanTeam) || cleanTeam.includes(tName)));
    });

    if (!matchedTeam) {
      if (teams.length > 0) {
        matchedTeam = teams[0];
        if (teamCode.trim()) {
          warnings.push(`House/Team "${teamCode}" not found. Assigned to ${matchedTeam.name}`);
        } else {
          warnings.push(`House not specified. Assigned to ${matchedTeam.name}`);
        }
      } else {
        errors.push(`House/Team "${teamCode}" not found in system`);
      }
    }

    // 5. Gender validation
    let gender: 'MALE' | 'FEMALE' | 'OTHER' = 'OTHER';
    if (genderRaw.startsWith('M')) gender = 'MALE';
    else if (genderRaw.startsWith('F')) gender = 'FEMALE';

    // 6. Chest Number parsing (OPTIONAL - Left empty for Auto-Generation)
    let chestNumber: number | undefined;
    if (chestRaw && chestRaw.trim()) {
      const parsedNum = parseInt(chestRaw.trim(), 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        if (seenChestNumbers.has(parsedNum)) {
          errors.push(`Chest Number #${parsedNum} already assigned to another student in system`);
        } else if (csvSeenChestNos.has(parsedNum)) {
          errors.push(`Duplicate Chest Number #${parsedNum} in CSV file`);
        } else {
          chestNumber = parsedNum;
          csvSeenChestNos.add(parsedNum);
        }
      } else {
        warnings.push(`Invalid chest number "${chestRaw}". Left empty for Auto-Generation.`);
      }
    }

    const isValid = errors.length === 0;

    rows.push({
      rowIndex: i + 1,
      name: name.trim(),
      admissionNo: cleanAdm,
      classNumber: cleanClass || '-',
      sectionLetter: sectionLetter.trim() || 'A',
      teamCode: teamCode.trim() || (matchedTeam?.code || ''),
      gender,
      chestNumber,
      resolvedCategory,
      resolvedTeamId: matchedTeam?.id,
      resolvedTeamName: matchedTeam?.name,
      isValid,
      errors,
      warnings
    });
  }

  const validCount = rows.filter(r => r.isValid).length;
  const errorCount = rows.length - validCount;

  return { rows, validCount, errorCount };
}

/* ==========================================================================
   PROGRAM CSV TEMPLATES & VALIDATION
   ========================================================================== */

export const PROGRAM_CSV_HEADERS = [
  'Code',
  'Name',
  'Section',
  'Subsection',
  'Category',
  'ProgramType',
  'MinParticipants',
  'MaxParticipants',
  'StageLocation',
  'ScheduleTime',
  'Rules'
];

export function generateSampleProgramCSV(categoryConfigs?: CategoryConfig[]): string {
  const headers = PROGRAM_CSV_HEADERS.join(',');
  
  if (categoryConfigs && categoryConfigs.length > 0) {
    const sampleTemplates = [
      { code: 'ART-STG-01', name: 'Classical Vocal Solo', section: 'ARTS', sub: 'STAGE', type: 'INDIVIDUAL', min: 1, max: 1, loc: 'Main Auditorium', time: 'Day 1 - 10:00 AM', rules: 'Classical raga vocal (10 mins)' },
      { code: 'ART-STG-02', name: 'Group Folk Dance', section: 'ARTS', sub: 'STAGE', type: 'GROUP', min: 4, max: 10, loc: 'Main Stage', time: 'Day 2 - 03:00 PM', rules: 'Traditional folk dance with costume' },
      { code: 'ART-NST-01', name: 'Pencil Sketching', section: 'ARTS', sub: 'NON_STAGE', type: 'INDIVIDUAL', min: 1, max: 1, loc: 'Art Room 101', time: 'Day 1 - 11:30 AM', rules: 'Sheets provided on spot. 1 hour' },
      { code: 'SPT-TRK-01', name: '100m Sprint', section: 'SPORTS', sub: 'SPORTS_EVENT', type: 'INDIVIDUAL', min: 1, max: 1, loc: 'Track Ground', time: 'Day 1 - 09:00 AM', rules: 'Standard track sprint rules' },
      { code: 'SPT-TRK-02', name: '4x100m Relay', section: 'SPORTS', sub: 'SPORTS_EVENT', type: 'GROUP', min: 4, max: 4, loc: 'Track Ground', time: 'Day 2 - 04:00 PM', rules: '4 participants per team' },
      { code: 'GEN-EVT-01', name: 'Fest Grand Quiz', section: 'ARTS', sub: 'STAGE', type: 'GENERAL', min: 2, max: 4, loc: 'Seminar Hall', time: 'Day 2 - 11:00 AM', rules: 'Open house quiz championship' }
    ];

    const rows = sampleTemplates.map((tpl, i) => {
      const cat = categoryConfigs[i % categoryConfigs.length].category;
      return `${tpl.code},${tpl.name},${tpl.section},${tpl.sub},${cat},${tpl.type},${tpl.min},${tpl.max},${tpl.loc},${tpl.time},${tpl.rules}`;
    });

    return `${headers}\n${rows.join('\n')}\n`;
  }

  const sampleRows = [
    'ART-STG-10,Classical Carnatic Vocal,ARTS,STAGE,SENIOR,INDIVIDUAL,1,1,Main Auditorium,Day 1 - 10:00 AM,Classical Carnatic raga performance (10 mins)',
    'ART-STG-11,Folk Dance Group,ARTS,STAGE,SUPER_SENIOR,GROUP,4,10,Main Auditorium,Day 2 - 03:00 PM,Traditional Indian folk dance with costumes',
    'ART-NST-10,Clay Modeling,ARTS,NON_STAGE,JUNIOR,INDIVIDUAL,1,1,Art Room 102,Day 1 - 01:00 PM,Clay provided on spot. 1.5 hours',
    'SPT-TRK-10,200m Sprint,SPORTS,SPORTS_EVENT,SENIOR,INDIVIDUAL,1,1,Athletics Track,Day 1 - 09:30 AM,Standard track sprint',
    'SPT-TRK-11,4x400m Mixed Relay,SPORTS,SPORTS_EVENT,SUPER_SENIOR,GROUP,4,4,Athletics Track,Day 2 - 04:30 PM,2 Boys and 2 Girls per house contingent',
    'GEN-EVT-01,Fest Grand Quiz Bowl,ARTS,STAGE,SUPER_SENIOR,GENERAL,2,4,Seminar Hall A,Day 2 - 11:00 AM,Inter-house open quiz championship'
  ];
  return `${headers}\n${sampleRows.join('\n')}\n`;
}

export interface ParsedProgramRow {
  rowIndex: number;
  code: string;
  name: string;
  section: FestSection;
  subsection: ProgramSubsection;
  category: FestCategory;
  programType: ProgramType;
  minParticipants: number;
  maxParticipants: number;
  stageLocation?: string;
  scheduleTime?: string;
  rules?: string;
  isValid: boolean;
  isDuplicate?: boolean;
  duplicateType?: 'EXISTING_CODE' | 'EXISTING_NAME_CAT' | 'CSV_DUPLICATE_CODE' | 'CSV_DUPLICATE_NAME_CAT';
  duplicateDetails?: string;
  errors: string[];
  warnings: string[];
}

export function validateProgramCSVRows(
  csvText: string,
  existingPrograms: Program[],
  categoryConfigs?: CategoryConfig[]
): {
  rows: ParsedProgramRow[];
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  duplicates: ParsedProgramRow[];
} {
  const parsedGrid = parseCSV(csvText);
  if (parsedGrid.length < 2) {
    return { rows: [], validCount: 0, errorCount: 0, duplicateCount: 0, duplicates: [] };
  }

  const rawHeaders = parsedGrid[0].map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
  const codeIdx = rawHeaders.findIndex(h => h === 'code' || h === 'eventcode' || h === 'programcode');
  const nameIdx = rawHeaders.findIndex(h => h === 'name' || h === 'eventname' || h === 'programname');
  const secIdx = rawHeaders.findIndex(h => h === 'section');
  const subIdx = rawHeaders.findIndex(h => h === 'subsection' || h === 'type' || h === 'stagetype');
  const catIdx = rawHeaders.findIndex(h => h === 'category');
  const progTypeIdx = rawHeaders.findIndex(h => h === 'programtype' || h === 'eventtype' || h === 'grouptype');
  const minIdx = rawHeaders.findIndex(h => h === 'minparticipants' || h === 'min');
  const maxIdx = rawHeaders.findIndex(h => h === 'maxparticipants' || h === 'max');
  const locIdx = rawHeaders.findIndex(h => h === 'stagelocation' || h === 'venue' || h === 'location');
  const timeIdx = rawHeaders.findIndex(h => h === 'scheduletime' || h === 'time' || h === 'schedule');
  const rulesIdx = rawHeaders.findIndex(h => h === 'rules' || h === 'description');

  const rows: ParsedProgramRow[] = [];
  
  // Existing database lookup maps
  const existingByCode = new Map<string, Program>();
  const existingByNameCat = new Map<string, Program>();
  
  existingPrograms.forEach(p => {
    if (p.code) existingByCode.set(p.code.toLowerCase().trim(), p);
    const key = `${p.name.toLowerCase().trim()}___${p.category.toLowerCase().trim()}___${p.section.toLowerCase().trim()}`;
    existingByNameCat.set(key, p);
  });

  // Intra-CSV tracker
  const csvSeenCodes = new Map<string, number>();
  const csvSeenNameCats = new Map<string, number>();

  for (let i = 1; i < parsedGrid.length; i++) {
    const rawRow = parsedGrid[i];
    if (rawRow.length === 0 || (rawRow.length === 1 && !rawRow[0])) continue;

    let code = (codeIdx >= 0 ? rawRow[codeIdx] : rawRow[0]) || '';
    const name = (nameIdx >= 0 ? rawRow[nameIdx] : rawRow[1]) || '';
    const sectionRaw = ((secIdx >= 0 ? rawRow[secIdx] : rawRow[2]) || 'ARTS').toUpperCase().trim();
    const subsectionRaw = ((subIdx >= 0 ? rawRow[subIdx] : rawRow[3]) || 'STAGE').toUpperCase().trim();
    const categoryRaw = ((catIdx >= 0 ? rawRow[catIdx] : rawRow[4]) || 'SENIOR').toUpperCase().trim();
    const progTypeRaw = ((progTypeIdx >= 0 ? rawRow[progTypeIdx] : rawRow[5]) || 'INDIVIDUAL').toUpperCase().trim();
    const minRaw = minIdx >= 0 ? rawRow[minIdx] : rawRow[6];
    const maxRaw = maxIdx >= 0 ? rawRow[maxIdx] : rawRow[7];
    const stageLocation = locIdx >= 0 ? rawRow[locIdx] : rawRow[8];
    const scheduleTime = timeIdx >= 0 ? rawRow[timeIdx] : rawRow[9];
    const rules = rulesIdx >= 0 ? rawRow[rulesIdx] : rawRow[10];

    const errors: string[] = [];
    const warnings: string[] = [];
    let isDuplicate = false;
    let duplicateType: 'EXISTING_CODE' | 'EXISTING_NAME_CAT' | 'CSV_DUPLICATE_CODE' | 'CSV_DUPLICATE_NAME_CAT' | undefined;
    let duplicateDetails: string | undefined;

    // 1. Name validation
    if (!name.trim()) {
      errors.push('Event name is required');
    }

    // 2. Section validation
    let section: FestSection = 'ARTS';
    if (sectionRaw === 'SPORTS' || sectionRaw.startsWith('SPORT')) {
      section = 'SPORTS';
    } else if (sectionRaw === 'ARTS' || sectionRaw.startsWith('ART')) {
      section = 'ARTS';
    } else {
      errors.push(`Invalid Section "${sectionRaw}". Must be ARTS or SPORTS`);
    }

    // 3. Subsection validation
    let subsection: ProgramSubsection = 'STAGE';
    if (section === 'SPORTS') {
      subsection = 'SPORTS_EVENT';
    } else {
      if (subsectionRaw.includes('NON') || subsectionRaw === 'NON_STAGE') {
        subsection = 'NON_STAGE';
      } else {
        subsection = 'STAGE';
      }
    }

    // 4. Category validation
    let category: FestCategory = 'SENIOR';
    const parsedCat = parseCategoryString(categoryRaw, categoryConfigs);
    if (parsedCat) {
      category = parsedCat;
    } else if (categoryRaw === 'SUB_JUNIOR' || categoryRaw.includes('SUB')) {
      category = 'SUB_JUNIOR';
    } else if (categoryRaw === 'SUPER_SENIOR' || categoryRaw.includes('SUPER')) {
      category = 'SUPER_SENIOR';
    } else if (categoryRaw === 'JUNIOR') {
      category = 'JUNIOR';
    } else if (categoryRaw === 'SENIOR') {
      category = 'SENIOR';
    } else if (categoryRaw) {
      category = categoryRaw as FestCategory;
    } else {
      errors.push(`Invalid Category "${categoryRaw}".`);
    }

    // 5. Code validation & Duplicate Checks
    const cleanCode = code.trim();
    const cleanCodeKey = cleanCode.toLowerCase();

    if (!cleanCode) {
      code = `EVT-${Date.now().toString().slice(-4)}${i}`;
      warnings.push(`Auto-generated event code "${code}"`);
    } else {
      // Check duplicate code against existing database
      if (existingByCode.has(cleanCodeKey)) {
        const existingProg = existingByCode.get(cleanCodeKey)!;
        isDuplicate = true;
        duplicateType = 'EXISTING_CODE';
        duplicateDetails = `Code "${cleanCode}" already exists in system for "${existingProg.name}" (${existingProg.category})`;
        errors.push(`Duplicate Code: "${cleanCode}" already exists in system`);
      } 
      // Check duplicate code within CSV
      else if (csvSeenCodes.has(cleanCodeKey)) {
        const prevRow = csvSeenCodes.get(cleanCodeKey)!;
        isDuplicate = true;
        duplicateType = 'CSV_DUPLICATE_CODE';
        duplicateDetails = `Duplicate code "${cleanCode}" repeats in CSV (First in Row #${prevRow})`;
        errors.push(`Duplicate Code: "${cleanCode}" repeats in CSV (Row #${prevRow})`);
      } else {
        csvSeenCodes.set(cleanCodeKey, i + 1);
      }
    }

    // 6. Name + Category + Section Duplicate Check
    const cleanName = name.trim();
    if (cleanName) {
      const nameCatKey = `${cleanName.toLowerCase()}___${category.toLowerCase()}___${section.toLowerCase()}`;
      
      // Check against existing database
      if (!isDuplicate && existingByNameCat.has(nameCatKey)) {
        const existingProg = existingByNameCat.get(nameCatKey)!;
        isDuplicate = true;
        duplicateType = 'EXISTING_NAME_CAT';
        duplicateDetails = `Event "${cleanName}" (${category}) already exists in system with code "${existingProg.code}"`;
        errors.push(`Duplicate Event: "${cleanName}" (${category}) already registered in system`);
      }
      // Check against earlier row in CSV
      else if (!isDuplicate && csvSeenNameCats.has(nameCatKey)) {
        const prevRow = csvSeenNameCats.get(nameCatKey)!;
        isDuplicate = true;
        duplicateType = 'CSV_DUPLICATE_NAME_CAT';
        duplicateDetails = `Duplicate event "${cleanName}" (${category}) repeats in CSV (First in Row #${prevRow})`;
        errors.push(`Duplicate Event: "${cleanName}" (${category}) repeats in CSV (Row #${prevRow})`);
      } else {
        csvSeenNameCats.set(nameCatKey, i + 1);
      }
    }

    // 7. Program Type validation
    let programType: ProgramType = 'INDIVIDUAL';
    if (progTypeRaw === 'GROUP' || progTypeRaw.includes('GRP')) {
      programType = 'GROUP';
    } else if (progTypeRaw === 'GENERAL' || progTypeRaw.includes('GEN')) {
      programType = 'GENERAL';
    } else {
      programType = 'INDIVIDUAL';
    }

    // 8. Participant limits validation
    let minParticipants = 1;
    let maxParticipants = 1;
    if (minRaw && !isNaN(parseInt(minRaw, 10))) {
      minParticipants = Math.max(1, parseInt(minRaw, 10));
    }
    if (maxRaw && !isNaN(parseInt(maxRaw, 10))) {
      maxParticipants = Math.max(minParticipants, parseInt(maxRaw, 10));
    } else {
      maxParticipants = programType === 'INDIVIDUAL' ? 1 : Math.max(minParticipants, 4);
    }

    const isValid = errors.length === 0;

    rows.push({
      rowIndex: i + 1,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      section,
      subsection,
      category,
      programType,
      minParticipants,
      maxParticipants,
      stageLocation: stageLocation?.trim() || 'Auditorium',
      scheduleTime: scheduleTime?.trim() || 'Day 1',
      rules: rules?.trim() || '',
      isValid,
      isDuplicate,
      duplicateType,
      duplicateDetails,
      errors,
      warnings
    });
  }

  const validCount = rows.filter(r => r.isValid).length;
  const errorCount = rows.length - validCount;
  const duplicates = rows.filter(r => r.isDuplicate);
  const duplicateCount = duplicates.length;

  return { rows, validCount, errorCount, duplicateCount, duplicates };
}

/* ==========================================================================
   INDIVIDUAL REGISTRATION CSV HELPERS
   ========================================================================== */

export const INDIVIDUAL_REG_CSV_HEADERS = [
  'ProgramCode',
  'ProgramName',
  'Category',
  'AllottedLimit',
  'Candidate_1',
  'Candidate_2'
];

export interface ParsedIndividualRegRow {
  rowIndex: number;
  programCode: string;
  programName?: string;
  category?: string;
  maxCandidates?: number;
  candidateSlot?: number;
  chestNo?: string;
  admissionNo: string;
  studentName?: string;
  autoDetectedStudentName?: string;
  resolvedProgram?: Program;
  resolvedStudent?: Student;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function generateSampleIndividualRegCSV(
  programs: Program[],
  students: Student[],
  teamId?: string,
  category?: FestCategory,
  allCategories = false
): string {
  // Filter individual programs - all categories if allCategories is true or no category specified
  const indProgs = programs.filter(p => {
    if (p.programType !== 'INDIVIDUAL') return false;
    if (allCategories || !category) return true;
    return p.category === category;
  });

  // Determine max slots across these programs to build header columns
  let maxSlotsAcross = 2;
  indProgs.forEach(p => {
    if (p.maxParticipants && p.maxParticipants > maxSlotsAcross) {
      maxSlotsAcross = p.maxParticipants;
    }
  });

  const headers = [
    'ProgramCode',
    'ProgramName',
    'Category',
    'AllottedLimit',
    ...Array.from({ length: maxSlotsAcross }, (_, i) => `Candidate_${i + 1}`)
  ].join(',');

  if (indProgs.length > 0) {
    const rows: string[] = [];
    
    // Group programs by category and sort by code
    const sortedProgs = [...indProgs].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    });

    let studentPointer = 0;

    for (const prog of sortedProgs) {
      const allotted = prog.maxParticipants || 2;
      
      // Find eligible students in the house matching this program's category
      const eligibleStudents = students.filter(
        s => s.status === 'ACTIVE' && (!teamId || s.teamId === teamId) && s.category === prog.category
      );

      const candidateCols: string[] = [];
      for (let slot = 0; slot < maxSlotsAcross; slot++) {
        if (slot < allotted && eligibleStudents.length > 0) {
          const stud = eligibleStudents[studentPointer % eligibleStudents.length];
          studentPointer++;
          // Provide student chest number (or admission number) for instant auto-detection
          const candidateVal = stud.chestNumber ? stud.chestNumber.toString() : stud.admissionNo;
          candidateCols.push(candidateVal);
        } else {
          candidateCols.push('');
        }
      }

      const safeProgName = prog.name.includes(',') ? `"${prog.name}"` : prog.name;
      rows.push(`${prog.code},${safeProgName},${prog.category},${allotted},${candidateCols.join(',')}`);
    }

    return `${headers}\n${rows.join('\n')}\n`;
  }

  const fallback = [
    'ART-NS-01,PENCIL DRAWING,SUB_JUNIOR,1,101,104',
    'ART-NS-02,TYPING MASTER,SUB_JUNIOR,1,101,104',
    'ART-NS-03,ESSAY WRITING,JUNIOR,1,201,204',
    'ART-NS-04,GK QUIZ,JUNIOR,1,201,204',
    'ART-NS-05,POEM WRITING,SENIOR,1,301,304',
    'ART-NS-06,MEMORY TEST,SENIOR,1,301,304',
    'SPT-01,100M SPRINT,SUPER_SENIOR,1,401,404'
  ];
  return `${headers}\n${fallback.join('\n')}\n`;
}

export function validateIndividualRegCSVRows(
  csvText: string,
  programs: Program[],
  students: Student[],
  teamId: string,
  existingRegistrations: Registration[],
  categoryConfigs?: CategoryConfig[],
  maxIndividualProgramsDefault = 5
): { rows: ParsedIndividualRegRow[]; validCount: number; errorCount: number } {
  const parsedGrid = parseCSV(csvText);
  if (parsedGrid.length < 2) {
    return { rows: [], validCount: 0, errorCount: 0 };
  }

  const rawHeaders = parsedGrid[0].map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
  const progIdx = rawHeaders.findIndex(h => h === 'programcode' || h === 'code' || h === 'eventcode' || h === 'program');
  const progNameIdx = rawHeaders.findIndex(h => h === 'programname' || h === 'progname' || h === 'eventname' || h === 'name');
  const catIdx = rawHeaders.findIndex(h => h === 'category' || h === 'cat' || h === 'festcategory' || h === 'section');
  const maxIdx = rawHeaders.findIndex(h => h === 'allottedlimit' || h === 'allottedcount' || h === 'maxcandidates' || h === 'maxcandidate' || h === 'maxparticipants' || h === 'max');
  const chestIdx = rawHeaders.findIndex(h => h === 'chestno' || h === 'chestnumber' || h === 'chest' || h === 'chestnum');
  const admIdx = rawHeaders.findIndex(h => h === 'admissionno' || h === 'admno' || h === 'admission' || h === 'adm');
  const nameIdx = rawHeaders.findIndex(h => h === 'studentname' || h === 'name' || h === 'student');

  // Check for horizontal candidate columns: candidate1, candidate2, cand1, cand2, etc.
  const candidateColumnIndices: number[] = [];
  rawHeaders.forEach((h, idx) => {
    if (
      h.startsWith('candidate') || 
      h.startsWith('cand') || 
      h.startsWith('student') && idx > 3 || 
      h.startsWith('chest') && idx > 3 ||
      h.startsWith('slot')
    ) {
      candidateColumnIndices.push(idx);
    }
  });

  const isHorizontalFormat = candidateColumnIndices.length > 0 || (
    progIdx >= 0 && progNameIdx >= 0 && (catIdx >= 0 || maxIdx >= 0) && parsedGrid[0].length >= 5 && chestIdx < 0 && admIdx < 0
  );

  const rows: ParsedIndividualRegRow[] = [];

  // Track counts within this CSV batch to avoid exceeding quotas in a single upload
  const csvStudentCounts = new Map<string, number>();
  const csvProgramTeamEntries = new Map<string, number>();
  const csvSeenPairs = new Set<string>();

  for (let i = 1; i < parsedGrid.length; i++) {
    const rawRow = parsedGrid[i];
    if (rawRow.length === 0 || (rawRow.length === 1 && !rawRow[0])) continue;

    // 1. Resolve Program Metadata from row
    let progCode = '';
    let progName = '';
    let category = '';
    let maxCandidates = 2;

    if (progIdx >= 0) {
      progCode = rawRow[progIdx] || '';
    } else {
      progCode = rawRow[0] || '';
    }

    if (progNameIdx >= 0) {
      progName = rawRow[progNameIdx] || '';
    } else if (rawRow.length > 1 && !isHorizontalFormat) {
      progName = rawRow[1] || '';
    } else if (rawRow.length > 1 && isHorizontalFormat) {
      progName = rawRow[1] || '';
    }

    if (catIdx >= 0) {
      category = rawRow[catIdx] || '';
    } else if (rawRow.length > 2 && isHorizontalFormat) {
      // Check if col 2 is Category or AllottedLimit
      const isNum = /^\d+$/.test(rawRow[2]?.trim());
      if (!isNum) category = rawRow[2] || '';
      else maxCandidates = parseInt(rawRow[2], 10) || 2;
    }

    if (maxIdx >= 0 && rawRow[maxIdx]) {
      maxCandidates = parseInt(rawRow[maxIdx], 10) || 2;
    } else if (rawRow.length > 3 && isHorizontalFormat) {
      const isNum = /^\d+$/.test(rawRow[3]?.trim());
      if (isNum) maxCandidates = parseInt(rawRow[3], 10) || 2;
    }

    const cleanProg = progCode.trim();
    const cleanProgName = progName.trim();
    const cleanCat = category.trim();

    // Resolve Program
    const matchedProgram = programs.find(
      p => p.code.toLowerCase() === cleanProg.toLowerCase() || 
           (cleanProgName && p.name.toLowerCase() === cleanProgName.toLowerCase()) || 
           p.name.toLowerCase() === cleanProg.toLowerCase() || 
           p.id === cleanProg
    );

    const progErrors: string[] = [];
    const progWarnings: string[] = [];

    if (!cleanProg) {
      progErrors.push('Program code is required');
    } else if (!matchedProgram) {
      progErrors.push(`Program "${cleanProg}" not found`);
    } else if (matchedProgram.programType !== 'INDIVIDUAL') {
      progErrors.push(`Program "${matchedProgram.name}" (${matchedProgram.code}) is a ${matchedProgram.programType} event, not an Individual event.`);
    }

    if (matchedProgram && cleanCat) {
      if (matchedProgram.category.toLowerCase() !== cleanCat.toLowerCase()) {
        progWarnings.push(`CSV Category "${cleanCat}" differs from Program Category "${matchedProgram.category}".`);
      }
    }

    // 2. Extract Candidate Slots
    const candidateSlots: { slotNum: number; rawValue: string }[] = [];

    if (isHorizontalFormat) {
      if (candidateColumnIndices.length > 0) {
        candidateColumnIndices.forEach((cIdx, idx) => {
          const val = rawRow[cIdx]?.trim();
          if (val) candidateSlots.push({ slotNum: idx + 1, rawValue: val });
        });
      } else {
        // Assume all columns from index 4 onwards (or index 3 if only code, name, limit) are candidate slots
        const startIdx = (catIdx >= 0 && maxIdx >= 0) ? 4 : (rawRow.length >= 6 ? 4 : 3);
        for (let c = startIdx; c < rawRow.length; c++) {
          const val = rawRow[c]?.trim();
          if (val) candidateSlots.push({ slotNum: c - startIdx + 1, rawValue: val });
        }
      }
    } else {
      // Standard vertical single-candidate format
      let chestVal = (chestIdx >= 0 ? rawRow[chestIdx] : '') || '';
      let admVal = (admIdx >= 0 ? rawRow[admIdx] : '') || '';
      let nameVal = (nameIdx >= 0 ? rawRow[nameIdx] : '') || '';

      if (chestIdx < 0 && admIdx < 0 && nameIdx < 0) {
        if (rawRow.length >= 5) {
          chestVal = rawRow[2] || '';
          admVal = rawRow[3] || '';
          nameVal = rawRow[4] || '';
        } else if (rawRow.length >= 4) {
          admVal = rawRow[2] || '';
          nameVal = rawRow[3] || '';
        } else if (rawRow.length >= 2) {
          admVal = rawRow[1] || '';
          nameVal = rawRow[2] || '';
        }
      }

      const singleIdentifier = chestVal || admVal || nameVal;
      if (singleIdentifier) {
        candidateSlots.push({ slotNum: 1, rawValue: singleIdentifier });
      }
    }

    // If no candidate was filled on this row
    if (candidateSlots.length === 0) {
      // Empty row or unassigned template row
      continue;
    }

    // 3. Process each candidate slot
    for (const slot of candidateSlots) {
      const cleanVal = slot.rawValue.trim();
      const slotErrors = [...progErrors];
      const slotWarnings = [...progWarnings];

      if (!cleanVal) continue;

      // Find student by Chest Number first, then Admission Number, then Name
      let matchedStudent: Student | undefined;

      // 1. Match Chest Number
      matchedStudent = students.find(
        s => s.chestNumber && (s.chestNumber.toString() === cleanVal || s.chestNumber.toString().toLowerCase() === cleanVal.toLowerCase())
      );

      // 2. Match Admission Number
      if (!matchedStudent) {
        matchedStudent = students.find(
          s => s.admissionNo.toLowerCase() === cleanVal.toLowerCase()
        );
      }

      // 3. Match Student Name
      if (!matchedStudent) {
        matchedStudent = students.find(
          s => s.name.toLowerCase() === cleanVal.toLowerCase()
        );
      }

      let detectedName = '';
      let resolvedAdm = '';
      let resolvedChest = '';

      if (!matchedStudent) {
        slotErrors.push(`Candidate "${cleanVal}" not found in system (Check Chest No or Admission No)`);
      } else {
        detectedName = matchedStudent.name;
        resolvedAdm = matchedStudent.admissionNo;
        resolvedChest = matchedStudent.chestNumber ? matchedStudent.chestNumber.toString() : '';

        // Validate Team ownership
        if (teamId && matchedStudent.teamId !== teamId) {
          slotErrors.push(`Student "${matchedStudent.name}" belongs to another house/team, not your house.`);
        }

        if (matchedStudent.status === 'INACTIVE') {
          slotErrors.push(`Student "${matchedStudent.name}" is marked as INACTIVE`);
        }

        if (!matchedStudent.chestNumber) {
          slotWarnings.push(`Student "${matchedStudent.name}" has no chest number assigned yet.`);
        }

        // Category match check
        if (matchedProgram && matchedStudent.category !== matchedProgram.category) {
          slotErrors.push(
            `Category mismatch: Student "${matchedStudent.name}" is in "${matchedStudent.category}", but program is for "${matchedProgram.category}".`
          );
        }
      }

      // Duplicate and quota checks
      if (matchedProgram && matchedStudent) {
        const pairKey = `${matchedProgram.id}_${matchedStudent.id}`;

        const alreadyRegistered = existingRegistrations.some(
          r =>
            r.programId === matchedProgram.id &&
            r.studentId === matchedStudent.id &&
            r.status === 'CONFIRMED'
        );

        if (alreadyRegistered) {
          slotErrors.push(`Student "${matchedStudent.name}" is already registered for "${matchedProgram.name}"`);
        } else if (csvSeenPairs.has(pairKey)) {
          slotErrors.push(`Duplicate entry: Student "${matchedStudent.name}" is entered multiple times for "${matchedProgram.name}"`);
        } else {
          csvSeenPairs.add(pairKey);

          // Individual participation quota check
          const currentCatConfig = categoryConfigs?.find(c => c.category === matchedStudent.category);
          const maxQuota = currentCatConfig?.maxIndividualProgramsPerStudent ?? maxIndividualProgramsDefault;

          const existingCount = existingRegistrations.filter(
            r => r.studentId === matchedStudent.id && r.programType === 'INDIVIDUAL' && r.status === 'CONFIRMED'
          ).length;

          const batchCount = csvStudentCounts.get(matchedStudent.id) || 0;
          const totalAfterBatch = existingCount + batchCount + 1;

          if (totalAfterBatch > maxQuota) {
            slotErrors.push(
              `Participation quota exceeded: Max ${maxQuota} individual events allowed for ${matchedStudent.category}. Student already has ${existingCount} registered.`
            );
          } else {
            csvStudentCounts.set(matchedStudent.id, batchCount + 1);
          }

          // Specific subsection quota check
          const isSports = matchedProgram.section === 'SPORTS' || matchedProgram.subsection === 'SPORTS_EVENT';
          const isStage = !isSports && matchedProgram.subsection === 'STAGE';
          const isNonStage = !isSports && matchedProgram.subsection === 'NON_STAGE';

          if (isStage && currentCatConfig?.maxStagePrograms !== undefined) {
            const existingStage = existingRegistrations.filter(
              r => r.studentId === matchedStudent.id && r.programType === 'INDIVIDUAL' && r.status === 'CONFIRMED' && r.section !== 'SPORTS' && r.subsection === 'STAGE'
            ).length;
            if (existingStage >= currentCatConfig.maxStagePrograms) {
              slotErrors.push(`Stage quota exceeded: Max ${currentCatConfig.maxStagePrograms} Stage events allowed for ${matchedStudent.category}.`);
            }
          }

          if (isNonStage && currentCatConfig?.maxNonStagePrograms !== undefined) {
            const existingNonStage = existingRegistrations.filter(
              r => r.studentId === matchedStudent.id && r.programType === 'INDIVIDUAL' && r.status === 'CONFIRMED' && r.section !== 'SPORTS' && r.subsection === 'NON_STAGE'
            ).length;
            if (existingNonStage >= currentCatConfig.maxNonStagePrograms) {
              slotErrors.push(`Non-Stage quota exceeded: Max ${currentCatConfig.maxNonStagePrograms} Non-Stage events allowed for ${matchedStudent.category}.`);
            }
          }

          if (isSports && currentCatConfig?.maxSportsPrograms !== undefined) {
            const existingSports = existingRegistrations.filter(
              r => r.studentId === matchedStudent.id && r.programType === 'INDIVIDUAL' && r.status === 'CONFIRMED' && (r.section === 'SPORTS' || r.subsection === 'SPORTS_EVENT')
            ).length;
            if (existingSports >= currentCatConfig.maxSportsPrograms) {
              slotErrors.push(`Sports quota exceeded: Max ${currentCatConfig.maxSportsPrograms} Sports events allowed for ${matchedStudent.category}.`);
            }
          }

          // Program house limit check (allotted candidate limit)
          const teamHouseLimit = matchedProgram.maxParticipants || maxCandidates || 2;
          const existingTeamCount = existingRegistrations.filter(
            r =>
              r.programId === matchedProgram.id &&
              r.teamId === matchedStudent.teamId &&
              r.programType === 'INDIVIDUAL' &&
              r.status === 'CONFIRMED'
          ).length;

          const batchTeamCount = csvProgramTeamEntries.get(matchedProgram.id) || 0;
          const totalTeamEntries = existingTeamCount + batchTeamCount + 1;

          if (totalTeamEntries > teamHouseLimit) {
            slotErrors.push(
              `House event quota reached: Max ${teamHouseLimit} candidate(s) per house allowed for "${matchedProgram.name}".`
            );
          } else {
            csvProgramTeamEntries.set(matchedProgram.id, batchTeamCount + 1);
          }
        }
      }

      const isValid = slotErrors.length === 0;

      rows.push({
        rowIndex: i + 1,
        programCode: cleanProg,
        programName: matchedProgram?.name || cleanProgName,
        category: cleanCat || matchedProgram?.category || matchedStudent?.category,
        maxCandidates: matchedProgram?.maxParticipants || maxCandidates || 2,
        candidateSlot: slot.slotNum,
        chestNo: resolvedChest,
        admissionNo: resolvedAdm,
        studentName: detectedName || cleanVal,
        autoDetectedStudentName: matchedStudent?.name,
        resolvedProgram: matchedProgram,
        resolvedStudent: matchedStudent,
        isValid,
        errors: slotErrors,
        warnings: slotWarnings
      });
    }
  }

  const validCount = rows.filter(r => r.isValid).length;
  const errorCount = rows.length - validCount;

  return { rows, validCount, errorCount };
}

/* ==========================================================================
   GROUP REGISTRATION CSV HELPERS
   ========================================================================== */

export const GROUP_REG_CSV_HEADERS = [
  'ProgramCode',
  'ProgramName',
  'Category',
  'MinCandidates',
  'MaxCandidates',
  'GroupName',
  'StudentAdmissionNumbers'
];

export interface ParsedGroupRegRow {
  rowIndex: number;
  programCode: string;
  programName?: string;
  category?: string;
  minCandidates?: number;
  maxCandidates?: number;
  groupName: string;
  admissionNosRaw: string;
  resolvedProgram?: Program;
  resolvedStudents: Student[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function generateSampleGroupRegCSV(
  programs: Program[],
  students: Student[],
  teamId?: string,
  category?: FestCategory,
  allCategories = false
): string {
  const headers = GROUP_REG_CSV_HEADERS.join(',');
  
  const groupProgs = programs.filter(p => {
    const isGroup = p.programType === 'GROUP' || p.programType === 'GENERAL';
    if (!isGroup) return false;
    if (allCategories || !category || p.programType === 'GENERAL') return true;
    return p.category === category;
  });

  if (groupProgs.length > 0) {
    const rows: string[] = [];
    
    // Sort cleanly by category and code
    const sortedProgs = [...groupProgs].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    });

    sortedProgs.forEach((prog, idx) => {
      const minP = prog.minParticipants || 2;
      const maxP = prog.maxParticipants || 4;
      
      const teamStudents = students.filter(
        s => s.status === 'ACTIVE' && (!teamId || s.teamId === teamId) && (prog.programType === 'GENERAL' || s.category === prog.category)
      );

      const needed = Math.min(teamStudents.length, Math.max(minP, Math.min(maxP, 4)));
      const sampleAdms = teamStudents.length > 0
        ? teamStudents.slice(0, needed).map(s => (s.chestNumber ? s.chestNumber.toString() : s.admissionNo)).join(';')
        : '101;104';

      const safeProgName = prog.name.includes(',') ? `"${prog.name}"` : prog.name;
      const grpName = `${prog.name} Contingent ${idx + 1}`;
      rows.push(`${prog.code},${safeProgName},${prog.category},${minP},${maxP},${grpName},${sampleAdms}`);
    });

    return `${headers}\n${rows.join('\n')}\n`;
  }

  const fallback = [
    'ART-STG-01,GROUP SONG,SUB_JUNIOR,2,4,Junior Group Song Contingent,101;104',
    'ART-STG-02,FOLK CHORUS,SENIOR,4,10,Ruby Folk Chorus,301;302;303;304',
    'SPT-TRK-02,SPRINT RELAY,SUPER_SENIOR,4,4,Sprint Relay Team,401;402;403;404'
  ];
  return `${headers}\n${fallback.join('\n')}\n`;
}

export function validateGroupRegCSVRows(
  csvText: string,
  programs: Program[],
  students: Student[],
  teamId: string,
  existingRegistrations: Registration[],
  categoryConfigs?: CategoryConfig[]
): { rows: ParsedGroupRegRow[]; validCount: number; errorCount: number } {
  const parsedGrid = parseCSV(csvText);
  if (parsedGrid.length < 2) {
    return { rows: [], validCount: 0, errorCount: 0 };
  }

  const rawHeaders = parsedGrid[0].map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
  const progIdx = rawHeaders.findIndex(h => h === 'programcode' || h === 'code' || h === 'eventcode' || h === 'program');
  const progNameIdx = rawHeaders.findIndex(h => h === 'programname' || h === 'progname' || h === 'eventname');
  const catIdx = rawHeaders.findIndex(h => h === 'category' || h === 'cat' || h === 'festcategory' || h === 'section');
  const minIdx = rawHeaders.findIndex(h => h === 'mincandidates' || h === 'minparticipants' || h === 'min');
  const maxIdx = rawHeaders.findIndex(h => h === 'maxcandidates' || h === 'maxparticipants' || h === 'max');
  const nameIdx = rawHeaders.findIndex(h => h === 'groupname' || h === 'name' || h === 'teamtitle');
  const admIdx = rawHeaders.findIndex(h => h === 'studentadmissionnumbers' || h === 'admissionnos' || h === 'students' || h === 'members' || h === 'chestnumbers' || h === 'studentchestoradmissionnos');

  const rows: ParsedGroupRegRow[] = [];
  const csvProgramGroupCounts = new Map<string, number>();

  for (let i = 1; i < parsedGrid.length; i++) {
    const rawRow = parsedGrid[i];
    if (rawRow.length === 0 || (rawRow.length === 1 && !rawRow[0])) continue;

    let progCode = '';
    let progName = '';
    let category = '';
    let minCandidates = 2;
    let maxCandidates = 4;
    let groupName = '';
    let admNosRaw = '';

    if (progIdx >= 0 || catIdx >= 0 || nameIdx >= 0 || admIdx >= 0) {
      progCode = (progIdx >= 0 ? rawRow[progIdx] : rawRow[0]) || '';
      progName = (progNameIdx >= 0 ? rawRow[progNameIdx] : '') || '';
      category = (catIdx >= 0 ? rawRow[catIdx] : '') || '';
      if (minIdx >= 0 && rawRow[minIdx]) minCandidates = parseInt(rawRow[minIdx], 10) || 2;
      if (maxIdx >= 0 && rawRow[maxIdx]) maxCandidates = parseInt(rawRow[maxIdx], 10) || 4;
      groupName = (nameIdx >= 0 ? rawRow[nameIdx] : (rawRow.length > 2 ? rawRow[1] : '')) || '';
      admNosRaw = (admIdx >= 0 ? rawRow[admIdx] : rawRow[rawRow.length - 1]) || '';
    } else {
      // Positional fallbacks
      if (rawRow.length >= 7) {
        progCode = rawRow[0] || '';
        progName = rawRow[1] || '';
        category = rawRow[2] || '';
        minCandidates = parseInt(rawRow[3], 10) || 2;
        maxCandidates = parseInt(rawRow[4], 10) || 4;
        groupName = rawRow[5] || '';
        admNosRaw = rawRow[6] || '';
      } else if (rawRow.length >= 4) {
        progCode = rawRow[0] || '';
        category = rawRow[1] || '';
        groupName = rawRow[2] || '';
        admNosRaw = rawRow[3] || '';
      } else if (rawRow.length === 3) {
        progCode = rawRow[0] || '';
        groupName = rawRow[1] || '';
        admNosRaw = rawRow[2] || '';
      } else {
        progCode = rawRow[0] || '';
        admNosRaw = rawRow[1] || '';
      }
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    const cleanProg = progCode.trim();
    const cleanProgName = progName.trim();
    const cleanCat = category.trim();
    const cleanGroupName = groupName.trim() || 'Group Contingent';

    if (!cleanProg) {
      errors.push('Program code is required');
    }
    if (!admNosRaw.trim()) {
      errors.push('Student chest or admission numbers are required');
    }

    // 1. Resolve Program
    const matchedProgram = programs.find(
      p => p.code.toLowerCase() === cleanProg.toLowerCase() || 
           (cleanProgName && p.name.toLowerCase() === cleanProgName.toLowerCase()) || 
           p.name.toLowerCase() === cleanProg.toLowerCase() || 
           p.id === cleanProg
    );

    if (!matchedProgram) {
      if (cleanProg) errors.push(`Program "${cleanProg}" not found`);
    } else if (matchedProgram.programType !== 'GROUP' && matchedProgram.programType !== 'GENERAL') {
      errors.push(`Program "${matchedProgram.name}" (${matchedProgram.code}) is an ${matchedProgram.programType} event, not a Group event.`);
    }

    if (matchedProgram && cleanCat) {
      if (matchedProgram.category.toLowerCase() !== cleanCat.toLowerCase()) {
        warnings.push(`CSV Category "${cleanCat}" differs from Program Category "${matchedProgram.category}".`);
      }
    }

    // 2. Resolve Students (supports chest numbers or admission numbers)
    const rawAdms = admNosRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean);
    const resolvedStudents: Student[] = [];
    const seenStudentIdsInGroup = new Set<string>();

    for (const adm of rawAdms) {
      const student = students.find(
        s => (s.chestNumber && s.chestNumber.toString() === adm) ||
             s.admissionNo.toLowerCase() === adm.toLowerCase() || 
             s.name.toLowerCase() === adm.toLowerCase()
      );

      if (!student) {
        errors.push(`Student with Chest / Admission No. "${adm}" not found`);
      } else {
        if (seenStudentIdsInGroup.has(student.id)) {
          errors.push(`Student "${student.name}" is listed multiple times in this group`);
        } else {
          seenStudentIdsInGroup.add(student.id);
          resolvedStudents.push(student);

          // Team ownership check
          if (teamId && student.teamId !== teamId) {
            errors.push(`Student "${student.name}" belongs to another house/team.`);
          }

          if (student.status === 'INACTIVE') {
            errors.push(`Student "${student.name}" is marked as INACTIVE`);
          }

          // Category check (unless General event)
          if (matchedProgram && matchedProgram.programType !== 'GENERAL' && student.category !== matchedProgram.category) {
            errors.push(
              `Student "${student.name}" is in category "${student.category}", but program is for "${matchedProgram.category}".`
            );
          }
        }
      }
    }

    // 3. Member Count Checks
    if (matchedProgram && resolvedStudents.length > 0) {
      const minP = matchedProgram.minParticipants || 1;
      const maxP = matchedProgram.maxParticipants || 10;

      if (resolvedStudents.length < minP) {
        errors.push(`Group requires at least ${minP} members (found ${resolvedStudents.length})`);
      }
      if (resolvedStudents.length > maxP) {
        errors.push(`Group cannot exceed ${maxP} members (found ${resolvedStudents.length})`);
      }

      // Check program team quota
      const currentTeamGroupRegistrations = existingRegistrations.filter(
        r => r.programId === matchedProgram.id && r.teamId === teamId && r.status === 'CONFIRMED'
      );
      const uniqueGroupIds = new Set(currentTeamGroupRegistrations.map(r => r.groupId).filter(Boolean));
      const existingGroupCount = uniqueGroupIds.size;
      const batchGroupCount = csvProgramGroupCounts.get(matchedProgram.id) || 0;
      const maxTeamGroups = matchedProgram.maxGroupsPerTeam || 1;

      if (existingGroupCount + batchGroupCount + 1 > maxTeamGroups) {
        errors.push(
          `House group entry quota reached: Maximum ${maxTeamGroups} group entry per house for "${matchedProgram.name}".`
        );
      } else {
        csvProgramGroupCounts.set(matchedProgram.id, batchGroupCount + 1);
      }
    }

    const isValid = errors.length === 0;

    rows.push({
      rowIndex: i + 1,
      programCode: cleanProg,
      programName: matchedProgram?.name || cleanProgName,
      category: cleanCat || matchedProgram?.category,
      minCandidates: matchedProgram?.minParticipants || minCandidates,
      maxCandidates: matchedProgram?.maxParticipants || maxCandidates,
      groupName: cleanGroupName,
      admissionNosRaw: admNosRaw,
      resolvedProgram: matchedProgram,
      resolvedStudents,
      isValid,
      errors,
      warnings
    });
  }

  const validCount = rows.filter(r => r.isValid).length;
  const errorCount = rows.length - validCount;

  return { rows, validCount, errorCount };
}

