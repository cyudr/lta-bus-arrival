/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BusStop,
  BusServiceArrival,
  LiveVehicle,
  BusRoute,
  ApiConfiguration,
  BookmarkItem,
} from './types/bus';
import { BusService, DEFAULT_CONFIG } from './services/busService';
import { SINGAPORE_BUS_STOPS, POPULAR_BUS_SERVICES } from './data/singaporeBuses';
import { Header, ActiveTab } from './components/Header';
import { BusMap } from './components/BusMap';
import { ArrivalBoard } from './components/ArrivalBoard';
import { RouteViewerModal } from './components/RouteViewerModal';
import { BackendConfigModal } from './components/BackendConfigModal';
import { NearbyStopsList } from './components/NearbyStopsList';
import { RoutesDirectory } from './components/RoutesDirectory';
import { BookmarksList } from './components/BookmarksList';
import { StopSearchModal } from './components/StopSearchModal';
import { MobileTabBar } from './components/MobileTabBar';
import { Search, MapPin, Radio, Compass, RefreshCw } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<ApiConfiguration>(BusService.getConfig());
  const [activeTab, setActiveTab] = useState<ActiveTab>('radar');
  const [stops] = useState<BusStop[]>(SINGAPORE_BUS_STOPS);
  
  // Default selected stop: Opp Orchard Stn / ION Orchard (09048)
  const [selectedStop, setSelectedStop] = useState<BusStop>(
    SINGAPORE_BUS_STOPS[0] || {
      BusStopCode: '09048',
      RoadName: 'Orchard Rd',
      Description: 'Opp Orchard Stn / ION Orchard',
      Latitude: 1.3044,
      Longitude: 103.8318,
      services: ['7', '14', '16', '36', '65', '106', '111', '124', '174', '175', '190'],
    }
  );

  const [arrivals, setArrivals] = useState<BusServiceArrival[]>([]);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState(false);
  const [liveVehicles, setLiveVehicles] = useState<LiveVehicle[]>([]);
  const [activeRoute, setActiveRoute] = useState<BusRoute | null>(null);
  const [inspectingRouteService, setInspectingRouteService] = useState<string | null>(null);

  // User Geolocation
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({
    lat: 1.3044,
    lng: 103.8318,
  });
  const [isLocating, setIsLocating] = useState(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(BusService.getBookmarks());

  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch Arrivals for the selected stop
  const fetchArrivals = useCallback(async (stopCode: string) => {
    setIsLoadingArrivals(true);
    try {
      const data = await BusService.getArrivalsForStop(stopCode);
      setArrivals(data);
    } catch (err) {
      console.error('Failed to load arrivals:', err);
    } finally {
      setIsLoadingArrivals(false);
    }
  }, []);

  // Initial fetch and on stop change
  useEffect(() => {
    if (selectedStop) {
      fetchArrivals(selectedStop.BusStopCode);
    }
  }, [selectedStop, fetchArrivals]);

  // Periodic arrival refresh
  useEffect(() => {
    const intervalSeconds = config.refreshIntervalSeconds || 15;
    const interval = setInterval(() => {
      if (selectedStop) {
        fetchArrivals(selectedStop.BusStopCode);
      }
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [selectedStop, config.refreshIntervalSeconds, fetchArrivals]);

  // High-frequency vehicle simulation loop (every 2.5s for smooth motion)
  useEffect(() => {
    const updateVehicles = () => {
      const updated = BusService.getLiveVehicles();
      setLiveVehicles(updated);
    };

    updateVehicles();
    const interval = setInterval(updateVehicles, 2500);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Geolocation handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setIsLocating(false);

        // Find nearest stop and select it
        const nearest = BusService.getNearbyStops(coords.lat, coords.lng, 1);
        if (nearest.length > 0) {
          setSelectedStop(nearest[0]);
        }
      },
      (err) => {
        console.warn('Geolocation failed or denied, using simulated Orchard location:', err);
        setIsLocating(false);
        setUserLocation({ lat: 1.3044, lng: 103.8318 });
      },
      { timeout: 8000 }
    );
  };

  const handleSetSimulatedLocation = (label: string, lat: number, lng: number) => {
    const coords = { lat, lng };
    setUserLocation(coords);
    const nearest = BusService.getNearbyStops(lat, lng, 1);
    if (nearest.length > 0) {
      setSelectedStop(nearest[0]);
    }
  };

  const handleToggleBookmark = () => {
    if (!selectedStop) return;
    BusService.toggleBookmark(selectedStop.BusStopCode, selectedStop.Description);
    setBookmarks(BusService.getBookmarks());
  };

  const handleRemoveBookmark = (code: string) => {
    BusService.toggleBookmark(code);
    setBookmarks(BusService.getBookmarks());
  };

  const handleSaveConfig = (newConfig: ApiConfiguration) => {
    setConfig(newConfig);
    BusService.saveConfig(newConfig);
    if (selectedStop) {
      fetchArrivals(selectedStop.BusStopCode);
    }
  };

  const handleSelectRouteFromDirectory = (route: BusRoute) => {
    setActiveRoute(route);
    setInspectingRouteService(route.ServiceNo);
    // Pan to first stop on route
    if (route.Stops.length > 0) {
      const firstStop = BusService.getStopByCode(route.Stops[0].BusStopCode);
      if (firstStop) {
        setSelectedStop(firstStop);
      }
    }
  };

  // Nearby stops list calculated from userLocation
  const nearbyStops = useMemo(() => {
    const lat = userLocation?.lat || 1.3044;
    const lng = userLocation?.lng || 103.8318;
    return BusService.getNearbyStops(lat, lng, 12);
  }, [userLocation]);

  // Distance from user to current selected stop
  const selectedStopDistance = useMemo(() => {
    if (!userLocation || !selectedStop) return undefined;
    return BusService.calculateDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      selectedStop.Latitude,
      selectedStop.Longitude
    );
  }, [userLocation, selectedStop]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 3-Zone Top Bar */}
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenBackendConfig={() => setIsConfigOpen(true)}
        isBackendMode={config.mode === 'backend'}
        activeBusCount={liveVehicles.length}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Control Panel / Tab Views (Desktop: fixed width, Mobile: full or toggled) */}
        <div
          className={`flex flex-col w-full md:w-[420px] lg:w-[460px] xl:w-[500px] shrink-0 border-r border-slate-800 bg-slate-900/95 z-10 transition-all ${
            activeTab === 'radar'
              ? 'h-[45vh] md:h-full order-2 md:order-1'
              : 'h-[calc(100vh-3.5rem-3.5rem)] md:h-full order-1'
          }`}
        >
          {/* Universal Quick Search Trigger Bar */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-left text-xs text-slate-400 flex items-center justify-between transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Search any Singapore bus stop, road, or service...</span>
              </div>
              <kbd className="hidden sm:inline-block font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'radar' && selectedStop && (
              <ArrivalBoard
                stop={selectedStop}
                arrivals={arrivals}
                isLoading={isLoadingArrivals}
                onRefresh={() => fetchArrivals(selectedStop.BusStopCode)}
                isBookmarked={BusService.isBookmarked(selectedStop.BusStopCode)}
                onToggleBookmark={handleToggleBookmark}
                onViewRoute={(srvNo) => {
                  const r = POPULAR_BUS_SERVICES.find((p) => p.ServiceNo === srvNo);
                  if (r) setActiveRoute(r);
                  setInspectingRouteService(srvNo);
                }}
                onTrackVehicleOnMap={(lat, lng) => {
                  // Handled via map flyTo inside map or state
                }}
                userDistanceMeters={selectedStopDistance}
              />
            )}

            {activeTab === 'nearby' && (
              <NearbyStopsList
                stops={nearbyStops}
                selectedStopCode={selectedStop?.BusStopCode}
                onSelectStop={(stop) => {
                  setSelectedStop(stop);
                  setActiveTab('radar');
                }}
                userLocation={userLocation}
                onSetSimulatedLocation={handleSetSimulatedLocation}
                onLocateMe={handleLocateMe}
                isLocating={isLocating}
              />
            )}

            {activeTab === 'routes' && (
              <RoutesDirectory
                onSelectRoute={handleSelectRouteFromDirectory}
                activeRouteServiceNo={activeRoute?.ServiceNo}
              />
            )}

            {activeTab === 'bookmarks' && (
              <BookmarksList
                bookmarks={bookmarks}
                onSelectStop={(stop) => {
                  setSelectedStop(stop);
                  setActiveTab('radar');
                }}
                onRemoveBookmark={handleRemoveBookmark}
                selectedStopCode={selectedStop?.BusStopCode}
              />
            )}
          </div>
        </div>

        {/* Right Section: The Live Radar Map */}
        <div
          className={`flex-1 relative h-[55vh] md:h-full order-1 md:order-2 ${
            activeTab !== 'radar' ? 'hidden md:block' : 'block'
          }`}
        >
          <BusMap
            stops={stops}
            selectedStop={selectedStop}
            onSelectStop={(stop) => {
              setSelectedStop(stop);
              setActiveTab('radar');
            }}
            liveVehicles={liveVehicles}
            activeRoute={activeRoute}
            userLocation={userLocation}
            onLocateMe={handleLocateMe}
            isLocating={isLocating}
          />
        </div>
      </div>

      {/* Mobile Ergonomic Tab Bar */}
      <MobileTabBar activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Global Search Modal */}
      <StopSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStop={(stop) => {
          setSelectedStop(stop);
          setActiveTab('radar');
        }}
      />

      {/* Detailed Route Modal */}
      <RouteViewerModal
        serviceNo={inspectingRouteService}
        onClose={() => setInspectingRouteService(null)}
        onSelectStop={(stop) => {
          setSelectedStop(stop);
          setActiveTab('radar');
        }}
        liveVehicles={liveVehicles}
        currentSelectedStopCode={selectedStop?.BusStopCode}
      />

      {/* Backend & LTA API Integration Modal */}
      <BackendConfigModal
        config={config}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
