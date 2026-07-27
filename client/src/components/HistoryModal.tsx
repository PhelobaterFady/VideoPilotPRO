import React from 'react';
import type { HistoryItem } from '../types';
import { X, Trash2, Download, ExternalLink, Calendar } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';

interface HistoryModalProps {
  history: HistoryItem[];
  onClose: () => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onClearHistory }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-card rounded-3xl p-6 border border-white/10 shadow-2xl relative max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-slate-100">سجل التحميلات السابقة ({history.length})</h3>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                title="مسح السجل"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">لا يوجد سوابق تنزيل حتى الآن</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 truncate">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-slate-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center flex-shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                  )}
                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <PlatformBadge platform={item.platform} showText={false} />
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.downloadDate).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex-shrink-0"
                  title="فتح الرابط الأصل"
                >
                  <ExternalLink className="w-4 h-4 text-violet-400" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
