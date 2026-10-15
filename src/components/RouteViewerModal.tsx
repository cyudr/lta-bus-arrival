import React from 'react';
import { BusRoute, BusStop, LiveVehicle } from '../types/bus';
import { POPULAR_BUS_SERVICES } from '../data/singaporeBuses';
import { BusService } from '../services/busService';
import { X, ArrowRight, Clock, MapPin, Navigation, Bus } from 'lucide-react';

interface RouteViewerModalProps {
  serviceNo: string | null;
  onClose: () => void;
  onSelectStop: (stop: BusStop) => void;
  liveVehicles: LiveVehicle[];
  currentSelectedStopCode?: string;
}

export const RouteViewerModal: React.FC<RouteViewerModalProps> = ({
  serviceNo,
  onClose,
  onSelectStop,
  liveVehicles,
  currentSelectedStopCode,
}) => {
  if (!serviceNo) return null;

  const route = POPULAR_BUS_SERVICES.find((r) => r.ServiceNo === serviceNo);
  const relevantVehicles = liveVehicles.filter((v) => v.serviceNo === serviceNo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-2xl font-black text-emerald-400">
                {serviceNo}
              </span>
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {route?.Operator || 'LTA Transit'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {route?.Category || 'Trunk Service'}
              </span>
            </div>

            <div className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <span className="truncate">{route?.OriginName || 'Origin'}</span>
              <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{route?.DestinationName || 'Destination'}</span>
            </div>

            {route?.OperatingHours && (
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Weekday: {route.OperatingHours.firstBusWeekday} - {route.OperatingHours.lastBusWeekday}</span>
                </span>
                <span>·</span>
                <span>Weekend: {route.OperatingHours.firstBusWeekend} - {route.OperatingHours.lastBusWeekend}</span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Active Buses summary */}
        <div className="px-5 py-2.5 bg-emerald-950/30 border-b border-emerald-900/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>{relevantVehicles.length}</strong> active buses on this route right now
            </span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400/80">Real-time GPS</span>
        </div>

        {/* Route Stops Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {route?.Stops && route.Stops.length > 0 ? (
            route.Stops.map((stopItem, index) => {
              const stopDetails = BusService.getStopByCode(stopItem.BusStopCode);
              const isSelected = currentSelectedStopCode === stopItem.BusStopCode;
              // Check if any vehicle is currently approaching this stop
              const approachingBus = relevantVehicles.find(
                (v) => v.nextStopCode === stopItem.BusStopCode
              );

              return (
                <div key={stopItem.BusStopCode} className="relative flex items-start gap-4">
                  {/* Vertical Track Line */}
                  {index < route.Stops.length - 1 && (
                    <div className="absolute left-[13px] top-[26px] bottom-[-18px] w-0.5 bg-slate-800" />
                  )}

                  {/* Node Circle */}
                  <div
                    className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 border-white text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                        : 'bg-slate-950 border-slate-700 text-slate-400'
                    }`}
                  >
                    {stopItem.StopSequence}
                  </div>

                  {/* Stop Information & Click to View */}
                  <div className="flex-1 pb-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <button
                          onClick={() => {
                            if (stopDetails) {
                              onSelectStop(stopDetails);
                              onClose();
                            }
                          }}
                          className="text-left font-semibold text-sm sm:text-base text-slate-200 hover:text-emerald-400 transition-colors group flex items-center gap-1.5"
                        >
                          <span>{stopDetails ? stopDetails.Description : `Stop ${stopItem.BusStopCode}`}</span>
                          <Navigation className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-emerald-500/90 font-medium">
                            {stopItem.BusStopCode}
                          </span>
                          <span>·</span>
                          <span>{stopDetails?.RoadName || 'Singapore'}</span>
                          <span>·</span>
                          <span className="font-mono text-slate-500">{stopItem.Distance} km</span>
                        </div>
                      </div>

                      {/* Live Bus indicator at this stop */}
                      {approachingBus && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-mono shrink-0">
                          <Bus className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span>~{approachingBus.speedKmH} km/h</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400">
              <p>Full route sequencing is being mapped for Service {serviceNo}.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 text-center">
          Tap any stop to inspect its real-time arrivals on the live radar map.
        </div>
      </div>
    </div>
  );
};
