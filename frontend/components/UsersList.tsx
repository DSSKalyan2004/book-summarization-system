import React, { useEffect, useState } from 'react';
import { User, LoginEvent } from '../types';
import { authApi } from '../services/api';
import {
  Users, Shield, Calendar, Mail, Loader2, AlertCircle, Copy,
  CheckCircle2, UserPlus, Search, Clock, RefreshCw, LogIn, Activity,
  MapPin, MonitorSmartphone
} from 'lucide-react';

/* ─── Design tokens ─────────────────────────────────────── */
const P        = '#6366F1';
const P_LIGHT  = 'rgba(99,102,241,0.08)';
const P_BORDER = 'rgba(99,102,241,0.18)';
const SURFACE  = '#ffffff';
const BORDER   = '#E8EAF0';
const TEXT     = '#111827';
const TEXT_SUB = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

/* ─── Avatar palette ────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg: '#EDE9FE', color: '#7C3AED' },
  { bg: '#DBEAFE', color: '#2563EB' },
  { bg: '#D1FAE5', color: '#059669' },
  { bg: '#FCE7F3', color: '#DB2777' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#E0F2FE', color: '#0284C7' },
];
function getAvatarStyle(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

/* ─── Tooltip Avatar ────────────────────────────────────── */
const AvatarWithTooltip: React.FC<{ name: string; size?: number }> = ({ name, size = 34 }) => {
  const [show, setShow] = useState(false);
  const { bg, color } = getAvatarStyle(name);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: bg, color,
        fontWeight: 700, fontSize: Math.round(size * 0.38),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${SURFACE}`, boxShadow: '0 1px 4px rgba(0,0,0,0.09)',
        flexShrink: 0, cursor: 'default', userSelect: 'none',
      }}>
        {name.charAt(0).toUpperCase()}
      </div>
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 7px)', left: '50%', transform: 'translateX(-50%)',
          background: '#111827', color: '#fff', fontSize: '12px', fontWeight: 600,
          padding: '5px 10px', borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 200,
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)', pointerEvents: 'none',
        }}>
          {name}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #111827' }} />
        </div>
      )}
    </div>
  );
};

/* ─── Pill badge ────────────────────────────────────────── */
const Pill: React.FC<{ color: string; bg: string; border: string; children: React.ReactNode }> = ({ color, bg, border, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: bg, border: `1px solid ${border}`, borderRadius: '99px', color, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
    {children}
  </span>
);

/* ─── Search input ──────────────────────────────────────── */
const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: TEXT_MUTED, pointerEvents: 'none' }} />
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '9px 14px 9px 34px', background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: '10px', fontSize: '14px', color: TEXT, fontWeight: 500, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
      onFocus={e => { e.target.style.borderColor = P; e.target.style.boxShadow = 'rgba(99,102,241,0.12) 0 0 0 3px'; }}
      onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

/* ─── Stat card ─────────────────────────────────────────── */
const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; accent: string; iconColor: string }> = ({ label, value, icon, accent, iconColor }) => (
  <div style={{ background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}>
    <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '22px', fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '12px', color: TEXT_SUB, margin: '4px 0 0 0', fontWeight: 600 }}>{label}</p>
    </div>
  </div>
);

const UsersList: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'history'>('users');

  // â”€â”€ Users tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [search, setSearch] = useState('');

  // â”€â”€ Login History tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<LoginEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (tab === 'history' && !historyLoaded) loadHistory();
  }, [tab]);

  // Auto-refresh every 30 seconds so logins from other devices appear automatically
  useEffect(() => {
    const interval = setInterval(() => {
      loadUsers();
      if (historyLoaded) {
        setHistoryLoaded(false);
        loadHistory();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [historyLoaded]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q ? users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    ) : users);
  }, [search, users]);

  useEffect(() => {
    const q = historySearch.toLowerCase().trim();
    setFilteredEvents(q ? events.filter(e =>
      e.email.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    ) : events);
  }, [historySearch, events]);

  const loadUsers = async () => {
    setLoadingUsers(true); setUsersError(null);
    try {
      const res = await authApi.getAllUsers();
      setUsers(res.users); setFiltered(res.users);
      setLastUpdated(new Date());
    } catch (err: any) { setUsersError(err.message || 'Failed to load users'); }
    finally { setLoadingUsers(false); }
  };

  const loadHistory = async () => {
    setLoadingHistory(true); setHistoryError(null);
    try {
      const res = await authApi.getLoginHistory();
      setEvents(res.events); setFilteredEvents(res.events); setHistoryLoaded(true);
      setLastUpdated(new Date());
    } catch (err: any) { setHistoryError(err.message || 'Failed to load login history'); }
    finally { setLoadingHistory(false); }
  };

  const formatDate = (d?: string | null) => {
    if (!d) return 'â€”';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'â€”';
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (d?: string | null) => {
    if (!d) return 'â€”';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'â€”';
    return dt.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatRelative = (d?: string | null) => {
    if (!d) return 'Never';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'Never';
    const diff = Date.now() - dt.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(d);
  };

  const copyAllEmails = () => {
    navigator.clipboard.writeText(users.map(u => u.email).join(', '));
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const avatarColor = (name: string) => {
    const c = ['from-orange-500 to-pink-600','from-blue-500 to-cyan-600','from-purple-500 to-indigo-600','from-green-500 to-teal-600','from-rose-500 to-orange-600'];
    return c[(name.charCodeAt(0) || 0) % c.length];
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ── */}
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px 28px', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(11,60,93,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
              <UserPlus size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Admin Panel</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0', fontWeight: 500 }}>Users &amp; Login History</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(79,70,229,0.06))', border: '1.5px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#6366f1', margin: 0, lineHeight: 1 }}>{users.length}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0 0', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Users</p>
            </div>
            <div style={{ padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(14,165,233,0.06))', border: '1.5px solid rgba(6,182,212,0.2)', textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#0891b2', margin: 0, lineHeight: 1 }}>{events.length || '—'}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0 0', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Logins</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', padding: '5px', background: '#F3F4F6', borderRadius: '12px', width: 'fit-content', border: '1.5px solid #E5E7EB' }}>
          {[
            { key: 'users', label: 'Registered Users', icon: <Users size={14} />, activeGrad: 'linear-gradient(135deg, #6366f1, #4f46e5)', activeShadow: '0 2px 10px rgba(99,102,241,0.3)' },
            { key: 'history', label: 'Login History', icon: <Activity size={14} />, activeGrad: 'linear-gradient(135deg, #0891b2, #0e7490)', activeShadow: '0 2px 10px rgba(6,182,212,0.3)' },
          ].map(({ key, label, icon, activeGrad, activeShadow }) => (
            <button key={key} onClick={() => setTab(key as 'users' | 'history')}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.18s',
                background: tab === key ? activeGrad : 'transparent',
                color: tab === key ? '#fff' : '#9CA3AF',
                boxShadow: tab === key ? activeShadow : 'none',
              }}>{icon}{label}</button>
          ))}
        </div>
        {lastUpdated && (
          <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '10px' }}>Auto-refreshes every 30s · Updated: {lastUpdated.toLocaleTimeString()}</p>
        )}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {[
              { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: <Shield size={20} color="#fff" />, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: '0 4px 16px rgba(139,92,246,0.35)' },
              { label: 'Regular Users', value: users.filter(u => u.role === 'user').length, icon: <Users size={20} color="#fff" />, bg: 'linear-gradient(135deg, #6366f1, #4f46e5)', shadow: '0 4px 16px rgba(99,102,241,0.35)' },
              { label: 'Active', value: users.filter(u => u.isActive).length, icon: <CheckCircle2 size={20} color="#fff" />, bg: 'linear-gradient(135deg, #10b981, #059669)', shadow: '0 4px 16px rgba(16,185,129,0.35)' },
            ].map(({ label, value, icon, bg, shadow }) => (
              <div key={label} style={{ background: '#ffffff', border: '1.5px solid #E5E7EB', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: shadow }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', fontWeight: 600 }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search by name, email or role…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 36px', background: '#ffffff', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', color: '#0f172a', fontWeight: 500, outline: 'none', boxSizing: 'border-box', transition: 'all 0.18s' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <button onClick={loadUsers} disabled={loadingUsers} title="Refresh"
              style={{ padding: '10px', borderRadius: '10px', background: '#ffffff', border: '1.5px solid #E5E7EB', color: '#64748b', cursor: loadingUsers ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loadingUsers ? 0.5 : 1, transition: 'all 0.18s' }}>
              <RefreshCw size={15} className={loadingUsers ? 'animate-spin' : ''} />
            </button>
            <button onClick={copyAllEmails}
              style={{ padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              {emailCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {emailCopied ? 'Copied!' : 'Copy All Emails'}
            </button>
          </div>

          {/* Table */}
          {loadingUsers ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ textAlign: 'center' }}><Loader2 size={36} className="animate-spin" style={{ color: '#6366f1', display: 'block', margin: '0 auto 12px' }} /><p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading users…</p></div>
            </div>
          ) : usersError ? (
            <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
              <p style={{ color: '#dc2626', fontWeight: 600, margin: 0 }}>{usersError}</p>
              <button onClick={loadUsers} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={12} />Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #E5E7EB' }}>
              <Users size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: '#94a3b8', fontWeight: 600 }}>{search ? `No users match "${search}"` : 'No users registered yet'}</p>
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(11,60,93,0.06)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #f8faff, #f1f5f9)', borderBottom: '2px solid #E5E7EB' }}>
                      {['#', 'User', 'Email', 'Role', 'Registered', 'Last Login', 'Status'].map(h => (
                        <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user, i) => {
                      const { bg: avBg, color: avColor } = getAvatarStyle(user.name);
                      return (
                        <tr key={user._id || user.id}
                          style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFF'}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>{i + 1}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: avBg, color: avColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', flexShrink: 0 }}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{user.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>{user.email}</td>
                          <td style={{ padding: '14px 16px' }}>
                            {user.role === 'admin'
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#7c3aed', fontSize: '12px', fontWeight: 700 }}><Shield size={10} />Admin</span>
                              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#4f46e5', fontSize: '12px', fontWeight: 700 }}>User</span>}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={12} style={{ color: '#cbd5e1' }} />{formatDate(user.createdAt)}</div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={12} style={{ color: '#cbd5e1' }} />{formatRelative(user.lastLogin)}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {user.isActive
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669', fontSize: '12px', fontWeight: 700 }}>● Active</span>
                              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '12px', fontWeight: 700 }}>● Inactive</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {search && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                  Showing {filtered.length} of {users.length} users
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── LOGIN HISTORY TAB ── */}
      {tab === 'history' && (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search by email, name or role…" value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 36px', background: '#ffffff', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', color: '#0f172a', fontWeight: 500, outline: 'none', boxSizing: 'border-box', transition: 'all 0.18s' }}
                onFocus={e => { e.target.style.borderColor = '#0891b2'; e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <button onClick={() => { setHistoryLoaded(false); loadHistory(); }} disabled={loadingHistory} title="Refresh"
              style={{ padding: '10px', borderRadius: '10px', background: '#ffffff', border: '1.5px solid #E5E7EB', color: '#64748b', cursor: loadingHistory ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loadingHistory ? 0.5 : 1 }}>
              <RefreshCw size={15} className={loadingHistory ? 'animate-spin' : ''} />
            </button>
            <div style={{ padding: '9px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(14,165,233,0.06))', border: '1.5px solid rgba(6,182,212,0.2)' }}>
              <span style={{ fontWeight: 800, color: '#0891b2', fontSize: '15px' }}>{events.length}</span>
              <span style={{ color: '#94a3b8', fontSize: '13px', marginLeft: '6px', fontWeight: 500 }}>total login events</span>
            </div>
          </div>

          {loadingHistory ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ textAlign: 'center' }}><Loader2 size={36} className="animate-spin" style={{ color: '#0891b2', display: 'block', margin: '0 auto 12px' }} /><p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading login history…</p></div>
            </div>
          ) : historyError ? (
            <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
              <p style={{ color: '#dc2626', fontWeight: 600, margin: 0 }}>{historyError}</p>
              <button onClick={loadHistory} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={12} />Retry</button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #E5E7EB' }}>
              <LogIn size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: '#94a3b8', fontWeight: 600 }}>{historySearch ? `No logins match "${historySearch}"` : 'No login events recorded yet'}</p>
              <p style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '6px' }}>Every login will appear here permanently</p>
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(11,60,93,0.06)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #f0fdff, #ecfeff)', borderBottom: '2px solid #E5E7EB' }}>
                      {['#', 'User', 'Email', 'Role', 'IP Address', 'Device', 'Login Time', 'When'].map(h => (
                        <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event, i) => {
                      const { bg: avBg, color: avColor } = getAvatarStyle(event.name || event.email);
                      return (
                        <tr key={`${event.email}-${event.timestamp}-${i}`}
                          style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#F0FDFF'}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>{i + 1}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: avBg, color: avColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', flexShrink: 0 }}>
                                {(event.name || event.email).charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{event.name || '—'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>{event.email}</td>
                          <td style={{ padding: '14px 16px' }}>
                            {event.role === 'admin'
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#7c3aed', fontSize: '12px', fontWeight: 700 }}><Shield size={10} />Admin</span>
                              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#0891b2', fontSize: '12px', fontWeight: 700 }}>User</span>}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {event.ip ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} style={{ color: '#cbd5e1' }} />{event.ip}</span> : '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <MonitorSmartphone size={13} style={{ color: '#cbd5e1' }} />
                              {event.userAgent
                                ? event.userAgent.includes('Mobile') ? 'Mobile'
                                  : event.userAgent.includes('Tablet') ? 'Tablet'
                                  : 'Desktop'
                                : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={11} style={{ color: '#cbd5e1' }} />{formatDateTime(event.timestamp)}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '99px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#0891b2', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>{formatRelative(event.timestamp)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {historySearch && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                  Showing {filteredEvents.length} of {events.length} events
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsersList;
