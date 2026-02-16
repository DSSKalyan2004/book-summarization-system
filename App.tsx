
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { Page, BookMetadata, SummaryResult } from './types';
import { APP_NAME, NAV_ITEMS } from './constants';
import { generateBookSummary } from './services/summarizer';
import { summaryApi } from './services/api';
import HistoryList from './components/HistoryList';
import { 
  FileUp, 
  BookText, 
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
  ArrowRight
} from 'lucide-react';

declare const mammoth: any;
declare const pdfjsLib: any;

const App: React.FC = () => {
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

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const summaries = await summaryApi.getAll();
      setHistory(summaries);
    } catch (error) {
      console.error('Failed to load history:', error);
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem('summ_ai_history');
      if (saved) setHistory(JSON.parse(saved));
    }
  };

  const saveToHistory = async (item: SummaryResult) => {
    try {
      await summaryApi.create(item);
      const newHistory = [item, ...history];
      setHistory(newHistory);
    } catch (error) {
      console.error('Failed to save to database:', error);
      // Fallback to localStorage if API fails
      const newHistory = [item, ...history];
      setHistory(newHistory);
      localStorage.setItem('summ_ai_history', JSON.stringify(newHistory));
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      await summaryApi.delete(id);
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
    } catch (error) {
      console.error('Failed to delete from database:', error);
      // Fallback to localStorage if API fails
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem('summ_ai_history', JSON.stringify(newHistory));
    }
  };

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileInputName(file.name);
    setError(null);
    setIsLoading(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        setTextContent(await extractTextFromPDF(arrayBuffer));
        setInputMode('text');
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setTextContent(result.value);
        setInputMode('text');
      } else if (extension === 'txt') {
        setTextContent(await file.text());
        setInputMode('text');
      } else {
        throw new Error("Format not supported. Use .pdf, .docx, or .txt");
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse file.");
    } finally {
      setIsLoading(false);
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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
          <button 
            onClick={() => setActiveSummary(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors group text-sm font-semibold"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            New Summary
          </button>

          <div className="card-premium p-8 md:p-14 rounded-[2.5rem] space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/5 pb-10">
              <div className="flex-1">
                <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">{activeSummary.metadata.title}</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4">Synthesized Report • {new Date(activeSummary.timestamp).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(fullSummaryText)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all" title="Copy Summary"><Copy size={22} /></button>
                <button onClick={() => downloadSummary(activeSummary)} className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white transition-all shadow-lg shadow-indigo-950/20" title="Download Text File"><Download size={22} /></button>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-indigo-400 text-[0.65rem] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <BookText size={14} /> Comprehensive Synthesis
                </h3>
                <div className="space-y-8">
                  {activeSummary.summaryParagraphs.map((para, i) => (
                    <p key={i} className="text-slate-100 leading-[2] text-[1.0625rem] font-light tracking-wide text-justify indent-8 first-letter:text-2xl first-letter:font-semibold first-letter:text-indigo-300">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-white/5">
                <h3 className="text-emerald-400 text-[0.65rem] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <CheckCircle size={14} /> Key Points
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {activeSummary.bulletPoints.map((point, idx) => (
                    <div key={idx} className="flex gap-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5 items-start group hover:border-indigo-500/20 transition-all">
                      <span className="text-indigo-500/50 group-hover:text-indigo-400 font-bold text-sm leading-none transition-colors mt-0.5">{String(idx + 1).padStart(2, '0')}</span>
                      <p className="text-slate-300 text-[15px] leading-relaxed flex-1">{point}</p>
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
      <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in zoom-in duration-500">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[0.65rem] font-black uppercase tracking-widest mb-2">
            <Sparkles size={12} /> AI Powered
          </div>
          <h2 className="text-5xl font-extrabold text-white tracking-tight">Summarize Any Document.</h2>
          <p className="text-slate-400 text-lg">High-fidelity synthesis in exactly two paragraphs.</p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card-premium p-8 md:p-10 rounded-[2.5rem] space-y-8">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest ml-1">Document Title</label>
              <input type="text" required value={metadata.title} onChange={e => setMetadata({...metadata, title: e.target.value})} placeholder="e.g. Sapiens" className="w-full input-premium rounded-2xl p-4 text-white placeholder:text-slate-700 outline-none" />
            </div>

            <div className="space-y-6 border-t border-white/5 pt-8">
              <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 max-w-sm mx-auto">
                {[
                  { id: 'text', icon: <FileText size={16} />, label: 'Text' },
                  { id: 'file', icon: <FileUp size={16} />, label: 'File' },
                  { id: 'url', icon: <LinkIcon size={16} />, label: 'URL' },
                ].map(mode => (
                  <button key={mode.id} type="button" onClick={() => setInputMode(mode.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${inputMode === mode.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>

              {inputMode === 'text' && <textarea required value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Paste chapters or full text here..." className="w-full input-premium rounded-3xl p-6 text-white min-h-[300px] outline-none resize-none placeholder:text-slate-800 text-lg leading-relaxed" />}
              {inputMode === 'url' && <input type="url" required value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." className="w-full input-premium rounded-2xl p-5 text-white outline-none" />}
              {inputMode === 'file' && (
                <div className="border-2 border-dashed border-white/5 rounded-3xl p-16 flex flex-col items-center gap-4 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform"><FileUp size={32} /></div>
                  <div className="text-center">
                    <p className="text-white font-bold">{fileInputName || 'Choose PDF, DOCX, or TXT'}</p>
                    <p className="text-slate-500 text-xs mt-1">Up to 50MB per document</p>
                  </div>
                  <input type="file" id="file-up" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
                  <label htmlFor="file-up" className="bg-white text-slate-950 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-slate-200">Browse Files</label>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={isLoading || (inputMode === 'text' && !textContent.trim())} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all font-black text-lg uppercase tracking-widest shadow-xl shadow-indigo-950/20 active:scale-[0.98]">
            {isLoading ? <><Loader2 className="animate-spin" size={20} /> {loadingMsg}</> : <><Send size={18} /> Summarize with BERT AI <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header><h2 className="text-4xl font-extrabold text-white tracking-tight">Your History</h2><p className="text-slate-400 text-lg">Retrieve previously generated summaries.</p></header>
      <HistoryList items={history} onSelect={(item) => { setActiveSummary(item); setCurrentPage(Page.UPLOAD); }} onDelete={deleteFromHistory} />
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 py-10">
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-black text-white tracking-tighter uppercase">{APP_NAME}</h2>
        <p className="text-xl text-indigo-400 font-bold uppercase tracking-[0.3em]">Pure Document Intelligence</p>
      </div>
      <div className="card-premium p-12 rounded-[4rem] space-y-8 leading-relaxed">
        <p className="text-slate-300 text-2xl font-light">The most efficient way to digest large volumes of information. <span className="text-white font-medium">SummAI</span> converts thousands of pages into actionable strategic insights using advanced AI.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-10">
          <div><h4 className="text-white font-bold text-lg mb-2">Multi-Format</h4><p className="text-slate-500 text-sm">PDF, DOCX, and Text file extraction with lossless semantic preservation.</p></div>
          <div><h4 className="text-white font-bold text-lg mb-2">BERT AI Model</h4><p className="text-slate-500 text-sm">Powered by state-of-the-art BERT transformers running directly in your browser for intelligent extractive summarization.</p></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex text-slate-100 min-h-screen">
      <Sidebar currentPage={currentPage} onPageChange={(p) => { setCurrentPage(p); setActiveSummary(null); }} />
      <main className="flex-1 md:ml-64 p-6 md:p-16 pb-32 md:pb-16 bg-[#030712]/50">
        {currentPage === Page.UPLOAD && renderUpload()}
        {currentPage === Page.HISTORY && renderHistory()}
        {currentPage === Page.ABOUT && renderAbout()}
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 flex justify-around p-5 z-50">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => { setCurrentPage(item.id as Page); setActiveSummary(null); }} className={`p-3 rounded-2xl transition-all ${currentPage === item.id ? 'text-indigo-400 bg-white/5' : 'text-slate-500'}`}>{item.icon}</button>
        ))}
      </nav>
    </div>
  );
};

export default App;
