import React, { useEffect, useState } from 'react';
import { User, LoginEvent } from '../types';
import { authApi } from '../services/api';
import {
  Users, Shield, Calendar, Mail, Loader2, AlertCircle, Copy,
  CheckCircle2, UserPlus, Search, Clock, RefreshCw, LogIn, Activity
} from 'lucide-react';

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
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <header className="p-6 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
              <UserPlus color="#818cf8" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
              <p className="text-sm" style={{ color: '#64748b' }}>Users &amp; Login History — stored permanently in MongoDB</p>
              {lastUpdated && (
                <p className="text-xs mt-0.5" style={{ color: '#334155' }}>
                  Auto-refreshes every 30s · Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl text-center" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p className="font-bold text-xl leading-none" style={{ color: '#818cf8' }}>{users.length}</p>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Users</p>
            </div>
            <div className="px-4 py-2.5 rounded-xl text-center" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <p className="font-bold text-xl leading-none" style={{ color: '#67e8f9' }}>{events.length || '\u2014'}</p>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Logins</p>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setTab('users')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === 'users' ? { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' } : { background: 'rgba(30,41,59,0.7)', color: '#64748b', border: '1px solid rgba(51,65,85,0.5)' }}
          >
            <Users size={15} /> Registered Users
          </button>
          <button
            onClick={() => setTab('history')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === 'history' ? { background: 'linear-gradient(135deg, #0891b2, #0e7490)', color: '#fff', boxShadow: '0 4px 14px rgba(6,182,212,0.3)', border: '1px solid rgba(6,182,212,0.4)' } : { background: 'rgba(30,41,59,0.7)', color: '#64748b', border: '1px solid rgba(51,65,85,0.5)' }}
          >
            <Activity size={15} /> Login History
          </button>
        </div>
      </header>

      {/* â”€â”€ USERS TAB â”€â”€ */}
      {tab === 'users' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: '#9CA3AF' }} />
              <input type="text" placeholder="Search by name, email or role…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm transition-all" style={{ background: '#ffffff', border: '1.5px solid #E5E7EB', outline: 'none', color: '#0B3C5D', fontWeight: 500 }}
                onMouseEnter={e => { (e.target as HTMLInputElement).style.background = '#0B3C5D'; (e.target as HTMLInputElement).style.color = '#ffffff'; (e.target as HTMLInputElement).style.borderColor = '#0B3C5D'; }}
                onMouseLeave={e => { if (document.activeElement !== e.target) { (e.target as HTMLInputElement).style.background = '#ffffff'; (e.target as HTMLInputElement).style.color = '#0B3C5D'; (e.target as HTMLInputElement).style.borderColor = '#E5E7EB'; } }}
                onFocus={e => { e.target.style.background = '#0B3C5D'; e.target.style.color = '#ffffff'; e.target.style.borderColor = '#1D4ED8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.2)'; }}
                onBlur={e => { e.target.style.background = '#ffffff'; e.target.style.color = '#0B3C5D'; e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <button onClick={loadUsers} disabled={loadingUsers} className="p-2.5 rounded-lg transition-all disabled:opacity-50" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.5)', color: '#64748b' }} title="Refresh">
              <RefreshCw size={15} className={loadingUsers ? 'animate-spin' : ''} />
            </button>
            <button onClick={copyAllEmails} className="px-4 py-2.5 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }}>
              {emailCopied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
              {emailCopied ? 'Copied!' : 'Copy All Emails'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#a78bfa' }}>Admins</p><p className="text-2xl font-bold mt-1" style={{ color: '#c4b5fd' }}>{users.filter(u => u.role === 'admin').length}</p></div>
              <Shield style={{ color: 'rgba(139,92,246,0.3)' }} size={30} />
            </div>
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#818cf8' }}>Users</p><p className="text-2xl font-bold mt-1" style={{ color: '#a5b4fc' }}>{users.filter(u => u.role === 'user').length}</p></div>
              <Users style={{ color: 'rgba(99,102,241,0.3)' }} size={30} />
            </div>
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6ee7b7' }}>Active</p><p className="text-2xl font-bold mt-1" style={{ color: '#a7f3d0' }}>{users.filter(u => u.isActive).length}</p></div>
              <CheckCircle2 style={{ color: 'rgba(16,185,129,0.3)' }} size={30} />
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-20"><div className="text-center space-y-3"><Loader2 className="animate-spin mx-auto" size={40} style={{ color: '#6366f1' }} /><p style={{ color: '#64748b' }}>Loading users…</p></div></div>
          ) : usersError ? (
            <div className="p-5 rounded-xl flex items-center gap-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle style={{ color: '#f87171', flexShrink: 0 }} size={22} />
              <div className="flex-1"><p style={{ color: '#f87171', fontWeight: 600 }}>Failed to load users</p><p style={{ color: '#fca5a5', fontSize: '13px', marginTop: '2px' }}>{usersError}</p></div>
              <button onClick={loadUsers} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}><RefreshCw size={13} />Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl p-16 text-center" style={{ border: '1px solid rgba(51,65,85,0.4)' }}>
              <Users style={{ color: '#1e293b', margin: '0 auto 16px' }} size={48} />
              <p style={{ color: '#475569' }}>{search ? `No users match "${search}"` : 'No users registered yet'}</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(51,65,85,0.4)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                    <tr>
                      {['#','Name','Email','Role','Registered','Last Login','Status'].map(h => (
                        <th key={h} className="text-left p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(51,65,85,0.3)' }}>
                    {filtered.map((user, i) => (
                      <tr key={user._id || user.id} className="transition-all" style={{ borderColor: 'rgba(51,65,85,0.3)' }} onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='rgba(15,23,42,0.5)'} onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background='transparent'}>
                        <td className="p-4 font-mono text-sm" style={{ color: '#334155' }}>{i + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(user.name)} flex items-center justify-center text-white font-bold text-xs shadow shrink-0`}>{user.name.charAt(0).toUpperCase()}</div>
                            <span className="text-white font-semibold whitespace-nowrap">{user.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-300 font-mono text-sm">{user.email}</td>
                        <td className="p-4">
                          {user.role === 'admin'
                            ? <span className="badge badge-violet inline-flex items-center gap-1"><Shield size={10} />Admin</span>
                            : <span className="badge badge-indigo">User</span>}
                        </td>
                        <td className="p-4 text-sm whitespace-nowrap" style={{ color: '#475569' }}>{formatDate(user.createdAt)}</td>
                        <td className="p-4 text-sm whitespace-nowrap" style={{ color: '#475569' }}>{formatRelative(user.lastLogin)}</td>
                        <td className="p-4">
                          {user.isActive
                            ? <span className="badge badge-green">Active</span>
                            : <span className="badge badge-red">Inactive</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {search && <div className="px-4 py-3 text-sm" style={{ borderTop: '1px solid rgba(51,65,85,0.4)', color: '#475569' }}>Showing {filtered.length} of {users.length} users</div>}
            </div>
          )}
        </>
      )}

      {/* â”€â”€ LOGIN HISTORY TAB â”€â”€ */}
      {tab === 'history' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: '#9CA3AF' }} />
              <input type="text" placeholder="Search by email, name or role…" value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm transition-all" style={{ background: '#ffffff', border: '1.5px solid #E5E7EB', outline: 'none', color: '#0B3C5D', fontWeight: 500 }}
                onMouseEnter={e => { (e.target as HTMLInputElement).style.background = '#0B3C5D'; (e.target as HTMLInputElement).style.color = '#ffffff'; (e.target as HTMLInputElement).style.borderColor = '#0B3C5D'; }}
                onMouseLeave={e => { if (document.activeElement !== e.target) { (e.target as HTMLInputElement).style.background = '#ffffff'; (e.target as HTMLInputElement).style.color = '#0B3C5D'; (e.target as HTMLInputElement).style.borderColor = '#E5E7EB'; } }}
                onFocus={e => { e.target.style.background = '#0B3C5D'; e.target.style.color = '#ffffff'; e.target.style.borderColor = '#1D4ED8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.2)'; }}
                onBlur={e => { e.target.style.background = '#ffffff'; e.target.style.color = '#0B3C5D'; e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <button onClick={() => { setHistoryLoaded(false); loadHistory(); }} disabled={loadingHistory}
              className="p-2.5 rounded-lg transition-all disabled:opacity-50" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.5)', color: '#64748b' }} title="Refresh">
              <RefreshCw size={15} className={loadingHistory ? 'animate-spin' : ''} />
            </button>
            <div className="px-4 py-2.5 rounded-xl" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <span className="font-bold" style={{ color: '#67e8f9' }}>{events.length}</span>
              <span className="text-sm ml-1.5" style={{ color: '#475569' }}>total login events</span>
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-20"><div className="text-center space-y-3"><Loader2 className="animate-spin mx-auto" size={40} style={{ color: '#06b6d4' }} /><p style={{ color: '#64748b' }}>Loading login history…</p></div></div>
          ) : historyError ? (
            <div className="p-5 rounded-xl flex items-center gap-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle style={{ color: '#f87171', flexShrink: 0 }} size={22} />
              <div className="flex-1"><p style={{ color: '#f87171', fontWeight: 600 }}>Failed to load history</p><p style={{ color: '#fca5a5', fontSize: '13px', marginTop: '2px' }}>{historyError}</p></div>
              <button onClick={loadHistory} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}><RefreshCw size={13} />Retry</button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-2xl p-16 text-center" style={{ border: '1px solid rgba(51,65,85,0.4)' }}>
              <LogIn style={{ color: '#1e293b', margin: '0 auto 16px' }} size={48} />
              <p style={{ color: '#475569' }}>{historySearch ? `No logins match "${historySearch}"` : 'No login events recorded yet'}</p>
              <p style={{ color: '#334155', fontSize: '13px', marginTop: '8px' }}>Every login will appear here permanently</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(51,65,85,0.4)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                    <tr>
                      {['#','User','Email','Role','IP Address','Device','Login Time','When'].map(h => (
                        <th key={h} className="text-left p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(51,65,85,0.3)' }}>
                    {filteredEvents.map((event, i) => (
                      <tr key={`${event.email}-${event.timestamp}-${i}`} className="transition-all" onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='rgba(15,23,42,0.5)'} onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background='transparent'}>
                        <td className="p-4 font-mono text-sm" style={{ color: '#334155' }}>{i + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(event.name || event.email)} flex items-center justify-center text-white font-bold text-xs shadow shrink-0`}>{(event.name || event.email).charAt(0).toUpperCase()}</div>
                            <span className="text-white font-semibold whitespace-nowrap">{event.name || 'â€”'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-300 font-mono text-sm">{event.email}</td>
                        <td className="p-4">
                          {event.role === 'admin'
                            ? <span className="badge badge-violet inline-flex items-center gap-1"><Shield size={10} />Admin</span>
                            : <span className="badge badge-indigo">User</span>}
                        </td>
                        <td className="p-4 font-mono text-xs whitespace-nowrap" style={{ color: '#475569' }}>{event.ip || '—'}</td>
                        <td className="p-4 text-zinc-400 text-xs whitespace-nowrap">
                          {event.userAgent
                            ? event.userAgent.includes('Mobile') ? '📱 Mobile'
                              : event.userAgent.includes('Tablet') ? '📟 Tablet'
                              : '💻 Desktop'
                            : '—'}
                        </td>
                        <td className="p-4 text-sm whitespace-nowrap" style={{ color: '#94a3b8' }}>{formatDateTime(event.timestamp)}</td>
                        <td className="p-4 text-sm whitespace-nowrap" style={{ color: '#475569' }}>{formatRelative(event.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {historySearch && <div className="px-4 py-3 text-sm" style={{ borderTop: '1px solid rgba(51,65,85,0.4)', color: '#475569' }}>Showing {filteredEvents.length} of {events.length} events</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsersList;

