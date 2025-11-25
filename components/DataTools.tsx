import React, { useState } from 'react';
import { AppState } from '../types';
import { exportBackup, clearState } from '../services/storage';
import { Download, Upload, RefreshCw, AlertTriangle, CheckCircle, X, Settings, Users } from 'lucide-react';

interface DataToolsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const DataTools: React.FC<DataToolsProps> = ({ state, setState }) => {
  const [restoreStatus, setRestoreStatus] = useState<string>('');
  const [pendingBackup, setPendingBackup] = useState<AppState | null>(null);
  
  // Restore Options
  const [importSettings, setImportSettings] = useState(true);
  const [importSchoolInfo, setImportSchoolInfo] = useState(true);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation
        if (json.students && Array.isArray(json.students)) {
           setPendingBackup(json);
           setRestoreStatus('');
        } else {
           setRestoreStatus('Error: Invalid backup file format.');
        }
      } catch (err) {
        setRestoreStatus('Error: Could not parse JSON.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const executeRestore = () => {
    if (!pendingBackup) return;

    setState(current => {
        // 1. Merge Classes (Keep existing, add new if ID unique)
        const existingClassIds = new Set(current.classes.map(c => c.id));
        const newClasses = pendingBackup.classes.filter(c => !existingClassIds.has(c.id));
        
        // 2. Merge Students (Keep existing, add new if ID unique)
        const existingStudentIds = new Set(current.students.map(s => s.id));
        const newStudents = pendingBackup.students.filter(s => !existingStudentIds.has(s.id));

        return {
            ...current,
            // Settings Merge
            theme: importSettings ? (pendingBackup.theme || current.theme) : current.theme,
            orientation: importSettings ? (pendingBackup.orientation || current.orientation) : current.orientation,
            schoolInfo: importSchoolInfo ? (pendingBackup.schoolInfo || current.schoolInfo) : current.schoolInfo,
            
            // Data Merge
            classes: [...current.classes, ...newClasses],
            students: [...current.students, ...newStudents]
        };
    });

    const newStudentCount = pendingBackup.students.filter(s => !state.students.find(cs => cs.id === s.id)).length;
    setRestoreStatus(`Success! Merged data. Added ${newStudentCount} new students.`);
    setPendingBackup(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Download size={20} /> Backup Data</h2>
         <p className="text-gray-500 mb-4 text-sm">Download a full JSON backup of your configuration, students, and marks. Save this file safely.</p>
         <button 
            onClick={() => exportBackup(state)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
         >
           <Download size={16} /> Download Backup File
         </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Upload size={20} /> Restore Data</h2>
         <p className="text-gray-500 mb-4 text-sm">Restore from a previously saved JSON backup file. Data will be merged (new students added, existing kept).</p>
         
         <div className="flex items-center gap-4">
            <label className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium cursor-pointer flex items-center gap-2">
              <Upload size={16} /> Select Backup File
              <input type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
            </label>
            {restoreStatus && (
              <span className={`text-sm flex items-center gap-1 ${restoreStatus.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                 {restoreStatus.includes('Error') ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
                 {restoreStatus}
              </span>
            )}
         </div>
      </div>

      <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-100">
         <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600"><RefreshCw size={20} /> Factory Reset</h2>
         <p className="text-red-800 mb-4 text-sm">Clear all local storage data. This action cannot be undone. The app will return to its initial demo state.</p>
         <button 
            onClick={() => {
              if(confirm("Are you sure? This will wipe ALL data.")) {
                clearState();
              }
            }}
            className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 font-medium flex items-center gap-2"
         >
           <AlertTriangle size={16} /> Clear All Data
         </button>
      </div>

      {/* Restore Options Modal */}
      {pendingBackup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Import Options</h3>
                    <button onClick={() => setPendingBackup(null)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                        <Users className="text-blue-600 mt-1" size={20} />
                        <div>
                            <p className="font-semibold text-blue-900">Merging Data</p>
                            <p className="text-sm text-blue-700 mt-1">
                                {pendingBackup.students.length} students found in backup. 
                                New students will be added. Existing students (matching IDs) will be kept as is.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input 
                                type="checkbox" 
                                checked={importSettings} 
                                onChange={e => setImportSettings(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <span className="font-medium text-gray-800 flex items-center gap-2"><Settings size={16}/> Import Layout & Theme</span>
                                <p className="text-xs text-gray-500">Colors, Margins, Fonts, Orientation</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input 
                                type="checkbox" 
                                checked={importSchoolInfo} 
                                onChange={e => setImportSchoolInfo(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <span className="font-medium text-gray-800">Import School Info</span>
                                <p className="text-xs text-gray-500">School Name, Address, Logo, Session</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setPendingBackup(null)} className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={executeRestore} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Confirm Import</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DataTools;