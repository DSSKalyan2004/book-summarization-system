
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import UsersList from './components/UsersList';
import HistoryList from './components/HistoryList';
import { Page, BookMetadata, SummaryResult, User } from './types';
import { APP_NAME, NAV_ITEMS, ADMIN_NAV_ITEMS } from './constants';
import { generateBookSummary } from './services/summarizer';
import { summaryApi, authApi } from './services/api';
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
  LogOut
} from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = authApi.getCurrentUser();
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      loadHistory();
    }
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
    const saved = localStorage.getItem(historyKey());
    if (saved) setHistory(JSON.parse(saved));
  };

  const saveToHistory = (item: SummaryResult) => {
    setHistory(prev => {
      const newHistory = [item, ...prev];
      localStorage.setItem(historyKey(), JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(h => h.id !== id);
      localStorage.setItem(historyKey(), JSON.stringify(newHistory));
      return newHistory;
    });
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
      saveToHistory(result);
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
    const content = `TITLE: ${item.metadata.title}\n\nSUMMARY:\n${item.summaryParagraphs.join('\n\n')}\n\nKEY INSIGHTS:\n${item.bulletPoints.map(b => `- ${b}`).join('\n')}`;
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
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group text-sm font-semibold bg-zinc-900/50 hover:bg-zinc-800/50 px-5 py-3 rounded-lg border border-zinc-800"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>New Summary</span>
          </button>

          <div className="card-premium p-10 md:p-14 rounded-2xl space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-zinc-800 pb-10">
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-3">{activeSummary.metadata.title}</h2>
                <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider">AI Summary • {new Date(activeSummary.timestamp).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(fullSummaryText)} className="p-3 bg-zinc-800/70 hover:bg-zinc-700/70 rounded-lg text-zinc-300 hover:text-white transition-all" title="Copy"><Copy size={20} /></button>
                <button onClick={() => downloadSummary(activeSummary)} className="p-3 btn-primary text-white rounded-lg" title="Download"><Download size={20} /></button>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-orange-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-l-4 border-orange-500 pl-4 py-1">
                  <BookText size={18} /> Summary
                </h3>
                <div className="space-y-5 bg-gradient-to-b from-zinc-900/30 to-zinc-900/50 p-8 rounded-2xl border border-zinc-800/50">
                  {activeSummary.summaryParagraphs.map((para, i) => (
                    <p key={i} className="text-zinc-100 leading-[2] text-lg font-normal text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-orange-400 indent-8">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-l-4 border-emerald-500 pl-4 py-1">
                  <CheckCircle size={18} /> Key Points
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {activeSummary.bulletPoints.map((point, idx) => (
                    <div key={idx} className="flex gap-4 p-6 bg-zinc-900/40 rounded-xl border border-zinc-800/60 items-start group hover:border-orange-500/30 hover:bg-zinc-900/60 transition-all">
                      <span className="text-orange-400 font-bold text-sm mt-1 bg-orange-500/10 px-3 py-1.5 rounded-lg min-w-[2rem] text-center">{idx + 1}</span>
                      <p className="text-zinc-200 text-[17px] leading-[1.8] flex-1 text-justify">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles size={16} strokeWidth={2.5} /> AI Powered
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">Summarize Any Document</h2>
          <p className="text-zinc-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed">Upload your files and get instant AI-powered summaries with key insights</p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium">
            <AlertCircle size={20} className="flex-shrink-0" /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card-premium p-8 md:p-10 rounded-2xl space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-300 ml-1 block">Document Title</label>
              <input type="text" required value={metadata.title} onChange={e => setMetadata({...metadata, title: e.target.value})} placeholder="Enter your document title..." className="w-full input-premium rounded-xl p-4 text-white text-base placeholder:text-zinc-500 font-medium" />
            </div>

            <div className="space-y-6 border-t border-zinc-800 pt-8">
              <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800 max-w-md mx-auto">
                {[
                  { id: 'text', icon: <FileText size={18} />, label: 'Text' },
                  { id: 'file', icon: <FileUp size={18} />, label: 'File' },
                  { id: 'url', icon: <LinkIcon size={18} />, label: 'URL' },
                ].map(mode => (
                  <button key={mode.id} type="button" onClick={() => setInputMode(mode.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${inputMode === mode.id ? 'btn-primary text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                    {mode.icon} <span>{mode.label}</span>
                  </button>
                ))}
              </div>

              {inputMode === 'text' && <textarea required value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Paste your document text here..." className="w-full input-premium rounded-xl p-6 text-white text-base min-h-[320px] resize-none placeholder:text-zinc-500 leading-relaxed font-normal" />}
              {inputMode === 'url' && <input type="url" required value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/article" className="w-full input-premium rounded-xl p-4 text-white text-base placeholder:text-zinc-500 font-medium" />}
              {inputMode === 'file' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-zinc-700 rounded-xl p-16 flex flex-col items-center gap-5 bg-zinc-900/30 hover:border-orange-500/40 hover:bg-zinc-900/50 transition-all cursor-pointer group">
                    <div className="p-5 bg-orange-500/10 rounded-2xl text-orange-500 group-hover:bg-orange-500/15 transition-all"><FileUp size={40} strokeWidth={2} /></div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-base">{fileInputName || 'Click to browse or drag & drop'}</p>
                      <p className="text-zinc-500 text-sm mt-2">PDF, DOCX, TXT • Max 50MB</p>
                    </div>
                    <input type="file" id="file-up" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
                    <label htmlFor="file-up" className="btn-primary text-white px-8 py-3 rounded-lg text-sm font-semibold cursor-pointer">Browse Files</label>
                  </div>
                  {fileInputName && textContent && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm font-medium">
                      <CheckCircle size={20} /> <span>File ready to summarize</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={isLoading || ((inputMode === 'text' || inputMode === 'file') && !textContent.trim())} className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none text-white py-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-base">
            {isLoading ? <><Loader2 className="animate-spin" size={20} /> <span>{loadingMsg}</span></> : <><Send size={20} /> <span>Generate Summary</span> <ArrowRight size={20} /></>}
          </button>
        </form>
      </div>
    );
  };

  const renderHistory = () => (
    <div style={{ width: '100%', minHeight: '80vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #f97316, #c2410c)', borderRadius: '20px', padding: '40px 32px', marginBottom: '28px', boxShadow: '0 10px 40px rgba(234,88,12,0.5)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', backgroundColor: 'white', borderRadius: '18px', marginBottom: '20px', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
          <BookOpen size={36} color="#ea580c" strokeWidth={3} />
        </div>
        <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#ffffff', margin: '0 0 12px 0', textShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'block' }}>
          📚 My Document History
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', margin: '0 0 16px 0', fontWeight: 600 }}>
          Logged in as <strong>{currentUser?.email}</strong>
        </p>
        <div style={{ display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.25)', color: '#ffffff', fontWeight: 700, fontSize: '18px', padding: '10px 28px', borderRadius: '50px' }}>
          {history.length === 0
            ? '🎯 No summaries yet — generate one!'
            : `📖 ${history.length} ${history.length === 1 ? 'Summary' : 'Summaries'}`}
        </div>
      </div>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '2px solid #fed7aa' }}>
        <HistoryList
          items={history}
          onSelect={(item) => { setActiveSummary(item); setCurrentPage(Page.UPLOAD); }}
          onDelete={deleteFromHistory}
        />
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-4xl mx-auto space-y-12 py-10">
      <div className="text-center space-y-5">
        <h2 className="text-5xl md:text-6xl font-extrabold gradient-text tracking-tight">{APP_NAME}</h2>
        <p className="text-lg text-orange-400 font-semibold uppercase tracking-wider">AI Document Intelligence</p>
      </div>
      <div className="card-premium p-10 md:p-12 rounded-2xl space-y-8">
        <p className="text-zinc-300 text-xl font-normal leading-relaxed">Transform your documents into <span className="text-white font-bold gradient-text">actionable insights</span> using cutting-edge AI technology.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-800 pt-8">
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2.5"><FileText className="text-orange-400" size={22} /> Multi-Format Support</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">Process PDF, DOCX, and TXT files with intelligent text extraction and formatting.</p>
          </div>
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2.5"><Sparkles className="text-orange-400" size={22} /> BERT AI Model</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">Powered by state-of-the-art transformers for precise extractive summarization.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => <UsersList />;

  return (
    <>
      {!isAuthenticated ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <div className="flex text-slate-100 min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
          <Sidebar 
            currentPage={currentPage} 
            onPageChange={(p) => { setCurrentPage(p); setActiveSummary(null); }}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          <main
            className="flex-1 md:ml-64 p-8 md:p-16 pb-32 md:pb-16 min-h-screen"
            style={currentPage === Page.HISTORY ? { backgroundColor: '#fff7ed' } : {}}
          >
            {/* Mobile user header */}
            {currentUser && (
              <div className="md:hidden mb-6 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <UserIcon size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{currentUser.name}</p>
                    <p className="text-zinc-500 text-xs truncate">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-all text-sm font-semibold"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
            {currentPage === Page.UPLOAD && renderUpload()}
            {currentPage === Page.HISTORY && renderHistory()}
            {currentPage === Page.USERS && renderUsers()}
            {currentPage === Page.ABOUT && renderAbout()}
          </main>
          <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-zinc-800 flex justify-around p-4 z-50">
            {(currentUser?.role === 'admin' ? ADMIN_NAV_ITEMS : NAV_ITEMS).map(item => (
              <button 
                key={item.id} 
                onClick={() => { setCurrentPage(item.id as Page); setActiveSummary(null); }} 
                className={`p-3 rounded-lg transition-all ${currentPage === item.id ? 'text-orange-400 bg-orange-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
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
