import React, { useState } from 'react';
import { AppState, ClassConfig, SubjectConfig, ExamConfig } from '../types';
import { Plus, Trash2, Save, Upload, LayoutTemplate, CheckSquare, Square, Copy } from 'lucide-react';

interface ConfigProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Configuration: React.FC<ConfigProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<'school' | 'class'>('school');
  const [selectedClassId, setSelectedClassId] = useState<string>(state.classes[0]?.id || '');
  const [newFieldName, setNewFieldName] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({
          ...prev,
          schoolInfo: { ...prev.schoolInfo, logo: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addClass = () => {
    const newClass: ClassConfig = {
      id: Date.now().toString(),
      className: `New Class ${state.classes.length + 1}`,
      subjects: [],
      extraInfoFields: ['Father Name'],
      passPercentage: 33,
      enableStudentPhoto: true
    };
    setState(prev => ({ ...prev, classes: [...prev.classes, newClass] }));
    setSelectedClassId(newClass.id);
  };

  const duplicateClass = () => {
    const classToClone = state.classes.find(c => c.id === selectedClassId);
    if (!classToClone) return;

    const newClass: ClassConfig = {
        ...classToClone,
        id: Date.now().toString(),
        className: `${classToClone.className} (Copy)`,
        // Deep copy subjects/exams to prevent reference issues
        subjects: classToClone.subjects.map(s => ({
            ...s,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            exams: s.exams.map(e => ({...e, id: Date.now().toString() + Math.random().toString(36).substr(2, 5)}))
        }))
    };

    setState(prev => ({ ...prev, classes: [...prev.classes, newClass] }));
    setSelectedClassId(newClass.id);
  };

  const updateClass = (id: string, updates: Partial<ClassConfig>) => {
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const selectedClass = state.classes.find(c => c.id === selectedClassId);

  // Helper to update subjects deeply
  const updateSubject = (subjectId: string, updates: Partial<SubjectConfig>) => {
    if (!selectedClass) return;
    const newSubjects = selectedClass.subjects.map(s => 
      s.id === subjectId ? { ...s, ...updates } : s
    );
    updateClass(selectedClassId, { subjects: newSubjects });
  };

  const addSubject = (type: 'Scholastic' | 'Co-Scholastic') => {
    if (!selectedClass) return;
    const newSubject: SubjectConfig = {
      id: Date.now().toString(),
      name: 'New Subject',
      type,
      exams: type === 'Scholastic' ? [{ id: 'e1', name: 'Annual', maxMarks: 100, weightage: 100 }] : []
    };
    updateClass(selectedClassId, { subjects: [...selectedClass.subjects, newSubject] });
  };

  const handleAddField = () => {
    if (newFieldName.trim() && selectedClass) {
      const updatedFields = [...(selectedClass.extraInfoFields || []), newFieldName.trim()];
      updateClass(selectedClassId, { extraInfoFields: updatedFields });
      setNewFieldName('');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex gap-4 border-b border-gray-200">
        <button
          className={`pb-3 px-4 font-medium ${activeTab === 'school' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('school')}
        >
          School Info
        </button>
        <button
          className={`pb-3 px-4 font-medium ${activeTab === 'class' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('class')}
        >
          Class Configurations
        </button>
      </div>

      {activeTab === 'school' && (
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">School Name</label>
              <input
                type="text"
                value={state.schoolInfo.name}
                onChange={e => setState(prev => ({ ...prev, schoolInfo: { ...prev.schoolInfo, name: e.target.value } }))}
                className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Affiliation / Subtitle</label>
              <input
                type="text"
                value={state.schoolInfo.affiliation}
                onChange={e => setState(prev => ({ ...prev, schoolInfo: { ...prev.schoolInfo, affiliation: e.target.value } }))}
                className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={state.schoolInfo.address}
                onChange={e => setState(prev => ({ ...prev, schoolInfo: { ...prev.schoolInfo, address: e.target.value } }))}
                className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Academic Session</label>
              <input
                type="text"
                value={state.schoolInfo.session}
                onChange={e => setState(prev => ({ ...prev, schoolInfo: { ...prev.schoolInfo, session: e.target.value } }))}
                className="w-full p-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Default Orientation</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setState(prev => ({...prev, orientation: 'portrait'}))}
                  className={`flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 ${state.orientation === 'portrait' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="h-6 w-4 border-2 border-current"></div> Portrait
                </button>
                <button 
                  onClick={() => setState(prev => ({...prev, orientation: 'landscape'}))}
                  className={`flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 ${state.orientation === 'landscape' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="h-4 w-6 border-2 border-current"></div> Landscape
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">School Logo</label>
              <div className="flex items-center gap-4">
                {state.schoolInfo.logo && (
                  <div className="p-2 border bg-white rounded-lg">
                    <img src={state.schoolInfo.logo} alt="Logo" className="h-16 w-16 object-contain" />
                  </div>
                )}
                <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2 shadow-sm">
                  <Upload size={16} /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'class' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Class Sidebar */}
          <div className="bg-white p-4 rounded-xl shadow-sm h-fit space-y-4">
            <h3 className="font-semibold text-gray-700">Classes</h3>
            <div className="space-y-1">
              {state.classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${selectedClassId === cls.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {cls.className}
                </button>
              ))}
            </div>
            <button 
              onClick={addClass}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 border border-blue-200 bg-white rounded-lg hover:bg-blue-50"
            >
              <Plus size={16} /> Add Class
            </button>
          </div>

          {/* Class Config Detail */}
          {selectedClass ? (
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                 <div className="flex-1 max-w-xs">
                    <label className="text-xs text-gray-500 block mb-1">Class Name</label>
                    <input 
                      className="w-full text-xl font-bold border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none px-3 py-2"
                      value={selectedClass.className}
                      onChange={(e) => updateClass(selectedClassId, { className: e.target.value })}
                    />
                 </div>
                 <div className="flex gap-2">
                    <button 
                        onClick={duplicateClass}
                        className="flex items-center gap-2 text-gray-600 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded border border-gray-200"
                        title="Duplicate this class"
                    >
                        <Copy size={16} />
                        <span className="text-sm font-medium">Duplicate</span>
                    </button>
                    <button 
                        onClick={() => {
                        if(confirm('Delete this class configuration?')) {
                            setState(prev => ({...prev, classes: prev.classes.filter(c => c.id !== selectedClassId)}));
                            setSelectedClassId(state.classes[0]?.id || '');
                        }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                    >
                        <Trash2 size={20} />
                    </button>
                 </div>
              </div>

              {/* Feature Toggles */}
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-900 mb-2">Class Settings</h4>
                  <label className="flex items-center gap-3 cursor-pointer">
                      <div 
                        className={`w-5 h-5 border rounded flex items-center justify-center ${selectedClass.enableStudentPhoto ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}
                        onClick={() => updateClass(selectedClassId, { enableStudentPhoto: !selectedClass.enableStudentPhoto })}
                      >
                        {selectedClass.enableStudentPhoto && <CheckSquare size={14} />}
                      </div>
                      <span className="text-sm text-gray-700 font-medium select-none" onClick={() => updateClass(selectedClassId, { enableStudentPhoto: !selectedClass.enableStudentPhoto })}>
                        Enable Student Photos (Profile Picture)
                      </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-8">
                    Enabling this allows uploading photos for students. Photos will appear on marksheets.
                  </p>
              </div>

              {/* Info Fields */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Dynamic Fields (Student Info)</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(selectedClass.extraInfoFields || []).map((field, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm flex items-center gap-2 shadow-sm">
                      {field}
                      <button onClick={() => updateClass(selectedClassId, { 
                        extraInfoFields: selectedClass.extraInfoFields.filter((_, i) => i !== idx) 
                      })}>
                        <XIcon size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                
                {/* Add New Field Input */}
                <div className="flex items-center gap-2 max-w-md">
                  <input 
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Add Field (e.g. Aadhar No)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                  />
                  <button 
                    onClick={handleAddField}
                    disabled={!newFieldName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">These fields will appear in the student add/edit form and on the marksheet.</p>
              </div>

              {/* Subjects */}
              <div>
                <div className="flex justify-between items-center mb-4">
                   <h4 className="font-medium text-gray-800">Scholastic Subjects</h4>
                   <button onClick={() => addSubject('Scholastic')} className="text-sm text-blue-600 flex items-center gap-1 hover:underline"><Plus size={14}/> Add Subject</button>
                </div>
                <div className="space-y-4">
                  {selectedClass.subjects.filter(s => s.type === 'Scholastic').map(subject => (
                    <div key={subject.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between mb-3 items-center">
                        <input 
                          value={subject.name}
                          onChange={e => updateSubject(subject.id, { name: e.target.value })}
                          className="font-medium border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white w-full max-w-xs"
                        />
                        <button onClick={() => updateClass(selectedClassId, { subjects: selectedClass.subjects.filter(s => s.id !== subject.id) })} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                      
                      {/* Exams for this subject */}
                      <div className="bg-gray-50 p-3 rounded space-y-2">
                         <p className="text-xs font-semibold text-gray-500 uppercase">Exams</p>
                         {subject.exams.map((exam, idx) => (
                           <div key={exam.id} className="flex gap-2 items-center text-sm">
                              <input 
                                value={exam.name} 
                                onChange={e => {
                                  const newExams = [...subject.exams];
                                  newExams[idx].name = e.target.value;
                                  updateSubject(subject.id, { exams: newExams });
                                }}
                                className="w-32 p-1.5 border border-gray-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Exam Name"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 font-medium">Max:</span>
                                <input 
                                  type="number"
                                  value={exam.maxMarks} 
                                  onChange={e => {
                                    const newExams = [...subject.exams];
                                    newExams[idx].maxMarks = Number(e.target.value);
                                    updateSubject(subject.id, { exams: newExams });
                                  }}
                                  className="w-16 p-1.5 border border-gray-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  const newExams = subject.exams.filter((_, i) => i !== idx);
                                  updateSubject(subject.id, { exams: newExams });
                                }}
                                className="text-gray-400 hover:text-red-500 ml-auto"
                              >
                                &times;
                              </button>
                           </div>
                         ))}
                         <button 
                           onClick={() => updateSubject(subject.id, { exams: [...subject.exams, { id: Date.now().toString(), name: 'New Exam', maxMarks: 100, weightage: 100 }] })}
                           className="text-xs text-blue-600 hover:underline mt-2 block"
                         >
                           + Add Exam
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Co-Scholastic */}
              <div>
                <div className="flex justify-between items-center mb-4">
                   <h4 className="font-medium text-gray-800">Co-Scholastic (Grades Only)</h4>
                   <button onClick={() => addSubject('Co-Scholastic')} className="text-sm text-blue-600 flex items-center gap-1 hover:underline"><Plus size={14}/> Add Activity</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {selectedClass.subjects.filter(s => s.type === 'Co-Scholastic').map(subject => (
                     <div key={subject.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-100">
                        <input 
                          value={subject.name}
                          onChange={e => updateSubject(subject.id, { name: e.target.value })}
                          className="bg-white border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none text-sm w-full"
                        />
                        <button onClick={() => updateClass(selectedClassId, { subjects: selectedClass.subjects.filter(s => s.id !== subject.id) })} className="text-red-400 ml-2"><Trash2 size={14}/></button>
                     </div>
                   ))}
                </div>
              </div>

            </div>
          ) : (
             <div className="lg:col-span-3 flex items-center justify-center text-gray-400">Select a class to configure</div>
          )}
        </div>
      )}
    </div>
  );
};

const XIcon = ({size}: {size:number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default Configuration;