import React, { useState, useMemo } from 'react';
import { SummaryResult } from '../types';
import {
  Calendar, ChevronRight, Trash2, FileText, Clock,
  Sparkles, Search, SortAsc, SortDesc, BookOpen, Zap, Database, Eye
} from 'lucide-react';

interface HistoryListProps {
  items: SummaryResult[];
  onSelect: (item: SummaryResult) => void;
  onDelete: (id: string) => void;
}

const GRADIENTS = [
  'linear-gradient(135deg, #0B3C5D, #1D4ED8)',
  'linear-gradient(135deg, #1D4ED8, #0284c7)',
  'linear-gradient(135deg, #15803D, #0B3C5D)',
  'linear-gradient(135deg, #7c3aed, #1D4ED8)',
  'linear-gradient(135deg, #0284c7, #15803D)',
  'linear-gradient(135deg, #0B3C5D, #7c3aed)',
];

function readingTime(wordCount: number) {
  const mins = Math.ceil(wordCount / 200);
  return mins === 1 ? '1 min read' : `${mins} min read`;
}

function timeAgo(ts: number) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function wordCountLabel(wc: number): { label: string; color: string; bg: string; border: string } {
  if (wc < 2000)  return { label: 'Short',  color: '#15803D', bg: 'rgba(21,128,61,0.08)',  border: 'rgba(21,128,61,0.22)' };
  if (wc < 8000)  return { label: 'Medium', color: '#0284c7', bg: 'rgba(2,132,199,0.08)',  border: 'rgba(2,132,199,0.22)' };
  if (wc < 20000) return { label: 'Long',   color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.22)' };
  return { label: 'Book',   color: '#0B3C5D', bg: 'rgba(11,60,93,0.08)',  border: 'rgba(11,60,93,0.22)' };
}

