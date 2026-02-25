// FULL REWRITE - CLEAN VERSION
import React, { useState } from 'react';
import {
  BookOpen, Mail, Lock, User, LogIn, UserPlus, Sparkles,
  AlertCircle, Loader2, CheckCircle2, Shield, X
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { authApi } from '../services/api';

interface AuthProps {
  onLogin: (token: string, user: any) => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) { setError('Email and password are required'); return false; }
    if (!isLogin && !formData.name) { setError('Name is required'); return false; }
    if (!isLogin && formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters long'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Please enter a valid email address'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (isLogin) {
        const data = await authApi.login(formData.email, formData.password);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.token, data.user);
      } else {
        const data = await authApi.register(formData.name, formData.email, formData.password);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccess('Account created successfully! Logging you in...');
        setTimeout(() => onLogin(data.token, data.user), 500);
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred.';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        setError('🔌 Cannot connect to server. Please ensure the backend is running on port 5000.');
      } else if (msg.toLowerCase().includes('already exists')) {
        setError('⚠️ This email is already registered. Please log in instead.');
      } else if (msg.toLowerCase().includes('invalid email or password') || msg.toLowerCase().includes('invalid credentials')) {
        setError('❌ Invalid email or password.');
      } else if (msg.toLowerCase().includes('user not found')) {
        setError('❌ No account found with this email. Please sign up first.');
      } else {
        setError(`❌ ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null); setSuccess(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    if (!adminEmail || !adminPassword) { setAdminError('Please enter both email and password'); return; }
    setIsLoading(true);
    try {
      const data = await authApi.login(adminEmail, adminPassword);
      if (data.user.role !== 'admin') {
        setAdminError('This account does not have admin privileges');
        setIsLoading(false);
        return;
      }
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setShowAdminModal(false);
      onLogin(data.token, data.user);
    } catch (err: any) {
      setAdminError(err.message || 'Invalid admin credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
            <BookOpen size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{APP_NAME}</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Sparkles size={14} className="text-orange-400" strokeWidth={2.5} />
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">AI Document Intelligence</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="card-premium p-8 md:p-10 rounded-2xl space-y-6 shadow-2xl">
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <button type="button" onClick={() => !isLoading && setIsLogin(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${isLogin ? 'btn-primary text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
              <LogIn size={18} /><span>Log In</span>
            </button>
            <button type="button" onClick={() => !isLoading && setIsLogin(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${!isLogin ? 'btn-primary text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
              <UserPlus size={18} /><span>Sign Up</span>
            </button>
          </div>

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm font-medium">
              <CheckCircle2 size={20} className="flex-shrink-0" /><span>{success}</span>
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium">
              <AlertCircle size={20} className="flex-shrink-0" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-zinc-300 ml-1 block">Full Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><User size={20} /></div>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange}
                    placeholder="John Doe" disabled={isLoading}
                    className="w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white text-base placeholder:text-zinc-500 font-medium" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-zinc-300 ml-1 block">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><Mail size={20} /></div>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange}
                  placeholder="you@example.com" disabled={isLoading}
                  className="w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white text-base placeholder:text-zinc-500 font-medium" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-zinc-300 ml-1 block">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><Lock size={20} /></div>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange}
                  disabled={isLoading} autoComplete="new-password"
                  className="w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white text-base font-medium" />
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-zinc-300 ml-1 block">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><Lock size={20} /></div>
                  <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                    disabled={isLoading} autoComplete="new-password"
                    className="w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white text-base font-medium" />
                </div>
              </div>
            )}
            <button type="submit" disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-base mt-6">
              {isLoading ? (<><Loader2 className="animate-spin" size={20} /><span>Processing...</span></>)
                : isLogin ? (<><LogIn size={20} /><span>Log In to Your Account</span></>)
                : (<><UserPlus size={20} /><span>Create Your Account</span></>)}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-zinc-800">
            <p className="text-zinc-400 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={toggleMode} disabled={isLoading}
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors disabled:opacity-50">
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>

        {/* Admin Login Button */}
        <div className="mt-6">
          <button type="button"
            onClick={() => { setShowAdminModal(true); setAdminError(null); setAdminEmail(''); setAdminPassword(''); }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-base shadow-lg transition-all hover:scale-[1.02] border border-indigo-500/30">
            <Shield size={22} strokeWidth={2.5} />
            <span>Admin Login</span>
          </button>
        </div>
      </div>

      {/* Admin Modal - Pure inline styles to guarantee visibility */}
      {showAdminModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', border: '4px solid #6366f1', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '480px', position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
            {/* Close Button */}
            <button type="button" onClick={() => setShowAdminModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={22} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', background: 'linear-gradient(135deg, #6366f1, #9333ea)', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 10px 30px rgba(99,102,241,0.4)' }}>
                <Shield size={40} color="white" strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', margin: '0 0 8px 0' }}>Admin Access</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', fontWeight: 600, margin: 0 }}>Enter your administrator credentials</p>
            </div>

            {/* Admin Error */}
            {adminError && (
              <div style={{ backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#b91c1c', fontWeight: 700, fontSize: '14px', marginBottom: '24px' }}>
                <AlertCircle size={22} style={{ flexShrink: 0 }} />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin}>
              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="admin-email" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1f2937', marginBottom: '8px', marginLeft: '4px' }}>Admin Email</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}><Mail size={22} /></div>
                  <input type="email" id="admin-email" value={adminEmail}
                    onChange={e => { setAdminEmail(e.target.value); setAdminError(null); }}
                    placeholder="admin@example.com" disabled={isLoading} autoFocus
                    style={{ width: '100%', backgroundColor: '#f9fafb', border: '2px solid #d1d5db', borderRadius: '12px', padding: '14px 16px 14px 50px', fontSize: '16px', fontWeight: 500, color: '#111827', boxSizing: 'border-box', outline: 'none' }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                    onBlur={e => (e.target.style.borderColor = '#d1d5db')}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '28px' }}>
                <label htmlFor="admin-password" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1f2937', marginBottom: '8px', marginLeft: '4px' }}>Admin Password</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}><Lock size={22} /></div>
                  <input type="password" id="admin-password" value={adminPassword}
                    onChange={e => { setAdminPassword(e.target.value); setAdminError(null); }}
                    disabled={isLoading} autoComplete="new-password"
                    style={{ width: '100%', backgroundColor: '#f9fafb', border: '2px solid #d1d5db', borderRadius: '12px', padding: '14px 16px 14px 50px', fontSize: '16px', fontWeight: 500, color: '#111827', boxSizing: 'border-box', outline: 'none' }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                    onBlur={e => (e.target.style.borderColor = '#d1d5db')}
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #9333ea)', border: 'none', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '18px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(99,102,241,0.4)' }}>
                {isLoading ? (<><Loader2 className="animate-spin" size={22} /><span>Authenticating...</span></>)
                  : (<><Shield size={22} /><span>Login as Admin</span></>)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
