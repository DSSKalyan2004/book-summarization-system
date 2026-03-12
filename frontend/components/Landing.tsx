import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Zap, Brain, FileText, ArrowRight,
  Shield, Globe, Menu, X, Sparkles,
  Lock, Cpu, Check
} from 'lucide-react';

/* ───────── STAR PARTICLES BACKGROUND ───────── */
const StarParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; r: number; a: number; speed: number }[] = [];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 160; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.3 + 0.05,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.fill();
        s.y -= s.speed;
        if (s.y < -5) { s.y = canvas.height + 5; s.x = Math.random() * canvas.width; }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

/* ───────── BOOK COVER IMAGES ───────── */
const BOOK_IMAGES = {
  library: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80',
  bookStack: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
  openBook: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
  bookShelf: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80',
  readingBook: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&q=80',
  booksTop: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80',
  darkLibrary: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
  aiChip: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80',
  security: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&q=80',
  document: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80',
};

/* ───────── 3D HERO ILLUSTRATION ───────── */
const HeroIllustration: React.FC = () => (
  <div style={{ position: 'relative', width: '100%', maxWidth: 520, height: 480, margin: '0 auto' }}>
    {/* Outer neon ring */}
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', top: '50%', left: '50%', width: 380, height: 380, marginTop: -190, marginLeft: -190, borderRadius: '50%', border: '1.5px solid rgba(124,92,255,0.25)', boxShadow: '0 0 60px rgba(124,92,255,0.12)' }} />
    {/* Inner neon ring */}
    <motion.div animate={{ rotate: -360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', top: '50%', left: '50%', width: 280, height: 280, marginTop: -140, marginLeft: -140, borderRadius: '50%', border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 0 40px rgba(34,211,238,0.08)' }} />

    {/* Center — Main library image in tablet frame */}
    <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', top: '50%', left: '50%', width: 200, height: 260, marginTop: -130, marginLeft: -100, borderRadius: 16, border: '2px solid rgba(124,92,255,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,92,255,0.15)', overflow: 'hidden', zIndex: 5 }}>
      <img src={BOOK_IMAGES.library} alt="Library" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(124,92,255,0.15) 0%, rgba(7,7,20,0.4) 100%)' }} />
    </motion.div>

    {/* Floating book 1 (left) — Real book cover */}
    <motion.div animate={{ y: [0, -16, 0], rotate: [-6, -3, -6] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', top: '22%', left: '5%', width: 80, height: 110, borderRadius: '4px 10px 10px 4px', overflow: 'hidden', boxShadow: '6px 10px 30px rgba(124,92,255,0.4), 0 0 20px rgba(124,92,255,0.15)', zIndex: 4 }}>
      <img src={BOOK_IMAGES.bookStack} alt="Book" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,92,255,0.2), transparent)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'rgba(124,92,255,0.5)', borderRadius: '4px 0 0 4px' }} />
    </motion.div>

    {/* Floating book 2 (right) — Real book cover */}
    <motion.div animate={{ y: [0, -20, 0], rotate: [8, 5, 8] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      style={{ position: 'absolute', top: '15%', right: '6%', width: 75, height: 100, borderRadius: '4px 10px 10px 4px', overflow: 'hidden', boxShadow: '6px 10px 30px rgba(34,211,238,0.35), 0 0 20px rgba(34,211,238,0.12)', zIndex: 4 }}>
      <img src={BOOK_IMAGES.openBook} alt="Open book" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(34,211,238,0.2), transparent)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'rgba(34,211,238,0.5)', borderRadius: '4px 0 0 4px' }} />
    </motion.div>

    {/* Floating book 3 (bottom-left) — Real book cover */}
    <motion.div animate={{ y: [0, -14, 0], rotate: [-4, -1, -4] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      style={{ position: 'absolute', bottom: '10%', left: '12%', width: 68, height: 92, borderRadius: '4px 10px 10px 4px', overflow: 'hidden', boxShadow: '6px 10px 25px rgba(236,72,153,0.3)', zIndex: 4 }}>
      <img src={BOOK_IMAGES.readingBook} alt="Reading" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(236,72,153,0.2), transparent)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'rgba(236,72,153,0.5)', borderRadius: '4px 0 0 4px' }} />
    </motion.div>

    {/* Floating book 4 (bottom-right) — Extra book */}
    <motion.div animate={{ y: [0, -10, 0], rotate: [3, 6, 3] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      style={{ position: 'absolute', bottom: '18%', right: '8%', width: 60, height: 82, borderRadius: '4px 8px 8px 4px', overflow: 'hidden', boxShadow: '4px 8px 22px rgba(139,92,246,0.3)', zIndex: 4 }}>
      <img src={BOOK_IMAGES.booksTop} alt="Books" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(139,92,246,0.25), transparent)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'rgba(139,92,246,0.5)', borderRadius: '4px 0 0 4px' }} />
    </motion.div>

    {/* Floating bookshelf card with image */}
    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
      style={{ position: 'absolute', top: '6%', left: '30%', width: 110, height: 65, borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
      <img src={BOOK_IMAGES.bookShelf} alt="Shelf" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(7,7,20,0.5))' }} />
      <div style={{ position: 'absolute', bottom: 6, left: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Sparkles size={10} color="#7C5CFF" />
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>AI Summary</span>
      </div>
    </motion.div>

    {/* Summary stats floating card */}
    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      style={{ position: 'absolute', bottom: '5%', left: '40%', width: 120, height: 60, borderRadius: 10, background: 'rgba(7,7,20,0.85)', border: '1px solid rgba(124,92,255,0.2)', backdropFilter: 'blur(12px)', padding: '10px 12px', zIndex: 6, boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <Zap size={12} color="#7C5CFF" />
        <span style={{ fontSize: 9, color: '#8B5CF6', fontWeight: 700 }}>SUMMARY READY</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
          <img src={BOOK_IMAGES.openBook} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ width: 50, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)', marginBottom: 3 }} />
          <div style={{ width: 35, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }} />
        </div>
      </div>
    </motion.div>

    {/* Glow behind center */}
    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 300, height: 300, marginTop: -150, marginLeft: -150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.18) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 1 }} />
  </div>
);

