

import React, { useState } from 'react';
import { AppState, ThemeConfig, Student, Gender, ClassConfig } from '../types';
import { MarksheetTemplate } from './MarksheetPreview';
import { ChevronDown, ChevronRight, Layout, Type, Palette, Monitor, FileText, Save, RefreshCw, Maximize } from 'lucide-react';

interface EditorProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

// Dummy data for the preview
const DUMMY_STUDENT: Student = {
  id: 'DEMO-001',
  name: 'Arjun Kumar',
  rollNo: '101',
  className: 'Class 10',
  gender: Gender.Male,
  info: { 'Father Name': 'Ramesh Kumar', 'Mother Name': 'Sunita Devi', 'DOB': '2008-05-15' },
  marks: [
    { subjectId: 's1', examId: 'e1', obtained: 85 }, { subjectId: 's1', examId: 'e2', obtained: 92 },
    { subjectId: 's2', examId: 'e1', obtained: 78 }, { subjectId: 's2', examId: 'e2', obtained: 88 },
    { subjectId: 's3', examId: 'e1', obtained: 82 }, { subjectId: 's3', examId: 'e2', obtained: 85 },
  ],
  coScholasticGrades: [
    { subjectId: 'cs1', grade: 'A' }, { subjectId: 'cs2', grade: 'A' }
  ],
  photo: null
};

const DUMMY_CLASS_CONFIG: ClassConfig = {
  id: 'demo-class-config',
  className: 'Class 10',
  passPercentage: 33,
  extraInfoFields: ['Father Name', 'Mother Name', 'DOB'],
  subjects: [
    { id: 's1', name: 'Mathematics', type: 'Scholastic', exams: [{ id: 'e1', name: 'Term 1', maxMarks: 100, weightage: 50 }, { id: 'e2', name: 'Term 2', maxMarks: 100, weightage: 50 }] },
    { id: 's2', name: 'Science', type: 'Scholastic', exams: [{ id: 'e1', name: 'Term 1', maxMarks: 100, weightage: 50 }, { id: 'e2', name: 'Term 2', maxMarks: 100, weightage: 50 }] },
    { id: 's3', name: 'English', type: 'Scholastic', exams: [{ id: 'e1', name: 'Term 1', maxMarks: 100, weightage: 50 }, { id: 'e2', name: 'Term 2', maxMarks: 100, weightage: 50 }] },
    { id: 'cs1', name: 'Discipline', type: 'Co-Scholastic', exams: [] },
    { id: 'cs2', name: 'Art Education', type: 'Co-Scholastic', exams: [] },
  ],
  enableStudentPhoto: true
};

// Fallback theme to initialize state if storage data is incomplete
const DEFAULT_THEME_FALLBACK: ThemeConfig = {
    fontFamily: 'Inter',
    pageBorderColor: '#1e293b',
    watermarkOpacity: 0.1,
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
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
};

