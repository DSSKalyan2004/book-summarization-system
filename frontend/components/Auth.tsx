import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Mail, Lock, User, LogIn, UserPlus,
  AlertCircle, Loader2, CheckCircle2, Shield, X,
  Zap, FileText, Globe, ShieldCheck, ArrowRight, Eye, EyeOff, Sparkles,
  Library, BookMarked, BookText
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
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes authSlideRight {
    from { opacity: 0; transform: translateX(-30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -40px) scale(1.05); }
    66% { transform: translate(-20px, 20px) scale(0.95); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-40px, 30px) scale(0.95); }
    66% { transform: translate(25px, -25px) scale(1.05); }
  }
  @keyframes orbFloat3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(20px, -30px) scale(1.08); }
  }
  @keyframes gridPulse {
    0%, 100% { opacity: 0.03; }
    50% { opacity: 0.06; }
  }
  @keyframes shimmerSlide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes strengthPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes formSwitch {
    0% { opacity: 0; transform: translateY(8px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shelfFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes bookGlow {
    0%, 100% { filter: drop-shadow(0 4px 12px rgba(99,102,241,0.2)); }
    50% { filter: drop-shadow(0 8px 24px rgba(99,102,241,0.4)); }
  }
  @keyframes pageFlutter {
    0%, 100% { transform: scaleX(1) skewY(0deg); }
    25% { transform: scaleX(0.96) skewY(-1deg); }
    75% { transform: scaleX(1.02) skewY(0.5deg); }
  }
  @keyframes rippleEffect {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
  }
  @keyframes particleFloat {
    0% { opacity: 0; transform: translateY(0) scale(0); }
    20% { opacity: 1; transform: translateY(-10px) scale(1); }
    100% { opacity: 0; transform: translateY(-60px) scale(0.3); }
  }
  .auth-animate { animation: authFadeIn 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  .auth-slide-right { animation: authSlideRight 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .auth-form-switch { animation: formSwitch 0.35s cubic-bezier(0.16,1,0.3,1) both; }
  .orb-1 { animation: orbFloat1 12s ease-in-out infinite; }
  .orb-2 { animation: orbFloat2 15s ease-in-out infinite; }
  .orb-3 { animation: orbFloat3 10s ease-in-out infinite; }
  .auth-input {
    width: 100%;
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    padding: 14px 16px 14px 44px;
    font-size: 14.5px;
    color: #0f172a;
    outline: none;
    font-weight: 500;
    box-sizing: border-box;
    transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
  }
  .auth-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99,102,241,0.1), 0 2px 12px rgba(99,102,241,0.08);
    background: #fefefe;
    transform: translateY(-1px);
  }
  .auth-input:hover:not(:focus) {
    border-color: #c7d2fe;
  }
  .auth-input::placeholder { color: #b4b4bd; }
  .auth-submit-btn {
    position: relative;
    overflow: hidden;
    width: 100%;
    padding: 14px 20px;
    border-radius: 12px;
    border: none;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    box-shadow: 0 4px 16px rgba(79,70,229,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .auth-submit-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.01);
    box-shadow: 0 12px 36px rgba(79,70,229,0.45), inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .auth-submit-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 2px 8px rgba(79,70,229,0.3);
  }
  .auth-submit-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .auth-submit-btn .shimmer-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    animation: shimmerSlide 2.5s ease infinite;
  }
  .auth-feature-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    cursor: default;
  }
  .auth-feature-card:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.14);
    transform: translateX(6px) scale(1.02);
    box-shadow: 0 8px 24px rgba(99,102,241,0.1);
  }
  .password-toggle {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    transition: color 0.15s, transform 0.2s;
  }
  .password-toggle:hover { color: #6366f1; transform: translateY(-50%) scale(1.15); }
  .auth-ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    pointer-events: none;
    animation: rippleEffect 0.6s ease-out forwards;
  }
  .auth-book-spine {
    position: relative;
    border-radius: 3px 6px 6px 3px;
    transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
    cursor: pointer;
    overflow: hidden;
  }
  .auth-book-spine::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 3px 0 0 3px;
  }
  .auth-book-spine::after {
    content: '';
    position: absolute;
    right: 0;
    top: 8%; bottom: 8%;
    width: 2px;
    background: repeating-linear-gradient(180deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 2px, transparent 2px, transparent 4px);
    opacity: 0.5;
  }
  .auth-book-spine:hover {
    transform: translateY(-14px) scale(1.08) !important;
    z-index: 10;
  }
  .auth-particle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    pointer-events: none;
    animation: particleFloat 3s ease-out infinite;
  }