/* ───────── AI CHIP ILLUSTRATION (Card 1) ───────── */
const AiChipIllustration: React.FC = () => (
  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
    <div style={{ position: 'relative', width: 160, height: 100, borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(124,92,255,0.3)', boxShadow: '0 0 40px rgba(124,92,255,0.2), 0 0 80px rgba(124,92,255,0.08)' }}>
      <img src={BOOK_IMAGES.aiChip} alt="AI Technology" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,92,255,0.25), rgba(7,7,20,0.3))' }} />
      <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Cpu size={14} color="#fff" strokeWidth={2} />
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>BERT ENGINE</span>
      </div>
    </div>
  </motion.div>
);

/* ───────── TABLET ILLUSTRATION (Card 2) ───────── */
const TabletIllustration: React.FC = () => (
  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
    <div style={{ position: 'relative', width: 160, height: 100, borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(124,92,255,0.25)', boxShadow: '0 15px 40px rgba(0,0,0,0.4), 0 0 30px rgba(124,92,255,0.1)' }}>
      <img src={BOOK_IMAGES.document} alt="Document summary" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(124,92,255,0.15), rgba(7,7,20,0.4))' }} />
      <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <FileText size={14} color="#fff" strokeWidth={2} />
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>INSTANT</span>
      </div>
    </div>
  </motion.div>
);

/* ───────── SHIELD ILLUSTRATION (Card 3) ───────── */
const ShieldIllustration: React.FC = () => (
  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
    <div style={{ position: 'relative', width: 160, height: 100, borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(124,92,255,0.3)', boxShadow: '0 0 40px rgba(124,92,255,0.18), 0 0 80px rgba(124,92,255,0.06)' }}>
      <img src={BOOK_IMAGES.security} alt="Security" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(7,7,20,0.4))' }} />
      <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Lock size={14} color="#fff" strokeWidth={2} />
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>ENCRYPTED</span>
      </div>
    </div>
  </motion.div>
);

/* ───────── ANIMATION VARIANTS ───────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -8, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

/* ───────── MAIN LANDING COMPONENT ───────── */
interface LandingProps { onGetStarted: () => void; }

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const navLinks = ['Features', 'How It Works', 'Live Demo'];

  return (
    <div style={{
      background: '#070714', color: '#fff',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden', lineHeight: 1.6,
      minHeight: '100vh', position: 'relative',
    }}>
      <StarParticles />

      {/* Purple glow overlays */}
      <div style={{ position: 'fixed', top: '-20%', left: '50%', width: 900, height: 600, transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,92,255,0.08) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: 600, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 72, padding: '0 max(24px, calc((100vw - 1200px) / 2))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(7,7,20,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(1.4)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(1.4)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.35s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #7C5CFF, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,92,255,0.3)' }}>
            <BookOpen size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#fff', letterSpacing: '-0.02em' }}>
            BookSumm <span style={{ color: '#8B5CF6', fontWeight: 500 }}>AI</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="landing-desktop-nav" style={{ alignItems: 'center', gap: 32 }}>
          {navLinks.map(link => (
            <span key={link}
              onClick={() => {
                if (link === 'Live Demo') window.open('https://book-summarization-system-1.onrender.com/', '_blank', 'noopener,noreferrer');
                else document.getElementById(link.toLowerCase().replace(/\s+/g, '-'))?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#B8B8D0')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              {link === 'Live Demo' && <Globe size={14} />} {link}
            </span>
          ))}
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onGetStarted} className="landing-signin-btn"
            style={{ padding: '10px 22px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >Sign In</button>
          <button onClick={onGetStarted}
            style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7C5CFF, #8B5CF6)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 0 20px rgba(124,92,255,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(124,92,255,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(124,92,255,0.4)'; }}
          >Get Started</button>
          <button className="landing-mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'none', marginLeft: 4 }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ position: 'fixed', top: 72, left: 0, right: 0, zIndex: 999, background: 'rgba(7,7,20,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px 24px' }}>
            {navLinks.map(link => (
              <div key={link}
                onClick={() => { setMobileOpen(false); if (link === 'Live Demo') window.open('https://book-summarization-system-1.onrender.com/', '_blank', 'noopener,noreferrer'); else document.getElementById(link.toLowerCase().replace(/\s+/g, '-'))?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ padding: '14px 0', fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
              >{link}</div>
            ))}
            <button onClick={() => { setMobileOpen(false); onGetStarted(); }}
              style={{ marginTop: 16, width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7C5CFF, #8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >Get Started</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO SECTION ─── */}
      <section style={{
        position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px max(24px, calc((100vw - 1200px) / 2)) 80px', zIndex: 1,
      }}>
        <div className="landing-hero-grid" style={{ display: 'grid', gap: 40, width: '100%', alignItems: 'center' }}>
          {/* Left text */}
          <div>
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 18px', borderRadius: 100, background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)', marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'landingPulseDot 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#8B5CF6', letterSpacing: '0.06em' }}>BERT-Powered AI Engine</span>
            </motion.div>

            {/* Heading */}
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 'clamp(38px, 5.5vw, 64px)', fontWeight: 700, fontFamily: "'Poppins', sans-serif", lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 24px', color: '#FFFFFF' }}>
              Summarize any book<br />
              <span style={{ background: 'linear-gradient(135deg, #7C5CFF, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>in seconds</span>
            </motion.h1>

            {/* Description */}
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', color: '#B8B8D0', lineHeight: 1.8, maxWidth: 520, margin: '0 0 36px', fontWeight: 400 }}>
              Transform lengthy books, research papers, and documents into clear, concise summaries with key insights extracted by BERT AI.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={onGetStarted}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7C5CFF, #8B5CF6)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(124,92,255,0.6)', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(124,92,255,0.8)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(124,92,255,0.6)'; }}
              >Get Started Free <ArrowRight size={18} strokeWidth={2.2} /></button>
              <a href="https://book-summarization-system-1.onrender.com/" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, border: '1px solid rgba(124,92,255,0.3)', background: 'rgba(124,92,255,0.08)', color: '#B8B8D0', fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,92,255,0.5)'; e.currentTarget.style.background = 'rgba(124,92,255,0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,92,255,0.3)'; e.currentTarget.style.background = 'rgba(124,92,255,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
              ><Globe size={17} strokeWidth={2} /> Live Demo</a>
            </motion.div>
          </div>

          {/* Right illustration */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="landing-hero-illustration">
            <HeroIllustration />
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURE CARDS ─── */}
      <section id="features" style={{ padding: '100px max(24px, calc((100vw - 1200px) / 2)) 120px', position: 'relative', zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} style={{ textAlign: 'center', marginBottom: 64 }}>
          <motion.p custom={0} variants={fadeUp} style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Features</motion.p>
          <motion.h2 custom={1} variants={fadeUp} style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.1, fontFamily: "'Poppins', sans-serif" }}>
            Powered by cutting-edge AI
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} style={{ fontSize: 16, color: '#B8B8D0', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Experience the future of document summarization with our advanced capabilities.
          </motion.p>
        </motion.div>

        <div className="landing-cards-grid" style={{ display: 'grid', gap: 24 }}>
          {/* Card 1 — BERT Engine */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={0} variants={fadeUp} whileHover="hover" animate="rest">
            <motion.div variants={cardHover} style={{ padding: '36px 32px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', overflow: 'hidden', transition: 'border-color 0.3s' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px', fontFamily: "'Poppins', sans-serif" }}>BERT-Powered AI Engine</h3>
              <p style={{ fontSize: 14, color: '#B8B8D0', margin: '0 0 20px', lineHeight: 1.7 }}>Advanced NLP technology delivering clear, concise summaries.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {['BERT AI Engine', '10x Faster Summaries', '100% Secure & Private'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#7C5CFF" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 13, color: '#B8B8D0' }}>{item}</span>
                  </div>
                ))}
              </div>
              <AiChipIllustration />
            </motion.div>
          </motion.div>

          {/* Card 2 — Summaries */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={1} variants={fadeUp} whileHover="hover" animate="rest">
            <motion.div variants={cardHover} style={{ padding: '36px 32px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', overflow: 'hidden', transition: 'border-color 0.3s' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px', fontFamily: "'Poppins', sans-serif" }}>Get Detailed Summaries in Seconds</h3>
              <p style={{ fontSize: 14, color: '#B8B8D0', margin: '0 0 20px', lineHeight: 1.7 }}>Upload any book, research paper, or document and receive concise summaries instantly.</p>
              <TabletIllustration />
            </motion.div>
          </motion.div>

          {/* Card 3 — Security */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={2} variants={fadeUp} whileHover="hover" animate="rest">
            <motion.div variants={cardHover} style={{ padding: '36px 32px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', overflow: 'hidden', transition: 'border-color 0.3s' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px', fontFamily: "'Poppins', sans-serif" }}>Private & Secure</h3>
              <p style={{ fontSize: 14, color: '#B8B8D0', margin: '0 0 20px', lineHeight: 1.7 }}>Your data is protected with top-tier security measures.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {['Advanced encryption', 'No data stored after summary', 'Secure AI processing'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#7C5CFF" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 13, color: '#B8B8D0' }}>{item}</span>
                  </div>
                ))}
              </div>
              <ShieldIllustration />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" style={{ padding: '100px max(24px, calc((100vw - 1200px) / 2)) 120px', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} style={{ textAlign: 'center', marginBottom: 64 }}>
          <motion.p custom={0} variants={fadeUp} style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>How It Works</motion.p>
          <motion.h2 custom={1} variants={fadeUp} style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.1, fontFamily: "'Poppins', sans-serif" }}>
            Three simple steps
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} style={{ fontSize: 16, color: '#B8B8D0', maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
            From upload to insights in under 10 seconds.
          </motion.p>
        </motion.div>

        <div className="landing-steps-grid" style={{ display: 'grid', gap: 24 }}>
          {[
            { num: '01', title: 'Upload Content', desc: 'Drop a PDF, DOCX, TXT file — or paste text and let our AI handle the rest.', icon: FileText, color: '#7C5CFF' },
            { num: '02', title: 'AI Analyzes', desc: 'Our BERT transformer reads the entire document, extracting meaning and key relationships.', icon: Brain, color: '#8B5CF6' },
            { num: '03', title: 'Get Insights', desc: 'Receive a concise summary, bullet points, concept table, and flow diagram — instantly.', icon: Zap, color: '#22d3ee' },
          ].map((step, i) => (
            <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={i} variants={fadeUp} whileHover="hover" animate="rest">
              <motion.div variants={cardHover} style={{ padding: '40px 32px', borderRadius: 20, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', overflow: 'hidden', transition: 'border-color 0.3s' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${step.color}15`, border: `1px solid ${step.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <step.icon size={24} color={step.color} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: step.color }}>{step.num}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '8px 0 10px', fontFamily: "'Poppins', sans-serif" }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#B8B8D0', margin: 0, lineHeight: 1.7 }}>{step.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── BOOK SHOWCASE ─── */}
      <section style={{ padding: '80px max(24px, calc((100vw - 1200px) / 2)) 100px', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.p custom={0} variants={fadeUp} style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Library</motion.p>
          <motion.h2 custom={1} variants={fadeUp} style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.1, fontFamily: "'Poppins', sans-serif" }}>
            Summarize any type of book
          </motion.h2>
        </motion.div>

        {/* Book grid with real images */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
          {[
            { img: BOOK_IMAGES.bookStack, title: 'Fiction Novels', color: '#7C5CFF' },
            { img: BOOK_IMAGES.openBook, title: 'Research Papers', color: '#22d3ee' },
            { img: BOOK_IMAGES.readingBook, title: 'Textbooks', color: '#ec4899' },
            { img: BOOK_IMAGES.booksTop, title: 'Non-Fiction', color: '#f59e0b' },
            { img: BOOK_IMAGES.document, title: 'Documents', color: '#10b981' },
            { img: BOOK_IMAGES.bookShelf, title: 'Academic', color: '#8B5CF6' },
          ].map((book, i) => (
            <motion.div key={book.title}
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }}
              custom={i} variants={fadeUp}
              whileHover={{ scale: 1.05, y: -8 }}
              style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', transition: 'border-color 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${book.color}50`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <div style={{ height: 200, overflow: 'hidden' }}>
                <img src={book.img} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(7,7,20,0.9) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <BookOpen size={13} color={book.color} strokeWidth={2} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{book.title}</span>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>AI-powered summary</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Full-width library banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          style={{ marginTop: 40, borderRadius: 20, overflow: 'hidden', position: 'relative', height: 220, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
        >
          <img src={BOOK_IMAGES.darkLibrary} alt="Dark library" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,7,20,0.85) 0%, rgba(7,7,20,0.4) 50%, rgba(124,92,255,0.15) 100%)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 40, transform: 'translateY(-50%)', maxWidth: 400 }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 10px', fontFamily: "'Poppins', sans-serif" }}>Your Personal AI Library</h3>
            <p style={{ fontSize: 14, color: '#B8B8D0', margin: 0, lineHeight: 1.7 }}>Every summary is saved to your collection. Build a library of insights from hundreds of books.</p>
          </div>
        </motion.div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '100px max(24px, calc((100vw - 1200px) / 2)) 120px', textAlign: 'center', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        {/* Library background image behind CTA */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img src={BOOK_IMAGES.library} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08 }} />
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,92,255,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} style={{ position: 'relative', zIndex: 1, maxWidth: 550, margin: '0 auto' }}>
          <motion.h2 custom={0} variants={fadeUp} style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.035em', lineHeight: 1.1, fontFamily: "'Poppins', sans-serif" }}>
            Ready to read smarter?
          </motion.h2>
          <motion.p custom={1} variants={fadeUp} style={{ fontSize: 16, color: '#B8B8D0', margin: '0 0 40px', lineHeight: 1.7 }}>
            Create a free account and start summarizing any document in seconds.
          </motion.p>
          <motion.div custom={2} variants={fadeUp}>
            <button onClick={onGetStarted}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 44px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7C5CFF, #8B5CF6)', color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(124,92,255,0.6)', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(124,92,255,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(124,92,255,0.6)'; }}
            >Get Started Free <ArrowRight size={19} strokeWidth={2.2} /></button>
            <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>No credit card required</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px max(24px, calc((100vw - 1200px) / 2))', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #7C5CFF, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={13} color="#fff" strokeWidth={2.3} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Poppins', sans-serif" }}>BookSumm AI</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
          {'\u00A9'} {new Date().getFullYear()} Intelligent Book Summarization Platform
        </p>
      </footer>

      {/* Keyframes + responsive overrides */}
      <style>{`
        @keyframes landingPulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .landing-hero-grid {
          grid-template-columns: 1fr;
        }
        .landing-hero-illustration {
          display: none;
        }
        .landing-desktop-nav {
          display: none;
        }
        .landing-mobile-menu-btn {
          display: flex !important;
        }
        .landing-cards-grid {
          grid-template-columns: 1fr;
        }
        .landing-steps-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .landing-hero-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .landing-hero-illustration {
            display: block !important;
          }
          .landing-desktop-nav {
            display: flex !important;
          }
          .landing-mobile-menu-btn {
            display: none !important;
          }
          .landing-signin-btn {
            display: inline-flex;
          }
          .landing-cards-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .landing-steps-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
