/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BusStop,
  BusServiceArrival,
  LiveVehicle,
  ApiConfiguration,
  BookmarkItem,
} from './types/bus';
import { BusService } from './services/busService';
import { Header, ActiveTab } from './components/Header';
import { BusMap } from './components/BusMap';
import { ArrivalBoard } from './components/ArrivalBoard';
import { BackendConfigModal } from './components/BackendConfigModal';
import { BookmarksList } from './components/BookmarksList';
import { StopSearchModal } from './components/StopSearchModal';
import { MobileTabBar } from './components/MobileTabBar';
import { Search, MapPin, Radio, Key, RefreshCw } from 'lucide-react';

// Documentation example stop from Image 1 & 2
const DEFAULT_DOC_STOP: BusStop = {
  BusStopCode: '83139',
  RoadName: 'Victoria St / Marine Parade',
  Description: 'Bus Stop 83139 (LTA Example)',
  Latitude: 1.3044,
  Longitude: 103.8318,
  services: ['15'],
};

export default function App() {
  const [config, setConfig] = useState<ApiConfiguration>(BusService.getConfig());
  const [activeTab, setActiveTab] = useState<ActiveTab>('radar');
  const [stops, setStops] = useState<BusStop[]>([DEFAULT_DOC_STOP]);
  const [selectedStop, setSelectedStop] = useState<BusStop>(DEFAULT_DOC_STOP);

  const [arrivals, setArrivals] = useState<BusServiceArrival[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<LiveVehicle[]>([]);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | undefined>(undefined);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState(false);

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

  // Fetch official bus stops from LTA DataMall
  useEffect(() => {
    let isMounted = true;
    BusService.fetchOfficialBusStops().then((loadedStops) => {
      if (isMounted && loadedStops.length > 0) {
        setStops((prev) => {
          const combined = [...prev];
          loadedStops.forEach((s) => {
            if (!combined.some((c) => c.BusStopCode === s.BusStopCode)) {
              combined.push(s);
            }
          });
          return combined;
        });

        // If the default stop exists in the official list, enrich it
        const official = loadedStops.find((s) => s.BusStopCode === '83139');
        if (official) {
          setSelectedStop(official);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real arrivals from LTA DataMall v3 API (No simulation or hardcoded fallbacks)
  const fetchArrivals = useCallback(async (stopCode: string) => {
    setIsLoadingArrivals(true);
    setApiError(undefined);

    try {
      const result = await BusService.getArrivalsForStop(stopCode);
      setArrivals(result.services);
      setLiveVehicles(result.liveVehicles);
      setRawApiResponse(result.rawResponse);

      if (result.error) {
        setApiError(result.error);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to fetch arrival data from LTA DataMall');
      setArrivals([]);
      setLiveVehicles([]);
    } finally {
      setIsLoadingArrivals(false);
    }
  }, []);

  // Fetch when selectedStop changes
  useEffect(() => {
    if (selectedStop && selectedStop.BusStopCode) {
      fetchArrivals(selectedStop.BusStopCode);
    }
  }, [selectedStop, fetchArrivals]);

  // Periodic refresh: 20 seconds as documented in LTA BusArrival specification
  useEffect(() => {
    const intervalSeconds = config.refreshIntervalSeconds || 20;
    const interval = setInterval(() => {
      if (selectedStop && selectedStop.BusStopCode) {
        fetchArrivals(selectedStop.BusStopCode);
      }
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [selectedStop, config.refreshIntervalSeconds, fetchArrivals]);

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

  // Handle direct query for any bus stop code
  const handleQueryStopCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Check if stop exists in loaded stops
    const existing = stops.find((s) => s.BusStopCode === trimmed);
    if (existing) {
      setSelectedStop(existing);
    } else {
      const newStop: BusStop = {
        BusStopCode: trimmed,
        RoadName: 'Singapore',
        Description: `Bus Stop ${trimmed}`,
        Latitude: selectedStop.Latitude,
        Longitude: selectedStop.Longitude,
      };
      setStops((prev) => [newStop, ...prev]);
      setSelectedStop(newStop);
    }
  };

  // Geolocation
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
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
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

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 3-Zone Top Bar */}
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenBackendConfig={() => setIsConfigOpen(true)}
        isBackendMode={Boolean(config.ltaAccountKey && config.ltaAccountKey.trim())}
        activeBusCount={liveVehicles.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Panel: Real LTA Arrival Board / Bookmarks */}
        <div
          className={`flex flex-col w-full md:w-[440px] lg:w-[480px] xl:w-[520px] shrink-0 border-r border-slate-800 bg-slate-900/95 z-10 transition-all ${
            activeTab === 'radar'
              ? 'h-[50vh] md:h-full order-2 md:order-1'
              : 'h-[calc(100vh-3.5rem-3.5rem)] md:h-full order-1'
          }`}
        >
          {/* Quick Search Bar */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-left text-xs text-slate-400 flex items-center justify-between transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Search any Singapore LTA BusStopCode (e.g. 83139)...</span>
              </div>
              <kbd className="hidden sm:inline-block font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Panes */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'radar' && (
              <ArrivalBoard
                stop={selectedStop}
                arrivals={arrivals}
                isLoading={isLoadingArrivals}
                onRefresh={() => fetchArrivals(selectedStop.BusStopCode)}
                isBookmarked={BusService.isBookmarked(selectedStop.BusStopCode)}
                onToggleBookmark={handleToggleBookmark}
                apiError={apiError}
                rawApiResponse={rawApiResponse}
                onOpenSettings={() => setIsConfigOpen(true)}
                onQueryStopCode={handleQueryStopCode}
                onTrackVehicleOnMap={(lat, lng) => {
                  setSelectedStop((prev) => ({
                    ...prev,
                    Latitude: lat,
                    Longitude: lng,
                  }));
                }}
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

        {/* Right Section: Interactive Google Map with live LTA buses */}
        <div
          className={`flex-1 relative h-[50vh] md:h-full order-1 md:order-2 ${
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
            activeRoute={null}
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
