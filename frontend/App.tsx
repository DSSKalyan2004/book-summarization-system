
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import Landing from './components/Landing';
import UsersList from './components/UsersList';
import HistoryList from './components/HistoryList';
import { TableSection } from './components/VisualSummary';
import MindMapSection from './components/MindMap';
import SectionTabs from './components/SectionTabs';
import { Page, BookMetadata, SummaryResult, User } from './types';
import { APP_NAME, NAV_ITEMS, ADMIN_NAV_ITEMS } from './constants';
import { generateBookSummary } from './services/summarizer';
import { summaryApi, authApi, checkServerHealth } from './services/api';
import { 
  FileUp, 
  BookText,
  BookOpen,
  Send, 
  Loader2, 
  CheckCircle, 
  Download, 
  Copy, 
  ChevronLeft,
  Link as LinkIcon,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowRight,
  User as UserIcon,
  LogOut,
  Lightbulb,
  Table2,
  Brain,
  BookMarked,
  Library
} from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.UPLOAD);
  const [history, setHistory] = useState<SummaryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSummary, setActiveSummary] = useState<SummaryResult | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'url'>('text');
  const [metadata, setMetadata] = useState<BookMetadata>({ title: '' });
  const [textContent, setTextContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fileInputName, setFileInputName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Processing...');
  const [serverOnline, setServerOnline] = useState<boolean | null>(null); // null = checking
  const [justReconnected, setJustReconnected] = useState(false); // green flash on reconnect
  const [serverOfflineSince, setServerOfflineSince] = useState<number | null>(null); // timestamp when first went offline
  const [, forceTickUpdate] = useState(0); // 1-second tick for waking-up counter

  // 1-second tick while server is offline so the "Xsecond" counter updates live
  useEffect(() => {
    if (serverOnline !== false && serverOnline !== null) return;
    const t = setInterval(() => forceTickUpdate(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [serverOnline]);

  // Probe immediately on startup, then retry rapidly for the first second.
  // After connection stabilizes, fall back to slower health checks.
  useEffect(() => {
    let isMounted = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const checkHealth = async () => {
      const ok = await checkServerHealth();
      if (!isMounted) return;
      setServerOnline(prev => {
        if (ok) {
          // Server just came back online — show green flash
          if (prev === false || prev === null) {
            setJustReconnected(true);
            setTimeout(() => setJustReconnected(false), 3000);
          }
          setServerOfflineSince(null); // reset wake-up timer
        } else {
          // Record the first moment the server was unreachable
          setServerOfflineSince(ts => ts ?? Date.now());
        }
        return ok;
      });

      timeout = setTimeout(checkHealth, ok ? 30000 : 1000); // retry every 1s if not ok
    };

    checkHealth();

    return () => {
      isMounted = false;
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Check authentication on mount — validate token with server
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const cachedUser = authApi.getCurrentUser();

    if (token && cachedUser) {
      // ✅ Show cached user IMMEDIATELY — UI is instant, user is never blocked
      setIsAuthenticated(true);
      setCurrentUser(cachedUser);
      loadHistory();

      // Then verify in the background:
      // - Server offline → stays logged in (valid: true with cached user)
      // - Server rejects token (401/403) → logs out cleanly
      // - Server OK → updates user data silently + refreshes token
      authApi.verifyAndRefreshSession().then(result => {
        if (!result.valid) {
          // Genuine token rejection from server — logout
          setIsAuthenticated(false);
          setCurrentUser(null);
          setHistory([]);
          setActiveSummary(null);
        } else if (result.user) {
          // Silently update with fresh user data from server
          setCurrentUser(result.user);
        }
        // If server was offline (valid: true, user: cachedUser) — nothing changes, user stays in
      });
    }

    // Auto-logout when a real data API call returns 401 mid-session
    const onSessionExpired = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setHistory([]);
      setActiveSummary(null);
    };
    window.addEventListener('session-expired', onSessionExpired);
    return () => window.removeEventListener('session-expired', onSessionExpired);
  }, []);

  const handleLogin = (token: string, user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    loadHistory();
  };

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setHistory([]);
    setActiveSummary(null);
  };

  const historyKey = () => {
    const user = authApi.getCurrentUser();
    return user ? `summ_ai_history_${user._id || user.id || user.email}` : 'summ_ai_history';
  };

  const loadHistory = async () => {
    // Show cached version instantly while DB loads
    const cached = localStorage.getItem(historyKey());
    if (cached) {
      try { setHistory(JSON.parse(cached)); } catch {}
    }
    // Then load from MongoDB (permanent storage)
    try {
      const summaries = await summaryApi.getAll();
      setHistory(summaries);
      localStorage.setItem(historyKey(), JSON.stringify(summaries));
    } catch (error) {
      console.error('Could not load history from server:', error);
    }
  };

  const saveToHistory = async (item: SummaryResult) => {
    // Update UI immediately
    setHistory(prev => {
      const newHistory = [item, ...prev];
      localStorage.setItem(historyKey(), JSON.stringify(newHistory));
      return newHistory;
    });
    // Persist to MongoDB
    try {
      const saved = await summaryApi.create(item);
      // Update the item's id to the DB-assigned one
      setHistory(prev => {
        const updated = prev.map(h => h.id === item.id ? { ...h, id: saved.id } : h);
        localStorage.setItem(historyKey(), JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Could not save to server (stored locally):', error);
    }
  };

  const deleteFromHistory = async (id: string) => {
    // Update UI immediately
    setHistory(prev => {
      const newHistory = prev.filter(h => h.id !== id);
      localStorage.setItem(historyKey(), JSON.stringify(newHistory));
      return newHistory;
    });
    // Delete from MongoDB
    try {
      await summaryApi.delete(id);
    } catch (error) {
      console.error('Could not delete from server:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileInputName(file.name);
    setError(null);
    setIsLoading(true);
    setLoadingMsg('Uploading and extracting text from file...');

    try {
      // Upload file to server for extraction
      const result = await summaryApi.uploadFile(file);
      
      // Store the extracted text (without switching to text mode)
      setTextContent(result.text);
      
      console.log(`✅ Successfully extracted ${result.text.length} characters from ${result.filename}`);
    } catch (err: any) {
      setError(err.message || "Failed to process file. Please try again.");
      console.error('File upload error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMsg('Processing...');
    }
  };

  const fetchUrlContent = async (url: string): Promise<string> => {
    const proxies = [
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
    ];
    
    let lastError: Error | null = null;
    
    for (let i = 0; i < proxies.length; i++) {
      try {
        setLoadingMsg(`Fetching webpage (attempt ${i + 1}/${proxies.length})...`);
        const proxyUrl = proxies[i](url);
        const response = await fetch(proxyUrl, { 
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const htmlContent = await response.text();
        
        // Create temporary DOM element to parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Remove script, style, nav, footer, etc.
        ['script', 'style', 'nav', 'footer', 'header', 'iframe', 'noscript', 'aside'].forEach(tag => {
          doc.querySelectorAll(tag).forEach(el => el.remove());
        });
        
        // Remove common noise elements
        ['.sidebar', '.menu', '.navigation', '#toc', '.references', '.footer'].forEach(selector => {
          doc.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // Extract text from main content areas
        const mainContent = doc.querySelector('main') || 
                            doc.querySelector('article') || 
                            doc.querySelector('[role="main"]') || 
                            doc.querySelector('.mw-parser-output') || // Wikipedia specific
                            doc.querySelector('.content') ||
                            doc.querySelector('#content') ||
                            doc.querySelector('#bodyContent') || // Wikipedia
                            doc.body;
        
        let text = mainContent?.textContent || '';
        
        // Clean up extracted text
        text = text
          .replace(/\s+/g, ' ')
          .replace(/\[[0-9]+\]/g, '')
          .replace(/\[edit\]/gi, '')
          .replace(/Jump to navigation/gi, '')
          .replace(/Jump to search/gi, '')
          .trim();
        
        if (text.length < 50) {
          throw new Error('Not enough text extracted');
        }
        
        console.log(`✅ Successfully fetched ${text.length} characters using proxy ${i + 1}`);
        return text;
        
      } catch (error: any) {
        lastError = error;
        console.warn(`Proxy ${i + 1} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error(`All proxies failed. Please copy and paste the text directly instead. (Last error: ${lastError?.message})`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    let source = '';
    
    if (inputMode === 'url') {
      if (!urlInput.trim()) {
        setError("Please provide a URL.");
        return;
      }
      setIsLoading(true);
      setLoadingMsg('Fetching webpage content...');
      try {
        source = await fetchUrlContent(urlInput);
      } catch (err: any) {
        setError(err.message || "Failed to fetch URL content.");
        setIsLoading(false);
        return;
      }
    } else {
      source = textContent;
    }
    
    if (!source.trim() || !metadata.title) {
      setError("Please provide a title and document content.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadingMsg('Loading BERT AI model...');
    
    try {
      setTimeout(() => setLoadingMsg('Processing with BERT AI...'), 2000);
      setTimeout(() => setLoadingMsg('Extracting key insights...'), 5000);
      setTimeout(() => setLoadingMsg('Building summary...'), 8000);
      
      const result = await generateBookSummary(source, metadata);
      await saveToHistory(result);
      setActiveSummary(result);
    } catch (err: any) {
      setError(err.message || "Failed to summarize. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMsg('Processing...');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadSummary = (item: SummaryResult) => {
    const rows = item.tableRows ?? [];

    const tableLines = rows.length > 0
      ? rows.map(r => `| ${r.concept.padEnd(30)} | ${r.explanation}`).join('\n')
      : item.bulletPoints.map((b, i) => `| Point ${i + 1}`.padEnd(33) + `| ${b}`).join('\n');

    const content = [
      `TITLE: ${item.metadata.title}`,
      ``,
      `SUMMARY:`,
      item.summaryParagraphs.join('\n\n'),
      ``,
      `KEY INSIGHTS:`,
      item.bulletPoints.map(b => `- ${b}`).join('\n'),
      ``,
      `${'─'.repeat(42)}`,
      `TABLE FORMAT SUMMARY`,
      `${'─'.repeat(42)}`,
      `| ${'Concept'.padEnd(30)} | Explanation`,
      `|${'─'.repeat(32)}|${'─'.repeat(50)}`,
      tableLines,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.metadata.title}_summary.txt`;
    a.click();
  };

  const renderUpload = () => {
    if (activeSummary) {
      const fullSummaryText = activeSummary.summaryParagraphs.join('\n\n');
      return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
          <button 
            onClick={() => setActiveSummary(null)}
            className="animate-slide-up flex items-center gap-2 transition-all group text-sm font-semibold px-5 py-3 rounded-xl"
            style={{ background: '#ffffff', border: '1.5px solid #E5E7EB', color: '#0B3C5D', boxShadow: '0 2px 8px rgba(11,60,93,0.08)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(29,78,216,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(11,60,93,0.08)'; }}
          >
            <ChevronLeft size={17} className="group-hover:-translate-x-1 transition-transform" />
            <span>New Summary</span>
          </button>

          <div className="animate-scale-in delay-100 card-premium rounded-2xl" style={{ padding: '40px 48px' }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8 mb-8" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: '#0B3C5D' }}>{activeSummary.metadata.title}</h2>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => copyToClipboard(fullSummaryText)}
                  className="p-3 rounded-xl transition-all" style={{ background: '#ffffff', border: '1.5px solid #E5E7EB', color: '#0B3C5D', boxShadow: '0 2px 8px rgba(11,60,93,0.06)' }}
                  title="Copy" aria-label="Copy summary to clipboard"
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1D4ED8'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; }}
                ><Copy size={19} /></button>
                <button onClick={() => downloadSummary(activeSummary)} className="p-3 btn-primary text-white rounded-xl" title="Download" aria-label="Download summary"><Download size={19} /></button>
              </div>
            </div>

            <div className="space-y-10 animate-slide-up delay-300">
              <div className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #0B3C5D, #1D4ED8)' }}></div>
                  <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#0B3C5D' }}>
                    <BookText size={16} /> Summary
                  </h3>
                </div>
                <div className="space-y-4 p-7 rounded-2xl" style={{ background: 'rgba(11,60,93,0.03)', border: '1px solid #E5E7EB' }}>
                  {activeSummary.summaryParagraphs.map((para, i) => (
                    <p key={i} className="leading-[1.9] text-base text-justify indent-6" style={{ color: '#374151', fontWeight: 400 }}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Section buttons */}
          <div className="animate-slide-up delay-400">
          <SectionTabs tabs={[
            {
              id: 'insights',
              label: 'Key Insights',
              icon: <Lightbulb size={18} />,
              accentColor: '#059669',
              gradientFrom: '#059669',
              gradientTo: '#0891b2',
              content: (
                <div className="grid grid-cols-1 gap-3">
                  {(activeSummary.bulletPoints ?? []).map((point, idx) => (
                    <div key={idx} className="flex gap-4 p-5 rounded-xl items-start transition-all" style={{ background: '#ffffff', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 8px rgba(11,60,93,0.04)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(29,78,216,0.35)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(11,60,93,0.12)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(11,60,93,0.04)'; }}
                    >
                      <span className="font-bold text-xs mt-0.5 px-2.5 py-1.5 rounded-lg min-w-[2rem] text-center flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #0B3C5D, #1D4ED8)', boxShadow: '0 2px 8px rgba(11,60,93,0.3)' }}>{idx + 1}</span>
                      <p className="text-base leading-[1.8] flex-1" style={{ color: '#374151' }}>{point}</p>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              id: 'table',
              label: 'Tabular Format',
              icon: <Table2 size={18} />,
              accentColor: '#7c3aed',
              gradientFrom: '#7c3aed',
              gradientTo: '#a855f7',
              content: <TableSection summary={activeSummary} />,
            },
            {
              id: 'mindmap',
              label: 'Mind Map',
              icon: <Brain size={18} />,
              accentColor: '#7C3AED',
              gradientFrom: '#7C3AED',
              gradientTo: '#EC4899',
              content: <MindMapSection summary={activeSummary} />,
            },
          ]} />
          </div>

        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Dashboard Welcome Banner */}
        <div className="animate-slide-up rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #162850 40%, #1E3A6E 100%)' }}>
          {/* Background decoration */}
          <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '20%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '20%', left: '60%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          {/* Dot pattern overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

          <div style={{ padding: '36px 40px', position: 'relative', zIndex: 1 }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(79,70,229,0.4)', flexShrink: 0 }}>
                  <BookOpen size={28} color="#fff" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 12px', borderRadius: '99px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: '8px' }}>
                    <Sparkles size={11} color="#a5b4fc" />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BERT-Powered AI Engine</span>
                  </div>
                  <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    Welcome back{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}
                  </h1>
                  <p style={{ fontSize: '14px', margin: '6px 0 0', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                    Upload documents and get AI-powered summaries with insights, tables & mind maps.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '24px' }}>
              {[
                { label: 'Documents Analyzed', value: history.length.toString(), icon: <FileText size={16} />, color: '#93c5fd' },
                { label: 'Total Words Processed', value: history.reduce((s, i) => s + i.wordCount, 0).toLocaleString(), icon: <BookText size={16} />, color: '#6ee7b7' },
                { label: 'Insights Extracted', value: history.reduce((s, i) => s + i.bulletPoints.length, 0).toString(), icon: <Lightbulb size={16} />, color: '#fde68a' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', backdropFilter: 'blur(8px)', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{icon}</span>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  </div>
                  <p style={{ fontSize: '22px', fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {error && (
          <div className="animate-slide-up p-4 rounded-xl flex items-center gap-3 text-sm font-medium" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}>
            <AlertCircle size={18} className="flex-shrink-0" /> <span>{error}</span>
          </div>
        )}

        {/* Summarization Form */}
        <div className="animate-slide-up delay-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card-premium rounded-2xl" style={{ padding: '32px 36px' }}>
            {/* Form section header */}
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(79,70,229,0.25)' }}>
                <Send size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B3C5D', margin: 0 }}>New Document Analysis</h3>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0', fontWeight: 500 }}>Provide a title and your content below</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-7">
              <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: '#0B3C5D' }}>Document Title</label>
              <input type="text" required value={metadata.title} onChange={e => setMetadata({...metadata, title: e.target.value})} placeholder="Enter your document title..." className="w-full input-premium rounded-xl font-medium" style={{ padding: '13px 16px', fontSize: '15px', color: '#0B3C5D', background: '#ffffff' }} />
            </div>

            <div className="space-y-5" style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px' }}>
              <div className="flex gap-1 p-1 rounded-xl max-w-md mx-auto" style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                {[
                  { id: 'text', icon: <FileText size={16} />, label: 'Paste Text' },
                  { id: 'file', icon: <FileUp size={16} />, label: 'Upload File' },
                  { id: 'url', icon: <LinkIcon size={16} />, label: 'From URL' },
                ].map(mode => (
                  <button key={mode.id} type="button" onClick={() => setInputMode(mode.id as any)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all"
                    style={inputMode === mode.id ? { background: 'linear-gradient(135deg, #0B3C5D, #1D4ED8)', color: '#fff', boxShadow: '0 2px 10px rgba(11,60,93,0.3)' } : { color: '#9CA3AF' }}
                  >
                    {mode.icon} <span>{mode.label}</span>
                  </button>
                ))}
              </div>

              {inputMode === 'text' && <textarea required value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Paste your document text here..." className="w-full input-premium rounded-xl text-base resize-none leading-relaxed" style={{ padding: '20px', minHeight: '300px', fontWeight: 400, color: '#0B3C5D', background: '#ffffff' }} />}
              {inputMode === 'url' && <input type="url" required value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/article" className="w-full input-premium rounded-xl font-medium" style={{ padding: '13px 16px', fontSize: '15px', color: '#0B3C5D', background: '#ffffff' }} />}
              {inputMode === 'file' && (
                <div className="space-y-4">
                  <div className="rounded-2xl p-14 flex flex-col items-center gap-5 transition-all cursor-pointer relative overflow-hidden group" style={{ border: '2px dashed rgba(29,78,216,0.3)', background: '#EFF6FF' }}
                    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'rgba(29,78,216,0.55)'; d.style.background = 'rgba(29,78,216,0.06)'; }}
                    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'rgba(29,78,216,0.3)'; d.style.background = '#EFF6FF'; }}
                  >
                    {/* Decorative floating mini books in upload area */}
                    <div style={{ position: 'absolute', top: '12px', left: '16px', opacity: 0.08, pointerEvents: 'none' }}>
                      <div className="animate-book-float-1" style={{ width: '24px', height: '32px', borderRadius: '2px 4px 4px 2px', background: 'linear-gradient(135deg, #6366f1, #4338ca)' }} />
                    </div>
                    <div style={{ position: 'absolute', top: '8px', right: '20px', opacity: 0.06, pointerEvents: 'none' }}>
                      <div className="animate-book-float-2" style={{ width: '20px', height: '28px', borderRadius: '2px 4px 4px 2px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }} />
                    </div>
                    <div style={{ position: 'absolute', bottom: '12px', right: '25%', opacity: 0.06, pointerEvents: 'none' }}>
                      <div className="animate-book-float-3" style={{ width: '18px', height: '24px', borderRadius: '2px 4px 4px 2px', background: 'linear-gradient(135deg, #0891b2, #164e63)' }} />
                    </div>
                    
                    <div className="p-5 rounded-2xl icon-bounce" style={{ background: 'linear-gradient(135deg, #0B3C5D, #1D4ED8)', boxShadow: '0 6px 20px rgba(11,60,93,0.3)' }}>
                      <FileUp size={36} color="#fff" strokeWidth={1.8} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-base" style={{ color: fileInputName ? '#0B3C5D' : '#9CA3AF' }}>{fileInputName || 'Click to browse or drag & drop'}</p>
                      <p className="text-sm mt-1.5" style={{ color: '#9ca3af' }}>PDF, DOCX, TXT — Max 50MB</p>
                    </div>
                    <input type="file" id="file-up" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
                    <label htmlFor="file-up" className="btn-primary text-white px-7 py-2.5 rounded-xl text-sm font-semibold cursor-pointer">Browse Files</label>
                  </div>
                  {fileInputName && textContent && (
                    <div className="p-4 rounded-xl flex items-center gap-3 text-sm font-medium" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', color: '#059669' }}>
                      <CheckCircle size={18} /> <span>File extracted and ready — {textContent.length.toLocaleString()} characters</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={isLoading || ((inputMode === 'text' || inputMode === 'file') && !textContent.trim())} className="w-full btn-primary disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-base relative overflow-hidden">
            {isLoading ? <><Loader2 className="animate-spin" size={19} /> <span>{loadingMsg}</span></> : <><Send size={19} /> <span>Generate AI Summary</span> <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" /></>}
          </button>
        </form>
        </div>

        {/* Output format preview cards */}
        <div className="animate-slide-up delay-300">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #4F46E5, #7C3AED)' }} />
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B', letterSpacing: '0.1em' }}>What You'll Get</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { icon: <BookText size={20} />, title: 'Summary', desc: 'Concise paragraphs', color: '#0B3C5D', bg: 'rgba(11,60,93,0.05)' },
              { icon: <Lightbulb size={20} />, title: 'Key Insights', desc: 'Bullet-point highlights', color: '#059669', bg: 'rgba(5,150,105,0.05)' },
              { icon: <Table2 size={20} />, title: 'Table Format', desc: 'Concept definitions', color: '#7c3aed', bg: 'rgba(124,58,237,0.05)' },
              { icon: <Brain size={20} />, title: 'Mind Map', desc: 'Topic hierarchy', color: '#EC4899', bg: 'rgba(236,72,153,0.05)' },
            ].map(({ icon, title, desc, color, bg }) => (
              <div key={title} className="p-4 rounded-xl transition-all" style={{ background: '#ffffff', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 8px rgba(11,60,93,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}15`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(11,60,93,0.04)'; }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#0B3C5D', margin: 0 }}>{title}</p>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '1px 0 0', fontWeight: 500 }}>{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    const totalWords = history.reduce((s, i) => s + i.wordCount, 0);
    const totalBullets = history.reduce((s, i) => s + i.bulletPoints.length, 0);
    const avgWords = history.length ? Math.round(totalWords / history.length) : 0;

    return (
      <div style={{ width: '100%', minHeight: '80vh' }}>
        {/* Header banner */}
        <div className="rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, #0B3C5D 0%, #1D4ED8 100%)', boxShadow: '0 8px 32px rgba(11,60,93,0.3)', overflow: 'hidden', position: 'relative' }}>
          {/* Background blobs */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,128,61,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ padding: '32px 36px', position: 'relative', zIndex: 1 }}>
            {/* Top row */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  <BookOpen size={26} color="#fff" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '6px' }}>
                    <Sparkles size={10} color="rgba(255,255,255,0.9)" />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Document Library</span>
                  </div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>Summary History</h1>
                  <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: 'rgba(255,255,255,0.65)' }}>
                    Signed in as <span style={{ color: '#fff', fontWeight: 700 }}>{currentUser?.email}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Documents',  value: history.length,            color: '#fff',    sub: 'total summaries' },
                { label: 'Total Words', value: totalWords.toLocaleString(), color: '#93c5fd', sub: 'across all docs' },
                { label: 'Key Points', value: totalBullets,              color: '#6ee7b7', sub: 'insights extracted' },
                { label: 'Avg. Length', value: avgWords.toLocaleString() + ' w', color: '#fde68a', sub: 'per document' },
              ].map(({ label, value, color, sub }) => (
                <div key={label} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <p style={{ fontSize: '20px', fontWeight: 800, color, margin: '0 0 2px 0', lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* List panel */}
        <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1.5px solid #E5E7EB', boxShadow: '0 4px 16px rgba(11,60,93,0.06)' }}>
          <HistoryList
            items={history}
            onSelect={(item) => { setActiveSummary(item); setCurrentPage(Page.UPLOAD); }}
            onDelete={deleteFromHistory}
          />
        </div>
      </div>
    );
  };

  const renderAbout = () => (
    <div className="max-w-4xl mx-auto space-y-12 py-10">
      <div className="text-center space-y-4 pb-4 relative">
        {/* Decorative floating books */}
        <div className="hidden md:block" style={{ position: 'absolute', top: '-20px', left: '10%', opacity: 0.07, pointerEvents: 'none' }}>
          <div className="animate-book-float-1" style={{ width: '36px', height: '48px', borderRadius: '3px 6px 6px 3px', background: 'linear-gradient(135deg, #6366f1, #4338ca)' }} />
        </div>
        <div className="hidden md:block" style={{ position: 'absolute', top: '10px', right: '8%', opacity: 0.06, pointerEvents: 'none' }}>
          <div className="animate-book-float-2" style={{ width: '30px', height: '42px', borderRadius: '3px 6px 6px 3px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }} />
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: 'rgba(11,60,93,0.07)', border: '1px solid rgba(11,60,93,0.2)', color: '#0B3C5D' }}>
          <Sparkles size={12} /> Platform Overview
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight gradient-text">{APP_NAME}</h2>
        <p className="text-base font-bold uppercase tracking-wider" style={{ color: '#1D4ED8' }}>Intelligent Book Summarization Platform</p>
      </div>

      <div className="card-premium rounded-2xl card-3d" style={{ padding: '36px 40px' }}>
        <p className="text-lg font-normal leading-relaxed mb-8" style={{ color: '#57534e' }}>Transform your documents into <span className="font-bold" style={{ color: '#0B3C5D' }}>actionable insights</span> using BERT AI, built for researchers, students, and professionals.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
          {[
            { icon: <FileText size={20} color="#0B3C5D" />, color: '#0B3C5D', bg: 'rgba(11,60,93,0.07)', title: 'Multi-Format Support', desc: 'Process PDF, DOCX, TXT and web article URLs with intelligent extraction.' },
            { icon: <Sparkles size={20} color="#1D4ED8" />, color: '#1D4ED8', bg: 'rgba(29,78,216,0.07)', title: 'BERT AI Model', desc: 'State-of-the-art extractive summarization powered by BERT — fast and accurate.' },
            { icon: <BookOpen size={20} color="#15803D" />, color: '#15803D', bg: 'rgba(21,128,61,0.07)', title: 'Key Insight Extraction', desc: 'Automatically identifies and extracts the most important bullet points.' },
            { icon: <Send size={20} color="#0284c7" />, color: '#0284c7', bg: 'rgba(14,165,233,0.07)', title: 'Cloud Persistence', desc: 'All summaries stored in MongoDB, accessible from any device, any time.' },
          ].map(({ icon, color, bg, title, desc }) => (
            <div key={title} className="p-5 rounded-xl card-magnetic" style={{ background: bg, border: `1px solid ${color}25`, transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl icon-bounce" style={{ background: '#ffffff', boxShadow: `0 2px 8px ${color}22` }}>{icon}</div>
                <h4 className="font-bold" style={{ color: '#0B3C5D' }}>{title}</h4>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  const renderUsers = () => <UsersList />;

  // Server status banner (shown at top of page)
  const ServerBanner = () => {
    if (justReconnected) return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        backgroundColor: '#14532d', color: '#fff', fontSize: '13px', fontWeight: 600,
        padding: '8px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'opacity 0.5s'
      }}>
        <span style={{ fontSize: '18px' }}>✅</span> Connected to server!
      </div>
    );
    if (serverOnline === true) return null; // fully hidden when connected

    // Render free-tier cold start takes ~50 s. Show a friendly waking-up
    // banner for the first 90 s, then show a real error.
    const offlineMs = serverOfflineSince ? Date.now() - serverOfflineSince : 0;
    const isWakingUp = serverOnline === null || offlineMs < 90_000;
    const secsWaiting = Math.min(Math.round(offlineMs / 1000), 90);

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        backgroundColor: isWakingUp ? '#1e3a5f' : '#7f1d1d',
        color: '#fff', fontSize: '13px', fontWeight: 600,
        padding: '10px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
      }}>
        {isWakingUp ? (
          // Spinner
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <span style={{ fontSize: '16px' }}>🔴</span>
        )}
        {isWakingUp
          ? secsWaiting < 5
            ? 'Connecting to server…'
            : `Server is waking up on Render free tier — please wait… (${secsWaiting}s)`
          : 'Cannot connect to server. It may be down — try refreshing the page.'}
        {!isWakingUp && (
          <button
            onClick={async () => {
              setServerOfflineSince(null);
              setServerOnline(null);
              const ok = await checkServerHealth();
              if (!ok) setServerOfflineSince(Date.now());
              setServerOnline(ok);
              if (ok) { setJustReconnected(true); setTimeout(() => setJustReconnected(false), 3000); }
            }}
            style={{
              marginLeft: '12px', padding: '4px 12px', borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', cursor: 'pointer', fontSize: '12px'
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <ServerBanner />
      {!isAuthenticated ? (
        showLanding ? (
          <Landing onGetStarted={() => setShowLanding(false)} />
        ) : (
          <Auth onLogin={handleLogin} onBack={() => setShowLanding(true)} />
        )
      ) : (
        <div className="flex text-slate-800 min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdf4 100%)' }}>
          <Sidebar 
            currentPage={currentPage} 
            onPageChange={(p) => { setCurrentPage(p); setActiveSummary(null); }}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          <main
            className="flex-1 md:ml-[270px] p-6 md:p-10 lg:p-12 pb-32 md:pb-12 min-h-screen"
            style={{ position: 'relative' }}
          >
            {/* Subtle background decoration */}
            <div style={{ position: 'fixed', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-150px', left: '30%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Mobile user header */}
            {currentUser && (
              <div className="md:hidden mb-6 rounded-2xl p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #ffffff, #fafafe)', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(11,60,93,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 3px 12px rgba(79,70,229,0.35)' }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#0f172a' }}>{currentUser.name}</p>
                    <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
            {currentPage === Page.UPLOAD && renderUpload()}
            {currentPage === Page.HISTORY && renderHistory()}
            {currentPage === Page.USERS && renderUsers()}
            {currentPage === Page.ABOUT && renderAbout()}
            </div>
          </main>
          <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around p-3 z-50" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 -8px 32px rgba(11,60,93,0.06)' }}>
            {(currentUser?.role === 'admin' ? ADMIN_NAV_ITEMS : NAV_ITEMS).map(item => (
              <button 
                key={item.id} 
                onClick={() => { setCurrentPage(item.id as Page); setActiveSummary(null); }} 
                aria-label={item.label}
                className="p-3 rounded-xl transition-all"
                style={currentPage === item.id ? { color: '#4F46E5', background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.06))', border: '1px solid rgba(79,70,229,0.2)', boxShadow: '0 2px 12px rgba(79,70,229,0.12)' } : { color: '#94a3b8', border: '1px solid transparent' }}
              >
                {item.icon}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default App;
