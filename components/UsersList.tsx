import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { Users, Shield, Calendar, Mail, Loader2, AlertCircle, Copy, CheckCircle2, UserPlus } from 'lucide-react';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.getAllUsers();
      setUsers(response.users);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const copyAllEmails = () => {
    const allEmails = users.map(user => user.email).join(', ');
    navigator.clipboard.writeText(allEmails);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="p-6 rounded-xl border border-zinc-800 bg-gradient-to-r from-orange-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <UserPlus className="text-orange-500" size={28} />
            <h2 className="text-2xl font-bold text-white">Registered Users</h2>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-orange-500 mx-auto" size={48} />
            <p className="text-zinc-400 text-lg">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="p-6 rounded-xl border border-zinc-800 bg-gradient-to-r from-orange-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <UserPlus className="text-orange-500" size={28} />
            <h2 className="text-2xl font-bold text-white">Registered Users</h2>
          </div>
        </header>
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl flex items-center gap-4">
          <AlertCircle className="text-red-400" size={24} />
          <div>
            <p className="text-red-400 font-semibold">Error Loading Users</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
          <button 
            onClick={loadUsers}
            className="ml-auto btn-primary px-6 py-2 rounded-lg text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="p-6 rounded-xl border border-zinc-800 bg-gradient-to-r from-orange-500/10 to-purple-500/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-3 rounded-lg border border-orange-500/30">
              <UserPlus className="text-orange-500" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Registered Users</h2>
              <p className="text-zinc-400 text-sm">Admin Panel - All Registrations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyAllEmails}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20"
            >
              {emailCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span>{emailCopied ? 'Copied!' : 'Copy All Emails'}</span>
            </button>
            <div className="bg-zinc-900 border border-zinc-700 px-5 py-2.5 rounded-lg">
              <p className="text-orange-500 font-bold text-xl">{users.length}</p>
              <p className="text-zinc-400 text-xs">Total</p>
            </div>
          </div>
        </div>
      </header>

      {users.length === 0 ? (
        <div className="card-premium p-16 rounded-xl text-center border border-zinc-800">
          <Users className="text-zinc-600 mx-auto mb-4" size={64} />
          <p className="text-zinc-400 text-lg">No users registered yet</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="card-premium rounded-xl border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900/50 border-b border-zinc-800">
                  <tr>
                    <th className="text-left p-4 text-zinc-400 font-semibold text-sm">#</th>
                    <th className="text-left p-4 text-zinc-400 font-semibold text-sm">Name</th>
                    <th className="text-left p-4 text-zinc-400 font-semibold text-sm">Email</th>
                    <th className="text-left p-4 text-zinc-400 font-semibold text-sm">Role</th>
                    <th className="text-left p-4 text-zinc-400 font-semibold text-sm">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.map((user, index) => (
                    <tr key={user._id} className="hover:bg-zinc-900/30 transition-all">
                      <td className="p-4">
                        <span className="text-zinc-500 font-mono text-sm">{index + 1}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-semibold">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="text-zinc-500" size={16} />
                          <span className="text-zinc-300">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {user.role === 'admin' ? (
                          <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-500/30 inline-flex items-center gap-1">
                            <Shield size={12} />
                            Admin
                          </span>
                        ) : (
                          <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-500/30">
                            User
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <Calendar size={16} className="text-zinc-500" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-xs font-semibold uppercase tracking-wider mb-1">Admins</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className="text-orange-500/50" size={32} />
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Regular Users</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {users.filter(u => u.role === 'user').length}
                  </p>
                </div>
                <Users className="text-blue-500/50" size={32} />
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-400">
                    {users.filter(u => u.isActive).length}
                  </p>
                </div>
                <CheckCircle2 className="text-green-500/50" size={32} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersList;
