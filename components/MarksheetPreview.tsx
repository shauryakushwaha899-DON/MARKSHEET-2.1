

import React, { useRef, useState, useEffect } from 'react';
import { AppState, Student, ClassConfig, ThemeConfig } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowLeft, Download, Printer, Minus, Plus, Type, Eye, X } from 'lucide-react';

interface MarksheetPreviewProps {
  student: Student;
  classConfig: ClassConfig;
  schoolInfo: AppState['schoolInfo'];
  orientation: 'portrait' | 'landscape';
  theme: ThemeConfig;
  onUpdateTheme: (newTheme: ThemeConfig) => void;
  onBack: () => void;
}

export interface MarksheetTemplateProps {
  student: Student;
  classConfig: ClassConfig;
  schoolInfo: AppState['schoolInfo'];
  orientation: 'portrait' | 'landscape';
  fontSize: number;
  theme: ThemeConfig;
}

// Minimal fallback theme to prevent crashes
const FALLBACK_THEME: ThemeConfig = {
  fontFamily: 'Inter',
  pageBorderColor: '#000',
  watermarkOpacity: 0.1,
  margins: { top: 10, right: 10, bottom: 10, left: 10 },
  schoolNameColor: '#000',
  schoolNameSize: 2.5,
  schoolNameAlign: 'center',
  headerSecondaryColor: '#444',
  sessionBadgeBg: '#000',
  sessionBadgeColor: '#fff',
  sessionBadgeSize: 0.85,
  studentInfoBg: '#eee',
  studentLabelColor: '#555',
  studentValueColor: '#000',
  tableHeaderBg: '#ddd',
  tableHeaderColor: '#000',
  tableBorderColor: '#ccc',
  tableRowOddBg: '#fff',
  tableRowEvenBg: '#f9f9f9',
  gradeColor: '#000',
  resultPassColor: 'green',
  resultFailColor: 'red',
  resultContentScale: 1.0
};

