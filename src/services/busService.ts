import {
  BusStop,
  BusServiceArrival,
  BusArrivalTiming,
  LiveVehicle,
  BusLoad,
  BusType,
  ApiConfiguration,
  BookmarkItem,
  LtaBusArrivalApiResponse,
} from '../types/bus';

const CONFIG_KEY = 'sg_bus_radar_api_config';
const BOOKMARKS_KEY = 'sg_bus_radar_bookmarks';
const CACHED_STOPS_KEY = 'sg_bus_radar_cached_stops';

export const DEFAULT_CONFIG: ApiConfiguration = {
  endpointUrl: '/api/busarrival',
  ltaAccountKey: '',
  refreshIntervalSeconds: 20, // 20s matches LTA DataMall documentation update frequency
};

export class BusService {
  public static getConfig(): ApiConfiguration {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {
      // ignore
    }
    return DEFAULT_CONFIG;
  }

  public static saveConfig(config: ApiConfiguration): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  public static getBookmarks(): BookmarkItem[] {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    // Default initial example stop from LTA documentation
    return [
      {
        id: '83139-default',
        busStopCode: '83139',
        customLabel: 'Documentation Example Stop',
        addedAt: Date.now(),
      },
    ];
  }

  public static saveBookmarks(bookmarks: BookmarkItem[]): void {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }

  public static toggleBookmark(busStopCode: string, label?: string): boolean {
    const list = this.getBookmarks();
    const idx = list.findIndex((b) => b.busStopCode === busStopCode);
    if (idx >= 0) {
      list.splice(idx, 1);
      this.saveBookmarks(list);
      return false;
    } else {
      list.push({
        id: `${busStopCode}-${Date.now()}`,
        busStopCode,
        customLabel: label,
        addedAt: Date.now(),
      });
      this.saveBookmarks(list);
      return true;
    }
  }

  public static isBookmarked(busStopCode: string): boolean {
    return this.getBookmarks().some((b) => b.busStopCode === busStopCode);
  }

