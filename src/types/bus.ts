export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy Bus
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS'; // SBS Transit, SMRT, Tower Transit, Go-Ahead Singapore

export interface BusArrivalTiming {
  EstimatedArrival: string; // ISO string
  Latitude: number;
  Longitude: number;
  VisitNumber: number;
  Load: BusLoad;
  Feature: 'WAB' | '';
  Type: BusType;
  Speed?: number;
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: BusOperator;
  DestinationCode?: string;
  DestinationName?: string;
  NextBus: BusArrivalTiming | null;
  NextBus2: BusArrivalTiming | null;
  NextBus3: BusArrivalTiming | null;
}

export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  mrtConnections?: string[];
  services: string[];
}

export interface BusRouteStop {
  StopSequence: number;
  BusStopCode: string;
  Distance: number; // in kilometers
}

export interface BusRoute {
  ServiceNo: string;
  Operator: BusOperator;
  Direction: 1 | 2;
  OriginCode: string;
  OriginName: string;
  DestinationCode: string;
  DestinationName: string;
  Category: 'Trunk' | 'Feeder' | 'Express' | 'City Direct';
  OperatingHours: {
    firstBusWeekday: string;
    lastBusWeekday: string;
    firstBusWeekend: string;
    lastBusWeekend: string;
  };
  Stops: BusRouteStop[];
  Polyline?: [number, number][]; // GPS coordinates for route line
}

export interface LiveVehicle {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  lat: number;
  lng: number;
  heading: number; // in degrees (0-360)
  load: BusLoad;
  type: BusType;
  feature: 'WAB' | '';
  nextStopCode: string;
  currentSegmentProgress: number; // 0 to 1
  speedKmH: number;
  etaToNextStopSeconds: number;
}

export interface BookmarkItem {
  id: string;
  busStopCode: string;
  serviceNo?: string;
  customLabel?: string;
  addedAt: number;
}

export interface ApiConfiguration {
  mode: 'simulation' | 'backend';
  customBackendUrl: string;
  ltaAccountKey?: string;
  refreshIntervalSeconds: number;
}
