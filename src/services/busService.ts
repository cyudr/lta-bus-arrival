import {
  BusStop,
  BusServiceArrival,
  BusArrivalTiming,
  LiveVehicle,
  BusLoad,
  BusType,
  BusOperator,
  ApiConfiguration,
  BookmarkItem,
} from '../types/bus';
import { SINGAPORE_BUS_STOPS, POPULAR_BUS_SERVICES } from '../data/singaporeBuses';

const CONFIG_KEY = 'sg_bus_radar_api_config';
const BOOKMARKS_KEY = 'sg_bus_radar_bookmarks';

export const DEFAULT_CONFIG: ApiConfiguration = {
  mode: 'simulation',
  customBackendUrl: '/api/busarrival',
  ltaAccountKey: '',
  refreshIntervalSeconds: 15,
};

// Operator lookup for services
const SERVICE_OPERATORS: Record<string, BusOperator> = {
  '190': 'SMRT',
  '960': 'SMRT',
  '851': 'SMRT',
  '857': 'TTS',
  '106': 'TTS',
  '143': 'TTS',
  '65': 'SBST',
  '7': 'SBST',
  '14': 'SBST',
  '12': 'GAS',
  '147': 'SBST',
  '36': 'GAS',
  '502': 'SBST',
  '518': 'GAS',
};

export class BusService {
  private static liveVehicles: Map<string, LiveVehicle> = new Map();
  private static initializedVehicles = false;

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
    // Default initial bookmark: Opp Orchard Stn
    return [
      {
        id: '09048-default',
        busStopCode: '09048',
        customLabel: 'Orchard Central / ION',
        addedAt: Date.now(),
      },
      {
        id: '01112-default',
        busStopCode: '01112',
        customLabel: 'Bugis Junction',
        addedAt: Date.now() - 3600000,
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
      return false; // removed
    } else {
      list.push({
        id: `${busStopCode}-${Date.now()}`,
        busStopCode,
        customLabel: label,
        addedAt: Date.now(),
      });
      this.saveBookmarks(list);
      return true; // added
    }
  }

  public static isBookmarked(busStopCode: string): boolean {
    return this.getBookmarks().some((b) => b.busStopCode === busStopCode);
  }

  public static getAllStops(): BusStop[] {
    return SINGAPORE_BUS_STOPS;
  }