  /**
   * Fetches official Bus Stops from LTA DataMall /api/busstops.
   * Caches in localStorage for smooth navigation across sessions.
   */
  public static async fetchOfficialBusStops(skip = 0): Promise<BusStop[]> {
    const config = this.getConfig();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (config.ltaAccountKey && config.ltaAccountKey.trim()) {
      headers['AccountKey'] = config.ltaAccountKey.trim();
    }

    try {
      const res = await fetch(`/api/busstops?$skip=${skip}`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to fetch bus stops (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.value)) {
        const stops: BusStop[] = data.value.map((item: any) => ({
          BusStopCode: String(item.BusStopCode),
          RoadName: item.RoadName || '',
          Description: item.Description || `Stop ${item.BusStopCode}`,
          Latitude: parseFloat(item.Latitude) || 0,
          Longitude: parseFloat(item.Longitude) || 0,
        }));

        // Cache first page
        if (skip === 0 && stops.length > 0) {
          try {
            localStorage.setItem(CACHED_STOPS_KEY, JSON.stringify(stops));
          } catch {
            // storage may be full
          }
        }
        return stops;
      }
    } catch (err) {
      console.warn('Could not fetch bus stops from API:', err);
    }

    // Try reading cached stops
    try {
      const cached = localStorage.getItem(CACHED_STOPS_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }

    return [];
  }

  /**
   * Fetches live real-time Bus Arrival data from LTA DataMall v3 API.
   * NO simulated or hardcoded fallbacks: returns raw live API services!
   */
  public static async getArrivalsForStop(
    busStopCode: string,
    serviceNo?: string
  ): Promise<{
    services: BusServiceArrival[];
    liveVehicles: LiveVehicle[];
    rawResponse: any;
    error?: string;
  }> {
    const config = this.getConfig();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (config.ltaAccountKey && config.ltaAccountKey.trim()) {
      headers['AccountKey'] = config.ltaAccountKey.trim();
    }

    let url = config.endpointUrl.trim() || '/api/busarrival';
    const params = new URLSearchParams();
    params.set('BusStopCode', busStopCode.trim());
    if (serviceNo && serviceNo.trim()) {
      params.set('ServiceNo', serviceNo.trim());
    }

    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}${params.toString()}`;

    try {
      const res = await fetch(fullUrl, { headers });
      const data = await res.json();

      if (!res.ok) {
        return {
          services: [],
          liveVehicles: [],
          rawResponse: data,
          error: data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      if (data && Array.isArray(data.Services)) {
        const services: BusServiceArrival[] = [];
        const liveVehicles: LiveVehicle[] = [];

        data.Services.forEach((rawSrv: any) => {
          const nextBus = rawSrv.NextBus ? this.parseTiming(rawSrv.NextBus) : null;
          const nextBus2 = rawSrv.NextBus2 ? this.parseTiming(rawSrv.NextBus2) : null;
          const nextBus3 = rawSrv.NextBus3 ? this.parseTiming(rawSrv.NextBus3) : null;

          services.push({
            ServiceNo: String(rawSrv.ServiceNo),
            Operator: rawSrv.Operator || 'LTA',
            NextBus: nextBus,
            NextBus2: nextBus2,
            NextBus3: nextBus3,
          });

          // Extract live moving vehicles from NextBus, NextBus2, NextBus3 that have valid GPS coordinates
          [nextBus, nextBus2, nextBus3].forEach((timing, idx) => {
            if (
              timing &&
              timing.Latitude &&
              timing.Longitude &&
              Number.isFinite(timing.Latitude) &&
              Number.isFinite(timing.Longitude) &&
              timing.Latitude > 1.1 && // Singapore latitude range ~ 1.2 to 1.5
              timing.Latitude < 1.5 &&
              timing.Longitude > 103.5 &&
              timing.Longitude < 104.1
            ) {
              liveVehicles.push({
                id: `${rawSrv.ServiceNo}-${idx + 1}-${timing.VisitNumber || 1}`,
                serviceNo: String(rawSrv.ServiceNo),
                operator: rawSrv.Operator || 'LTA',
                lat: timing.Latitude,
                lng: timing.Longitude,
                heading: 0,
                load: timing.Load,
                type: timing.Type,
                feature: timing.Feature,
                monitored: timing.Monitored,
                originCode: timing.OriginCode,
                destinationCode: timing.DestinationCode,
                estimatedArrival: timing.EstimatedArrival,
                targetStopCode: busStopCode,
              });
            }
          });
        });

        return {
          services,
          liveVehicles,
          rawResponse: data,
        };
      }

      return {
        services: [],
        liveVehicles: [],
        rawResponse: data,
        error: 'Invalid response structure from LTA DataMall (missing Services array)',
      };
    } catch (err: any) {
      return {
        services: [],
        liveVehicles: [],
        rawResponse: null,
        error: err.message || 'Failed to reach API server',
      };
    }
  }

  private static parseTiming(raw: any): BusArrivalTiming | null {
    if (!raw || Object.keys(raw).length === 0) return null;
    if (!raw.EstimatedArrival && !raw.Load && !raw.Type) return null;

    const lat = typeof raw.Latitude === 'number' ? raw.Latitude : parseFloat(raw.Latitude);
    const lng = typeof raw.Longitude === 'number' ? raw.Longitude : parseFloat(raw.Longitude);

    return {
      OriginCode: raw.OriginCode || '',
      DestinationCode: raw.DestinationCode || '',
      EstimatedArrival: raw.EstimatedArrival || '',
      Monitored: raw.Monitored !== undefined ? Number(raw.Monitored) : 0,
      Latitude: Number.isFinite(lat) ? lat : 0,
      Longitude: Number.isFinite(lng) ? lng : 0,
      VisitNumber: raw.VisitNumber || 1,
      Load: (['SEA', 'SDA', 'LSD'].includes(raw.Load) ? raw.Load : '') as BusLoad,
      Feature: raw.Feature || '',
      Type: (['SD', 'DD', 'BD'].includes(raw.Type) ? raw.Type : '') as BusType,
    };
  }

  /**
   * Calculates human friendly countdown prediction from real ISO arrival string
   */
  public static getCountdown(estimatedArrivalIso: string | undefined | null): {
    label: string;
    secondsRemaining: number;
    minutesRemaining: number;
    status: 'arriving' | 'imminent' | 'scheduled' | 'none';
  } {
    if (!estimatedArrivalIso || !estimatedArrivalIso.trim()) {
      return { label: '-', secondsRemaining: 9999, minutesRemaining: 999, status: 'none' };
    }

    const arrivalMs = new Date(estimatedArrivalIso).getTime();
    if (isNaN(arrivalMs)) {
      return { label: '-', secondsRemaining: 9999, minutesRemaining: 999, status: 'none' };
    }

    const nowMs = Date.now();
    const diffSeconds = Math.round((arrivalMs - nowMs) / 1000);

    if (diffSeconds <= 20) {
      return {
        label: 'Arr',
        secondsRemaining: diffSeconds,
        minutesRemaining: 0,
        status: 'arriving',
      };
    }

    const minutes = Math.floor(diffSeconds / 60);

    if (minutes <= 1) {
      return {
        label: '1 min',
        secondsRemaining: diffSeconds,
        minutesRemaining: 1,
        status: 'imminent',
      };
    }

    return {
      label: `${minutes} min`,
      secondsRemaining: diffSeconds,
      minutesRemaining: minutes,
      status: 'scheduled',
    };
  }

  /**
   * Triggers audio and vibration alert
   */
  public static triggerArrivalAlert(serviceNo: string): void {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext may be blocked before interaction
    }
  }
}
