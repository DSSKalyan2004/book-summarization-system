
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
      <div className="relative overflow-hidden min-h-[600px] flex items-center justify-center">
        {/* Decorative background elements - VERY VISIBLE */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400/5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Main empty state card - ULTRA VISIBLE */}
        <div className="relative text-center py-32 px-12 w-full max-w-4xl border-4 border-dashed border-orange-400/60 rounded-3xl bg-zinc-800 shadow-2xl shadow-orange-500/20">
          {/* Icon with glow effect - HUGE AND BRIGHT */}
          <div className="inline-flex p-12 bg-gradient-to-br from-orange-500/40 to-orange-600/40 rounded-full mb-10 border-4 border-orange-500/60 shadow-2xl shadow-orange-500/40 relative animate-pulse">
            <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-3xl"></div>
            <BookOpen size={96} className="text-orange-400 relative z-10" strokeWidth={3} />
          </div>
          
          {/* Text content - WHITE AND LARGE */}
          <div className="space-y-6 mb-10">
            <h3 className="text-white text-6xl font-extrabold drop-shadow-lg">No Documents Yet</h3>
            <p className="text-white text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
              Start your journey by uploading and summarizing your first document.
            </p>
            <p className="text-orange-300 text-xl">
              All your summaries will be saved here for easy access.
            </p>
          </div>
          
          {/* Call to action - BRIGHT BUTTON */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 mb-12">
            <div className="inline-flex items-center gap-4 px-10 py-6 bg-gradient-to-r from-orange-500/30 to-orange-600/30 border-4 border-orange-500/60 rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all cursor-pointer hover:scale-105">
              <BookOpen size={32} className="text-orange-400" strokeWidth={3} />
              <span className="text-white text-xl font-extrabold">Upload a document to begin</span>
            </div>
          </div>
          
          {/* Feature highlights - VISIBLE CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-6 bg-zinc-700 rounded-2xl border-2 border-orange-500/30 shadow-lg">
              <div className="text-5xl mb-3">📄</div>
              <p className="text-white text-base font-bold">PDF & Text Files</p>
            </div>
            <div className="p-6 bg-zinc-700 rounded-2xl border-2 border-orange-500/30 shadow-lg">
              <div className="text-5xl mb-3">⚡</div>
              <p className="text-white text-base font-bold">AI-Powered Summaries</p>
            </div>
            <div className="p-6 bg-zinc-700 rounded-2xl border-2 border-orange-500/30 shadow-lg">
              <div className="text-5xl mb-3">💾</div>
              <p className="text-white text-base font-bold">Auto-Saved History</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div 
          key={item.id}
          className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-4 border-zinc-700 hover:border-orange-500/80 group flex items-center justify-between p-8 rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden shadow-2xl hover:shadow-orange-500/30 hover:scale-[1.03]"
          onClick={() => onSelect(item)}
        >
          {/* Hover effect overlay - BRIGHT */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="flex items-center gap-6 relative z-10 flex-1 min-w-0">
            {/* Icon - LARGE AND BRIGHT */}
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500/40 to-orange-600/40 flex items-center justify-center text-orange-400 border-4 border-orange-500/60 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/30">
              <BookOpen size={36} strokeWidth={3} />
            </div>
            
            {/* Content - LARGE TEXT */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-extrabold text-2xl group-hover:text-orange-400 transition-colors truncate mb-2">
                {item.metadata.title}
              </h3>
              <div className="flex items-center gap-5 text-base text-zinc-300">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-orange-400" />
                  <span className="font-semibold">{new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className="text-zinc-600 text-2xl">•</span>
                <span className="font-bold text-orange-400 text-lg">{item.wordCount.toLocaleString()} words</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons - LARGER */}
          <div className="flex items-center gap-4 relative z-10">
             <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-4 text-red-400 hover:bg-red-500/30 hover:text-red-300 rounded-2xl transition-all border-2 border-transparent hover:border-red-500/50 shadow-lg"
              title="Delete summary"
            >
              <Trash2 size={24} strokeWidth={2.5} />
            </button>
            <ChevronRight className="text-orange-400 group-hover:translate-x-3 transition-transform duration-300" size={32} strokeWidth={3} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
