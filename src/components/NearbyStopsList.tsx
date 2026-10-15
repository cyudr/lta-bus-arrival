import React from 'react';
import { BusStop } from '../types/bus';
import { MapPin, Navigation, Bus, ChevronRight, Locate } from 'lucide-react';

interface NearbyStopsListProps {
  stops: (BusStop & { distanceMeters: number })[];
  selectedStopCode?: string;
  onSelectStop: (stop: BusStop) => void;
  userLocation: { lat: number; lng: number } | null;
  onSetSimulatedLocation: (label: string, lat: number, lng: number) => void;
  onLocateMe: () => void;
  isLocating: boolean;
}

const PRESET_LOCATIONS = [
  { name: 'Orchard Rd', lat: 1.3044, lng: 103.8318 },
  { name: 'Bugis Junction', lat: 1.3005, lng: 103.8558 },
  { name: 'Raffles Place', lat: 1.2839, lng: 103.8515 },
  { name: 'Marina Bay', lat: 1.2834, lng: 103.8607 },
  { name: 'Jurong East', lat: 1.3331, lng: 103.7423 },
  { name: 'Tampines', lat: 1.3526, lng: 103.9452 },
];

export const NearbyStopsList: React.FC<NearbyStopsListProps> = ({
  stops,
  selectedStopCode,
  onSelectStop,
  userLocation,
  onSetSimulatedLocation,
  onLocateMe,
  isLocating,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto p-4 space-y-4">
      {/* Location Presets & Locate Button */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Reference Location</span>
          </span>
          <button
            onClick={onLocateMe}
            disabled={isLocating}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>Use Real GPS</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESET_LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => onSetSimulatedLocation(loc.name, loc.lat, loc.lng)}
              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-xs transition-colors"
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Nearby Stops List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Nearest Stops to Current Point ({stops.length})
        </h3>

        {stops.map((stop) => {
          const isSelected = selectedStopCode === stop.BusStopCode;
          const distFormatted =
            stop.distanceMeters < 1000
              ? `${stop.distanceMeters} m`
              : `${(stop.distanceMeters / 1000).toFixed(1)} km`;

          return (
            <button
              key={stop.BusStopCode}
              onClick={() => onSelectStop(stop)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    {stop.BusStopCode}
                  </span>
                  <span className="text-xs font-mono text-blue-400 font-semibold">{distFormatted}</span>
                </div>
                <div className="font-semibold text-sm text-slate-100 truncate">
                  {stop.Description}
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">{stop.RoadName}</div>
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
              </div>

              <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
