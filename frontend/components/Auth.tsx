import React, { useState } from 'react';
import {
  BookOpen, Mail, Lock, User, LogIn, UserPlus,
  AlertCircle, Loader2, CheckCircle2, Shield, X
} from 'lucide-react';
import { authApi } from '../services/api';

interface AuthProps {
  onLogin: (token: string, user: any) => void;
  onBack?: () => void;
}
interface FormData {
  name: string; email: string; password: string; confirmPassword: string;
}

const AUTH_CSS = `
  @keyframes authFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .auth-animate { animation: authFadeIn 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .auth-input {
    width: 100%;
    background: #fafafa;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px 16px 12px 42px;
    font-size: 14px;
    color: #0f172a;
    outline: none;
    font-weight: 500;
    box-sizing: border-box;
    transition: all 0.15s ease;
  }
  .auth-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .auth-input::placeholder { color: #a1a1aa; }
`;

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
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
    setError(null); setSuccess(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) { setError('Email and password are required'); return false; }
    if (!isLogin && !formData.name) { setError('Name is required'); return false; }
    if (!isLogin && formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return false; }
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
        setSuccess('Account created! Signing you in...');
        setTimeout(() => onLogin(data.token, data.user), 500);
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred.';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network'))
        setError('Cannot connect to server. Ensure the backend is running on port 5000.');
      else if (msg.toLowerCase().includes('already exists'))
        setError('This email is already registered. Please log in instead.');
      else if (msg.toLowerCase().includes('invalid email or password') || msg.toLowerCase().includes('invalid credentials'))
        setError('Invalid email or password. Please try again.');
      else if (msg.toLowerCase().includes('user not found'))
        setError('No account with this email. Please sign up first.');
      else setError(msg);
    } finally { setIsLoading(false); }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin); setError(null); setSuccess(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAdminError(null);
    if (!adminEmail || !adminPassword) { setAdminError('Please enter both email and password'); return; }
    setIsLoading(true);
    try {
      const data = await authApi.login(adminEmail, adminPassword);
      if (data.user.role !== 'admin') { setAdminError('This account does not have admin privileges'); setIsLoading(false); return; }
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setShowAdminModal(false);
      onLogin(data.token, data.user);
    } catch (err: any) {
      setAdminError(err.message || 'Invalid admin credentials.');
    } finally { setIsLoading(false); }
  };

  return (
    <>
      <style>{AUTH_CSS}</style>
      <div style={{ minHeight: '100vh', display: 'flex', background: '#09090b', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

        {/* ─── LEFT PANEL ─── */}
        <div className="hidden lg:flex lg:w-[50%] flex-col" style={{
          background: '#09090b',
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: '30%', left: '40%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(79,70,229,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '80px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={17} color="#fff" strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
              BookSumm<span style={{ color: '#818cf8', marginLeft: '4px', fontWeight: 400 }}>AI</span>
            </span>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.03em' }}>
              Turn documents into<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>clear insights</span>
            </h2>

            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, margin: '0 0 48px' }}>
              Upload a PDF, paste text, or enter a URL — our BERT-powered engine extracts what matters in seconds.
            </p>

            {/* Minimal feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'BERT Transformer AI', color: '#6366f1' },
                { label: 'Instant summaries in seconds', color: '#22c55e' },
                { label: 'PDF, DOCX, TXT & URLs', color: '#f59e0b' },
                { label: 'Secure & private', color: '#3b82f6' },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ position: 'relative', zIndex: 1, paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '32px' }}>
            {[{ value: '10x', label: 'Faster' }, { value: 'BERT', label: 'AI Model' }, { value: '100%', label: 'Private' }].map(({ value, label }) => (
              <div key={label}>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>{value}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT PANEL (FORM) ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto', background: '#ffffff' }}>
          <div className="auth-animate" style={{ width: '100%', maxWidth: '400px' }}>

            {/* Mobile logo */}
            <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <BookOpen size={21} color="white" strokeWidth={2.3} />
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>BookSumm AI</h1>
            </div>

            {/* Back button (when navigated from landing) */}
            {onBack && (
              <button onClick={onBack} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                ← Back to home
              </button>
            )}

            {/* Heading */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>
                {isLogin ? 'Sign in to access your document library' : 'Start summarizing with AI in seconds'}
              </p>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '4px', padding: '3px', background: '#f4f4f5', borderRadius: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Sign In', icon: <LogIn size={14} />, active: isLogin },
                { label: 'Sign Up', icon: <UserPlus size={14} />, active: !isLogin },
              ].map(({ label, icon, active }, i) => (
                <button key={label} type="button"
                  onClick={() => !isLoading && (i === 0 ? setIsLogin(true) : setIsLogin(false))}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '9px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                    cursor: isLoading ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.15s',
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#0f172a' : '#a1a1aa',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Alerts */}
            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#15803d', fontSize: '13px', fontWeight: 600 }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />{success}
              </div>
            )}
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />{error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '6px' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                      placeholder="John Doe" disabled={isLoading} className="auth-input" />
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '6px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                    placeholder="you@example.com" disabled={isLoading} className="auth-input" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange}
                    disabled={isLoading} autoComplete="new-password" className="auth-input" />
                </div>
              </div>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '6px' }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                      disabled={isLoading} autoComplete="new-password" className="auth-input" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={isLoading}
                style={{
                  marginTop: '4px', width: '100%', padding: '12px 20px', borderRadius: '10px', border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  background: isLoading ? '#a5b4fc' : '#4F46E5',
                  color: '#fff', fontSize: '14px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#4338ca'; }}
                onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#4F46E5'; }}>
                {isLoading ? (<><Loader2 className="animate-spin" size={16} /><span>Processing...</span></>)
                  : isLogin ? (<><LogIn size={16} /><span>Sign In</span></>)
                  : (<><UserPlus size={16} /><span>Create Account</span></>)}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f4f4f5' }}>
              <span style={{ fontSize: '13px', color: '#a1a1aa' }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button type="button" onClick={toggleMode} disabled={isLoading}
                style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>

            <div style={{ marginTop: '12px' }}>
              <button type="button"
                onClick={() => { setShowAdminModal(true); setAdminError(null); setAdminEmail(''); setAdminPassword(''); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: '10px', color: '#71717a', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4d4d8'; e.currentTarget.style.background = '#f4f4f5'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; }}>
                <Shield size={13} />
                Administrator Access
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#d4d4d8', marginTop: '16px' }}>
              By continuing you agree to our Terms of Service & Privacy Policy
            </p>
          </div>
        </div>

        {/* ─── Admin Modal ─── */}
        {showAdminModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '400px', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
              <button type="button" onClick={() => setShowAdminModal(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px', background: '#f4f4f5', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a' }}>
                <X size={14} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Shield size={22} color="#dc2626" strokeWidth={2} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Admin Access</h2>
                <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>Enter administrator credentials</p>
              </div>

              {adminError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />{adminError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '6px' }}>Admin Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                    <input type="email" value={adminEmail} onChange={e => { setAdminEmail(e.target.value); setAdminError(null); }}
                      placeholder="admin@example.com" disabled={isLoading} autoFocus className="auth-input" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '6px' }}>Admin Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                    <input type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setAdminError(null); }}
                      disabled={isLoading} autoComplete="new-password" className="auth-input" />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  style={{ padding: '12px', background: isLoading ? '#fca5a5' : '#dc2626', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#b91c1c'; }}
                  onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#dc2626'; }}>
                  {isLoading ? (<><Loader2 className="animate-spin" size={16} /><span>Authenticating...</span></>) : (<><Shield size={16} /><span>Login as Admin</span></>)}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Auth;
