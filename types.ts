

export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

export interface ExamConfig {
  id: string;
  name: string; // e.g., "Half Yearly", "Annual"
  maxMarks: number;
  weightage: number; // Percentage to count towards final
}

export interface SubjectConfig {
  id: string;
  name: string;
  type: 'Scholastic' | 'Co-Scholastic';
  exams: ExamConfig[]; // Only for Scholastic
}

export interface ClassConfig {
  id: string;
  className: string;
  subjects: SubjectConfig[];
  extraInfoFields: string[]; // e.g., ["Aadhar No", "Mother Name"]
  passPercentage: number;
  enableStudentPhoto?: boolean; // New Toggle
}

export interface StudentMark {
  subjectId: string;
  examId: string;
  obtained: number;
}

export interface StudentCoScholasticGrade {
  subjectId: string;
  grade: string;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  gender: Gender;
  className: string; // Links to ClassConfig.className or ID
  info: Record<string, string>; // Dynamic fields
  marks: StudentMark[];
  coScholasticGrades: StudentCoScholasticGrade[];
  photo?: string; // Base64 string for student profile image
}

export interface SchoolInfo {
  name: string;
  address: string;
  affiliation: string;
  logo: string | null; // Base64
  session: string; // "2024-2025"
}

export interface ThemeConfig {
  // Global
  fontFamily: string;
  
  // Page & Watermark
  pageBorderColor: string;
  watermarkOpacity: number; // 0.1 to 1.0
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Header Section
  schoolNameColor: string;
  schoolNameSize: number; // em
  schoolNameAlign: 'center' | 'left' | 'right';
  headerSecondaryColor: string; // Address/Affiliation color

  // Session Badge
  sessionBadgeBg: string;
  sessionBadgeColor: string;
  sessionBadgeSize?: number; // em

  // Student Info Grid
  studentInfoBg: string;
  studentLabelColor: string;
  studentValueColor: string;

  // Tables
  tableHeaderBg: string;
  tableHeaderColor: string;
  tableBorderColor: string;
  tableRowOddBg: string;
  tableRowEvenBg: string;
  gradeColor: string;
  
  // Result
  resultPassColor: string;
  resultFailColor: string;
  resultContentScale?: number; // New scaling factor for result box content
}

export interface AppState {
  schoolInfo: SchoolInfo;
  classes: ClassConfig[];
  students: Student[];
  orientation: 'portrait' | 'landscape';
  theme: ThemeConfig;
}