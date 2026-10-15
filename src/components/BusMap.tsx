import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BusStop, LiveVehicle } from '../types/bus';
import { Locate, Navigation, Layers, Maximize2, Minimize2, Map as MapIcon, Compass } from 'lucide-react';

interface BusMapProps {
  stops: BusStop[];
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  liveVehicles: LiveVehicle[];
  activeRoute?: any;
  userLocation: { lat: number; lng: number } | null;
  onLocateMe: () => void;
  isLocating: boolean;
}

type MapLayerType = 'google-street' | 'google-hybrid' | 'google-terrain' | 'carto-dark';

const TILE_SERVERS: Record<MapLayerType, { name: string; url: string; maxZoom: number; subdomains?: string[] }> = {
  'google-street': {
    name: 'Map',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZoom: 20,
  },
  'google-hybrid': {
    name: 'Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20,
  },
  'google-terrain': {
    name: 'Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZoom: 20,
  },
  'carto-dark': {
    name: 'Dark Radar',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd'],
  },
};

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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const stopMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const busMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const isFirstLoadRef = useRef(true);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('google-street');
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: 1.3044,
    lng: 103.8318,
  });
  const [currentZoom, setCurrentZoom] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = selectedStop?.Latitude && Number.isFinite(selectedStop.Latitude) ? selectedStop.Latitude : 1.3044;
    const initialLng = selectedStop?.Longitude && Number.isFinite(selectedStop.Longitude) ? selectedStop.Longitude : 103.8318;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    const activeConfig = TILE_SERVERS['google-street'];
    const tileLayer = L.tileLayer(activeConfig.url, {
      maxZoom: activeConfig.maxZoom,
      subdomains: activeConfig.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    stopMarkersLayerRef.current = L.layerGroup().addTo(map);
    busMarkersLayerRef.current = L.layerGroup().addTo(map);

    map.on('move', () => {
      const center = map.getCenter();
      if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
        setCenterCoords({ lat: center.lat, lng: center.lng });
      }
      const zoom = map.getZoom();
      if (Number.isFinite(zoom)) {
        setCurrentZoom(Math.round(zoom));
      }
    });

    mapRef.current = map;

    // Handle container resizing
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Force size check after DOM tick
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch Tile Layer when activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const config = TILE_SERVERS[activeLayer];
    const newLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [activeLayer]);

  // Center on selected stop when it changes (Fixes NaN, NaN issue)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStop) return;

    const targetLat = selectedStop.Latitude;
    const targetLng = selectedStop.Longitude;

    // Strict validation
    if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng)) {
      return;
    }

    const currentMapZoom = typeof map.getZoom === 'function' ? map.getZoom() : 15;
    const safeZoom = Number.isFinite(currentMapZoom) ? Math.max(currentMapZoom, 15) : 15;

    // If first load or container not yet measured, use safe setView
    const mapSize = map.getSize();
    const hasZeroDimension = !mapSize || mapSize.x === 0 || mapSize.y === 0;

    if (isFirstLoadRef.current || hasZeroDimension) {
      isFirstLoadRef.current = false;
      map.invalidateSize();
      map.setView([targetLat, targetLng], safeZoom);
      return;
    }

    // Safe animated flyTo
    try {
      map.flyTo([targetLat, targetLng], safeZoom, {
        duration: 0.8,
        easeLinearity: 0.25,
      });
    } catch (e) {
      // Fallback if animation frame math fails
      map.setView([targetLat, targetLng], safeZoom);
    }
  }, [selectedStop]);

  // Update stop markers with coordinate safety
  useEffect(() => {
    const map = mapRef.current;
    const layer = stopMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    stops.forEach((stop) => {
      // Validate stop coordinates
      if (!Number.isFinite(stop.Latitude) || !Number.isFinite(stop.Longitude)) {
        return;
      }

      const isSelected = selectedStop?.BusStopCode === stop.BusStopCode;

      const stopIconHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
        }">
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

      const servicesText =
        Array.isArray(stop.services) && stop.services.length > 0
          ? `<div class="text-[11px] text-slate-600 mt-1">${stop.services.slice(0, 8).join(', ')}${
              stop.services.length > 8 ? '...' : ''
            }</div>`
          : '';

      marker.bindTooltip(
        `<div class="text-xs">
          <div class="font-bold text-slate-900">${stop.Description || `Bus Stop ${stop.BusStopCode}`}</div>
          <div class="text-slate-500">${stop.RoadName || 'Singapore'} · <span class="font-mono text-emerald-700 font-semibold">${stop.BusStopCode}</span></div>
          ${servicesText}
        </div>`,
        { direction: 'top', offset: [0, -14], opacity: 0.95 }
      );

      layer.addLayer(marker);
    });
  }, [stops, selectedStop, onSelectStop]);

  // Update live moving bus markers with coordinate safety
  useEffect(() => {
    const map = mapRef.current;
    const layer = busMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    liveVehicles.forEach((veh) => {
      // Validate vehicle coordinates
      if (!Number.isFinite(veh.lat) || !Number.isFinite(veh.lng)) {
        return;
      }

      const loadBg =
        veh.load === 'SEA'
          ? 'bg-emerald-500 text-slate-950 ring-emerald-400'
          : veh.load === 'SDA'
          ? 'bg-amber-400 text-slate-950 ring-amber-300'
          : veh.load === 'LSD'
          ? 'bg-rose-500 text-white ring-rose-400'
          : 'bg-slate-700 text-slate-100 ring-slate-600';

      const busIconHtml = `
        <div class="relative group cursor-pointer transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2">
          <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md shadow-lg border border-slate-900/40 text-[10px] font-bold ring-1 ${loadBg}">
            <span>Bus ${veh.serviceNo}</span>
            <span class="text-[8px] opacity-80 font-mono">${veh.type || 'SD'}</span>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        html: busIconHtml,
        className: 'custom-live-bus-marker',
        iconSize: [52, 24],
        iconAnchor: [26, 12],
      });

      const marker = L.marker([veh.lat, veh.lng], { icon: busIcon });

      const loadLabel =
        veh.load === 'SEA'
          ? 'Seats Available'
          : veh.load === 'SDA'
          ? 'Standing Available'
          : veh.load === 'LSD'
          ? 'Limited Standing'
          : 'Normal';

      marker.bindTooltip(
        `<div class="text-xs p-1">
          <div class="font-bold text-slate-900 flex items-center justify-between gap-4">
            <span>Bus ${veh.serviceNo} (${veh.operator})</span>
            <span class="text-[10px] font-mono text-emerald-700 font-bold">${
              veh.monitored === 1 ? 'Live GPS Monitored' : 'Scheduled'
            }</span>
          </div>
          <div class="text-slate-600 mt-1">Load: <strong class="${
            veh.load === 'SEA' ? 'text-emerald-700' : veh.load === 'SDA' ? 'text-amber-700' : 'text-rose-700'
          }">${loadLabel}</strong> · Type: <strong>${veh.type || 'SD'}</strong></div>
          <div class="text-slate-500 text-[11px] mt-0.5 font-mono">
            Origin: ${veh.originCode || '-'} → Dest: ${veh.destinationCode || '-'}
          </div>
        </div>`,
        { direction: 'top', offset: [0, -12], opacity: 0.95 }
      );

      layer.addLayer(marker);
    });
  }, [liveVehicles]);

  // Update active route polyline with coordinate safety
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routePolylineLayerRef.current) {
      routePolylineLayerRef.current.remove();
      routePolylineLayerRef.current = null;
    }

    if (activeRoute && Array.isArray(activeRoute.Polyline) && activeRoute.Polyline.length > 0) {
      const validPoints = activeRoute.Polyline.filter(
        (pt: any) => Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1])
      );

      if (validPoints.length > 1) {
        const polyline = L.polyline(validPoints, {
          color: '#10b981',
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        routePolylineLayerRef.current = polyline;

        try {
          const bounds = polyline.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          }
        } catch {
          // ignore
        }
      }
    }
  }, [activeRoute]);

  // Update user location marker with coordinate safety
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
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

  // Google Maps style Zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-900 overflow-hidden select-none">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Google Maps Style Layer Switcher (Top Left) */}
      <div className="absolute top-3.5 left-3.5 z-20 flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg shadow-md border border-slate-300 dark:border-slate-800 p-0.5 text-xs font-semibold overflow-hidden">
        <button
          onClick={() => setActiveLayer('google-street')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeLayer === 'google-street'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Map</span>
        </button>

        <button
          onClick={() => setActiveLayer('google-hybrid')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeLayer === 'google-hybrid'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          onClick={() => setActiveLayer('carto-dark')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeLayer === 'carto-dark'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Dark</span>
        </button>
      </div>

      {/* Google Maps Styled Control Cluster (Bottom Right) */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-2">
        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
          className="w-10 h-10 rounded-lg bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 shadow-md flex items-center justify-center transition-all active:scale-95"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Locate Me Button */}
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          title="Show My Location"
          aria-label="Show My Location"
          className="w-10 h-10 rounded-lg bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 shadow-md flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-500' : 'text-blue-600 dark:text-blue-400'}`} />
        </button>

        {/* Reset View Button */}
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setView([1.3521, 103.8198], 12);
            }
          }}
          title="Reset to Singapore Overview"
          aria-label="Reset to Singapore Overview"
          className="w-10 h-10 rounded-lg bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 shadow-md flex items-center justify-center transition-all active:scale-95"
        >
          <Compass className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Google Maps Style Stacked Zoom (+ / -) */}
        <div className="flex flex-col rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700/80 shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            className="w-10 h-9 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-200 dark:border-slate-800 active:bg-slate-200"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="w-10 h-9 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:bg-slate-200"
          >
            −
          </button>
        </div>
      </div>

      {/* Google Map Coordinate Alignment Inspector Bar (Bottom Left) */}
      <div className="absolute bottom-4 left-3.5 z-20 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-300 text-[11px] shadow-lg">
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="text-emerald-400 font-semibold">LTA DataMall & Google Map Aligned:</span>
            <span className="text-slate-100">
              {centerCoords.lat.toFixed(5)}°N, {centerCoords.lng.toFixed(5)}°E
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Seats</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Standing</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Full</span>
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <span className="font-mono text-[10px] text-emerald-400 font-medium">
            {liveVehicles.length} Buses Tracking
          </span>
        </div>
      </div>
    </div>
  );
};
