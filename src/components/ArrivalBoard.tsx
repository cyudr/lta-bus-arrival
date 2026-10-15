import React, { useState } from 'react';
import { BusStop, BusServiceArrival, BusArrivalTiming, BusRoute } from '../types/bus';
import { BusService } from '../services/busService';
import {
  Star,
  RefreshCw,
  Search,
  Bell,
  BellRing,
  Route,
  Accessibility,
  ArrowRight,
  Crosshair,
  MapPin,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface ArrivalBoardProps {
  stop: BusStop;
  arrivals: BusServiceArrival[];
  isLoading: boolean;
  onRefresh: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onViewRoute: (serviceNo: string) => void;
  onTrackVehicleOnMap?: (lat: number, lng: number) => void;
  userDistanceMeters?: number;
}

// MRT line color mapping for Singapore LTA standards
const MRT_COLORS: Record<string, { bg: string; text: string }> = {
  NS: { bg: 'bg-red-600', text: 'text-white' }, // North-South (Red)
  EW: { bg: 'bg-emerald-600', text: 'text-white' }, // East-West (Green)
  NE: { bg: 'bg-purple-600', text: 'text-white' }, // North-East (Purple)
  CC: { bg: 'bg-amber-500', text: 'text-slate-950' }, // Circle (Orange)
  DT: { bg: 'bg-blue-600', text: 'text-white' }, // Downtown (Blue)
  TE: { bg: 'bg-amber-900', text: 'text-white' }, // Thomson-East Coast (Brown)
  CE: { bg: 'bg-amber-500', text: 'text-slate-950' }, // Circle Ext
  JE: { bg: 'bg-teal-600', text: 'text-white' }, // Jurong Region (Teal)
  CR: { bg: 'bg-lime-700', text: 'text-white' }, // Cross Island (Lime)
};

export const ArrivalBoard: React.FC<ArrivalBoardProps> = ({
  stop,
  arrivals,
  isLoading,
  onRefresh,
  isBookmarked,
  onToggleBookmark,
  onViewRoute,
  onTrackVehicleOnMap,
  userDistanceMeters,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeAlerts, setActiveAlerts] = useState<Record<string, boolean>>({});

  const filteredArrivals = arrivals.filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      item.ServiceNo.toLowerCase().includes(q) ||
      (item.DestinationName && item.DestinationName.toLowerCase().includes(q))
    );
  });

  const toggleAlert = (serviceNo: string) => {
    const currentState = !!activeAlerts[serviceNo];
    const newState = !currentState;
    setActiveAlerts((prev) => ({ ...prev, [serviceNo]: newState }));

    if (newState) {
      BusService.triggerArrivalAlert(serviceNo, stop.Description);
    }
  };

  const renderTimingBlock = (timing: BusArrivalTiming | null, serviceNo: string, isNext: boolean) => {
    if (!timing) {
      return (
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 min-w-[70px] text-slate-500">
          <span className="text-xs font-mono">-</span>
          <span className="text-[10px] text-slate-600">No Bus</span>
        </div>
      );
    }

    const { label, secondsRemaining, status } = BusService.getCountdown(timing.EstimatedArrival);

    // Color based on load
    const loadColor =
      timing.Load === 'SEA'
        ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
        : timing.Load === 'SDA'
        ? 'text-amber-400 bg-amber-950/40 border-amber-800/60'
        : 'text-rose-400 bg-rose-950/40 border-rose-800/60';

    const loadDot =
      timing.Load === 'SEA'
        ? 'bg-emerald-400'
        : timing.Load === 'SDA'
        ? 'bg-amber-400'
        : 'bg-rose-500';

    const isArriving = status === 'arriving';

    return (
      <button
        onClick={() => {
          if (onTrackVehicleOnMap && timing.Latitude && timing.Longitude) {
            onTrackVehicleOnMap(timing.Latitude, timing.Longitude);
          }
        }}
        title={`Click to locate bus on map (${timing.Load === 'SEA' ? 'Seats Available' : timing.Load === 'SDA' ? 'Standing Available' : 'Limited Standing'})`}
        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center min-w-[74px] sm:min-w-[82px] hover:border-emerald-500/50 hover:bg-slate-800/80 cursor-pointer ${
          isArriving ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-900/30' : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${loadDot} ${isArriving ? 'animate-pulse' : ''}`} />
          <span
            className={`font-mono text-sm sm:text-base font-bold tabular-nums ${
              isArriving ? 'text-emerald-400' : 'text-slate-100'
            }`}
          >
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-medium">
          <span className="font-mono">{timing.Type}</span>
          {timing.Feature === 'WAB' && (
            <span title="Wheelchair Accessible">
              <Accessibility className="w-2.5 h-2.5 text-slate-400" />
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-slate-100 border-l border-slate-800/80 backdrop-blur-md">
      {/* Header Info */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono text-xs font-semibold">
                {stop.BusStopCode}
              </span>
              <span className="text-xs text-slate-400 truncate">{stop.RoadName}</span>
              {userDistanceMeters !== undefined && (
                <span className="text-xs text-blue-400 font-mono ml-auto">
                  {userDistanceMeters < 1000 ? `${userDistanceMeters}m away` : `${(userDistanceMeters / 1000).toFixed(1)}km away`}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-50 tracking-tight leading-snug">
              {stop.Description}
            </h2>

            {/* MRT Interchange badges */}
            {stop.mrtConnections && stop.mrtConnections.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[11px] text-slate-400 mr-1">MRT:</span>
                {stop.mrtConnections.map((code) => {
                  const prefix = code.replace(/[0-9]/g, '');
                  const style = MRT_COLORS[prefix] || { bg: 'bg-slate-700', text: 'text-white' };
                  return (
                    <span
                      key={code}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight shadow-sm ${style.bg} ${style.text}`}
                    >
                      {code}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this stop'}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this stop'}
              className={`p-2.5 rounded-xl border transition-all ${
                isBookmarked
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh timings"
              aria-label="Refresh timings"
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Input inside Stop */}
        <div className="relative mt-3.5">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter bus service (e.g. 190, 65)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 sm:p-3">
        {filteredArrivals.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">No bus services matching "{filterQuery}"</p>
          </div>
        ) : (
          filteredArrivals.map((item) => {
            const hasAlert = !!activeAlerts[item.ServiceNo];

            return (
              <div
                key={item.ServiceNo}
                className="py-3 px-2 sm:px-3 hover:bg-slate-800/30 rounded-xl transition-colors"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                      {item.ServiceNo}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                      {item.Operator}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* 2-Min Alert button */}
                    <button
                      onClick={() => toggleAlert(item.ServiceNo)}
                      title={hasAlert ? 'Alert active for this bus' : 'Set 2-min approaching alert'}
                      aria-label="Toggle arrival notification alert"
                      className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
                        hasAlert
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {hasAlert ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                    </button>

                    {/* View Route button */}
                    <button
                      onClick={() => onViewRoute(item.ServiceNo)}
                      title="View sequential route & live bus positions"
                      className="px-2 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-emerald-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Route className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Route</span>
                    </button>
                  </div>
                </div>

                {item.DestinationName && (
                  <p className="text-xs text-slate-400 mb-2.5 truncate flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span>To {item.DestinationName}</span>
                  </p>
                )}

                {/* 3 Arrival Timings */}
                <div className="grid grid-cols-3 gap-2">
                  {renderTimingBlock(item.NextBus, item.ServiceNo, true)}
                  {renderTimingBlock(item.NextBus2, item.ServiceNo, false)}
                  {renderTimingBlock(item.NextBus3, item.ServiceNo, false)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info / Legend Bar */}
      <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>Seats</span>
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-1" />
          <span>Standing</span>
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 ml-1" />
          <span>Limited</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
          <span>SD: Single</span>
          <span>·</span>
          <span>DD: Double</span>
        </div>
      </div>
    </div>
  );
};
