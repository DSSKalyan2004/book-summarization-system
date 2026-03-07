
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

const SIDEBAR_CSS = `
  .sidebar-nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    position: relative;
    transition: all 0.15s ease;
    background: transparent;
    color: rgba(255,255,255,0.5);
  }
  .sidebar-nav-item:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.85);
  }
  .sidebar-nav-item.active {
    background: rgba(99,102,241,0.12);
    color: #fff;
    font-weight: 600;
  }
  .sidebar-nav-item.active .nav-icon { color: #818cf8; }
  .sidebar-nav-item .nav-icon {
    color: rgba(255,255,255,0.35);
    transition: color 0.15s ease;
  }
  .sidebar-nav-item:hover .nav-icon { color: rgba(255,255,255,0.7); }
  .sidebar-logout {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .sidebar-logout:hover {
    background: rgba(239,68,68,0.12);
    border-color: rgba(239,68,68,0.3);
    color: #fca5a5;
  }
`;

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, currentUser, onLogout }) => {
  const navItems = currentUser?.role === 'admin' ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  return (
    <>
      <style>{SIDEBAR_CSS}</style>
      <aside className="fixed left-0 top-0 h-screen w-64 hidden md:flex flex-col z-50"
        style={{
          background: '#0f0f13',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={17} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                BookSumm<span style={{ color: '#818cf8', marginLeft: '3px', fontWeight: 400 }}>AI</span>
              </span>
            </div>
          </div>
          <div style={{ marginTop: '20px', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Nav label */}
        <div style={{ padding: '0 20px', marginBottom: '8px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Menu</p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id as Page)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                {isActive && (
                  <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', borderRadius: '0 4px 4px 0', background: '#6366f1' }} />
                )}
                <span className="nav-icon">{item.icon}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
              </button>
            );
          })}
        </nav>

        {/* User Card */}
        {currentUser && (
          <div style={{ padding: '16px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#fff', flexShrink: 0 }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</p>
                </div>
                {currentUser.role === 'admin' && (
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: 'rgba(34,197,94,0.12)', color: '#4ade80', letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0 }}>Admin</span>
                )}
              </div>
              <button onClick={onLogout} className="sidebar-logout">
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
