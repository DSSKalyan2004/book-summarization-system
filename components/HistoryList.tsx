
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
      <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
        <p className="text-indigo-200 opacity-60">No history found. Start by summarizing a document!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div 
          key={item.id}
          className="glass-card group flex items-center justify-between p-5 rounded-2xl cursor-pointer"
          onClick={() => onSelect(item)}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold group-hover:text-indigo-300 transition-colors">
                {item.metadata.title}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-indigo-200/50">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            >
              <Trash2 size={18} />
            </button>
            <ChevronRight className="text-indigo-400" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
