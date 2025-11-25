import React, { useState, useMemo } from 'react';
import { AppState, Student, Gender, ClassConfig } from '../types';
import * as XLSX from 'xlsx';
import { Search, Plus, Download, Upload, Edit2, Trash2, Eye, FileSpreadsheet, Filter, Image as ImageIcon, Camera, Table } from 'lucide-react';

interface StudentManagerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  navigateToMarksheet: (studentId: string) => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ state, setState, navigateToMarksheet }) => {
  const [selectedClass, setSelectedClass] = useState<string>(state.classes[0]?.className || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [bulkPhotoStatus, setBulkPhotoStatus] = useState<string>('');
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<{added: number, updated: number, failed: string[]} | null>(null);

  const currentClassConfig = state.classes.find(c => c.className === selectedClass);

  const filteredStudents = useMemo(() => {
    return state.students.filter(s => 
      s.className === selectedClass && 
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.includes(searchTerm))
    );
  }, [state.students, selectedClass, searchTerm]);

  // Compress Image Helper to save storage
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200; // Thumbnail size
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const generateExcelData = (includeData: boolean) => {
    if (!currentClassConfig) return null;

    // Standard Headers
    const headers = ['System_ID', 'Class_ID', 'Class_Name', 'RollNo', 'Name', 'Gender', ...currentClassConfig.extraInfoFields];
    
    // Add Subject Columns
    currentClassConfig.subjects.forEach(sub => {
        if (sub.type === 'Scholastic') {
            sub.exams.forEach(exam => headers.push(`${sub.name}_${exam.name}`));
        } else {
            headers.push(sub.name);
        }
    });

    const dataRows = [];
    if (includeData) {
        filteredStudents.forEach(s => {
            const row: any = {
                'System_ID': s.id,
                'Class_ID': currentClassConfig.id,
                'Class_Name': currentClassConfig.className,
                'RollNo': s.rollNo,
                'Name': s.name,
                'Gender': s.gender
            };
            
            // Info
            currentClassConfig.extraInfoFields.forEach(f => row[f] = s.info[f] || '');

            // Marks
            currentClassConfig.subjects.forEach(sub => {
                if(sub.type === 'Scholastic') {
                    sub.exams.forEach(exam => {
                        const m = s.marks.find(mark => mark.subjectId === sub.id && mark.examId === exam.id);
                        row[`${sub.name}_${exam.name}`] = m ? m.obtained : '';
                    });
                } else {
                    const g = s.coScholasticGrades.find(gr => gr.subjectId === sub.id);
                    row[sub.name] = g ? g.grade : '';
                }
            });
            dataRows.push(row);
        });
    } else {
        // For blank template, add one hidden row with Class ID to ensure verification
        // But users might delete it. Better to just put it in the first empty row column if they use the template.
        // Actually, let's just use headers. We can put the Class ID in the filename or just check the upload.
        // Or better: Pre-fill one sample row with the Class ID but empty data
        const sampleRow: any = {
            'System_ID': 'LEAVE_BLANK_FOR_NEW',
            'Class_ID': currentClassConfig.id,
            'Class_Name': currentClassConfig.className,
            'RollNo': '101', 
            'Name': 'Sample Student',
            'Gender': 'Male'
        };
        dataRows.push(sampleRow);
    }

    return { headers, dataRows };
  };

