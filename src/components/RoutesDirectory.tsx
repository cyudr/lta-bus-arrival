import React, { useState } from 'react';
import { BusRoute } from '../types/bus';
import { POPULAR_BUS_SERVICES } from '../data/singaporeBuses';
import { Route, ArrowRight, Clock, Search, ChevronRight, Bus } from 'lucide-react';

interface RoutesDirectoryProps {
  onSelectRoute: (route: BusRoute) => void;
  activeRouteServiceNo?: string;
}

export const RoutesDirectory: React.FC<RoutesDirectoryProps> = ({
  onSelectRoute,
  activeRouteServiceNo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoutes = POPULAR_BUS_SERVICES.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.ServiceNo.toLowerCase().includes(q) ||
      r.OriginName.toLowerCase().includes(q) ||
      r.DestinationName.toLowerCase().includes(q) ||
      r.Operator.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bus service or destination..."
          className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Routes List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Singapore Trunk & Express Services ({filteredRoutes.length})
        </h3>

        {filteredRoutes.map((route) => {
          const isActive = activeRouteServiceNo === route.ServiceNo;

          return (
            <button
              key={route.ServiceNo}
              onClick={() => onSelectRoute(route)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isActive
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xl font-black text-slate-100">
                    {route.ServiceNo}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {route.Operator}
                  </span>
                  <span className="text-[11px] text-emerald-400/90 font-medium">
                    {route.Category}
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
                  <span className="truncate">{route.OriginName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{route.DestinationName}</span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{route.OperatingHours.firstBusWeekday} - {route.OperatingHours.lastBusWeekday}</span>
                  </span>
                  <span>·</span>
                  <span>{route.Stops.length} Major Stops</span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
