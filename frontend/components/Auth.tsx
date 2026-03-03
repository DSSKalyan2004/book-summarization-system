import React, { useState } from 'react';
import {
  BookOpen, Mail, Lock, User, LogIn, UserPlus,
  AlertCircle, Loader2, CheckCircle2, Shield, X, Cpu, Zap, Brain, Database
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { authApi } from '../services/api';

interface AuthProps {
  onLogin: (token: string, user: any) => void;
}
interface FormData {
  name: string; email: string; password: string; confirmPassword: string;
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

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#ffffff',
    border: '1.5px solid #E5E7EB', borderRadius: '10px',
    padding: '12px 16px 12px 44px', fontSize: '15px', color: '#0B3C5D',
    outline: 'none', fontWeight: 500, boxSizing: 'border-box',
    transition: 'all 0.18s ease', boxShadow: '0 1px 4px rgba(11,60,93,0.06)',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F3F4F6' }}>

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] flex-col" style={{
        background: '#0a1628',
        padding: '56px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle geometric accent */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '320px', height: '320px', background: 'radial-gradient(ellipse at top right, rgba(29,78,216,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '260px', height: '260px', background: 'radial-gradient(ellipse at bottom left, rgba(11,60,93,0.35) 0%, transparent 65%)', pointerEvents: 'none' }} />
        {/* Thin vertical accent line */}
        <div style={{ position: 'absolute', top: '15%', right: '60px', width: '1px', height: '70%', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '72px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(29,78,216,0.3)', border: '1px solid rgba(29,78,216,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} color="#93c5fd" strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>{APP_NAME}</h1>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Document Intelligence</p>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Status pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(29,78,216,0.3)', marginBottom: '32px', width: 'fit-content' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} className="animate-pulse" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AI Engine Active</span>
          </div>

          {/* Headline */}
          <h2 style={{ fontSize: '44px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, margin: '0 0 16px 0', letterSpacing: '-0.03em', maxWidth: '420px' }}>
            Turn any document into{' '}
            <span style={{ color: '#93c5fd' }}>clear insights</span>
          </h2>

          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 52px 0', maxWidth: '360px', fontWeight: 400 }}>
            Upload a PDF, paste text, or drop a URL — our BERT-powered engine extracts what matters in seconds.
          </p>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { icon: Brain,    label: 'BERT Transformer',  desc: 'State-of-the-art extractive NLP',        accent: '#3b82f6' },
              { icon: Zap,      label: 'Instant Results',   desc: 'Summaries & bullets in seconds',         accent: '#a78bfa' },
              { icon: Database, label: 'Saved History',     desc: 'Every summary stored to your account',   accent: '#34d399' },
              { icon: Cpu,      label: 'Multi-Format',      desc: 'PDF, DOCX, TXT and web URLs',            accent: '#f59e0b' },
            ].map(({ icon: Icon, label, desc, accent }) => (
              <div key={label} style={{
                padding: '18px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Top accent line */}
                <div style={{ position: 'absolute', top: 0, left: '16px', right: '16px', height: '2px', borderRadius: '0 0 4px 4px', background: accent, opacity: 0.7 }} />
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  background: `${accent}18`,
                  border: `1px solid ${accent}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <Icon size={16} color={accent} strokeWidth={1.8} />
                </div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>{label}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ position: 'relative', zIndex: 1, paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '32px' }}>
          {[
            { value: '10x', label: 'Faster Reading' },
            { value: 'BERT', label: 'AI Model' },
            { value: '100%', label: 'Private' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: '2px', fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto', background: '#ffffff' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #0B3C5D, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(11,60,93,0.3)' }}>
              <BookOpen size={26} color="white" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B3C5D', margin: 0 }}>{APP_NAME}</h1>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0B3C5D', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ fontSize: '14px', color: '#78716c', margin: 0, fontWeight: 500 }}>
              {isLogin ? 'Sign in to access your document library' : 'Join to start summarizing documents with AI'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '6px', padding: '5px', background: '#F3F4F6', borderRadius: '12px', border: '1.5px solid #E5E7EB', marginBottom: '24px' }}>
            {[
              { label: 'Sign In', icon: <LogIn size={15} />, active: isLogin },
              { label: 'Sign Up', icon: <UserPlus size={15} />, active: !isLogin },
            ].map(({ label, icon, active }, i) => (
              <button key={label} type="button"
                onClick={() => !isLoading && (i === 0 ? setIsLogin(true) : setIsLogin(false))}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.18s',
                  background: active ? 'linear-gradient(135deg, #0B3C5D, #1D4ED8)' : 'transparent',
                  color: active ? '#fff' : '#9CA3AF',
                  boxShadow: active ? '0 2px 10px rgba(11,60,93,0.3)' : 'none',
                }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {success && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />{success}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.28)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B3C5D', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                    placeholder="John Doe" disabled={isLoading} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#1D4ED8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = '0 1px 4px rgba(11,60,93,0.06)'; }} />
                </div>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B3C5D', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                  placeholder="you@example.com" disabled={isLoading} style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#1D4ED8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = '0 1px 4px rgba(11,60,93,0.06)'; }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B3C5D', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input type="password" name="password" value={formData.password} onChange={handleInputChange}
                  disabled={isLoading} autoComplete="new-password" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#1D4ED8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = '0 1px 4px rgba(11,60,93,0.06)'; }} />
              </div>
            </div>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B3C5D', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                    disabled={isLoading} autoComplete="new-password" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#1D4ED8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = '0 1px 4px rgba(11,60,93,0.06)'; }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              style={{ marginTop: '8px', width: '100%', padding: '13px 20px', borderRadius: '10px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: isLoading ? 'rgba(11,60,93,0.4)' : 'linear-gradient(135deg, #0B3C5D, #1D4ED8)', color: '#fff', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: isLoading ? 'none' : '0 4px 16px rgba(11,60,93,0.3)', transition: 'all 0.18s' }}>
              {isLoading ? (<><Loader2 className="animate-spin" size={18} /><span>Processing...</span></>)
                : isLogin ? (<><LogIn size={18} /><span>Sign In</span></>)
                : (<><UserPlus size={18} /><span>Create Account</span></>)}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '14px', color: '#a8a29e' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button type="button" onClick={toggleMode} disabled={isLoading}
              style={{ fontSize: '14px', fontWeight: 700, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="button"
              onClick={() => { setShowAdminModal(true); setAdminError(null); setAdminEmail(''); setAdminPassword(''); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 20px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#dc2626', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.13)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.42)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.07)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)'; }}>
              <Shield size={16} color="#dc2626" />
              Administrator Access
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#a8a29e', marginTop: '20px' }}>
            By continuing you agree to our Terms of Service & Privacy Policy
          </p>
        </div>
      </div>

      {/* Admin Modal */}
      {showAdminModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,23,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', border: '1.5px solid #E5E7EB', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '440px', position: 'relative', boxShadow: '0 25px 60px rgba(11,60,93,0.15), 0 4px 16px rgba(0,0,0,0.1)' }}>

            <button type="button" onClick={() => setShowAdminModal(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', width: '32px', height: '32px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(239,68,68,0.35)' }}>
                <Shield size={28} color="white" strokeWidth={2} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0B3C5D', margin: '0 0 6px 0' }}>Administrator Access</h2>
              <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>Enter your administrator credentials to continue</p>
            </div>

            {adminError && (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.28)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />{adminError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B3C5D', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Admin Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input type="email" value={adminEmail} onChange={e => { setAdminEmail(e.target.value); setAdminError(null); }}
                    placeholder="admin@example.com" disabled={isLoading} autoFocus
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                    onFocus={e => { e.target.style.borderColor = '#1D4ED8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = '0 1px 4px rgba(11,60,93,0.06)'; }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0B3C5D', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Admin Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setAdminError(null); }}
                    disabled={isLoading} autoComplete="new-password"
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                    onFocus={e => { e.target.style.borderColor = '#1D4ED8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = '0 1px 4px rgba(11,60,93,0.06)'; }} />
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                style={{ padding: '13px', background: isLoading ? 'rgba(239,68,68,0.4)' : 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(239,68,68,0.32)', marginTop: '4px' }}>
                {isLoading ? (<><Loader2 className="animate-spin" size={18} /><span>Authenticating...</span></>) : (<><Shield size={18} /><span>Login as Admin</span></>)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
