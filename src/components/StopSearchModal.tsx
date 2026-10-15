import React, { useState } from 'react';
import { BusStop } from '../types/bus';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';

interface StopSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStop: (stop: BusStop) => void;
  stops?: BusStop[];
}

export const StopSearchModal: React.FC<StopSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStop,
  stops = [],
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const clean = query.trim().toLowerCase();
  const matched = clean
    ? stops.filter(
        (s) =>
          s.BusStopCode.toLowerCase().includes(clean) ||
          s.Description.toLowerCase().includes(clean) ||
          s.RoadName.toLowerCase().includes(clean)
      )
    : stops.slice(0, 10);

  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const code = query.trim();
      const existing = stops.find((s) => s.BusStopCode === code);
      if (existing) {
        onSelectStop(existing);
      } else {
        onSelectStop({
          BusStopCode: code,
          RoadName: 'Singapore',
          Description: `Bus Stop ${code}`,
          Latitude: 1.3044,
          Longitude: 103.8318,
        });
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <form onSubmit={handleDirectSearch} className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any LTA BusStopCode (e.g. 83139) & press Enter..."
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm sm:text-base focus:outline-none"
          />
          <button
            type="submit"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition-colors"
          >
            <span>Query</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-800/60 p-2">
          {matched.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              <p>No cached stop with code or name "{query}".</p>
              <button
                onClick={handleDirectSearch}
                className="mt-2 text-xs text-emerald-400 hover:underline font-mono"
              >
                Press Enter to query BusStopCode "{query}" directly via LTA API →
              </button>
            </div>
          ) : (
            matched.slice(0, 15).map((stop) => (
              <button
                key={stop.BusStopCode}
                onClick={() => {
                  onSelectStop(stop);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                      {stop.BusStopCode}
                    </span>
                    <span className="text-xs text-slate-400 truncate">{stop.RoadName}</span>
                  </div>
                  <div className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                    {stop.Description}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Footer tip */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <span>Example: Query documentation stop <strong>83139</strong></span>
          <span className="font-mono text-[10px]">ESC to close</span>
        </div>
      </div>
    </div>
  );
};
