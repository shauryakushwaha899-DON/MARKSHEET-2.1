
import React from 'react';
import { LayoutDashboard, Settings, Users, FileText, Database, X, Palette, Printer } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'layout', label: 'PDF Layout', icon: Palette },
    { id: 'bulk', label: 'Bulk Print', icon: Printer },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'generator', label: 'Marksheets', icon: FileText },
    { id: 'data', label: 'Backup & Data', icon: Database },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white w-72 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) z-30 shadow-2xl flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/50">E</div>
             <h1 className="text-xl font-bold tracking-tight">EduMark</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 mt-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}`} />
                <span className="relative z-10">{item.label}</span>
                {isActive && <div className="absolute right-0 top-0 h-full w-1 bg-blue-400 rounded-l-full opacity-50"></div>}
              </button>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-xs text-slate-400 font-medium">System Online v1.0.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
