import React from 'react';
import { SummaryResult } from '../types';
import { Calendar, ChevronRight, Trash2, FileText, Clock, Sparkles } from 'lucide-react';

interface HistoryListProps {
  items: SummaryResult[];
  onSelect: (item: SummaryResult) => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ items, onSelect, onDelete }) => {
  if (items.length === 0) {
    return (
      <div style={{ minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '20px', background: 'linear-gradient(135deg, #0B3C5D 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(11,60,93,0.3)' }}>
            <FileText size={38} color="#fff" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0B3C5D', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>No summaries yet</h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 32px 0', lineHeight: 1.7 }}>
            Generate your first AI summary and it will appear here automatically, stored in the cloud.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { color: '#0B3C5D', bg: 'rgba(11,60,93,0.07)',   border: 'rgba(11,60,93,0.18)',   emoji: '📄', label: 'PDF, DOCX, TXT' },
              { color: '#1D4ED8', bg: 'rgba(29,78,216,0.07)',  border: 'rgba(29,78,216,0.2)',   emoji: '⚡', label: 'BERT AI Engine' },
              { color: '#15803D', bg: 'rgba(21,128,61,0.07)',  border: 'rgba(21,128,61,0.2)',   emoji: '☁️', label: 'Cloud Storage' },
            ].map(({ color, bg, border, emoji, label }) => (
              <div key={label} style={{ padding: '16px 10px', background: bg, border: `1px solid ${border}`, borderRadius: '10px' }}>
                <div style={{ fontSize: '26px', marginBottom: '8px' }}>{emoji}</div>
                <p style={{ fontSize: '11px', fontWeight: 700, color, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          style={{
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            animationDelay: `${idx * 0.04}s`,
            boxShadow: '0 1px 4px rgba(11,60,93,0.06)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = 'rgba(29,78,216,0.35)';
            el.style.boxShadow = '0 4px 16px rgba(11,60,93,0.12)';
            el.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = '#E5E7EB';
            el.style.boxShadow = '0 1px 4px rgba(11,60,93,0.06)';
            el.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'linear-gradient(135deg, #0B3C5D, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 10px rgba(11,60,93,0.28)' }}>
            <FileText size={21} color="#fff" strokeWidth={1.8} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B3C5D', margin: '0 0 5px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.metadata.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={12} color="#1D4ED8" />
                <span style={{ fontWeight: 600, color: '#6B7280' }}>{new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={12} color="#15803D" />
                <span style={{ fontWeight: 600, color: '#6B7280' }}>{item.wordCount.toLocaleString()} words</span>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 9px', background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.22)', borderRadius: '6px', color: '#15803D', fontWeight: 700, fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <Sparkles size={9} /> AI Summary
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onDelete(item.id); }}
              title="Delete"
              style={{ padding: '8px', background: 'transparent', border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer', color: '#D1D5DB', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(220,38,38,0.07)'; b.style.borderColor = 'rgba(220,38,38,0.25)'; b.style.color = '#dc2626'; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.borderColor = 'transparent'; b.style.color = '#D1D5DB'; }}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
            <div style={{ padding: '8px', color: '#9CA3AF' }}>
              <ChevronRight size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
