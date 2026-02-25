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

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (tab === 'history' && !historyLoaded) loadHistory();
  }, [tab]);

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
    } catch (err: any) { setUsersError(err.message || 'Failed to load users'); }
    finally { setLoadingUsers(false); }
  };

  const loadHistory = async () => {
    setLoadingHistory(true); setHistoryError(null);
    try {
      const res = await authApi.getLoginHistory();
      setEvents(res.events); setFilteredEvents(res.events); setHistoryLoaded(true);
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
      <header className="p-6 rounded-xl border border-zinc-800 bg-gradient-to-r from-orange-500/10 to-purple-500/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-3 rounded-lg border border-orange-500/30">
              <UserPlus className="text-orange-500" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
              <p className="text-zinc-400 text-sm">Users & Login History â€” stored permanently</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-lg text-center">
              <p className="text-orange-500 font-bold text-xl leading-none">{users.length}</p>
              <p className="text-zinc-400 text-xs mt-0.5">Users</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-lg text-center">
              <p className="text-blue-400 font-bold text-xl leading-none">{events.length || 'â€”'}</p>
              <p className="text-zinc-400 text-xs mt-0.5">Logins</p>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'users' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
          >
            <Users size={15} /> Registered Users
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input type="text" placeholder="Search by name, email or roleâ€¦" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            <button onClick={loadUsers} disabled={loadingUsers} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg border border-zinc-700 transition-all disabled:opacity-50" title="Refresh">
              <RefreshCw size={15} className={loadingUsers ? 'animate-spin' : ''} />
            </button>
            <button onClick={copyAllEmails} className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all">
              {emailCopied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
              {emailCopied ? 'Copied!' : 'Copy All Emails'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg flex items-center justify-between">
              <div><p className="text-orange-300 text-xs font-semibold uppercase tracking-wider">Admins</p><p className="text-2xl font-bold text-orange-400 mt-1">{users.filter(u => u.role === 'admin').length}</p></div>
              <Shield className="text-orange-500/40" size={32} />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg flex items-center justify-between">
              <div><p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Users</p><p className="text-2xl font-bold text-blue-400 mt-1">{users.filter(u => u.role === 'user').length}</p></div>
              <Users className="text-blue-500/40" size={32} />
            </div>
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg flex items-center justify-between">
              <div><p className="text-green-300 text-xs font-semibold uppercase tracking-wider">Active</p><p className="text-2xl font-bold text-green-400 mt-1">{users.filter(u => u.isActive).length}</p></div>
              <CheckCircle2 className="text-green-500/40" size={32} />
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-20"><div className="text-center space-y-3"><Loader2 className="animate-spin text-orange-500 mx-auto" size={40} /><p className="text-zinc-400">Loading usersâ€¦</p></div></div>
          ) : usersError ? (
            <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-xl flex items-center gap-4">
              <AlertCircle className="text-red-400 shrink-0" size={22} />
              <div className="flex-1"><p className="text-red-400 font-semibold">Failed to load users</p><p className="text-red-300 text-sm mt-0.5">{usersError}</p></div>
              <button onClick={loadUsers} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"><RefreshCw size={13} />Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 p-16 text-center">
              <Users className="text-zinc-600 mx-auto mb-4" size={56} />
              <p className="text-zinc-400">{search ? `No users match "${search}"` : 'No users registered yet'}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-900/60 border-b border-zinc-800">
                    <tr>
                      {['#','Name','Email','Role','Registered','Last Login','Status'].map(h => (
                        <th key={h} className="text-left p-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filtered.map((user, i) => (
                      <tr key={user._id || user.id} className="hover:bg-zinc-900/40 transition-all">
                        <td className="p-4 text-zinc-500 font-mono text-sm">{i + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(user.name)} flex items-center justify-center text-white font-bold text-xs shadow shrink-0`}>{user.name.charAt(0).toUpperCase()}</div>
                            <span className="text-white font-semibold whitespace-nowrap">{user.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-300 font-mono text-sm">{user.email}</td>
                        <td className="p-4">
                          {user.role === 'admin'
                            ? <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-500/30 inline-flex items-center gap-1"><Shield size={10} />Admin</span>
                            : <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-500/30">User</span>}
                        </td>
                        <td className="p-4 text-zinc-400 text-sm whitespace-nowrap">{formatDate(user.createdAt)}</td>
                        <td className="p-4 text-zinc-400 text-sm whitespace-nowrap">{formatRelative(user.lastLogin)}</td>
                        <td className="p-4">
                          {user.isActive
                            ? <span className="bg-green-500/15 text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-500/25">Active</span>
                            : <span className="bg-red-500/15 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-500/25">Inactive</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {search && <div className="px-4 py-3 border-t border-zinc-800 text-zinc-500 text-sm">Showing {filtered.length} of {users.length} users</div>}
            </div>
          )}
        </>
      )}

      {/* â”€â”€ LOGIN HISTORY TAB â”€â”€ */}
      {tab === 'history' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input type="text" placeholder="Search by email, name or roleâ€¦" value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <button onClick={() => { setHistoryLoaded(false); loadHistory(); }} disabled={loadingHistory}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg border border-zinc-700 transition-all disabled:opacity-50" title="Refresh">
              <RefreshCw size={15} className={loadingHistory ? 'animate-spin' : ''} />
            </button>
            <div className="bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-lg">
              <span className="text-blue-400 font-bold">{events.length}</span>
              <span className="text-zinc-400 text-sm ml-1.5">total login events</span>
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-20"><div className="text-center space-y-3"><Loader2 className="animate-spin text-blue-500 mx-auto" size={40} /><p className="text-zinc-400">Loading login historyâ€¦</p></div></div>
          ) : historyError ? (
            <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-xl flex items-center gap-4">
              <AlertCircle className="text-red-400 shrink-0" size={22} />
              <div className="flex-1"><p className="text-red-400 font-semibold">Failed to load history</p><p className="text-red-300 text-sm mt-0.5">{historyError}</p></div>
              <button onClick={loadHistory} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"><RefreshCw size={13} />Retry</button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 p-16 text-center">
              <LogIn className="text-zinc-600 mx-auto mb-4" size={56} />
              <p className="text-zinc-400">{historySearch ? `No logins match "${historySearch}"` : 'No login events recorded yet'}</p>
              <p className="text-zinc-600 text-sm mt-2">Every login from this point on will appear here permanently</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-900/60 border-b border-zinc-800">
                    <tr>
                      {['#','User','Email','Role','Login Time','When'].map(h => (
                        <th key={h} className="text-left p-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredEvents.map((event, i) => (
                      <tr key={`${event.email}-${event.timestamp}-${i}`} className="hover:bg-zinc-900/40 transition-all">
                        <td className="p-4 text-zinc-500 font-mono text-sm">{i + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(event.name || event.email)} flex items-center justify-center text-white font-bold text-xs shadow shrink-0`}>{(event.name || event.email).charAt(0).toUpperCase()}</div>
                            <span className="text-white font-semibold whitespace-nowrap">{event.name || 'â€”'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-300 font-mono text-sm">{event.email}</td>
                        <td className="p-4">
                          {event.role === 'admin'
                            ? <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-500/30 inline-flex items-center gap-1"><Shield size={10} />Admin</span>
                            : <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-500/30">User</span>}
                        </td>
                        <td className="p-4 text-zinc-300 text-sm whitespace-nowrap">{formatDateTime(event.timestamp)}</td>
                        <td className="p-4 text-zinc-500 text-sm whitespace-nowrap">{formatRelative(event.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {historySearch && <div className="px-4 py-3 border-t border-zinc-800 text-zinc-500 text-sm">Showing {filteredEvents.length} of {events.length} events</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsersList;
