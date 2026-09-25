export type FestSection = 'ARTS' | 'SPORTS';
export type ArtsSubsection = 'STAGE' | 'NON_STAGE';
export type ProgramSubsection = ArtsSubsection | 'SPORTS_EVENT';

export type FestCategory = 'SUB_JUNIOR' | 'JUNIOR' | 'SENIOR' | 'SUPER_SENIOR' | string;

export type ProgramType = 'INDIVIDUAL' | 'GROUP' | 'GENERAL';

export type AwardPosition = 'FIRST' | 'SECOND' | 'THIRD' | 'OTHER' | 'NO_PRIZE';

export type AwardGrade = 'A' | 'B' | 'C' | 'D' | 'NONE';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'CONTROLLER' | 'PUBLIC';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string; // For team leaders
  assignedProgramIds?: string[]; // For controllers
  avatarUrl?: string;
  isActive?: boolean;
  lastLogin?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  color: string; // Hex color (e.g. #ef4444)
  bgClass: string;
  borderClass: string;
  leaderId: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone?: string;
  motto?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  classNumber: string; // e.g. "5", "10", "12"
  sectionLetter?: string; // e.g. "A", "B"
  category: FestCategory;
  teamId: string;
  chestNumber?: number | string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdDate: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface ClassCategoryMapping {
  id: string;
  classNumber: string; // e.g. "1", "2", "3"
  category: FestCategory;
  description?: string;
}

export interface CategoryConfig {
  id: string;
  category: FestCategory;
  displayName: string;
  sectionScope: 'ALL' | 'ARTS' | 'SPORTS';
  assignedClasses: string[];
  maxIndividualProgramsPerStudent: number; // Overall Max limit
  minIndividualProgramsPerStudent?: number; // Overall Min limit
  
  // Specific program type limits
  minStagePrograms?: number; // Arts Stage Min (default 0)
  maxStagePrograms?: number; // Arts Stage Max
  minNonStagePrograms?: number; // Arts Non-Stage Min (default 0)
  maxNonStagePrograms?: number; // Arts Non-Stage Max
  minSportsPrograms?: number; // Sports Min (default 0)
  maxSportsPrograms?: number; // Sports Max
  
  chestNoStart: number;
  chestNoEnd: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Program {
  id: string;
  code: string;
  name: string;
  section: FestSection;
  subsection: ProgramSubsection;
  category: FestCategory;
  programType: ProgramType;
  minParticipants: number;
  maxParticipants: number;
  maxGroupsPerTeam?: number; // Maximum groups allowed per team (default 1 or 2)
  requiredMembersPerGroup?: number; // Exact required members per group
  registrationOpen: boolean;
  assignedControllerId?: string;
  assignedControllerName?: string;
  rules?: string;
  stageLocation?: string;
  scheduleTime?: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  resultStatus: 'PENDING' | 'DRAFT' | 'SUBMITTED' | 'PUBLISHED';
}

export interface GroupMember {
  studentId: string;
  name: string;
  chestNumber?: number | string;
  admissionNo: string;
  classNumber: string;
}

export interface Registration {
  id: string;
  programId: string;
  programName: string;
  section: FestSection;
  subsection: ProgramSubsection;
  category: FestCategory;
  programType: ProgramType;
  teamId: string;
  teamName: string;
  teamColor: string;
  
  // For Individual
  studentId?: string;
  studentName?: string;
  admissionNo?: string;
  chestNumber?: number | string;
  classNumber?: string;
  
  // For Group / General
  groupId?: string;
  groupNumber?: number; // 1, 2, etc. within the team
  groupName?: string;
  groupMembers?: GroupMember[];
  
  registeredBy: string;
  registeredRole: UserRole;
  timestamp: string;
  status: 'CONFIRMED' | 'WITHDRAWN';
}

export interface GradePointConfig {
  id: string;
  grade: AwardGrade;
  points: number;
  label: string;
  active: boolean;
}

export interface PositionPointConfig {
  id: string;
  position: AwardPosition;
  points: number;
  label: string;
  active: boolean;
}

export interface ProgramTypeScoringConfig {
  programType: ProgramType;
  title: string;
  description: string;
  positionConfigs: PositionPointConfig[];
  gradeConfigs: GradePointConfig[];
}

export type ScoringConfigMap = Record<ProgramType, ProgramTypeScoringConfig>;

export interface ResultEntry {
  id: string;
  registrationId: string;
  teamId: string;
  teamName: string;
  
  // For individual
  studentId?: string;
  studentName?: string;
  chestNumber?: number | string;
  admissionNo?: string;
  
  // For group
  groupId?: string;
  groupName?: string;
  groupMembers?: GroupMember[];
  
  position: AwardPosition;
  grade: AwardGrade;
  positionPoints: number;
  gradePoints: number;
  totalPoints: number;
  codeLetter?: string;
  remarks?: string;
}

export interface ProgramResult {
  id: string;
  programId: string;
  programName: string;
  section: FestSection;
  category: FestCategory;
  programType: ProgramType;
  status: 'DRAFT' | 'SUBMITTED' | 'PUBLISHED';
  submittedBy: string;
  submittedAt?: string;
  publishedAt?: string;
  entries: ResultEntry[];
  remarks?: string;
}

export interface TeamScoreBreakdown {
  teamId: string;
  teamName: string;
  teamColor: string;
  artsStagePoints: number;
  artsNonStagePoints: number;
  artsTotalPoints: number;
  sportsTotalPoints: number;
  combinedTotalPoints?: number;
  categoryArtsPoints: Record<FestCategory, number>;
  categorySportsPoints: Record<FestCategory, number>;
  artsFirstCount: number;
  artsSecondCount: number;
  artsThirdCount: number;
  sportsFirstCount: number;
  sportsSecondCount: number;
  sportsThirdCount: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  artsRank: number;
  sportsRank: number;
  rank: number;
}

export interface StudentScoreBreakdown {
  studentId: string;
  studentName: string;
  admissionNo: string;
  chestNumber?: number | string;
  classNumber: string;
  category: FestCategory;
  teamId: string;
  teamName: string;
  teamColor: string;
  artsIndividualPoints: number;
  sportsIndividualPoints: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  gradeACount: number;
  gradeBCount: number;
  gradeCCount: number;
  registeredCount: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: 'STUDENT' | 'TEAM' | 'PROGRAM' | 'RESULT' | 'SETTING' | 'REGISTRATION' | 'CHEST_NUMBER';
  entityId?: string;
  details: string;
  performedBy: string;
  role: UserRole;
  timestamp: string;
}

export interface BannerSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  isActive: boolean;
}

export interface FestSettings {
  festName: string;
  festTagline: string;
  festYear: string;
  institutionName: string;
  registrationOpen: boolean;
  registrationOpensAt: string;
  registrationClosesAt: string;
  allowCombinedLeaderboard: boolean;
  requireAdminApproval: boolean;
  showPublicLiveScores: boolean;
  enableArtsSection?: boolean;
  enableSportsSection?: boolean;
  maxIndividualProgramsDefault: number;
  themeMode: 'dark' | 'light' | 'system';
  bannerSlides?: BannerSlide[];
}
