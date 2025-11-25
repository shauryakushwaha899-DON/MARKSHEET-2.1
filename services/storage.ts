

import { AppState, SchoolInfo } from '../types';

const STORAGE_KEY = 'school_ms_data_v1';

const DEFAULT_STATE: AppState = {
  schoolInfo: {
    name: 'Demo Public School',
    address: '123 Education Lane, Knowledge City',
    affiliation: 'Affiliated to CBSE',
    logo: null,
    session: '2024-2025'
  },
  theme: {
    fontFamily: 'Inter',
    pageBorderColor: '#1e293b',
    watermarkOpacity: 0.1,
    margins: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    },
    
    schoolNameColor: '#0f172a',
    schoolNameSize: 2.5,
    schoolNameAlign: 'center',
    headerSecondaryColor: '#475569',
    
    sessionBadgeBg: '#0f172a',
    sessionBadgeColor: '#ffffff',
    sessionBadgeSize: 0.85,
    
    studentInfoBg: '#f8fafc',
    studentLabelColor: '#64748b',
    studentValueColor: '#1e293b',
    
    tableHeaderBg: '#e2e8f0',
    tableHeaderColor: '#1e293b',
    tableBorderColor: '#cbd5e1',
    tableRowOddBg: '#ffffff',
    tableRowEvenBg: '#f8fafc',
    gradeColor: '#1e293b',
    
    resultPassColor: '#059669',
    resultFailColor: '#dc2626',
    resultContentScale: 1.0
  },
  classes: [
    {
      id: 'c1',
      className: 'Class 10',
      passPercentage: 33,
      extraInfoFields: ['Father Name', 'Mother Name', 'DOB'],
      subjects: [
        { id: 's1', name: 'Mathematics', type: 'Scholastic', exams: [{ id: 'e1', name: 'Term 1', maxMarks: 100, weightage: 50 }, { id: 'e2', name: 'Term 2', maxMarks: 100, weightage: 50 }] },
        { id: 's2', name: 'Science', type: 'Scholastic', exams: [{ id: 'e1', name: 'Term 1', maxMarks: 100, weightage: 50 }, { id: 'e2', name: 'Term 2', maxMarks: 100, weightage: 50 }] },
        { id: 's3', name: 'English', type: 'Scholastic', exams: [{ id: 'e1', name: 'Term 1', maxMarks: 100, weightage: 50 }, { id: 'e2', name: 'Term 2', maxMarks: 100, weightage: 50 }] },
        { id: 'cs1', name: 'Discipline', type: 'Co-Scholastic', exams: [] },
        { id: 'cs2', name: 'Art Education', type: 'Co-Scholastic', exams: [] },
      ]
    }
  ],
  students: [],
  orientation: 'portrait'
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized);
      
      // Robustly merge theme: use default theme as base, overwrite with saved theme
      // Also ensure margins exist if loading from old state
      const mergedTheme = { 
        ...DEFAULT_STATE.theme, 
        ...(parsed.theme || {}),
        margins: { ...DEFAULT_STATE.theme.margins, ...(parsed.theme?.margins || {}) },
        sessionBadgeSize: parsed.theme?.sessionBadgeSize ?? DEFAULT_STATE.theme.sessionBadgeSize,
        resultContentScale: parsed.theme?.resultContentScale ?? DEFAULT_STATE.theme.resultContentScale
      };

      // Deep merge with default to ensure new fields exist
      return { 
        ...DEFAULT_STATE, 
        ...parsed,
        theme: mergedTheme
      };
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }
  return DEFAULT_STATE;
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};

export const exportBackup = (state: AppState) => {
  const dataStr = JSON.stringify(state);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `school_backup_${new Date().toISOString().slice(0,10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};