  public static getStopByCode(code: string): BusStop | undefined {
    return SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === code);
  }

  public static searchStops(query: string): BusStop[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return SINGAPORE_BUS_STOPS;

    return SINGAPORE_BUS_STOPS.filter((stop) => {
      const matchCode = stop.BusStopCode.toLowerCase().includes(clean);
      const matchDesc = stop.Description.toLowerCase().includes(clean);
      const matchRoad = stop.RoadName.toLowerCase().includes(clean);
      const matchService = stop.services.some((srv) => srv.toLowerCase() === clean);
      const matchMrt = stop.mrtConnections?.some((mrt) => mrt.toLowerCase().includes(clean));

      return matchCode || matchDesc || matchRoad || matchService || matchMrt;
    });
  }

  /**
   * Computes distance in meters between two GPS coordinates using Haversine formula
   */
  public static calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Returns bus stops sorted by proximity to target coordinates
   */
  public static getNearbyStops(lat: number, lng: number, limit = 10): (BusStop & { distanceMeters: number })[] {
    return SINGAPORE_BUS_STOPS.map((stop) => ({
      ...stop,
      distanceMeters: this.calculateDistanceMeters(lat, lng, stop.Latitude, stop.Longitude),
    }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit);
  }

  /**
   * Initializes or updates live moving bus fleet
   */
  public static getLiveVehicles(): LiveVehicle[] {
    const now = Date.now();
    const cycleTimeMs = 180000; // 3 minute animation loop cycle

    if (!this.initializedVehicles || this.liveVehicles.size === 0) {
      this.initFleet();
    }

    // Progress each vehicle along route
    const vehicles: LiveVehicle[] = [];
    this.liveVehicles.forEach((veh) => {
      const route = POPULAR_BUS_SERVICES.find((r) => r.ServiceNo === veh.serviceNo);
      if (route && route.Polyline && route.Polyline.length > 1) {
        const poly = route.Polyline;
        const totalSegments = poly.length - 1;
        // Time offset based on vehicle ID hash
        const hash = Array.from(veh.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const progress = ((now + hash * 23000) % cycleTimeMs) / cycleTimeMs;

        const floatIndex = progress * totalSegments;
        const segmentIndex = Math.min(Math.floor(floatIndex), totalSegments - 1);
        const segmentFraction = floatIndex - segmentIndex;

        const startPt = poly[segmentIndex];
        const endPt = poly[segmentIndex + 1];

        // Linear interpolation
        veh.lat = startPt[0] + (endPt[0] - startPt[0]) * segmentFraction;
        veh.lng = startPt[1] + (endPt[1] - startPt[1]) * segmentFraction;

        // Calculate heading in degrees
        const dLng = endPt[1] - startPt[1];
        const dLat = endPt[0] - startPt[0];
        const rad = Math.atan2(dLng, dLat);
        veh.heading = (rad * 180) / Math.PI;

        // Dynamic speed between 25-45 km/h
        veh.speedKmH = Math.round(28 + Math.sin(now / 5000 + hash) * 12);
        
        // Estimated seconds to next stop
        veh.etaToNextStopSeconds = Math.max(10, Math.round((1 - segmentFraction) * 120));
      }
      vehicles.push({ ...veh });
    });

    return vehicles;
  }

  private static initFleet(): void {
    this.liveVehicles.clear();
    const services = POPULAR_BUS_SERVICES;

    services.forEach((service) => {
      // Create 2-3 buses per popular service
      const count = 3;
      for (let i = 0; i < count; i++) {
        const busId = `SG-${service.ServiceNo}-${1001 + i * 42}`;
        const loadPool: BusLoad[] = ['SEA', 'SEA', 'SDA', 'LSD'];
        const typePool: BusType[] = ['DD', 'DD', 'SD'];

        this.liveVehicles.set(busId, {
          id: busId,
          serviceNo: service.ServiceNo,
          operator: service.Operator,
          lat: service.Polyline ? service.Polyline[0][0] : 1.3044,
          lng: service.Polyline ? service.Polyline[0][1] : 103.8318,
          heading: 90,
          load: loadPool[(i + service.ServiceNo.length) % loadPool.length],
          type: typePool[i % typePool.length],
          feature: 'WAB',
          nextStopCode: service.Stops[Math.min(i + 1, service.Stops.length - 1)].BusStopCode,
          currentSegmentProgress: i * 0.3,
          speedKmH: 34,
          etaToNextStopSeconds: 60 + i * 180,
        });
      }
    });

    this.initializedVehicles = true;
  }

  /**
   * Fetches bus arrivals for a stop.
   * If config mode is backend, calls backend. Otherwise calculates live simulated arrivals.
   */
  public static async getArrivalsForStop(busStopCode: string): Promise<BusServiceArrival[]> {
    const config = this.getConfig();

    if (config.mode === 'backend' && config.customBackendUrl) {
      try {
        const headers: Record<string, string> = {
          Accept: 'application/json',
        };
        if (config.ltaAccountKey) {
          headers['AccountKey'] = config.ltaAccountKey;
        }

        let url = config.customBackendUrl.trim();
        if (url.includes('?')) {
          url += `&BusStopCode=${encodeURIComponent(busStopCode)}`;
        } else if (url.endsWith('/busarrival') || url.endsWith('/busarrival.ts')) {
          url += `?BusStopCode=${encodeURIComponent(busStopCode)}`;
        } else {
          url = `${url.replace(/\/$/, '')}/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
        }
        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`Backend returned HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        if (data && Array.isArray(data.Services)) {
          return data.Services.map((srv: any) => ({
            ServiceNo: srv.ServiceNo,
            Operator: srv.Operator || 'SBST',
            NextBus: srv.NextBus ? this.normalizeTiming(srv.NextBus) : null,
            NextBus2: srv.NextBus2 ? this.normalizeTiming(srv.NextBus2) : null,
            NextBus3: srv.NextBus3 ? this.normalizeTiming(srv.NextBus3) : null,
          }));
        }
      } catch (err) {
        console.warn('Backend fetch failed, falling back to live simulation engine:', err);
        // gracefully fall back to local high-fidelity simulation so UI never breaks
      }
    }

    // High fidelity simulation mode
    return this.generateSimulatedArrivals(busStopCode);
  }

  private static normalizeTiming(raw: any): BusArrivalTiming {
    return {
      EstimatedArrival: raw.EstimatedArrival || new Date().toISOString(),
      Latitude: parseFloat(raw.Latitude) || 1.3044,
      Longitude: parseFloat(raw.Longitude) || 103.8318,
      VisitNumber: parseInt(raw.VisitNumber, 10) || 1,
      Load: (['SEA', 'SDA', 'LSD'].includes(raw.Load) ? raw.Load : 'SEA') as BusLoad,
      Feature: raw.Feature === 'WAB' ? 'WAB' : '',
      Type: (['SD', 'DD', 'BD'].includes(raw.Type) ? raw.Type : 'SD') as BusType,
    };
  }

  private static generateSimulatedArrivals(busStopCode: string): BusServiceArrival[] {
    const stop = this.getStopByCode(busStopCode);
    const services = stop ? stop.services : ['190', '65', '106', '7', '14', '857'];
    const now = Date.now();

    return services.map((serviceNo) => {
      // Deterministic pseudo-random seed based on busStopCode + serviceNo + current 10-minute block
      const tenMinBlock = Math.floor(now / (10 * 60 * 1000));
      const seedStr = `${busStopCode}-${serviceNo}-${tenMinBlock}`;
      const seedNum = Array.from(seedStr).reduce((acc, char) => acc + char.charCodeAt(0), 0);

      // Realistic interval offset for NextBus: 0 to 11 minutes
      // As seconds tick forward within the 10-min block, arrival time approaches smoothly!
      const elapsedInBlock = (now % (10 * 60 * 1000)) / 1000; // 0 to 600 seconds
      const baseWaitSeconds = ((seedNum * 47) % 600) + 60; // 60s to 660s
      let nextWaitSeconds = Math.max(0, baseWaitSeconds - (elapsedInBlock % baseWaitSeconds));

      // Realistic load distribution
      const loadSeq: BusLoad[] = ['SEA', 'SEA', 'SDA', 'SEA', 'LSD', 'SDA'];
      const typeSeq: BusType[] = ['DD', 'DD', 'SD', 'DD', 'BD'];
      const operator = SERVICE_OPERATORS[serviceNo] || (seedNum % 2 === 0 ? 'SBST' : 'SMRT');

      const nextArrivalDate = new Date(now + nextWaitSeconds * 1000);
      const next2Date = new Date(now + (nextWaitSeconds + 480 + (seedNum % 240)) * 1000);
      const next3Date = new Date(now + (nextWaitSeconds + 1020 + (seedNum % 300)) * 1000);

      const stopLat = stop?.Latitude || 1.3044;
      const stopLng = stop?.Longitude || 103.8318;

      // Calculate approximate bus position back along heading
      const offsetFactor = Math.min(1, nextWaitSeconds / 600);
      const busLat = stopLat + (Math.sin(seedNum) * 0.015 * offsetFactor);
      const busLng = stopLng + (Math.cos(seedNum) * 0.015 * offsetFactor);

      const nextBus: BusArrivalTiming = {
        EstimatedArrival: nextArrivalDate.toISOString(),
        Latitude: busLat,
        Longitude: busLng,
        VisitNumber: 1,
        Load: loadSeq[seedNum % loadSeq.length],
        Feature: 'WAB',
        Type: typeSeq[seedNum % typeSeq.length],
        Speed: nextWaitSeconds === 0 ? 0 : 32,
      };

      const nextBus2: BusArrivalTiming = {
        EstimatedArrival: next2Date.toISOString(),
        Latitude: stopLat + Math.sin(seedNum + 1) * 0.03,
        Longitude: stopLng + Math.cos(seedNum + 1) * 0.03,
        VisitNumber: 1,
        Load: loadSeq[(seedNum + 1) % loadSeq.length],
        Feature: 'WAB',
        Type: typeSeq[(seedNum + 1) % typeSeq.length],
      };

      const nextBus3: BusArrivalTiming = {
        EstimatedArrival: next3Date.toISOString(),
        Latitude: stopLat + Math.sin(seedNum + 2) * 0.05,
        Longitude: stopLng + Math.cos(seedNum + 2) * 0.05,
        VisitNumber: 1,
        Load: loadSeq[(seedNum + 2) % loadSeq.length],
        Feature: 'WAB',
        Type: typeSeq[(seedNum + 2) % typeSeq.length],
      };

      return {
        ServiceNo: serviceNo,
        Operator: operator,
        DestinationName: this.getDestinationForService(serviceNo),
        NextBus: nextBus,
        NextBus2: nextBus2,
        NextBus3: nextBus3,
      };
    });
  }

  public static getDestinationForService(serviceNo: string): string {
    const route = POPULAR_BUS_SERVICES.find((r) => r.ServiceNo === serviceNo);
    if (route) return route.DestinationName;

    const commonDestinations: Record<string, string> = {
      '7': 'Clementi Int',
      '12': 'Kampong Bahru Ter',
      '14': 'Clementi Int',
      '16': 'Bukit Merah Int',
      '36': 'Changi Airport',
      '65': 'HarbourFront Int',
      '106': 'Shenton Way Ter',
      '111': 'Ghim Moh Ter',
      '124': 'St. Michael\'s Ter',
      '147': 'Clementi Int',
      '174': 'New Bridge Rd Ter',
      '175': 'Geylang Lor 1 Ter',
      '190': 'Kampong Bahru Ter',
      '502': 'Soon Lee Bus Pk',
      '518': 'Pasir Ris Int',
      '857': 'Suntec City / Marina Ctr',
      '960': 'Marina Centre Ter',
    };

    return commonDestinations[serviceNo] || 'En Route';
  }

  /**
   * Calculates human friendly countdown prediction
   */
  public static getCountdown(estimatedArrivalIso: string | undefined | null): {
    label: string;
    secondsRemaining: number;
    minutesRemaining: number;
    status: 'arriving' | 'imminent' | 'scheduled';
  } {
    if (!estimatedArrivalIso) {
      return { label: '--', secondsRemaining: 9999, minutesRemaining: 999, status: 'scheduled' };
    }

    const arrivalMs = new Date(estimatedArrivalIso).getTime();
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
   * Sound alert and vibration when bus approaches
   */
  public static triggerArrivalAlert(serviceNo: string, stopDesc: string): void {
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
      // AudioContext might be blocked before user interaction
    }
  }
}
