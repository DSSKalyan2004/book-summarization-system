
import React from 'react';
import { NAV_ITEMS, APP_NAME } from '../constants';
import { Page } from '../types';
import { Zap } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/5 hidden md:flex flex-col z-50">
      <div className="p-10">
        <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-xl shadow-lg shadow-indigo-950/40">
            <Zap size={20} className="fill-white text-white" />
          </div>
          {APP_NAME}
        </h1>
        <p className="text-slate-500 text-[0.6rem] mt-3 font-black uppercase tracking-[0.4em] opacity-40">Intelligence</p>
      </div>

      <nav className="flex-1 px-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id as Page)}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 ${
              currentPage === item.id 
                ? 'bg-white/5 text-white shadow-sm ring-1 ring-white/10' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <span className={currentPage === item.id ? 'text-indigo-400' : ''}>
              {item.icon}
            </span>
            <span className="font-bold text-[0.7rem] uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-8">
        <div className="bg-slate-900/40 rounded-3xl p-4 border border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
            <p className="text-[0.6rem] text-slate-400 font-black uppercase tracking-widest">System Ready</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
