import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BusStop, LiveVehicle, BusRoute } from '../types/bus';
import { Locate, Navigation, Layers, RefreshCw } from 'lucide-react';

interface BusMapProps {
  stops: BusStop[];
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  liveVehicles: LiveVehicle[];
  activeRoute: BusRoute | null;
  userLocation: { lat: number; lng: number } | null;
  onLocateMe: () => void;
  isLocating: boolean;
}

export const BusMap: React.FC<BusMapProps> = ({
  stops,
  selectedStop,
  onSelectStop,
  liveVehicles,
  activeRoute,
  userLocation,
  onLocateMe,
  isLocating,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stopMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const busMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Centered on Singapore central / Orchard
    const map = L.map(mapContainerRef.current, {
      center: [1.3044, 103.8318],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark high-contrast CartoDB tiles suitable for transit radar
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom control at bottom right for ergonomic desktop & mobile reach
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    stopMarkersLayerRef.current = L.layerGroup().addTo(map);
    busMarkersLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update stop markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = stopMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    stops.forEach((stop) => {
      const isSelected = selectedStop?.BusStopCode === stop.BusStopCode;

      const stopIconHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'}">
          ${isSelected ? '<span class="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping"></span>' : ''}
          <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg border transition-colors ${
            isSelected
              ? 'bg-emerald-600 border-white text-white shadow-emerald-500/40 ring-2 ring-emerald-400'
              : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-white'
          }">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 6v6"/>
              <path d="M15 6v6"/>
              <path d="M2 12h19.6"/>
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.7 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="15" cy="18" r="2"/>
            </svg>
          </div>
          <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 bg-slate-950/90 text-slate-200 text-[9px] font-mono rounded whitespace-nowrap border border-slate-800 shadow pointer-events-none ${
            isSelected ? 'block border-emerald-500/50 text-emerald-300 font-semibold' : 'hidden group-hover:block'
          }">
            ${stop.BusStopCode}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: stopIconHtml,
        className: 'custom-bus-stop-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([stop.Latitude, stop.Longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectStop(stop);
      });

      marker.bindTooltip(
        `<div class="text-xs">
          <div class="font-bold text-slate-900">${stop.Description}</div>
          <div class="text-slate-500">${stop.RoadName} · <span class="font-mono text-emerald-700 font-semibold">${stop.BusStopCode}</span></div>
          <div class="text-[11px] text-slate-600 mt-1">${stop.services.slice(0, 8).join(', ')}${stop.services.length > 8 ? '...' : ''}</div>
        </div>`,
        { direction: 'top', offset: [0, -14], opacity: 0.95 }
      );

      layer.addLayer(marker);
    });
  }, [stops, selectedStop, onSelectStop]);

  // Center on selected stop when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStop) return;

    map.flyTo([selectedStop.Latitude, selectedStop.Longitude], Math.max(map.getZoom(), 15), {
      duration: 0.8,
      easeLinearity: 0.25,
    });
  }, [selectedStop]);

  // Update live moving bus markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = busMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    liveVehicles.forEach((veh) => {
      // Color based on capacity load
      const loadBg =
        veh.load === 'SEA'
          ? 'bg-emerald-500 text-slate-950 ring-emerald-400'
          : veh.load === 'SDA'
          ? 'bg-amber-400 text-slate-950 ring-amber-300'
          : 'bg-rose-500 text-white ring-rose-400';

      const busIconHtml = `
        <div class="relative group cursor-pointer transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2">
          <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md shadow-lg border border-slate-900/40 text-[10px] font-bold ring-1 ${loadBg}">
            <span style="display:inline-block; transform: rotate(${veh.heading}deg);" class="text-[9px]">▲</span>
            <span>${veh.serviceNo}</span>
            <span class="text-[8px] opacity-75 font-mono">${veh.type}</span>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        html: busIconHtml,
        className: 'custom-live-bus-marker',
        iconSize: [44, 24],
        iconAnchor: [22, 12],
      });

      const marker = L.marker([veh.lat, veh.lng], { icon: busIcon });

      const loadLabel =
        veh.load === 'SEA'
          ? 'Seats Available'
          : veh.load === 'SDA'
          ? 'Standing Available'
          : 'Limited Standing';

      marker.bindTooltip(
        `<div class="text-xs p-1">
          <div class="font-bold text-slate-900 flex items-center justify-between gap-4">
            <span>Bus ${veh.serviceNo} (${veh.operator})</span>
            <span class="text-[10px] font-mono text-slate-500">${veh.id}</span>
          </div>
          <div class="text-slate-600 mt-1">Status: <strong class="${
            veh.load === 'SEA' ? 'text-emerald-700' : veh.load === 'SDA' ? 'text-amber-700' : 'text-rose-700'
          }">${loadLabel}</strong></div>
          <div class="text-slate-500 text-[11px] mt-0.5">Speed: <span class="font-mono">${veh.speedKmH} km/h</span> · ${veh.type === 'DD' ? 'Double Deck' : 'Single Deck'}</div>
        </div>`,
        { direction: 'top', offset: [0, -12], opacity: 0.95 }
      );

      layer.addLayer(marker);
    });
  }, [liveVehicles]);

  // Update active route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routePolylineLayerRef.current) {
      routePolylineLayerRef.current.remove();
      routePolylineLayerRef.current = null;
    }

    if (activeRoute && activeRoute.Polyline && activeRoute.Polyline.length > 0) {
      const polyline = L.polyline(activeRoute.Polyline, {
        color: '#10b981',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: undefined,
      }).addTo(map);

      routePolylineLayerRef.current = polyline;

      // Fit map bounds to show full route nicely
      map.fitBounds(polyline.getBounds(), { padding: [50, 50], maxZoom: 15 });
    }
  }, [activeRoute]);

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userHtml = `
        <div class="relative">
          <span class="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping"></span>
          <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-2 ring-blue-400"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userHtml,
        className: 'user-location-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-900 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Actions */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          title="Locate nearest Singapore bus stop"
          aria-label="Locate nearest Singapore bus stop"
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
        >
          <Locate className={`w-5 h-5 ${isLocating ? 'animate-spin text-emerald-400' : 'text-slate-300'}`} />
        </button>

        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.flyTo([1.3521, 103.8198], 12);
            }
          }}
          title="Reset to whole Singapore view"
          aria-label="Reset to whole Singapore view"
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center justify-center transition-transform active:scale-95"
        >
          <Navigation className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* Live Map Legend Bar */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-300 text-[11px] shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Seats (SEA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Standing (SDA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Full (LSD)</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-[10px] text-emerald-400 font-medium">
            {liveVehicles.length} Active Buses Tracked
          </span>
        </div>
      </div>
    </div>
  );
};
