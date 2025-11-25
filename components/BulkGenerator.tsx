
import React, { useState, useRef, useEffect } from 'react';
import { AppState, ClassConfig, Student } from '../types';
import { MarksheetTemplate } from './MarksheetPreview';
import { FileDown, CheckCircle, AlertCircle, Loader2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BulkGeneratorProps {
  state: AppState;
}

const BulkGenerator: React.FC<BulkGeneratorProps> = ({ state }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [batchSize, setBatchSize] = useState<number>(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Ref for the hidden container where we render marksheets to capture them
  const captureRef = useRef<HTMLDivElement>(null);
  
  // To handle the sequential generation, we need to store the current student being processed
  const [processingStudent, setProcessingStudent] = useState<Student | null>(null);

  const currentClassConfig = state.classes.find(c => c.className === selectedClass);
  const studentsInClass = state.students.filter(s => s.className === selectedClass);

  // Toggle Selection
  const toggleStudent = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  const toggleAll = () => {
    if (selectedStudentIds.size === studentsInClass.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(studentsInClass.map(s => s.id)));
    }
  };

  const handleGenerate = async () => {
    if (selectedStudentIds.size === 0) return;
    setIsGenerating(true);
    setProgress(0);
    setStatusMessage('Initializing PDF engine...');

    const studentsToPrint = studentsInClass.filter(s => selectedStudentIds.has(s.id));
    
    // Split into batches (files)
    const batches = [];
    for (let i = 0; i < studentsToPrint.length; i += batchSize) {
      batches.push(studentsToPrint.slice(i, i + batchSize));
    }

    try {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const isLastBatch = batchIndex === batches.length - 1;
        
        setStatusMessage(`Processing Batch ${batchIndex + 1} of ${batches.length}...`);
        
        // Create new PDF for this batch
        const isPortrait = state.orientation === 'portrait';
        const pdf = new jsPDF({
          orientation: isPortrait ? 'p' : 'l',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Process each student in the batch sequentially
        for (let i = 0; i < batch.length; i++) {
          const student = batch[i];
          
          // 1. Render student to DOM (trigger React update)
          setProcessingStudent(student);
          
          // 2. Wait for DOM update and Image loading
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for rendering

          // 3. Capture
          if (captureRef.current) {
             // Temporarily fix shadow for cleaner print
             const originalShadow = captureRef.current.style.boxShadow;
             captureRef.current.style.boxShadow = 'none';
             
             const canvas = await html2canvas(captureRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                scrollX: 0,
                scrollY: -window.scrollY
             });

             captureRef.current.style.boxShadow = originalShadow;
             
             const imgData = canvas.toDataURL('image/png');
             const imgProps = pdf.getImageProperties(imgData);
             
             // Logic to fit page (same as single download)
             const pdfHeightBasedOnWidth = (imgProps.height * pageWidth) / imgProps.width;
             
             if (i > 0) pdf.addPage(); // Add page for subsequent students

             if (pdfHeightBasedOnWidth > pageHeight) {
                const scaledWidth = (imgProps.width * pageHeight) / imgProps.height;
                const xOffset = (pageWidth - scaledWidth) / 2;
                pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, pageHeight);
             } else {
                pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pdfHeightBasedOnWidth);
             }
          }

          // Update Progress (Global percentage)
          const totalProcessed = (batchIndex * batchSize) + (i + 1);
          setProgress(Math.round((totalProcessed / studentsToPrint.length) * 100));
        }

        // Save Batch File
        const fileName = `${selectedClass}_Batch_${batchIndex + 1}_of_${batches.length}.pdf`;
        pdf.save(fileName);
      }

      setStatusMessage('All files generated successfully!');
    } catch (error) {
      console.error(error);
      setStatusMessage('Error during generation. Please try a smaller batch size.');
    } finally {
      setIsGenerating(false);
      setProcessingStudent(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Printer className="text-blue-600" /> Bulk Marksheet Generator
        </h1>
        <p className="text-slate-500">Generate multiple marksheets in a single PDF file or split into batches.</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Select Class</label>
          <select 
            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedStudentIds(new Set()); // Reset selection
            }}
          >
            <option value="">-- Choose Class --</option>
            {state.classes.map(c => <option key={c.id} value={c.className}>{c.className}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Marksheets per PDF (Batch Size)</label>
          <input 
            type="number"
            min="1"
            max="100"
            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
          />
          <p className="text-xs text-slate-400">Smaller batches (e.g., 20-50) prevent browser crashes.</p>
        </div>

        <div className="flex items-end">
           <button 
             onClick={handleGenerate}
             disabled={!selectedClass || selectedStudentIds.size === 0 || isGenerating}
             className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
           >
             {isGenerating ? <Loader2 className="animate-spin" /> : <FileDown size={20} />}
             {isGenerating ? 'Processing...' : 'Generate PDF(s)'}
           </button>
        </div>
      </div>

      {/* Progress Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
           <div className="w-64 bg-slate-700 rounded-full h-4 mb-4 overflow-hidden">
              <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
           </div>
           <h3 className="text-xl font-bold mb-2">{progress}% Completed</h3>
           <p className="text-slate-300">{statusMessage}</p>
        </div>
      )}

      {/* Student Selection List */}
      {selectedClass && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Select Students ({selectedStudentIds.size} selected)</h3>
            <button 
              onClick={toggleAll}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              {selectedStudentIds.size === studentsInClass.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
             {studentsInClass.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No students found in this class.</div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
                  {studentsInClass.map(s => (
                    <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedStudentIds.has(s.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}>
                       <input 
                         type="checkbox"
                         checked={selectedStudentIds.has(s.id)}
                         onChange={() => toggleStudent(s.id)}
                         className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                       />
                       <div>
                         <p className="font-medium text-sm text-slate-800">{s.name}</p>
                         <p className="text-xs text-slate-500">Roll: {s.rollNo}</p>
                       </div>
                    </label>
                  ))}
                </div>
             )}
          </div>
        </div>
      )}

      {/* Hidden Render Container */}
      <div className="fixed top-0 left-[-9999px] overflow-hidden">
         {processingStudent && currentClassConfig && (
            <div ref={captureRef} className="inline-block">
                <MarksheetTemplate 
                   student={processingStudent}
                   classConfig={currentClassConfig}
                   schoolInfo={state.schoolInfo}
                   orientation={state.orientation}
                   fontSize={12} // Standard size for bulk
                   theme={state.theme}
                />
            </div>
         )}
      </div>
    </div>
  );
};

export default BulkGenerator;