// Extracted Component for the actual paper layout
export const MarksheetTemplate = React.forwardRef<HTMLDivElement, MarksheetTemplateProps>(({ student, classConfig, schoolInfo, orientation, fontSize, theme }, ref) => {
  // Use safe theme with fallback
  const safeTheme = theme || FALLBACK_THEME;
  // Ensure margins exist (for old saved data)
  const margins = safeTheme.margins || FALLBACK_THEME.margins;
  
  const contentScale = safeTheme.resultContentScale || 1.0;

  // Calculation Logic
  const scholasticSubjects = classConfig.subjects.filter(s => s.type === 'Scholastic');
  
  // Calculate totals dynamically
  const grandTotalObtained = scholasticSubjects.reduce((acc, sub) => {
    const subTotal = sub.exams.reduce((sum, exam) => {
      const mark = student.marks.find(m => m.subjectId === sub.id && m.examId === exam.id);
      return sum + (mark ? mark.obtained : 0);
    }, 0);
    return acc + subTotal;
  }, 0);

  const grandTotalMax = scholasticSubjects.reduce((acc, sub) => {
    return acc + sub.exams.reduce((sum, exam) => sum + exam.maxMarks, 0);
  }, 0);

  const percentage = grandTotalMax > 0 ? (grandTotalObtained / grandTotalMax) * 100 : 0;
  const result = percentage >= classConfig.passPercentage ? "PASS" : "NEEDS IMPROVEMENT";

  // Grade Calculation
  const getGrade = (pct: number) => {
    if (pct >= 91) return 'A1';
    if (pct >= 81) return 'A2';
    if (pct >= 71) return 'B1';
    if (pct >= 61) return 'B2';
    if (pct >= 51) return 'C1';
    if (pct >= 41) return 'C2';
    if (pct >= 33) return 'D';
    return 'E';
  };

  // Dynamic Styles
  const fontStyle = { fontFamily: `${safeTheme.fontFamily || 'Inter'}, sans-serif` };
  const borderStyle = { borderColor: safeTheme.tableBorderColor || safeTheme.pageBorderColor };
  const headerStyle = { backgroundColor: safeTheme.tableHeaderBg, color: safeTheme.tableHeaderColor, ...borderStyle };
  
  // Padding style based on margins (mm)
  const paddingStyle = {
    paddingTop: `${margins.top}mm`,
    paddingRight: `${margins.right}mm`,
    paddingBottom: `${margins.bottom}mm`,
    paddingLeft: `${margins.left}mm`,
  };

  return (
    <div 
      ref={ref}
      style={{ fontSize: `${fontSize}px`, ...fontStyle }}
      className={`bg-white shadow-2xl mx-auto relative print-area leading-normal box-border
        ${orientation === 'portrait' ? 'w-[210mm] min-h-[297mm]' : 'w-[297mm] min-h-[210mm]'}
      `}
    >
       {/* BACKGROUND WATERMARK - MOVED TO FRONT LAYER (Z-50) */}
       {schoolInfo.logo && (
         <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden mix-blend-multiply">
           <img 
              src={schoolInfo.logo} 
              alt="Watermark" 
              className="w-[60%] grayscale"
              style={{ opacity: safeTheme.watermarkOpacity }}
           />
         </div>
       )}

       {/* Main Container with configurable margins */}
       <div className="relative z-10 h-full flex flex-col" style={paddingStyle}>
          
          {/* Fancy Border Container */}
          <div className="border-[3px] h-full p-1 flex-1 flex flex-col" style={{ borderColor: safeTheme.pageBorderColor }}>
            <div className="border h-full p-6 flex flex-col relative" style={{ borderColor: safeTheme.pageBorderColor }}>
              
              {/* Header */}
              <div className="border-b-2 pb-4 mb-6 relative" style={{ borderColor: safeTheme.pageBorderColor }}>
                 <div className={`flex items-center gap-6 mb-2 ${safeTheme.schoolNameAlign === 'center' ? 'justify-center' : safeTheme.schoolNameAlign === 'right' ? 'flex-row-reverse text-right' : 'justify-start'}`}>
                    {schoolInfo.logo && <img src={schoolInfo.logo} alt="Logo" className="h-24 w-24 object-contain drop-shadow-sm" />}
                    <div className="text-slate-900">
                        <h1 className="font-black tracking-tight uppercase" style={{ color: safeTheme.schoolNameColor, fontSize: `${safeTheme.schoolNameSize}em`, lineHeight: 1.2 }}>{schoolInfo.name}</h1>
                        <p className="text-lg font-medium mt-1" style={{ fontSize: '1.125em', color: safeTheme.headerSecondaryColor }}>{schoolInfo.address}</p>
                        <p className="text-sm italic mt-1" style={{ fontSize: '0.875em', color: safeTheme.headerSecondaryColor }}>{schoolInfo.affiliation}</p>
                    </div>
                 </div>
                 
                 <div className="flex justify-center items-end mt-4">
                    {/* Fixed Badge */}
                    <div 
                      className="inline-flex items-center justify-center px-8 py-2 rounded-full font-bold uppercase tracking-wider shadow-md" 
                      style={{ 
                        fontSize: `${safeTheme.sessionBadgeSize || 0.85}em`, 
                        backgroundColor: safeTheme.sessionBadgeBg, 
                        color: safeTheme.sessionBadgeColor,
                        lineHeight: 1.2
                      }}
                    >
                        Academic Session: {schoolInfo.session}
                    </div>
                 </div>
              </div>

              <div className="text-center mb-6">
                 <h2 className="font-bold inline-block border-b-4 pb-1 uppercase tracking-widest" style={{ fontSize: '1.5em', borderColor: safeTheme.pageBorderColor, color: safeTheme.schoolNameColor }}>Progress Report Card</h2>
              </div>

              {/* Student Info Grid */}
              <div 
                className="border rounded-lg p-6 mb-8 shadow-sm flex gap-6"
                style={{ backgroundColor: safeTheme.studentInfoBg, borderColor: safeTheme.tableBorderColor }}
              >
                  {/* Reflow Logic - Text Grid */}
                  <div className={`flex-1 grid ${orientation === 'landscape' ? 'grid-cols-4' : 'grid-cols-2'} gap-x-12 gap-y-4 content-center`}>
                      <div className="flex flex-col md:flex-row md:items-center border-b pb-1" style={{ borderColor: safeTheme.tableBorderColor }}>
                        <span className="font-bold uppercase w-32 shrink-0" style={{ fontSize: '0.75em', color: safeTheme.studentLabelColor }}>Student Name</span>
                        <span className="font-bold break-words leading-tight" style={{ fontSize: '1.125em', color: safeTheme.studentValueColor }}>{student.name}</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center border-b pb-1" style={{ borderColor: safeTheme.tableBorderColor }}>
                        <span className="font-bold uppercase w-32 shrink-0" style={{ fontSize: '0.75em', color: safeTheme.studentLabelColor }}>Class</span>
                        <span className="font-semibold break-words leading-tight" style={{ fontSize: '1em', color: safeTheme.studentValueColor }}>{student.className}</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center border-b pb-1" style={{ borderColor: safeTheme.tableBorderColor }}>
                        <span className="font-bold uppercase w-32 shrink-0" style={{ fontSize: '0.75em', color: safeTheme.studentLabelColor }}>Roll Number</span>
                        <span className="font-semibold font-mono break-words leading-tight" style={{ fontSize: '1em', color: safeTheme.studentValueColor }}>{student.rollNo}</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center border-b pb-1" style={{ borderColor: safeTheme.tableBorderColor }}>
                        <span className="font-bold uppercase w-32 shrink-0" style={{ fontSize: '0.75em', color: safeTheme.studentLabelColor }}>Gender</span>
                        <span className="font-semibold break-words leading-tight" style={{ fontSize: '1em', color: safeTheme.studentValueColor }}>{student.gender}</span>
                      </div>
                      {classConfig.extraInfoFields.map(field => (
                        <div key={field} className="flex flex-col md:flex-row md:items-center border-b pb-1" style={{ borderColor: safeTheme.tableBorderColor }}>
                          <span className="font-bold uppercase w-32 shrink-0" style={{ fontSize: '0.75em', color: safeTheme.studentLabelColor }}>{field}</span>
                          <span className="font-semibold break-words leading-tight" style={{ fontSize: '1em', color: safeTheme.studentValueColor }}>{student.info[field]}</span>
                      </div>
                      ))}
                  </div>

                  {/* Student Photo - Moved to Right */}
                  {student.photo && (
                    <div className="w-32 h-40 shrink-0 border-2 border-white shadow-md rounded-md overflow-hidden bg-gray-200">
                       <img src={student.photo} alt="Student" className="w-full h-full object-cover" />
                    </div>
                  )}
              </div>

              {/* Scholastic Table */}
              <div className="mb-6">
                <h3 
                  className="font-bold px-4 py-2 mb-0 uppercase tracking-wider rounded-t-lg inline-block" 
                  style={{ fontSize: '0.75em', backgroundColor: safeTheme.pageBorderColor, color: '#fff' }}
                >
                  Scholastic Achievement
                </h3>
                <div className="border-2 rounded-lg rounded-tl-none overflow-hidden" style={borderStyle}>
                    <table className="w-full border-collapse">
                        <thead>
                          <tr className="uppercase tracking-wider border-b-2" style={{ fontSize: '0.75em', ...headerStyle }}>
                              <th className="p-3 text-left font-bold border-r align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor }}>
                                <div className="flex items-center justify-start h-full w-full">Subject</div>
                              </th>
                              {scholasticSubjects[0]?.exams.map(exam => (
                                <React.Fragment key={exam.id}>
                                    <th className="p-3 text-center border-r font-bold w-[10%] align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor, filter: 'brightness(0.95)' }}>
                                        <div className="flex items-center justify-center h-full w-full">MM</div>
                                    </th>
                                    <th className="p-3 text-center border-r w-[15%] align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor }}>
                                        <div className="flex items-center justify-center h-full w-full">{exam.name}</div>
                                    </th>
                                </React.Fragment>
                              ))}
                              <th className="p-3 text-center font-bold border-r align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor, backgroundColor: 'rgba(0,0,0,0.05)' }}>
                                  <div className="flex items-center justify-center h-full w-full">Total</div>
                              </th>
                              <th className="p-3 text-center font-bold align-middle" style={{ verticalAlign: 'middle' }}>
                                  <div className="flex items-center justify-center h-full w-full">Grade</div>
                              </th>
                          </tr>
                        </thead>
                        <tbody style={{ fontSize: '0.875em' }}>
                          {scholasticSubjects.map((sub, idx) => {
                              let rowTotalObtained = 0;
                              let rowTotalMax = 0;
                              const rowBg = idx % 2 === 0 ? safeTheme.tableRowOddBg : safeTheme.tableRowEvenBg;
                              return (
                                <tr key={sub.id} className="border-b" style={{ backgroundColor: rowBg, borderColor: safeTheme.tableBorderColor }}>
                                  <td className="p-3 font-semibold border-r align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor, color: safeTheme.studentValueColor }}>
                                    <div className="flex items-center justify-start h-full w-full">{sub.name}</div>
                                  </td>
                                  {sub.exams.map(exam => {
                                      const mark = student.marks.find(m => m.subjectId === sub.id && m.examId === exam.id);
                                      const val = mark ? mark.obtained : 0;
                                      rowTotalObtained += val;
                                      rowTotalMax += exam.maxMarks;
                                      return (
                                        <React.Fragment key={exam.id}>
                                            <td className="p-3 text-center font-bold border-r align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor, color: safeTheme.studentLabelColor, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                                <div className="flex items-center justify-center h-full w-full">{exam.maxMarks}</div>
                                            </td>
                                            <td className="p-3 text-center font-semibold border-r align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor, color: safeTheme.studentValueColor }}>
                                                <div className="flex items-center justify-center h-full w-full">{val}</div>
                                            </td>
                                        </React.Fragment>
                                      );
                                  })}
                                  <td className="p-3 text-center font-bold border-r align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor, color: safeTheme.pageBorderColor, backgroundColor: 'rgba(0,0,0,0.03)' }}>
                                      <div className="flex items-center justify-center h-full w-full">{rowTotalObtained}</div>
                                  </td>
                                  <td className="p-3 text-center font-bold align-middle" style={{ verticalAlign: 'middle', color: safeTheme.gradeColor }}>
                                      <div className="flex items-center justify-center h-full w-full">{getGrade((rowTotalObtained/rowTotalMax)*100)}</div>
                                  </td>
                                </tr>
                              );
                          })}
                          <tr className="text-white border-t-2" style={{ backgroundColor: safeTheme.pageBorderColor, borderColor: safeTheme.pageBorderColor }}>
                              <td className="p-3 font-bold text-right uppercase tracking-wider align-middle" style={{ verticalAlign: 'middle' }}>
                                <div className="flex items-center justify-end h-full w-full">Grand Total</div>
                              </td>
                              {scholasticSubjects[0]?.exams.map(exam => (
                                  <React.Fragment key={exam.id}>
                                      <td className="p-3 border-r border-white/20"></td>
                                      <td className="p-3 border-r border-white/20"></td>
                                  </React.Fragment>
                              ))}
                              <td className="p-3 text-center font-bold border-x border-white/20 align-middle" style={{ fontSize: '1.125em', verticalAlign: 'middle', filter: 'brightness(1.2)' }}>
                                  <div className="flex items-center justify-center h-full w-full">{grandTotalObtained} / {grandTotalMax}</div>
                              </td>
                              <td className="p-3"></td>
                          </tr>
                        </tbody>
                    </table>
                </div>
              </div>

              {/* Co-Scholastic & Summary - REDUCED MARGIN BOTTOM (Gap fix) */}
              <div className="mb-2 flex gap-8">
                <div className="flex-1">
                    <h3 
                      className="font-bold text-white px-4 py-1.5 mb-0 uppercase tracking-wider rounded-t-lg inline-block" 
                      style={{ fontSize: '0.75em', backgroundColor: safeTheme.headerSecondaryColor }}
                    >
                      Co-Scholastic Areas
                    </h3>
                    <div className="border rounded-lg rounded-tl-none overflow-hidden" style={{ borderColor: safeTheme.tableBorderColor }}>
                        <table className="w-full border-collapse">
                          <thead>
                              <tr className="uppercase" style={{ fontSize: '0.75em', backgroundColor: safeTheme.tableRowEvenBg, color: safeTheme.studentLabelColor }}>
                                <th className="p-2 text-left font-semibold border-b align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor }}>
                                  <div className="flex items-center justify-start h-full w-full">Activity</div>
                                </th>
                                <th className="p-2 text-center font-semibold border-b w-24 align-middle" style={{ verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor }}>
                                  <div className="flex items-center justify-center h-full w-full">Grade</div>
                                </th>
                              </tr>
                          </thead>
                          <tbody>
                              {classConfig.subjects.filter(s => s.type === 'Co-Scholastic').map((sub, idx) => {
                                  const grade = student.coScholasticGrades.find(g => g.subjectId === sub.id)?.grade || '-';
                                  return (
                                    <tr key={sub.id} style={{ backgroundColor: idx % 2 !== 0 ? safeTheme.tableRowOddBg : safeTheme.tableRowEvenBg }}>
                                        <td className="p-2 border-b font-medium align-middle" style={{ fontSize: '0.875em', verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor, color: safeTheme.studentValueColor }}>
                                          <div className="flex items-center justify-start h-full w-full">{sub.name}</div>
                                        </td>
                                        <td className="p-2 text-center border-b font-bold align-middle" style={{ fontSize: '0.875em', verticalAlign: 'middle', borderColor: safeTheme.tableBorderColor, color: safeTheme.gradeColor }}>
                                          <div className="flex items-center justify-center h-full w-full">{grade}</div>
                                        </td>
                                    </tr>
                                  );
                              })}
                          </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Result Box */}
                <div className="w-72">
                   <h3 
                     className="font-bold text-white px-4 py-1.5 mb-0 uppercase tracking-wider rounded-t-lg inline-block" 
                     style={{ fontSize: '0.75em', backgroundColor: safeTheme.pageBorderColor }}
                   >
                     Final Result
                   </h3>
                   <div 
                      className="border-2 p-6 flex flex-col justify-center items-center bg-white rounded-lg rounded-tl-none shadow-sm h-[200px]"
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderColor: safeTheme.pageBorderColor }}
                   >
                        <div className="text-center mb-1">
                            <p className="uppercase tracking-widest mb-1" style={{ fontSize: '0.75em', color: safeTheme.studentLabelColor }}>Percentage</p>
                            <p className="font-black" style={{ fontSize: `${2.25 * contentScale}em`, color: safeTheme.schoolNameColor }}>{percentage.toFixed(2)}%</p>
                        </div>
                        <div className="w-full h-px mb-2" style={{ backgroundColor: safeTheme.tableBorderColor }}></div>
                        <div className="text-center">
                            <p className="uppercase tracking-widest mb-1" style={{ fontSize: '0.75em', color: safeTheme.studentLabelColor }}>Status</p>
                            <p 
                              className="font-bold px-4 py-1 rounded border-2"
                              style={{ 
                                fontSize: `${1.5 * contentScale}em`,
                                color: result === 'PASS' ? safeTheme.resultPassColor : safeTheme.resultFailColor,
                                borderColor: result === 'PASS' ? safeTheme.resultPassColor : safeTheme.resultFailColor,
                                backgroundColor: result === 'PASS' ? `${safeTheme.resultPassColor}10` : `${safeTheme.resultFailColor}10`
                              }}
                            >
                                {result}
                            </p>
                        </div>
                   </div>
                </div>
              </div>

              {/* Footer - REMOVED mt-auto to allow natural flowing, added fixed margin top */}
              <div className="mt-8">
                <div className="flex justify-between items-end mb-6 px-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-white p-1 rounded border" style={{ borderColor: safeTheme.tableBorderColor }}>
                          <QRCodeCanvas value={`Name:${student.name},Roll:${student.rollNo},Result:${result},Pct:${percentage.toFixed(2)}`} size={90} />
                      </div>
                      <span className="uppercase tracking-widest" style={{ fontSize: '0.625em', color: safeTheme.studentLabelColor }}>Scan to Verify</span>
                    </div>
                    
                    <div className="flex gap-32 pb-2">
                      <div className="text-center">
                          <div className="w-40 border-b-2 mb-2" style={{ borderColor: safeTheme.tableBorderColor }}></div>
                          <p className="font-bold uppercase" style={{ fontSize: '0.875em', color: safeTheme.headerSecondaryColor }}>Class Teacher</p>
                      </div>
                      <div className="text-center">
                          <div className="w-40 border-b-2 mb-2" style={{ borderColor: safeTheme.tableBorderColor }}></div>
                          <p className="font-bold uppercase" style={{ fontSize: '0.875em', color: safeTheme.headerSecondaryColor }}>Principal</p>
                      </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center border-t pt-3" style={{ fontSize: '0.625em', borderColor: safeTheme.tableBorderColor, color: safeTheme.studentLabelColor }}>
                    <span>Generated by AUMV</span>
                    <span>This document is computer generated.</span>
                </div>
              </div>

            </div>
          </div>
       </div>
    </div>
  );
});