  const handleExportTemplate = () => {
    const data = generateExcelData(false);
    if(!data) return;

    const ws = XLSX.utils.json_to_sheet(data.dataRows, { header: data.headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${selectedClass}_Template_Ref(${currentClassConfig?.id}).xlsx`);
  };

  const handleExportDataForEdit = () => {
    const data = generateExcelData(true);
    if(!data) return;

    const ws = XLSX.utils.json_to_sheet(data.dataRows, { header: data.headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StudentData");
    XLSX.writeFile(wb, `${selectedClass}_BulkEdit_Data.xlsx`);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentClassConfig) return;

    // Reset UI
    setImportReport(null);
    e.target.value = ''; // Allow re-uploading same file

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
            alert("File is empty.");
            return;
        }

        // 1. Validation: Check Class ID if present
        // Check first row or any row that has a Class_ID
        const fileClassId = data.find(r => r['Class_ID'])?.['Class_ID'];
        
        // Validation: If Class ID exists and doesn't match, STOP.
        // If Class ID is missing, we assume user knows what they are doing (legacy support), or we could warn.
        // Requirement 2 says: "Only usi class me import ho".
        if (fileClassId && String(fileClassId) !== String(currentClassConfig.id)) {
            alert(`Error: This file belongs to a different class (ID: ${fileClassId}).\nYou are currently in ${currentClassConfig.className} (ID: ${currentClassConfig.id}).`);
            return;
        }

        const stats = { added: 0, updated: 0, failed: [] as string[] };
        const existingRolls = new Map(state.students.filter(s => s.className === selectedClass).map(s => [s.rollNo, s.id]));
        const existingIds = new Set(state.students.map(s => s.id));
        
        let studentsListCopy = [...state.students];

        data.forEach((row, idx) => {
             // Skip sample row if it says "LEAVE_BLANK_FOR_NEW"
             if (row['System_ID'] === 'LEAVE_BLANK_FOR_NEW') return;

             const rollNo = String(row['RollNo'] || '').trim();
             const systemId = row['System_ID'];
             
             if (!rollNo) return; // Skip empty rows

             // Prepare Student Object Data
             const marks: any[] = [];
             const coScholasticGrades: any[] = [];
             const info: any = {};
 
             currentClassConfig.extraInfoFields.forEach(field => {
               info[field] = row[field] || '';
             });
 
             currentClassConfig.subjects.forEach(sub => {
               if (sub.type === 'Scholastic') {
                 sub.exams.forEach(exam => {
                   const val = row[`${sub.name}_${exam.name}`];
                   if (val !== undefined && val !== '') {
                     marks.push({ subjectId: sub.id, examId: exam.id, obtained: Number(val) });
                   }
                 });
               } else {
                 const val = row[sub.name];
                 if (val) {
                   coScholasticGrades.push({ subjectId: sub.id, grade: String(val) });
                 }
               }
             });

             const studentPayload: Partial<Student> = {
                className: selectedClass,
                name: row['Name'],
                rollNo: rollNo,
                gender: row['Gender'] === 'Male' ? Gender.Male : Gender.Female,
                info,
                marks,
                coScholasticGrades
             };

             // LOGIC 1: Bulk Edit (Update by System ID)
             if (systemId && existingIds.has(systemId)) {
                 // Update existing
                 studentsListCopy = studentsListCopy.map(s => {
                    if (s.id === systemId) {
                        return { ...s, ...studentPayload, id: systemId, photo: s.photo } as Student;
                    }
                    return s;
                 });
                 stats.updated++;
             } 
             // LOGIC 2: Add New (Check Duplicate RollNo)
             else {
                 if (existingRolls.has(rollNo)) {
                     // Duplicate Roll No -> Fail/Skip
                     stats.failed.push(rollNo);
                 } else {
                     // Add New
                     const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                     const newStudent = {
                         ...studentPayload,
                         id: newId,
                         photo: null // New imports don't have photos yet
                     } as Student;
                     
                     studentsListCopy.push(newStudent);
                     existingRolls.set(rollNo, newId); // Add to map so duplicates inside the file itself are caught
                     stats.added++;
                 }
             }
        });

        setState(prev => ({ ...prev, students: studentsListCopy }));
        setImportReport(stats);

      } catch (err) {
          console.error(err);
          alert("Failed to process file. Check format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentClassConfig) return;

    setBulkPhotoStatus('Processing images...');
    let matchCount = 0;

    // We need to update the students state
    // Strategy: Create a map of updates
    const updates = new Map<string, string>(); // rollNo -> base64

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Extract Roll No from filename (e.g. "101.jpg" -> "101")
      const fileName = file.name.split('.')[0];
      
      // Check if student exists in current class with this roll no
      const studentExists = state.students.some(s => s.className === selectedClass && s.rollNo === fileName);
      
      if (studentExists) {
        try {
          const compressedBase64 = await compressImage(file);
          updates.set(fileName, compressedBase64);
          matchCount++;
        } catch (err) {
          console.error("Failed to process image", fileName);
        }
      }
    }

    if (matchCount > 0) {
      setState(prev => ({
        ...prev,
        students: prev.students.map(s => {
          if (s.className === selectedClass && updates.has(s.rollNo)) {
             return { ...s, photo: updates.get(s.rollNo) };
          }
          return s;
        })
      }));
      setBulkPhotoStatus(`Successfully updated ${matchCount} student photos.`);
      setTimeout(() => setBulkPhotoStatus(''), 3000);
    } else {
      setBulkPhotoStatus('No matching students found for uploaded photos. Ensure filenames match Roll Numbers.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure?')) {
      setState(prev => ({ ...prev, students: prev.students.filter(s => s.id !== id) }));
    }
  };

  const handleSaveStudent = (student: Student) => {
    // Check duplicates if adding new
    if (!editingStudent) {
        const isDup = state.students.some(s => s.className === selectedClass && s.rollNo === student.rollNo);
        if (isDup) {
            alert(`Roll Number ${student.rollNo} already exists in this class!`);
            return;
        }
    }

    if (editingStudent) {
      setState(prev => ({
        ...prev,
        students: prev.students.map(s => s.id === student.id ? student : s)
      }));
    } else {
      setState(prev => ({ ...prev, students: [...prev.students, student] }));
    }
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  // Drag and Drop Handlers for Individual Cell
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragOverId !== id) setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(null);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       try {
         const compressed = await compressImage(file);
         setState(prev => ({
           ...prev,
           students: prev.students.map(s => s.id === id ? { ...s, photo: compressed } : s)
         }));
       } catch (error) {
         console.error("Drop error", error);
       }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Student Management</h1>
        <p className="text-slate-500">Manage enrollments, marks, and profiles.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex gap-3 items-center w-full lg:w-auto">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 appearance-none min-w-[160px]"
            >
              <option value="" disabled>Select Class</option>
              {state.classes.map(c => <option key={c.id} value={c.className}>{c.className}</option>)}
            </select>
          </div>
          
          <div className="relative flex-1 lg:w-80">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 bg-white"
              placeholder="Search Name or Roll No..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 w-full lg:w-auto">
          {/* Bulk Photo Upload */}
          {currentClassConfig?.enableStudentPhoto && (
             <label className={`flex items-center gap-2 px-4 py-2.5 border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 text-sm font-medium cursor-pointer transition-colors ${!selectedClass ? 'opacity-50 pointer-events-none' : ''}`}>
                <ImageIcon size={18} /> Upload Photos
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleBulkPhotoUpload} 
                  disabled={!selectedClass} 
                />
             </label>
          )}
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button 
                onClick={handleExportTemplate}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-xs font-medium disabled:opacity-50"
                disabled={!selectedClass}
                title="Download Blank Template for New Entries"
             >
                <Download size={14} /> Blank Template
             </button>
             <button 
                onClick={handleExportDataForEdit}
                className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-xs font-medium disabled:opacity-50"
                disabled={!selectedClass}
                title="Download Current Data for Bulk Editing"
             >
                <Table size={14} /> Export Data
             </button>
          </div>

          <label className={`flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-medium cursor-pointer transition-colors bg-white ${!selectedClass ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload size={18} /> Import Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleBulkUpload} disabled={!selectedClass} />
          </label>
          <button 
            onClick={() => {
              if(!selectedClass) return;
              setEditingStudent(null);
              setIsModalOpen(true);
            }}
            disabled={!selectedClass}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Import Report Status */}
      {importReport && (
         <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="p-2 bg-blue-50 rounded-lg"><FileSpreadsheet className="text-blue-600" /></div>
            <div className="flex-1">
                <h4 className="font-bold text-slate-800">Import Summary</h4>
                <div className="flex gap-6 mt-1 text-sm">
                   <span className="text-emerald-600 font-medium">{importReport.added} New Added</span>
                   <span className="text-amber-600 font-medium">{importReport.updated} Updated (Bulk Edit)</span>
                   <span className="text-red-600 font-medium">{importReport.failed.length} Skipped (Duplicates)</span>
                </div>
                {importReport.failed.length > 0 && (
                    <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                        <strong>Duplicate Roll Numbers skipped:</strong> {importReport.failed.join(', ')}
                    </div>
                )}
            </div>
            <button onClick={() => setImportReport(null)} className="text-slate-400 hover:text-slate-600"><Trash2 size={16}/></button>
         </div>
      )}

      {/* Bulk Status Message */}
      {bulkPhotoStatus && (
        <div className="bg-indigo-50 text-indigo-800 px-4 py-2 rounded-lg text-sm border border-indigo-100 animate-pulse">
          {bulkPhotoStatus}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              {currentClassConfig?.enableStudentPhoto && (
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm uppercase tracking-wider w-24">Photo</th>
              )}
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Roll No</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Gender</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map(s => {
              const isDraggingOver = dragOverId === s.id;
              return (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  {currentClassConfig?.enableStudentPhoto && (
                    <td 
                      className="px-6 py-2 relative group"
                      onDragOver={(e) => handleDragOver(e, s.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, s.id)}
                    >
                       <div className={`h-10 w-10 rounded-full bg-slate-200 overflow-hidden border flex items-center justify-center transition-all duration-200 ${isDraggingOver ? 'border-blue-500 ring-4 ring-blue-100 scale-110 z-10' : 'border-slate-200 group-hover:border-slate-300'}`}>
                          {s.photo ? (
                            <img src={s.photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-slate-400" />
                          )}
                       </div>
                       
                       {/* Drag Overlay */}
                       {isDraggingOver && (
                         <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20 text-blue-600 text-[10px] font-bold border-2 border-blue-500 border-dashed m-1 rounded-lg pointer-events-none backdrop-blur-[2px]">
                            Drop Image
                         </div>
                       )}
                       
                       {/* Hover Hint (only if not dragging) */}
                       {!isDraggingOver && !s.photo && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            Drag & Drop Photo
                          </div>
                       )}
                    </td>
                  )}
                  <td className="px-6 py-4 text-slate-700 font-medium">{s.rollNo}</td>
                  <td className="px-6 py-4">
                     <div className="font-semibold text-slate-800">{s.name}</div>
                     <div className="text-xs text-slate-400">ID: {s.id.slice(-6)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.gender === Gender.Male ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                      {s.gender}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                     <button onClick={() => navigateToMarksheet(s.id)} title="View Marksheet" className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Eye size={18} /></button>
                     <button onClick={() => { setEditingStudent(s); setIsModalOpen(true); }} title="Edit Info" className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"><Edit2 size={18} /></button>
                     <button onClick={() => handleDelete(s.id)} title="Delete" className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={currentClassConfig?.enableStudentPhoto ? 5 : 4} className="px-6 py-16 text-center text-slate-400 bg-slate-50/30">
                  {selectedClass ? 'No students found. Add new or import Excel.' : 'Please select a class to view students.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Student Modal */}
      {isModalOpen && currentClassConfig && (
        <StudentModal 
          student={editingStudent} 
          classConfig={currentClassConfig}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveStudent}
        />
      )}
    </div>
  );
};

const StudentModal = ({ student, classConfig, onClose, onSave }: { 
  student: Student | null, 
  classConfig: ClassConfig, 
  onClose: () => void, 
  onSave: (s: Student) => void 
}) => {
  const [formData, setFormData] = useState<Student>(student || {
    id: Date.now().toString(),
    name: '',
    rollNo: '',
    className: classConfig.className,
    gender: Gender.Male,
    info: {},
    marks: [],
    coScholasticGrades: []
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // In a real app, compress here too. For single upload, raw base64 is usually ok but risky. 
        // Let's do a quick canvas resize inline for safety.
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 300;
            let width = img.width;
            let height = img.height;
            if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE/width; width = MAX_SIZE; }} 
            else { if (height > MAX_SIZE) { width *= MAX_SIZE/height; height = MAX_SIZE; }}
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
            setFormData(prev => ({ ...prev, photo: canvas.toDataURL('image/jpeg', 0.8) }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInfoChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, info: { ...prev.info, [key]: value } }));
  };

  const handleMarkChange = (subjectId: string, examId: string, val: number) => {
    setFormData(prev => {
      const existing = prev.marks.filter(m => !(m.subjectId === subjectId && m.examId === examId));
      return { ...prev, marks: [...existing, { subjectId, examId, obtained: val }] };
    });
  };

  const handleGradeChange = (subjectId: string, val: string) => {
     setFormData(prev => {
      const existing = prev.coScholasticGrades.filter(m => m.subjectId !== subjectId);
      return { ...prev, coScholasticGrades: [...existing, { subjectId, grade: val }] };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 z-10 flex justify-between items-center">
           <h2 className="text-xl font-bold text-slate-800">{student ? 'Edit Student' : 'Add New Student'} <span className="text-slate-400 font-normal ml-2">| {classConfig.className}</span></h2>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><Trash2 className="text-transparent" size={20} /><span className="sr-only">Close</span></button>
        </div>
        
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Photo Upload Area */}
              {classConfig.enableStudentPhoto && (
                <div className="md:row-span-3 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="h-32 w-32 rounded-full bg-white border-4 border-white shadow-sm overflow-hidden mb-4 relative group">
                        {formData.photo ? (
                            <img src={formData.photo} alt="Student" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-300">
                                <Camera size={40} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="text-white" />
                        </div>
                    </div>
                    <label className="cursor-pointer text-sm text-blue-600 font-medium hover:underline">
                        Change Photo
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                </div>
              )}

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input className="w-full border border-slate-300 bg-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Roll No</label>
                <input className="w-full border border-slate-300 bg-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.rollNo} onChange={e => handleChange('rollNo', e.target.value)} placeholder="101" />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</label>
                <select className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.gender} onChange={e => handleChange('gender', e.target.value as Gender)}>
                    <option value={Gender.Male}>Male</option>
                    <option value={Gender.Female}>Female</option>
                </select>
            </div>
            {classConfig.extraInfoFields.map(field => (
                <div key={field} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{field}</label>
                    <input className="w-full border border-slate-300 bg-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.info[field] || ''} onChange={e => handleInfoChange(field, e.target.value)} />
                </div>
            ))}
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                <h3 className="font-bold text-lg mb-4 text-blue-700 flex items-center gap-2"><FileSpreadsheet size={20}/> Academic Marks</h3>
                <div className="space-y-6">
                    {classConfig.subjects.filter(s => s.type === 'Scholastic').map(sub => (
                    <div key={sub.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2">{sub.name}</div>
                        <div className="flex flex-wrap gap-4">
                        {sub.exams.map(exam => {
                            const mark = formData.marks.find(m => m.subjectId === sub.id && m.examId === exam.id)?.obtained;
                            const val = mark !== undefined ? mark : '';
                            return (
                                <div key={exam.id} className="flex flex-col gap-1">
                                    <label className="text-[11px] font-medium text-slate-500 uppercase">{exam.name} <span className="text-slate-400">/ {exam.maxMarks}</span></label>
                                    <input 
                                    type="number"
                                    className="w-24 border border-slate-300 rounded-md p-2 text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono bg-white"
                                    value={val}
                                    onChange={e => handleMarkChange(sub.id, exam.id, Number(e.target.value))}
                                    placeholder="0"
                                    />
                                </div>
                            );
                        })}
                        </div>
                    </div>
                    ))}
                </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h3 className="font-bold text-lg mb-4 text-indigo-700 flex items-center gap-2"><Edit2 size={20}/> Co-Scholastic Grades</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {classConfig.subjects.filter(s => s.type === 'Co-Scholastic').map(sub => {
                    const grade = formData.coScholasticGrades.find(g => g.subjectId === sub.id)?.grade || '';
                    return (
                        <div key={sub.id} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                            <label className="text-xs font-semibold text-slate-500 block mb-2">{sub.name}</label>
                            <input 
                            className="w-full border border-slate-200 rounded p-2 focus:border-indigo-500 outline-none uppercase font-medium text-center bg-white"
                            value={grade}
                            onChange={e => handleGradeChange(sub.id, e.target.value)}
                            placeholder="Grade"
                            maxLength={2}
                            />
                        </div>
                    );
                })}
                </div>
            </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex justify-end gap-3 rounded-b-2xl">
           <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancel</button>
           <button onClick={() => onSave(formData)} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 font-medium transition-transform active:scale-95">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default StudentManager;