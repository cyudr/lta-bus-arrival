import React from 'react';
import { BookmarkItem, BusStop } from '../types/bus';
import { BusService } from '../services/busService';
import { Star, Trash2, ArrowRight, MapPin, Bus } from 'lucide-react';

interface BookmarksListProps {
  bookmarks: BookmarkItem[];
  onSelectStop: (stop: BusStop) => void;
  onRemoveBookmark: (busStopCode: string) => void;
  selectedStopCode?: string;
}

export const BookmarksList: React.FC<BookmarksListProps> = ({
  bookmarks,
  onSelectStop,
  onRemoveBookmark,
  selectedStopCode,
}) => {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <div className="p-3 rounded-full bg-slate-800/80 mb-3 text-slate-500">
          <Star className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-200 mb-1">No Bookmarked Stops Yet</h4>
        <p className="text-xs text-slate-400 max-w-xs">
          Click the star icon on any bus stop to bookmark your frequent commuter hubs for rapid arrival checks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between px-1 mb-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Saved Bus Stops ({bookmarks.length})
        </h3>
      </div>

      {bookmarks.map((bm) => {
        const stop = BusService.getStopByCode(bm.busStopCode);
        const isSelected = selectedStopCode === bm.busStopCode;

        return (
          <div
            key={bm.id}
            className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
              isSelected
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <button
              onClick={() => {
                if (stop) onSelectStop(stop);
              }}
              className="min-w-0 text-left flex-1 group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  {bm.busStopCode}
                </span>
                {bm.customLabel && (
                  <span className="text-xs text-amber-300 font-medium truncate">
                    {bm.customLabel}
                  </span>
                )}
              </div>

              <div className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                {stop?.Description || `Stop ${bm.busStopCode}`}
              </div>
              <div className="text-xs text-slate-400 truncate mt-0.5">
                {stop?.RoadName || 'Singapore'}
              </div>

              {stop?.services && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {stop.services.slice(0, 6).map((srv) => (
                    <span
                      key={srv}
                      className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono"
                    >
                      {srv}
                    </span>
                  ))}
                  {stop.services.length > 6 && (
                    <span className="text-[10px] text-slate-500 self-center">
                      +{stop.services.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => onRemoveBookmark(bm.busStopCode)}
              title="Remove from bookmarks"
              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
