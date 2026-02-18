
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
      <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-xl">
        <div className="inline-flex p-5 bg-orange-500/10 rounded-2xl mb-4">
          <BookOpen size={40} className="text-orange-400" strokeWidth={2} />
        </div>
        <p className="text-zinc-300 text-base font-semibold">No history found</p>
        <p className="text-zinc-500 text-sm mt-1.5">Start by summarizing a document</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div 
          key={item.id}
          className="card-premium group flex items-center justify-between p-5 rounded-xl cursor-pointer hover:border-orange-500/20 transition-all relative overflow-hidden"
          onClick={() => onSelect(item)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/5 to-orange-600/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base group-hover:text-orange-400 transition-colors">
                {item.metadata.title}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-orange-400" />
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <span>•</span>
                <span>{item.wordCount} words</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
             <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-2.5 text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-lg transition-all"
            >
              <Trash2 size={16} />
            </button>
            <ChevronRight className="text-orange-400 group-hover:translate-x-1 transition-transform" size={18} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
