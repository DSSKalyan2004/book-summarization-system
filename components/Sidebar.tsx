
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

      <div className="p-6">
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
