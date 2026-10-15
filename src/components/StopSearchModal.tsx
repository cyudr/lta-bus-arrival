import React, { useState } from 'react';
import { BusStop } from '../types/bus';
import { BusService } from '../services/busService';
import { Search, X, MapPin, Bus, ArrowRight } from 'lucide-react';

interface StopSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStop: (stop: BusStop) => void;
}

export const StopSearchModal: React.FC<StopSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStop,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = BusService.searchStops(query).slice(0, 15);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stop code, road, landmark, or bus service..."
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm sm:text-base focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-800/60 p-2">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No Singapore bus stops found for "{query}".
            </div>
          ) : (
            results.map((stop) => (
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
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                    <Bus className="w-3 h-3 text-slate-500" />
                    <span>{stop.services.slice(0, 8).join(', ')}{stop.services.length > 8 ? '...' : ''}</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Footer tip */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <span>Tip: Try typing "190", "Bugis", or "09048"</span>
          <span className="font-mono text-[10px]">ESC to close</span>
        </div>
      </div>
    </div>
  );
};