const PDFLayoutEditor: React.FC<EditorProps> = ({ state, setState }) => {
  // Initialize with state theme OR fallback to prevent undefined errors
  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(() => {
    // Merge safely
    return {
      ...DEFAULT_THEME_FALLBACK,
      ...(state.theme || {}),
      margins: { ...DEFAULT_THEME_FALLBACK.margins, ...(state.theme?.margins || {}) },
      resultContentScale: state.theme?.resultContentScale ?? DEFAULT_THEME_FALLBACK.resultContentScale
    };
  });
  const [activeOrientation, setActiveOrientation] = useState<'portrait' | 'landscape'>(state.orientation);
  const [activeSection, setActiveSection] = useState<string>('margins'); // Start with margins to show new feature

  const saveChanges = () => {
    setState(prev => ({
      ...prev,
      theme: activeTheme,
      orientation: activeOrientation
    }));
    alert('Configuration Saved Successfully!');
  };

  const resetChanges = () => {
    if (confirm('Reset to currently saved settings?')) {
        const resetTheme = {
          ...DEFAULT_THEME_FALLBACK,
          ...(state.theme || {}),
          margins: { ...DEFAULT_THEME_FALLBACK.margins, ...(state.theme?.margins || {}) },
          resultContentScale: state.theme?.resultContentScale ?? DEFAULT_THEME_FALLBACK.resultContentScale
        };
        setActiveTheme(resetTheme);
        setActiveOrientation(state.orientation);
    }
  };

  const updateTheme = (key: keyof ThemeConfig, value: any) => {
    setActiveTheme(prev => ({ ...prev, [key]: value }));
  };

  const updateMargin = (side: keyof ThemeConfig['margins'], value: number) => {
    setActiveTheme(prev => ({
      ...prev,
      margins: {
        ...prev.margins,
        [side]: value
      }
    }));
  };

  const AccordionItem = ({ id, title, icon: Icon, children }: any) => {
    const isOpen = activeSection === id;
    return (
      <div className="border-b border-gray-100 last:border-0">
        <button 
          onClick={() => setActiveSection(isOpen ? '' : id)}
          className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${isOpen ? 'bg-blue-50/50 text-blue-700' : 'text-gray-700'}`}
        >
          <div className="flex items-center gap-3 font-medium">
            <Icon size={18} className={isOpen ? 'text-blue-500' : 'text-gray-400'} />
            {title}
          </div>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isOpen && (
          <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200 space-y-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  const ColorInput = ({ label, prop }: { label: string, prop: keyof ThemeConfig }) => (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <input 
          type="color" 
          value={(activeTheme[prop] as string) || '#000000'}
          onChange={(e) => updateTheme(prop, e.target.value)}
          className="h-8 w-10 p-0.5 border border-gray-200 rounded cursor-pointer bg-white"
        />
        <span className="text-xs font-mono text-gray-400 w-16">{activeTheme[prop] as string}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-100 overflow-hidden">
      {/* LEFT: Editor Panel - Fixed width on desktop */}
      <div className="w-full md:w-80 bg-white shadow-xl flex flex-col z-10 border-r border-gray-200 flex-shrink-0 h-1/2 md:h-full">
        <div className="p-5 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Layout className="text-blue-600" size={20} /> Layout Editor
          </h2>
          <p className="text-xs text-gray-500 mt-1">Customize PDF style & branding</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 0. Page Margins - NEW */}
          <AccordionItem id="margins" title="Page Margins" icon={Maximize}>
             <div className="space-y-4">
               <p className="text-xs text-gray-500">Adjust margins (in mm) to fit content.</p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-600">Top</label>
                     <input type="number" value={activeTheme.margins?.top} onChange={e => updateMargin('top', Number(e.target.value))} className="w-full border rounded p-1.5 text-sm"/>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-600">Bottom</label>
                     <input type="number" value={activeTheme.margins?.bottom} onChange={e => updateMargin('bottom', Number(e.target.value))} className="w-full border rounded p-1.5 text-sm"/>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-600">Left</label>
                     <input type="number" value={activeTheme.margins?.left} onChange={e => updateMargin('left', Number(e.target.value))} className="w-full border rounded p-1.5 text-sm"/>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-600">Right</label>
                     <input type="number" value={activeTheme.margins?.right} onChange={e => updateMargin('right', Number(e.target.value))} className="w-full border rounded p-1.5 text-sm"/>
                  </div>
               </div>
             </div>
          </AccordionItem>

          {/* 1. General Settings */}
          <AccordionItem id="general" title="General & Page" icon={Monitor}>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Orientation</label>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setActiveOrientation('portrait')}
                         className={`flex-1 py-1.5 text-sm border rounded ${activeOrientation === 'portrait' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}
                       >Portrait</button>
                       <button 
                         onClick={() => setActiveOrientation('landscape')}
                         className={`flex-1 py-1.5 text-sm border rounded ${activeOrientation === 'landscape' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}
                       >Landscape</button>
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Font Family</label>
                    <select 
                      value={activeTheme.fontFamily || 'Inter'}
                      onChange={(e) => updateTheme('fontFamily', e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                    >
                      <option value="Inter">Inter (Modern)</option>
                      <option value="Times New Roman">Times New Roman (Classic)</option>
                      <option value="Arial">Arial (Standard)</option>
                      <option value="Georgia">Georgia (Serif)</option>
                    </select>
                 </div>
                 <ColorInput label="Page Border Color" prop="pageBorderColor" />
                 
                 <div className="space-y-2">
                    <div className="flex justify-between">
                       <label className="text-sm font-medium text-gray-700">Watermark Opacity</label>
                       <span className="text-xs text-gray-500">{((activeTheme.watermarkOpacity || 0.1) * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05"
                      value={activeTheme.watermarkOpacity || 0.1}
                      onChange={(e) => updateTheme('watermarkOpacity', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                 </div>
              </div>
          </AccordionItem>

          {/* 2. Header & School Info */}
          <AccordionItem id="header" title="Header Section" icon={Type}>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between">
                       <label className="text-sm font-medium text-gray-700">School Name Size</label>
                       <span className="text-xs text-gray-500">{(activeTheme.schoolNameSize || 2.5).toFixed(1)}em</span>
                    </div>
                    <input 
                      type="range" min="1.5" max="4" step="0.1"
                      value={activeTheme.schoolNameSize || 2.5}
                      onChange={(e) => updateTheme('schoolNameSize', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Alignment</label>
                    <div className="flex border rounded overflow-hidden">
                       {['left', 'center', 'right'].map((align) => (
                         <button 
                           key={align}
                           onClick={() => updateTheme('schoolNameAlign', align)}
                           className={`flex-1 py-1.5 text-xs uppercase ${activeTheme.schoolNameAlign === align ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                         >
                           {align}
                         </button>
                       ))}
                    </div>
                 </div>

                 <ColorInput label="School Name Color" prop="schoolNameColor" />
                 <ColorInput label="Address/Subtitle Color" prop="headerSecondaryColor" />
                 <div className="border-t pt-3 mt-3">
                   <p className="text-xs font-bold text-gray-400 uppercase mb-2">Session Badge</p>
                   
                   <div className="space-y-2 mb-3">
                      <div className="flex justify-between">
                         <label className="text-sm text-gray-600">Text Size</label>
                         <span className="text-xs text-gray-500">{(activeTheme.sessionBadgeSize || 0.85).toFixed(2)}em</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="1.5" step="0.05"
                        value={activeTheme.sessionBadgeSize || 0.85}
                        onChange={(e) => updateTheme('sessionBadgeSize', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                   </div>

                   <ColorInput label="Badge Background" prop="sessionBadgeBg" />
                   <div className="h-2"></div>
                   <ColorInput label="Badge Text" prop="sessionBadgeColor" />
                 </div>
              </div>
          </AccordionItem>

          {/* 3. Student Info */}
          <AccordionItem id="student" title="Student Details" icon={FileText}>
              <div className="space-y-4">
                  <ColorInput label="Background Color" prop="studentInfoBg" />
                  <ColorInput label="Label Color" prop="studentLabelColor" />
                  <ColorInput label="Value Color" prop="studentValueColor" />
              </div>
          </AccordionItem>

          {/* 4. Tables */}
          <AccordionItem id="tables" title="Marks Table" icon={Palette}>
              <div className="space-y-4">
                  <ColorInput label="Header Background" prop="tableHeaderBg" />
                  <ColorInput label="Header Text" prop="tableHeaderColor" />
                  <ColorInput label="Border Color" prop="tableBorderColor" />
                  <ColorInput label="Row (Odd) Bg" prop="tableRowOddBg" />
                  <ColorInput label="Row (Even) Bg" prop="tableRowEvenBg" />
                  <ColorInput label="Grade Text Color" prop="gradeColor" />
              </div>
          </AccordionItem>

          {/* 5. Results */}
          <AccordionItem id="result" title="Result Box" icon={Layout}>
              <div className="space-y-4">
                  <ColorInput label="Pass Status Color" prop="resultPassColor" />
                  <ColorInput label="Fail Status Color" prop="resultFailColor" />
                  
                  <div className="space-y-2 pt-2 border-t mt-2">
                     <div className="flex justify-between">
                        <label className="text-sm font-medium text-gray-700">Result Text Scale</label>
                        <span className="text-xs text-gray-500">{(activeTheme.resultContentScale || 1).toFixed(2)}x</span>
                     </div>
                     <input 
                        type="range" min="0.5" max="1.5" step="0.05"
                        value={activeTheme.resultContentScale || 1}
                        onChange={(e) => updateTheme('resultContentScale', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                     />
                  </div>
              </div>
          </AccordionItem>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
           <button 
             onClick={resetChanges}
             className="flex-1 py-2.5 flex items-center justify-center gap-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
           >
             <RefreshCw size={16} /> Reset
           </button>
           <button 
             onClick={saveChanges}
             className="flex-1 py-2.5 flex items-center justify-center gap-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm font-medium"
           >
             <Save size={16} /> Save
           </button>
        </div>
      </div>

      {/* RIGHT: Live Preview - Improved Layout to prevent cut-off */}
      <div className="flex-1 h-1/2 md:h-full bg-slate-900 overflow-hidden relative flex flex-col shadow-inner">
         <div className="p-2 text-center text-xs font-medium text-slate-400 bg-slate-800 border-b border-slate-700">
           Live Preview Mode
         </div>
         {/* Container specifically designed for centering scrollable content */}
         <div className="flex-1 overflow-auto w-full p-4 md:p-8 flex justify-center items-start">
             <div className="transform-gpu transition-all duration-300 origin-top shadow-2xl scale-[0.5] md:scale-[0.65] lg:scale-[0.8] 2xl:scale-100">
                <MarksheetTemplate 
                    student={DUMMY_STUDENT} 
                    classConfig={state.classes[0] || DUMMY_CLASS_CONFIG} // Fallback
                    schoolInfo={state.schoolInfo}
                    orientation={activeOrientation}
                    fontSize={12}
                    theme={activeTheme || DEFAULT_THEME_FALLBACK}
                />
             </div>
         </div>
      </div>
    </div>
  );
};

export default PDFLayoutEditor;