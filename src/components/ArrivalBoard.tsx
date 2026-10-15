import React, { useState } from 'react';
import { BusStop, BusServiceArrival, BusArrivalTiming } from '../types/bus';
import { BusService } from '../services/busService';
import {
  Star,
  RefreshCw,
  Search,
  Bell,
  BellRing,
  Accessibility,
  ArrowRight,
  Crosshair,
  AlertTriangle,
  Code2,
  ChevronDown,
  ChevronUp,
  Radio,
  Clock,
  Key,
} from 'lucide-react';

interface ArrivalBoardProps {
  stop: BusStop;
  arrivals: BusServiceArrival[];
  isLoading: boolean;
  onRefresh: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onTrackVehicleOnMap?: (lat: number, lng: number) => void;
  apiError?: string;
  rawApiResponse?: any;
  onOpenSettings: () => void;
  onQueryStopCode: (code: string) => void;
}

export const ArrivalBoard: React.FC<ArrivalBoardProps> = ({
  stop,
  arrivals,
  isLoading,
  onRefresh,
  isBookmarked,
  onToggleBookmark,
  onTrackVehicleOnMap,
  apiError,
  rawApiResponse,
  onOpenSettings,
  onQueryStopCode,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [inputStopCode, setInputStopCode] = useState(stop.BusStopCode);
  const [activeAlerts, setActiveAlerts] = useState<Record<string, boolean>>({});
  const [showRawJson, setShowRawJson] = useState(false);

  const filteredArrivals = arrivals.filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return item.ServiceNo.toLowerCase().includes(q) || item.Operator.toLowerCase().includes(q);
  });

  const toggleAlert = (serviceNo: string) => {
    const currentState = !!activeAlerts[serviceNo];
    const newState = !currentState;
    setActiveAlerts((prev) => ({ ...prev, [serviceNo]: newState }));
    if (newState) {
      BusService.triggerArrivalAlert(serviceNo);
    }
  };

  const handleStopCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputStopCode.trim()) {
      onQueryStopCode(inputStopCode.trim());
    }
  };

  const renderTimingBlock = (timing: BusArrivalTiming | null, slotName: string) => {
    if (!timing || (!timing.EstimatedArrival && !timing.Load && !timing.Type)) {
      return (
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/30 border border-slate-800/40 min-w-[70px] text-slate-500">
          <span className="text-xs font-mono">-</span>
          <span className="text-[10px] text-slate-600">{slotName}</span>
        </div>
      );
    }

    const { label, status } = BusService.getCountdown(timing.EstimatedArrival);
    const hasGps = timing.Latitude > 0 && timing.Longitude > 0;
    const isArriving = status === 'arriving';

    const loadDot =
      timing.Load === 'SEA'
        ? 'bg-emerald-400'
        : timing.Load === 'SDA'
        ? 'bg-amber-400'
        : timing.Load === 'LSD'
        ? 'bg-rose-500'
        : 'bg-slate-500';

    const loadText =
      timing.Load === 'SEA'
        ? 'Seats Avail'
        : timing.Load === 'SDA'
        ? 'Standing Avail'
        : timing.Load === 'LSD'
        ? 'Limited Standing'
        : 'Unknown';

    return (
      <button
        onClick={() => {
          if (hasGps && onTrackVehicleOnMap) {
            onTrackVehicleOnMap(timing.Latitude, timing.Longitude);
          }
        }}
        disabled={!hasGps}
        title={`Status: ${loadText} | Type: ${timing.Type || 'SD'} | Origin: ${timing.OriginCode || '-'} | Dest: ${timing.DestinationCode || '-'} ${
          hasGps ? '| Click to track on map' : '| GPS pending'
        }`}
        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center min-w-[74px] sm:min-w-[84px] ${
          hasGps ? 'cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/80' : 'cursor-default'
        } ${
          isArriving
            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-900/30'
            : 'bg-slate-900/60 border-slate-800'
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

        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium">
          <span className="font-mono">{timing.Type || 'SD'}</span>
          {timing.Feature === 'WAB' && (
            <span title="Wheelchair Accessible Bus">
              <Accessibility className="w-2.5 h-2.5 text-slate-400" />
            </span>
          )}
          {timing.Monitored === 1 && (
            <span title="Real-time GPS Monitored" className="text-emerald-400 text-[9px] font-mono">
              ●
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-slate-100 border-l border-slate-800/80 backdrop-blur-md">
      {/* Top Stop Header & Direct BusStopCode Query */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/50 space-y-3">
        <form onSubmit={handleStopCodeSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputStopCode}
              onChange={(e) => setInputStopCode(e.target.value)}
              placeholder="Enter LTA BusStopCode (e.g. 83139)..."
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Query LTA</span>
          </button>
        </form>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono text-xs font-semibold">
                Stop {stop.BusStopCode}
              </span>
              <span className="text-xs text-slate-400 truncate">{stop.RoadName || 'Singapore LTA'}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-50 tracking-tight leading-snug">
              {stop.Description || `Bus Stop ${stop.BusStopCode}`}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this stop'}
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
              title="Refresh LTA live arrival data (20s frequency)"
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter bus service (e.g. 15, 190)..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Error / AccountKey Warning Banner */}
      {apiError && (
        <div className="m-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>LTA DataMall API Notice</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{apiError}</p>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Configure LTA AccountKey</span>
          </button>
        </div>
      )}

      {/* Raw JSON Toggle Bar */}
      <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-mono text-[11px]">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>LTA v3 /BusArrival Live Feed</span>
        </span>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 transition-colors font-mono"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>{showRawJson ? 'Hide Raw JSON' : 'View API Response'}</span>
          {showRawJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Raw JSON Viewer */}
      {showRawJson && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 max-h-48 overflow-y-auto">
          <pre className="text-[10px] font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
            {rawApiResponse ? JSON.stringify(rawApiResponse, null, 2) : 'No API response loaded yet.'}
          </pre>
        </div>
      )}

      {/* Live Services List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 sm:p-3">
        {filteredArrivals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <p className="text-sm font-medium">
              {isLoading
                ? 'Calling LTA DataMall API...'
                : apiError
                ? 'Unable to load live arrivals from LTA API'
                : `No bus services reported for stop ${stop.BusStopCode}`}
            </p>
            <p className="text-xs text-slate-500">
              Try querying documentation example stop <code className="text-emerald-400 font-mono">83139</code> or enter a valid LTA BusStopCode above.
            </p>
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
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                      {item.Operator}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleAlert(item.ServiceNo)}
                      title={hasAlert ? 'Alert active for this bus' : 'Set approaching alert'}
                      className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
                        hasAlert
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {hasAlert ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Subtitle with Origin and Destination codes from LTA NextBus */}
                {item.NextBus && (item.NextBus.OriginCode || item.NextBus.DestinationCode) && (
                  <p className="text-xs text-slate-400 mb-2 truncate flex items-center gap-1 font-mono text-[11px]">
                    <span>Origin: {item.NextBus.OriginCode || '-'}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span>Dest: {item.NextBus.DestinationCode || '-'}</span>
                  </p>
                )}

                {/* 3 Arrival Slots: NextBus, NextBus2, NextBus3 */}
                <div className="grid grid-cols-3 gap-2">
                  {renderTimingBlock(item.NextBus, 'NextBus')}
                  {renderTimingBlock(item.NextBus2, 'NextBus2')}
                  {renderTimingBlock(item.NextBus3, 'NextBus3')}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Legend Bar */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>SEA (Seats)</span>
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-1" />
          <span>SDA (Standing)</span>
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 ml-1" />
          <span>LSD (Limited)</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
          <span>Freq: 20s</span>
        </div>
      </div>
    </div>
  );
};
