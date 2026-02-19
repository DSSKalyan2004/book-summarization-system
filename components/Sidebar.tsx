
import React from 'react';
import { NAV_ITEMS, APP_NAME } from '../constants';
import { Page, User } from '../types';
import { Zap, LogOut, User as UserIcon } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, currentUser, onLogout }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-zinc-800 hidden md:flex flex-col z-50">
      <div className="p-8">
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <div className="btn-primary p-1.5 rounded-lg">
            <Zap size={18} className="fill-white text-white" strokeWidth={2.5} />
          </div>
          <span className="gradient-text">{APP_NAME}</span>
        </h1>
        <p className="text-zinc-500 text-[0.65rem] mt-2.5 font-semibold uppercase tracking-widest">Intelligence</p>
      </div>

      <nav className="flex-1 px-4 space-y-1.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id as Page)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group relative ${
              currentPage === item.id 
                ? 'btn-primary text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span className="relative z-10">
              {item.icon}
            </span>
            <span className="relative z-10 font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 space-y-3">
        {/* User Info */}
        {currentUser && (
          <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <UserIcon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{currentUser.name}</p>
                <p className="text-zinc-500 text-xs truncate">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-all text-sm font-semibold border border-zinc-700/50 hover:border-red-500/30"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
        
        {/* System Status */}
        <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
            <p className="text-[0.65rem] text-zinc-400 font-semibold uppercase tracking-wider">System Ready</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