`;

const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  if (!pw) return { score: 0, label: '', color: '#e5e7eb' };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (s <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (s <= 3) return { score: 3, label: 'Good', color: '#22c55e' };
  return { score: 4, label: 'Strong', color: '#059669' };
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [hoveredBook, setHoveredBook] = useState<number | null>(null);
  const pwStrength = getPasswordStrength(formData.password);

  // Ripple effect for buttons
  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    ripple.className = 'auth-ripple';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

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
    setFormKey(k => k + 1);
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
      <div style={{ minHeight: '100vh', display: 'flex', background: '#05050a', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

        {/* ─── LEFT PANEL ─── */}
        <div className="hidden lg:flex lg:w-[52%] flex-col" style={{
          background: 'linear-gradient(160deg, #08081a 0%, #0c0c24 40%, #10102e 100%)',
          padding: '48px 56px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Animated orbs */}
          <div className="orb-1" style={{ position: 'absolute', top: '15%', right: '15%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
          <div className="orb-2" style={{ position: 'absolute', bottom: '20%', left: '10%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
          <div className="orb-3" style={{ position: 'absolute', top: '50%', left: '50%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
          
          {/* Grid pattern */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none', animation: 'gridPulse 6s ease-in-out infinite' }} />
          
          {/* Gradient border on right edge */}
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '1px', background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.3) 30%, rgba(124,58,237,0.3) 50%, rgba(6,182,212,0.2) 70%, transparent 100%)' }} />

          {/* Logo */}
          <div className="auth-slide-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '72px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 20px rgba(79,70,229,0.4)' }}>
              <BookOpen size={19} color="#fff" strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
              BookSumm<span style={{ color: '#818cf8', marginLeft: '4px', fontWeight: 400 }}>AI</span>
            </span>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '440px' }}>
            <div className="auth-slide-right" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '99px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '24px' }}>
                <Sparkles size={12} color="#818cf8" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI-Powered Platform</span>
              </div>
            </div>
            
            <h2 className="auth-slide-right" style={{ animationDelay: '0.15s', fontSize: '42px', fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-0.03em' }}>
              Turn documents into<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>clear insights</span>
            </h2>

            <p className="auth-slide-right" style={{ animationDelay: '0.2s', fontSize: '15.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 32px' }}>
              Upload a PDF, paste text, or enter a URL — our BERT-powered engine extracts what matters in seconds.
            </p>

            {/* ── Interactive Bookshelf ── */}
            <div className="auth-slide-right" style={{ animationDelay: '0.25s', marginBottom: '32px' }}>
              <div style={{ position: 'relative', padding: '20px 0' }}>
                {/* Floating particles */}
                {[
                  { left: '10%', top: '20%', color: '#818cf8', delay: '0s', size: '4px' },
                  { left: '80%', top: '10%', color: '#c084fc', delay: '1s', size: '3px' },
                  { left: '50%', top: '30%', color: '#22d3ee', delay: '2s', size: '5px' },
                  { left: '30%', top: '5%', color: '#fbbf24', delay: '0.5s', size: '3px' },
                  { left: '70%', top: '25%', color: '#34d399', delay: '1.5s', size: '4px' },
                ].map((p, i) => (
                  <div key={i} className="auth-particle" style={{ left: p.left, top: p.top, background: p.color, animationDelay: p.delay, width: p.size, height: p.size }} />
                ))}

                {/* Book row - interactive bookshelf */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', paddingBottom: '12px' }}>
                  {[
                    { w: 38, h: 54, bg: 'linear-gradient(180deg, #6366f1, #4338ca)', glow: 'rgba(99,102,241,0.4)', icon: <BookOpen size={12} />, delay: '0s' },
                    { w: 32, h: 68, bg: 'linear-gradient(180deg, #ec4899, #be185d)', glow: 'rgba(236,72,153,0.4)', icon: <BookMarked size={11} />, delay: '0.6s' },
                    { w: 42, h: 80, bg: 'linear-gradient(180deg, #7c3aed, #5b21b6)', glow: 'rgba(124,58,237,0.5)', icon: <BookText size={14} />, delay: '0.3s' },
                    { w: 36, h: 60, bg: 'linear-gradient(180deg, #0891b2, #164e63)', glow: 'rgba(6,182,212,0.4)', icon: <FileText size={11} />, delay: '0.9s' },
                    { w: 44, h: 72, bg: 'linear-gradient(180deg, #f59e0b, #b45309)', glow: 'rgba(245,158,11,0.4)', icon: <Sparkles size={13} />, delay: '0.15s' },
                    { w: 30, h: 50, bg: 'linear-gradient(180deg, #10b981, #065f46)', glow: 'rgba(16,185,129,0.4)', icon: <Zap size={10} />, delay: '0.75s' },
                    { w: 40, h: 64, bg: 'linear-gradient(180deg, #f43f5e, #9f1239)', glow: 'rgba(244,63,94,0.4)', icon: <Globe size={12} />, delay: '0.45s' },
                  ].map((book, i) => (
                    <div key={i} className="auth-book-spine"
                      onMouseEnter={() => setHoveredBook(i)}
                      onMouseLeave={() => setHoveredBook(null)}
                      style={{
                        width: book.w + 'px',
                        height: book.h + 'px',
                        background: book.bg,
                        boxShadow: hoveredBook === i
                          ? `0 12px 32px rgba(0,0,0,0.4), 0 0 20px ${book.glow}`
                          : '2px 4px 12px rgba(0,0,0,0.3)',
                        animation: `shelfFloat 4s ease-in-out ${book.delay} infinite`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.6)',
                      }}>
                      {book.icon}
                    </div>
                  ))}
                </div>
                {/* Shelf */}
                <div style={{ height: '6px', background: 'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(124,58,237,0.5), rgba(6,182,212,0.3))', borderRadius: '3px', boxShadow: '0 4px 16px rgba(99,102,241,0.15)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '100%', left: '10%', right: '10%', height: '8px', background: 'linear-gradient(180deg, rgba(0,0,0,0.15), transparent)', borderRadius: '0 0 50% 50%' }} />
                </div>
              </div>
            </div>

            {/* Feature cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: <Zap size={18} />, label: 'BERT Transformer AI', desc: 'State-of-the-art NLP model', color: '#818cf8', delay: '0.3s' },
                { icon: <Sparkles size={18} />, label: 'Instant Summaries', desc: 'Results in under 10 seconds', color: '#34d399', delay: '0.35s' },
                { icon: <FileText size={18} />, label: 'Multi-format Support', desc: 'PDF, DOCX, TXT & URLs', color: '#fbbf24', delay: '0.4s' },
                { icon: <ShieldCheck size={18} />, label: 'Secure & Private', desc: 'Your data stays protected', color: '#60a5fa', delay: '0.45s' },
              ].map(({ icon, label, desc, color, delay }) => (
                <div key={label} className="auth-feature-card auth-slide-right" style={{ animationDelay: delay }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
                    {icon}
                  </div>
                  <div>
                    <span style={{ fontSize: '14px', color: '#fff', fontWeight: 600, display: 'block' }}>{label}</span>
                    <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="auth-slide-right" style={{ animationDelay: '0.45s', position: 'relative', zIndex: 1, paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '40px' }}>
            {[{ value: '10x', label: 'Faster Reading' }, { value: 'BERT', label: 'AI Engine' }, { value: '100%', label: 'Private & Secure' }].map(({ value, label }) => (
              <div key={label}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
                <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.3)', margin: '3px 0 0', fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT PANEL (FORM) ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', overflowY: 'auto', background: '#ffffff', position: 'relative' }}>
          {/* Subtle background pattern */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.03) 1px, transparent 0)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
          
          <div className="auth-animate" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

            {/* Mobile logo */}
            <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 28px rgba(79,70,229,0.35)' }}>
                <BookOpen size={24} color="white" strokeWidth={2.3} />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>BookSumm AI</h1>
            </div>

            {/* Back button */}
            {onBack && (
              <button onClick={onBack} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '4px 0', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.gap = '8px'; }}
                onMouseLeave={e => { e.currentTarget.style.gap = '6px'; }}>
                ← Back to home
              </button>
            )}

            {/* Heading */}
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p style={{ fontSize: '14.5px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                {isLogin ? 'Sign in to access your document library' : 'Start summarizing with AI in seconds'}
              </p>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#f4f4f5', borderRadius: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Sign In', icon: <LogIn size={14} />, active: isLogin },
                { label: 'Sign Up', icon: <UserPlus size={14} />, active: !isLogin },
              ].map(({ label, icon, active }, i) => (
                <button key={label} type="button"
                  onClick={() => !isLoading && (i === 0 ? (isLogin || toggleMode()) : (!isLogin || toggleMode()))}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '13.5px',
                    cursor: isLoading ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#0f172a' : '#a1a1aa',
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
                  }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Alerts */}
            {success && (
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #86efac', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#15803d', fontSize: '13.5px', fontWeight: 600, boxShadow: '0 2px 8px rgba(34,197,94,0.1)' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />{success}
              </div>
            )}
            {error && (
              <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fff1f2)', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#dc2626', fontSize: '13.5px', fontWeight: 600, boxShadow: '0 2px 8px rgba(220,38,38,0.08)' }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />{error}
              </div>
            )}

            {/* Form */}
            <form key={formKey} onSubmit={handleSubmit} className="auth-form-switch" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#374151', marginBottom: '7px', letterSpacing: '0.01em' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                      placeholder="John Doe" disabled={isLoading} className="auth-input" />
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#374151', marginBottom: '7px', letterSpacing: '0.01em' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                    placeholder="you@example.com" disabled={isLoading} className="auth-input" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#374151', marginBottom: '7px', letterSpacing: '0.01em' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange}
                    disabled={isLoading} autoComplete="new-password" className="auth-input" style={{ paddingRight: '44px' }} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {!isLogin && formData.password && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i <= pwStrength.score ? pwStrength.color : '#e5e7eb', transition: 'all 0.3s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: pwStrength.color }}>{pwStrength.label}</span>
                  </div>
                )}
              </div>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#374151', marginBottom: '7px', letterSpacing: '0.01em' }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                    <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                      disabled={isLoading} autoComplete="new-password" className="auth-input" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="auth-submit-btn" style={{ marginTop: '6px' }}
                onClick={createRipple}>
                {!isLoading && <div className="shimmer-overlay" />}
                {isLoading ? (<><Loader2 className="animate-spin" size={17} /><span>Processing...</span></>)
                  : isLogin ? (<><LogIn size={17} /><span>Sign In</span><ArrowRight size={15} /></>)
                  : (<><UserPlus size={17} /><span>Create Account</span><ArrowRight size={15} /></>)}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '13.5px', color: '#a1a1aa' }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button type="button" onClick={toggleMode} disabled={isLoading}
                style={{ fontSize: '13.5px', fontWeight: 700, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#4338ca'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4F46E5'; }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>

            <div style={{ marginTop: '14px' }}>
              <button type="button"
                onClick={() => { setShowAdminModal(true); setAdminError(null); setAdminEmail(''); setAdminPassword(''); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '11px', background: '#fafafa', border: '1.5px solid #e5e7eb', borderRadius: '12px', color: '#71717a', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#6366f1'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.color = '#71717a'; }}>
                <Shield size={13} />
                Administrator Access
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#d4d4d8', marginTop: '18px' }}>
              By continuing you agree to our Terms of Service & Privacy Policy
            </p>
          </div>
        </div>

        {/* ─── Admin Modal ─── */}
        {showAdminModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 9999 }}>
            <div className="auth-animate" style={{ background: '#fff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <button type="button" onClick={() => setShowAdminModal(false)}
                style={{ position: 'absolute', top: '18px', right: '18px', width: '32px', height: '32px', background: '#f4f4f5', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f4f4f5'; e.currentTarget.style.color = '#71717a'; }}>
                <X size={15} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #fef2f2, #ffe4e6)', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(220,38,38,0.1)' }}>
                  <Shield size={24} color="#dc2626" strokeWidth={2} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Admin Access</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>Enter administrator credentials</p>
              </div>

              {adminError && (
                <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fff1f2)', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', fontSize: '13.5px', fontWeight: 600, marginBottom: '18px' }}>
                  <AlertCircle size={17} style={{ flexShrink: 0 }} />{adminError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#374151', marginBottom: '7px' }}>Admin Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                    <input type="email" value={adminEmail} onChange={e => { setAdminEmail(e.target.value); setAdminError(null); }}
                      placeholder="admin@example.com" disabled={isLoading} autoFocus className="auth-input" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#374151', marginBottom: '7px' }}>Admin Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                    <input type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setAdminError(null); }}
                      disabled={isLoading} autoComplete="new-password" className="auth-input" />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  style={{ padding: '14px', background: isLoading ? '#fca5a5' : 'linear-gradient(135deg, #dc2626, #b91c1c)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(220,38,38,0.3)' }}
                  onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(220,38,38,0.4)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(220,38,38,0.3)'; }}>
                  {isLoading ? (<><Loader2 className="animate-spin" size={17} /><span>Authenticating...</span></>) : (<><Shield size={17} /><span>Login as Admin</span></>)}
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