const MarksheetPreview: React.FC<MarksheetPreviewProps> = ({ student, classConfig, schoolInfo, orientation, theme, onUpdateTheme, onBack }) => {
  const marksheetRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(18); // Default 18px as requested
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!marksheetRef.current) return;
    
    const element = marksheetRef.current;
    
    // Temporarily reset box shadow for clean capture
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    // Capture canvas
    const canvas = await html2canvas(element, { 
      scale: 2, 
      useCORS: true,
      scrollX: 0,
      scrollY: -window.scrollY // Fixes whitespace issues on some browsers
    });
    
    // Restore styling
    element.style.boxShadow = originalShadow;

    const imgData = canvas.toDataURL('image/png');
    
    const isPortrait = orientation === 'portrait';
    const pdf = new jsPDF({
      orientation: isPortrait ? 'p' : 'l',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);

    // Calculate PDF height based on width first (Standard fit)
    const pdfHeightBasedOnWidth = (imgProps.height * pageWidth) / imgProps.width;
    
    // Check if the content is too tall for the page (which causes cut-off)
    if (pdfHeightBasedOnWidth > pageHeight) {
        // SCALING BY HEIGHT: Fit the image to the page height instead
        const scaledWidth = (imgProps.width * pageHeight) / imgProps.height;
        const xOffset = (pageWidth - scaledWidth) / 2; // Center it horizontally
        pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, pageHeight);
    } else {
        // SCALING BY WIDTH: Standard fit
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pdfHeightBasedOnWidth);
    }
    
    pdf.save(`${student.name}_Marksheet.pdf`);
  };

  if (isPreviewMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col h-screen animate-in fade-in duration-200">
        {/* Preview Toolbar */}
        <div className="flex justify-between items-center p-4 px-8 text-white border-b border-white/10 bg-slate-900 shrink-0 shadow-md z-20">
          <div>
            <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
              <Eye className="text-blue-400" size={20} /> Print Preview Mode
            </h2>
            <p className="text-xs text-slate-400">Review layout before printing</p>
          </div>
          <div className="flex gap-3">
              <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 font-medium transition-all shadow-lg shadow-blue-500/20">
                <Printer size={16} /> Print Now
              </button>
              <button onClick={() => setIsPreviewMode(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
                <X size={16} /> Close
              </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start bg-slate-800/50">
                <MarksheetTemplate 
                  ref={marksheetRef} 
                  student={student} 
                  classConfig={classConfig} 
                  schoolInfo={schoolInfo} 
                  orientation={orientation} 
                  fontSize={fontSize} 
                  theme={theme || FALLBACK_THEME}
                />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-4 justify-between items-center no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-black transition-colors px-4 py-2 rounded-lg hover:bg-white">
          <ArrowLeft size={20} /> Back to List
        </button>
        
        <div className="flex flex-wrap gap-3 items-center">
           {/* Font Size Control */}
           <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm mr-2">
              <Type size={16} className="text-slate-400 ml-2" />
              <button onClick={() => setFontSize(s => Math.max(8, s - 1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Decrease Font Size">
                <Minus size={14} />
              </button>
              <span className="text-xs font-medium w-8 text-center tabular-nums text-slate-700">{fontSize}px</span>
              <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Increase Font Size">
                <Plus size={14} />
              </button>
           </div>

           <button onClick={() => setIsPreviewMode(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
             <Eye size={18} /> Print Preview
           </button>
           
           <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-lg shadow-slate-500/30 transition-all active:scale-95">
             <Printer size={18} /> Print
           </button>
           <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
             <Download size={18} /> Download PDF
           </button>
        </div>
      </div>

      <div className="flex justify-center overflow-auto py-4">
        <MarksheetTemplate 
          ref={marksheetRef} 
          student={student} 
          classConfig={classConfig} 
          schoolInfo={schoolInfo} 
          orientation={orientation} 
          fontSize={fontSize} 
          theme={theme || FALLBACK_THEME}
        />
      </div>
    </div>
  );
};

export default MarksheetPreview;