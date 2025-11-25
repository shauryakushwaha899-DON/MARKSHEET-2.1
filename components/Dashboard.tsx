import React from 'react';
import { AppState, Gender } from '../types';
import { Users, GraduationCap, School, TrendingUp, ChevronRight } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  navigateToClass: (className: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, navigateToClass }) => {
  const totalStudents = state.students.length;
  const boys = state.students.filter(s => s.gender === Gender.Male).length;
  const girls = state.students.filter(s => s.gender === Gender.Female).length;
  const totalClasses = state.classes.length;

  const studentsPerClass = state.classes.map(cls => ({
    id: cls.id,
    name: cls.className,
    count: state.students.filter(s => s.className === cls.className).length
  }));

  const StatCard = ({ title, value, icon: Icon, gradient }: any) => (
    <div className={`relative overflow-hidden p-6 rounded-2xl shadow-lg text-white ${gradient} transform transition-all hover:scale-[1.02]`}>
      <div className="absolute right-[-20px] top-[-20px] opacity-20 rotate-12">
         <Icon size={100} />
      </div>
      <div className="relative z-10 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/10">
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome to your school management control center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={totalStudents} icon={Users} gradient="bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/30" />
        <StatCard title="Boys" value={boys} icon={TrendingUp} gradient="bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-500/30" />
        <StatCard title="Girls" value={girls} icon={TrendingUp} gradient="bg-gradient-to-br from-pink-500 to-pink-700 shadow-pink-500/30" />
        <StatCard title="Active Classes" value={totalClasses} icon={School} gradient="bg-gradient-to-br from-orange-500 to-orange-700 shadow-orange-500/30" />
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
               <GraduationCap size={20} />
            </div>
            Class Overview
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollment</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsPerClass.map((cls) => (
                <tr 
                  key={cls.id} 
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  onClick={() => navigateToClass(cls.name)}
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">{cls.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, cls.count * 2)}%` }}></div>
                      </div>
                      <span className="text-sm font-medium">{cls.count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 group-hover:text-blue-800 group-hover:translate-x-1 transition-all transform duration-200 inline-flex items-center gap-1 text-sm font-medium">
                      Manage <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {studentsPerClass.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <School size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No classes configured yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;