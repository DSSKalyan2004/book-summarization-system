
import React from 'react';
import { SummaryResult } from '../types';
import { BookOpen, Calendar, ChevronRight, Trash2 } from 'lucide-react';

interface HistoryListProps {
  items: SummaryResult[];
  onSelect: (item: SummaryResult) => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ items, onSelect, onDelete }) => {
  if (items.length === 0) {
    return (
      <div style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ed', borderRadius: '16px', padding: '48px' }}>
        {/* EMPTY STATE */}
        <div style={{ textAlign: 'center', padding: '60px 40px', width: '100%', maxWidth: '700px', border: '4px dashed #f97316', borderRadius: '20px', backgroundColor: '#ffffff' }}>
          {/* ICON */}
          <div style={{ display: 'inline-flex', padding: '32px', backgroundColor: '#ea580c', borderRadius: '50%', marginBottom: '28px', boxShadow: '0 10px 30px rgba(234,88,12,0.4)' }}>
            <BookOpen size={72} color="white" strokeWidth={3} />
          </div>

          {/* TEXT */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '42px', fontWeight: 900, color: '#431407', margin: '0 0 12px 0' }}>No Documents Yet</h3>
            <p style={{ fontSize: '18px', color: '#7c2d12', fontWeight: 600, maxWidth: '500px', margin: '0 auto 8px', lineHeight: 1.6 }}>
              Start by uploading and summarizing your first document.
            </p>
            <p style={{ fontSize: '16px', color: '#9a3412', fontWeight: 500 }}>
              All your summaries will be saved here!
            </p>
          </div>

          {/* BUTTON */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', backgroundColor: '#ea580c', color: 'white', borderRadius: '12px', boxShadow: '0 6px 20px rgba(234,88,12,0.5)', cursor: 'pointer', fontWeight: 700, fontSize: '17px', marginBottom: '32px' }}>
            <BookOpen size={22} color="white" strokeWidth={3} />
            <span>Upload a Document to Begin</span>
          </div>

          {/* FEATURE CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ padding: '20px', backgroundColor: '#fff7ed', borderRadius: '12px', border: '2px solid #fb923c' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
              <p style={{ color: '#7c2d12', fontWeight: 700, fontSize: '14px', margin: 0 }}>PDF & Text Files</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fff7ed', borderRadius: '12px', border: '2px solid #fb923c' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
              <p style={{ color: '#7c2d12', fontWeight: 700, fontSize: '14px', margin: 0 }}>AI-Powered</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fff7ed', borderRadius: '12px', border: '2px solid #fb923c' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💾</div>
              <p style={{ color: '#7c2d12', fontWeight: 700, fontSize: '14px', margin: 0 }}>Auto-Saved</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          style={{ backgroundColor: '#ffffff', border: '2px solid #fed7aa', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#f97316'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(249,115,22,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#fed7aa'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; }}
        >
          {/* Icon */}
          <div style={{ width: '56px', height: '56px', backgroundColor: '#ea580c', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(234,88,12,0.35)' }}>
            <BookOpen size={26} color="white" strokeWidth={3} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0, marginLeft: '16px', marginRight: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1c1917', margin: '0 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.metadata.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#78350f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} color="#ea580c" />
                <span style={{ fontWeight: 600 }}>{new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <span style={{ color: '#fb923c' }}>•</span>
              <span style={{ fontWeight: 700, color: '#ea580c' }}>{item.wordCount.toLocaleString()} words</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onDelete(item.id); }}
              title="Delete"
              style={{ padding: '8px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fef2f2')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
            >
              <Trash2 size={20} strokeWidth={2.5} />
            </button>
            <ChevronRight size={22} color="#ea580c" strokeWidth={3} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
