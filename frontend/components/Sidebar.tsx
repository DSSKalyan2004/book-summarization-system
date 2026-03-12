
import React from 'react';
import { NAV_ITEMS, ADMIN_NAV_ITEMS, APP_NAME } from '../constants';
import { Page, User } from '../types';
import { BookOpen, LogOut, ChevronRight, Sparkles } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const SIDEBAR_CSS = `
  @keyframes sidebarGlow {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }
  @keyframes navItemPulse {
    0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); }
    70% { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
    100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  }
  @keyframes indicatorSlide {
    from { height: 0; opacity: 0; }
    to { height: 22px; opacity: 1; }
  }
  .sidebar-nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    position: relative;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    background: transparent;
    color: rgba(255,255,255,0.45);
    overflow: hidden;
  }
  .sidebar-nav-item::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
    pointer-events: none;
  }
  .sidebar-nav-item:hover::after {
    transform: translateX(100%);
  }
  .sidebar-nav-item:hover {
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.9);
    transform: translateX(4px);
  }
  .sidebar-nav-item:active {
    transform: translateX(4px) scale(0.97);
  }
  .sidebar-nav-item.active {
    background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.1));
    color: #fff;
    font-weight: 600;
    border: 1px solid rgba(99,102,241,0.15);
  }
  .sidebar-nav-item.active .nav-icon { color: #a5b4fc; }
  .sidebar-nav-item .nav-icon {
    color: rgba(255,255,255,0.3);
    transition: color 0.2s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  .sidebar-nav-item:hover .nav-icon { color: rgba(255,255,255,0.7); transform: scale(1.15) rotate(-5deg); }
  .sidebar-nav-item.active .active-indicator {
    animation: indicatorSlide 0.3s cubic-bezier(0.16,1,0.3,1) both;
  }
  .sidebar-logout {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.45);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    position: relative;
    overflow: hidden;
  }
  .sidebar-logout:hover {
    background: rgba(239,68,68,0.12);
    border-color: rgba(239,68,68,0.25);
    color: #fca5a5;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239,68,68,0.15);
  }
  .sidebar-logout:active {
    transform: translateY(0) scale(0.97);
  }
`;

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, currentUser, onLogout }) => {
  const navItems = currentUser?.role === 'admin' ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  return (
    <>
      <style>{SIDEBAR_CSS}</style>
      <aside className="fixed left-0 top-0 h-screen w-[270px] hidden md:flex flex-col z-50"
        style={{
          background: 'linear-gradient(180deg, #0a0a14 0%, #0e0e1a 50%, #0a0a14 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Top gradient accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #4F46E5, #7C3AED, #06B6D4)', opacity: 0.6 }} />
        
        {/* Background orb */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', animation: 'sidebarGlow 6s ease-in-out infinite' }} />

        {/* Logo */}
        <div style={{ padding: '28px 22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 20px rgba(79,70,229,0.35)' }}>
              <BookOpen size={18} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <span style={{ fontSize: '17px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                BookSumm<span style={{ color: '#a5b4fc', marginLeft: '3px', fontWeight: 400 }}>AI</span>
              </span>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: '2px 0 0', fontWeight: 500, letterSpacing: '0.05em' }}>INTELLIGENT SUMMARIZATION</p>
            </div>
          </div>
          <div style={{ marginTop: '22px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
        </div>

        {/* Nav label */}
        <div style={{ padding: '0 22px', marginBottom: '10px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Navigation</p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id as Page)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                {isActive && (
                  <div className="active-indicator" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '22px', borderRadius: '0 6px 6px 0', background: 'linear-gradient(180deg, #6366f1, #8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.6)' }} />
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
            <div style={{ padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: '#fff', flexShrink: 0, boxShadow: '0 2px 12px rgba(79,70,229,0.3)' }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</p>
                </div>
                {currentUser.role === 'admin' && (
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', background: 'rgba(34,197,94,0.12)', color: '#4ade80', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0, border: '1px solid rgba(34,197,94,0.15)' }}>Admin</span>
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