const HistoryList: React.FC<HistoryListProps> = ({ items, onSelect, onDelete }) => {
  const [query, setQuery] = useState('');
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    let list = [...items];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(i => i.metadata.title.toLowerCase().includes(q) || i.bulletPoints.some(b => b.toLowerCase().includes(q)));
    }
    list.sort((a, b) => sortDesc ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return list;
  }, [items, query, sortDesc]);

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '520px' }}>
          {/* Animated icon */}
          <div style={{ width: '96px', height: '96px', borderRadius: '24px', background: 'linear-gradient(135deg, #0B3C5D 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 32px rgba(11,60,93,0.25)', position: 'relative' }}>
            <BookOpen size={42} color="#fff" strokeWidth={1.5} />
            <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', background: '#1D4ED8', borderRadius: '50%', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={10} color="#fff" />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#0B3C5D', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>No summaries yet</h3>
          <p style={{ fontSize: '15px', color: '#6B7280', margin: '0 0 36px 0', lineHeight: 1.75 }}>
            Upload a PDF, DOCX, or paste a URL and generate your first AI-powered summary. It will appear here automatically.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {[
              { icon: <FileText size={20} />, color: '#0B3C5D', bg: 'rgba(11,60,93,0.07)',  border: 'rgba(11,60,93,0.15)',  label: 'PDF · DOCX · TXT', sub: 'Upload files' },
              { icon: <Zap      size={20} />, color: '#1D4ED8', bg: 'rgba(29,78,216,0.07)', border: 'rgba(29,78,216,0.15)', label: 'BERT AI Engine', sub: 'Instant analysis' },
              { icon: <Database size={20} />, color: '#15803D', bg: 'rgba(21,128,61,0.07)', border: 'rgba(21,128,61,0.15)', label: 'Cloud Storage', sub: 'Always synced' },
            ].map(({ icon, color, bg, border, label, sub }) => (
              <div key={label} style={{ padding: '20px 12px', background: bg, border: `1.5px solid ${border}`, borderRadius: '14px', transition: 'all 0.2s' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color }}>{icon}</div>
                <p style={{ fontSize: '12px', fontWeight: 800, color, margin: '0 0 3px 0' }}>{label}</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search summaries…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '10px',
              padding: '10px 14px 10px 36px', fontSize: '14px', color: '#0B3C5D', outline: 'none',
              fontWeight: 500, boxSizing: 'border-box', transition: 'all 0.18s',
            }}
            onFocus={e => { e.target.style.background = '#ffffff'; e.target.style.borderColor = '#1D4ED8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.1)'; }}
            onBlur={e => { e.target.style.background = '#F9FAFB'; e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        {/* Sort */}
        <button
          onClick={() => setSortDesc(s => !s)}
          title={sortDesc ? 'Newest first' : 'Oldest first'}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: sortDesc ? 'rgba(11,60,93,0.07)' : 'rgba(29,78,216,0.08)', border: `1.5px solid ${sortDesc ? 'rgba(11,60,93,0.18)' : 'rgba(29,78,216,0.25)'}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: sortDesc ? '#0B3C5D' : '#1D4ED8', transition: 'all 0.18s', flexShrink: 0 }}
        >
          {sortDesc ? <SortDesc size={15} /> : <SortAsc size={15} />}
          {sortDesc ? 'Newest' : 'Oldest'}
        </button>
        {/* Count badge */}
        <div style={{ padding: '10px 16px', background: 'linear-gradient(135deg, rgba(11,60,93,0.07), rgba(29,78,216,0.07))', border: '1.5px solid rgba(11,60,93,0.15)', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#0B3C5D', flexShrink: 0 }}>
          {filtered.length} {filtered.length === 1 ? 'doc' : 'docs'}
        </div>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF' }}>
          <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>No results for "{query}"</p>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((item, idx) => {
          const wc = wordCountLabel(item.wordCount);
          const grad = GRADIENTS[idx % GRADIENTS.length];
          const preview = item.bulletPoints[0] || item.summaryParagraphs[0]?.slice(0, 120) || '';

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #E5E7EB',
                borderRadius: '16px',
                padding: '0',
                display: 'flex',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(11,60,93,0.05)',
                overflow: 'hidden',
                position: 'relative',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = 'rgba(29,78,216,0.3)';
                el.style.boxShadow = '0 8px 28px rgba(11,60,93,0.13)';
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = '#E5E7EB';
                el.style.boxShadow = '0 2px 8px rgba(11,60,93,0.05)';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Left gradient accent bar */}
              <div style={{ width: '5px', flexShrink: 0, background: grad, borderRadius: '0' }} />

              {/* Main content */}
              <div style={{ flex: 1, padding: '18px 20px', minWidth: 0 }}>
                {/* Top row: icon + title + badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '10px' }}>
                  {/* Number badge */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 10px rgba(11,60,93,0.2)', fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0B3C5D', margin: '0 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                      {item.metadata.title}
                    </h3>
                    {/* Badges row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.2)', borderRadius: '6px', color: '#1D4ED8', fontWeight: 700, fontSize: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        <Sparkles size={9} /> AI Summary
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', background: wc.bg, border: `1px solid ${wc.border}`, borderRadius: '6px', color: wc.color, fontWeight: 700, fontSize: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {wc.label}
                      </span>
                      {item.bulletPoints.length > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', background: 'rgba(21,128,61,0.07)', border: '1px solid rgba(21,128,61,0.2)', borderRadius: '6px', color: '#15803D', fontWeight: 700, fontSize: '10px' }}>
                          {item.bulletPoints.length} key points
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview bullet */}
                {preview && (
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 12px 0', lineHeight: 1.6, paddingLeft: '54px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {preview.length > 140 ? preview.slice(0, 140) + '…' : preview}
                  </p>
                )}

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#9CA3AF', paddingLeft: '54px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={11} color="#1D4ED8" />
                    <span style={{ fontWeight: 600, color: '#6B7280' }}>{timeAgo(item.timestamp)}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FileText size={11} color="#0B3C5D" />
                    <span style={{ fontWeight: 600, color: '#6B7280' }}>{item.wordCount.toLocaleString()} words</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={11} color="#15803D" />
                    <span style={{ fontWeight: 600, color: '#6B7280' }}>{readingTime(item.wordCount)}</span>
                  </span>
                  {item.processingTime > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Zap size={11} color="#f59e0b" />
                      <span style={{ fontWeight: 600, color: '#6B7280' }}>{(item.processingTime / 1000).toFixed(1)}s processed</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right actions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '16px 14px', flexShrink: 0, borderLeft: '1px solid #F3F4F6' }}>
                <button
                  onClick={e => { e.stopPropagation(); onSelect(item); }}
                  title="View summary"
                  style={{ width: '36px', height: '36px', background: 'rgba(29,78,216,0.07)', border: '1.5px solid rgba(29,78,216,0.18)', borderRadius: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#1D4ED8'; b.style.color = '#fff'; }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(29,78,216,0.07)'; b.style.color = '#1D4ED8'; }}
                >
                  <Eye size={15} strokeWidth={2} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(item.id); }}
                  title="Delete"
                  style={{ width: '36px', height: '36px', background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.15)', borderRadius: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(239,68,68,0.12)'; b.style.borderColor = 'rgba(239,68,68,0.3)'; b.style.color = '#dc2626'; }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(239,68,68,0.06)'; b.style.borderColor = 'rgba(239,68,68,0.15)'; b.style.color = '#fca5a5'; }}
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
                <div style={{ padding: '4px', color: '#D1D5DB' }}>
                  <ChevronRight size={14} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryList;
