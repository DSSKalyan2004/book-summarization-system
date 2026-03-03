
import React from 'react';
import { NAV_ITEMS, ADMIN_NAV_ITEMS, APP_NAME } from '../constants';
import { Page, User } from '../types';
import { BookOpen, LogOut, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, currentUser, onLogout }) => {
  const navItems = currentUser?.role === 'admin' ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 hidden md:flex flex-col z-50"
      style={{
        background: '#0B3C5D',
        borderRight: 'none',
        boxShadow: '4px 0 20px rgba(11,60,93,0.25)',
      }}
    >
      {/* Logo Block */}
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <BookOpen size={19} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight leading-none" style={{ color: '#ffffff' }}>{APP_NAME}</h1>
            <p className="text-[10px] font-bold mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>Book Intelligence</p>
          </div>
        </div>
        <div className="mt-5 h-px w-full" style={{ background: 'rgba(255,255,255,0.12)' }}></div>
      </div>

      {/* Nav Section Label */}
      <div className="px-5 mb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Navigation</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id as Page)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group"
              style={isActive ? {
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              } : {
                color: 'rgba(255,255,255,0.65)',
                border: '1px solid transparent',
              }}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                  style={{ background: '#15803D' }}></div>
              )}
              <span style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)' }}>{item.icon}</span>
              <span className="flex-1 text-left" style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>{item.label}</span>
              {isActive && <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.7)', opacity: 1 }} />}
            </button>
          );
        })}
      </nav>

      {/* AI Badge */}

      {/* User Card */}
      {currentUser && (
        <div className="px-4 pb-6">
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1D4ED8, #0B3C5D)', boxShadow: '0 2px 8px rgba(11,60,93,0.4)' }}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#ffffff' }}>{currentUser.name}</p>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{currentUser.email}</p>
              </div>
              {currentUser.role === 'admin' && (
                <span className="badge badge-green text-[10px] px-1.5" style={{ background: 'rgba(21,128,61,0.25)', color: '#86efac', borderColor: 'rgba(21,128,61,0.4)' }}>Admin</span>
              )}
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.25)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(220,38,38,0.5)';
                (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)';
              }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
