import React, { useState, useEffect } from 'react';
import {
  BookOpen, Zap, Brain, FileText, ArrowRight,
  Shield, Globe, Clock, Menu, X, Sparkles
} from 'lucide-react';

const CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes hero-book-levitate {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .anim-1 { animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
  .anim-2 { animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
  .anim-3 { animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
  .anim-4 { animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both; }
  .anim-5 { animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.65s both; }
  .grad-text {
    background: linear-gradient(135deg, #818cf8, #c084fc, #67e8f9);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s ease infinite;
  }
  .landing-card {
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .landing-card:hover {
    transform: translateY(-6px);
    border-color: rgba(99,102,241,0.4) !important;
    box-shadow: 0 20px 48px rgba(99,102,241,0.15) !important;
  }
  .cta-btn {
    transition: all 0.25s ease;
  }
  .cta-btn:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 16px 48px rgba(79,70,229,0.5) !important;
  }
  .nav-link { transition: color 0.2s ease; cursor: pointer; }
  .nav-link:hover { color: #a78bfa !important; }
  .hero-book {
    border-radius: 4px 10px 10px 4px;
    position: relative;
    overflow: hidden;
    cursor: default;
    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease;
  }
  .hero-book::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 5px;
    background: rgba(255,255,255,0.2);
    border-radius: 4px 0 0 4px;
  }
  .hero-book::after {
    content: '';
    position: absolute;
    right: -1px;
    top: 8%; bottom: 8%;
    width: 3px;
    background: repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1.5px, transparent 1.5px, transparent 3.5px);
    opacity: 0.5;
  }
  .hero-book:hover {
    transform: perspective(600px) rotateY(-8deg) translateY(-8px) scale(1.05);
    box-shadow: 8px 12px 32px rgba(0,0,0,0.35), 0 0 40px var(--book-glow);
  }
`;

const features = [
  { icon: Brain,  title: 'BERT Transformer AI',  desc: 'Deep semantic understanding using state-of-the-art extractive NLP that truly comprehends context.', color: '#6366f1' },
  { icon: Zap,    title: 'Instant Summaries',     desc: 'Get accurate summaries in under 5 seconds. No waiting, just instant AI-powered insights.',           color: '#f59e0b' },
  { icon: Globe,  title: 'Any Format',            desc: 'PDF, DOCX, TXT files and web URLs. One unified platform for all your documents.',                    color: '#10b981' },
  { icon: Shield, title: 'Fully Secure',          desc: 'End-to-end privacy. Data encrypted in transit and never shared with third parties.',                 color: '#3b82f6' },
  { icon: FileText, title: 'Smart History',       desc: 'Every summary auto-saved to your personal library. Revisit and share insights anytime.',             color: '#ec4899' },
  { icon: Clock,  title: 'Save 10x Time',         desc: 'Understand the key points of a 300-page book in 2 minutes flat.',                                    color: '#8b5cf6' },
];

const steps = [
  { num: '01', title: 'Upload Content',  desc: 'Drop a PDF, DOCX, TXT file — or paste text or enter a webpage URL.', color: '#6366f1' },
  { num: '02', title: 'AI Analyzes',     desc: 'Our BERT transformer reads the entire document, extracting meaning and key relationships.', color: '#8b5cf6' },
  { num: '03', title: 'Get Insights',    desc: 'Receive a concise summary, bullet points, concept table, and flow diagram — instantly.', color: '#22d3ee' },
];

interface LandingProps { onGetStarted: () => void; }

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div style={{ background: '#09090b', color: '#f1f5f9', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflowX: 'hidden', lineHeight: 1.6 }}>

        {/* ─── NAVBAR ─── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          height: '64px', padding: '0 max(20px, calc((100vw - 1100px) / 2))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: scrolled ? 'rgba(9,9,11,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(1.4)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={17} color="#fff" strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
              BookSumm<span style={{ color: '#818cf8', marginLeft: '4px', fontWeight: 400 }}>AI</span>
            </span>
          </div>

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '28px' }}>
            {['Features', 'How It Works'].map(l => (
              <span key={l} className="nav-link" style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}
                onClick={() => {
                  const id = l.toLowerCase().replace(/\s+/g, '-');
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >{l}</span>
            ))}
            <a href="https://book-summarization-system-1.onrender.com/" target="_blank" rel="noopener noreferrer"
              className="nav-link" style={{ fontSize: '13.5px', fontWeight: 600, color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
              <Globe size={14} /> Live Demo
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={onGetStarted}
              style={{ padding: '8px 20px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
              Sign In
            </button>
            <button onClick={onGetStarted}
              style={{ padding: '8px 20px', borderRadius: '9px', border: 'none', background: '#4F46E5', color: '#fff', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; }}>
              Get Started
            </button>
            <button className="md:hidden" onClick={() => setMobileOpen(o => !o)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex', marginLeft: '4px' }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 999, background: 'rgba(9,9,11,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px 24px' }}>
            {['Features', 'How It Works'].map(l => (
              <div key={l} onClick={() => { setMobileOpen(false); document.getElementById(l.toLowerCase().replace(/\s+/g, '-'))?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ padding: '14px 0', fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>{l}</div>
            ))}
            <button onClick={onGetStarted} style={{ marginTop: '16px', width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: '#4F46E5', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Get Started</button>
          </div>
        )}

        {/* ─── HERO ─── */}
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 80px', overflow: 'hidden' }}>
          {/* Subtle background glow */}
          <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '500px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(79,70,229,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 3, maxWidth: '720px' }}>
            {/* Badge */}
            <div className="anim-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '32px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#818cf8', letterSpacing: '0.05em' }}>BERT-Powered AI Engine</span>
            </div>

            {/* Heading */}
            <h1 className="anim-2" style={{ fontSize: 'clamp(36px, 7vw, 72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', margin: '0 0 24px', color: '#fff' }}>
              Summarize any book<br />
              <span className="grad-text">in seconds</span>
            </h1>

            {/* Subtext */}
            <p className="anim-3" style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: '560px', margin: '0 auto 40px', fontWeight: 400 }}>
              Transform lengthy books, research papers, and documents into clear, concise summaries with key insights extracted by BERT AI.
            </p>

            {/* CTA buttons */}
            <div className="anim-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={onGetStarted} className="cta-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px 36px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #4F46E5, #6366f1)', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}>
                Get Started Free <ArrowRight size={18} strokeWidth={2.2} />
              </button>
              <a href="https://book-summarization-system-1.onrender.com/" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 28px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = '#c7d2fe'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#a5b4fc'; }}>
                <Globe size={17} strokeWidth={2} /> Live Demo
              </a>
            </div>

            {/* 3 Premium Book Showcase */}
            <div className="anim-5" style={{ display: 'flex', alignItems: 'end', justifyContent: 'center', gap: '16px', marginTop: '52px' }}>
              {[
                { w: 64, h: 88, bg: 'linear-gradient(135deg, #6366f1, #4F46E5)', glow: 'rgba(99,102,241,0.4)', rotate: '-6deg', delay: '0s', icon: <Brain size={18} color="rgba(255,255,255,0.8)" strokeWidth={1.6} />, levDelay: '0s' },
                { w: 72, h: 100, bg: 'linear-gradient(135deg, #7c3aed, #c084fc)', glow: 'rgba(124,58,237,0.4)', rotate: '0deg', delay: '0.25s', icon: <BookOpen size={20} color="rgba(255,255,255,0.8)" strokeWidth={1.6} />, levDelay: '0.5s' },
                { w: 64, h: 88, bg: 'linear-gradient(135deg, #0891b2, #67e8f9)', glow: 'rgba(6,182,212,0.4)', rotate: '6deg', delay: '0.5s', icon: <Sparkles size={18} color="rgba(255,255,255,0.8)" strokeWidth={1.6} />, levDelay: '1s' },
              ].map((book, i) => (
                <div key={i} className="hero-book"
                  style={{
                    width: book.w, height: book.h,
                    background: book.bg,
                    boxShadow: `4px 6px 20px rgba(0,0,0,0.35), 0 0 0 rgba(0,0,0,0)`,
                    transform: `rotate(${book.rotate})`,
                    animation: `fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) ${book.delay} both, hero-book-levitate 4s ease-in-out ${book.levDelay} infinite`,
                    ['--book-glow' as any]: book.glow,
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {book.icon}
                    <div style={{ width: '50%', height: '2px', background: 'rgba(255,255,255,0.25)', borderRadius: '1px' }} />
                    <div style={{ width: '35%', height: '1.5px', background: 'rgba(255,255,255,0.15)', borderRadius: '1px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Trust row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '36px', flexWrap: 'wrap' }}>
              {[
                { val: '10x', label: 'Faster Reading' },
                { val: 'BERT', label: 'AI Engine' },
                { val: '100%', label: 'Private & Secure' },
              ].map(({ val, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#818cf8' }}>{val}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── STATS BAR ─── */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
            {[
              { val: '90,000', label: 'Words in avg. book', color: '#f59e0b' },
              { val: '~6 hours', label: 'Manual reading time', color: '#ef4444' },
              { val: '<2 min', label: 'AI summary time', color: '#22c55e' },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ padding: '20px 16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color, letterSpacing: '-0.03em', marginBottom: '4px' }}>{val}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="features" style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Capabilities</p>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Everything you need to understand faster
              </h2>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '460px', margin: '0 auto', lineHeight: 1.7 }}>
                Powerful AI capabilities in a simple, intuitive interface.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {features.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="landing-card" style={{ padding: '28px 24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Icon size={22} color={color} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>{title}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section id="how-it-works" style={{ padding: '100px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Process</p>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Three simple steps
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', margin: '0 auto 56px', maxWidth: '400px', lineHeight: 1.7 }}>
              From upload to insights in under 10 seconds.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {steps.map(({ num, title, desc, color }) => (
                <div key={num} className="landing-card" style={{ padding: '36px 28px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color }}>{num}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>{title}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section style={{ padding: '100px 24px 120px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(79,70,229,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '520px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.035em', lineHeight: 1.1 }}>
              Ready to read smarter?
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', margin: '0 0 40px', lineHeight: 1.7 }}>
              Create a free account and start summarizing any document in seconds.
            </p>
            <button onClick={onGetStarted} className="cta-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 44px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #4F46E5, #6366f1)', color: '#fff', fontSize: '17px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}>
              Get Started Free <ArrowRight size={19} strokeWidth={2.2} />
            </button>
            <p style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.22)' }}>
              No credit card required
            </p>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px max(24px, calc((100vw - 1100px) / 2))', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={13} color="#fff" strokeWidth={2.3} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>BookSumm AI</span>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
            {'\u00A9'} {new Date().getFullYear()} Intelligent Book Summarization Platform
          </p>
        </footer>
      </div>
    </>
  );
};

export default Landing;
