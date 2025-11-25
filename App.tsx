
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Configuration from './components/Configuration';
import StudentManager from './components/StudentManager';
import MarksheetPreview from './components/MarksheetPreview';
import PDFLayoutEditor from './components/PDFLayoutEditor';
import DataTools from './components/DataTools';
import BulkGenerator from './components/BulkGenerator';
import { loadState, saveState } from './services/storage';
import { AppState, ThemeConfig } from './types';
import { Menu } from 'lucide-react';

const App = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);

  // Autosave effect
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Routing Logic
  const handleNavigateToClass = (className: string) => {
    setActiveTab('students');
  };

  const handleNavigateToMarksheet = (studentId: string) => {
    setPreviewStudentId(studentId);
    setActiveTab('preview');
  };

  const handleUpdateTheme = (newTheme: ThemeConfig) => {
    setState(prev => ({ ...prev, theme: newTheme }));
  };

  const renderContent = () => {
    if (activeTab === 'preview' && previewStudentId) {
      const student = state.students.find(s => s.id === previewStudentId);
      if (!student) return <div>Student not found</div>;
      const classConfig = state.classes.find(c => c.className === student.className);
      if (!classConfig) return <div>Configuration error</div>;

      return (
        <MarksheetPreview 
          student={student} 
          classConfig={classConfig} 
          schoolInfo={state.schoolInfo}
          orientation={state.orientation}
          theme={state.theme}
          onUpdateTheme={handleUpdateTheme}
          onBack={() => {
            setPreviewStudentId(null);
            setActiveTab('students');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard state={state} navigateToClass={handleNavigateToClass} />;
      case 'config':
        return <Configuration state={state} setState={setState} />;
      case 'students':
        return <StudentManager state={state} setState={setState} navigateToMarksheet={handleNavigateToMarksheet} />;
      case 'layout':
        return <PDFLayoutEditor state={state} setState={setState} />;
      case 'bulk':
        return <BulkGenerator state={state} />;
      case 'generator':
        return (
          <div className="p-8 text-center">
             <h2 className="text-xl font-semibold mb-4">Generate Marksheets</h2>
             <p className="text-gray-600 mb-6">Go to the <strong>Students</strong> tab to view and print marksheets for individual students, or <strong>Bulk Print</strong> to generate for the whole class.</p>
             <button onClick={() => setActiveTab('students')} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mr-4">Go to Students</button>
             <button onClick={() => setActiveTab('bulk')} className="bg-slate-700 text-white px-6 py-2 rounded hover:bg-slate-800">Go to Bulk Print</button>
          </div>
        );
      case 'data':
        return <DataTools state={state} setState={setState} />;
      default:
        return <Dashboard state={state} navigateToClass={() => {}} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      {activeTab !== 'preview' && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${activeTab === 'preview' ? 'w-full' : 'min-w-0'}`}>
        {activeTab !== 'preview' && (
          <header className="bg-white shadow-sm p-4 flex items-center justify-between md:hidden shrink-0">
             <button onClick={() => setSidebarOpen(true)} className="text-gray-700">
               <Menu size={24} />
             </button>
             <span className="font-bold text-gray-800">EduMark</span>
          </header>
        )}
        {/* Scrollable content area - important for print styles to override this specific class */}
        <div className="flex-1 overflow-y-auto h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
