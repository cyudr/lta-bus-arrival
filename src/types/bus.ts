export type BusLoad = 'SEA' | 'SDA' | 'LSD' | ''; // SEA: Seats Available, SDA: Standing Available, LSD: Limited Standing
export type BusType = 'SD' | 'DD' | 'BD' | ''; // SD: Single Deck, DD: Double Deck, BD: Bendy
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS' | string; // SBS Transit, SMRT, Tower Transit, Go-Ahead Singapore

export interface BusArrivalTiming {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO 8601 string in GMT+8 (SST)
  Monitored: number; // 0 = based on schedule, 1 = estimated based on live bus location
  Latitude: number;
  Longitude: number;
  VisitNumber: number | string;
  Load: BusLoad;
  Feature: 'WAB' | '' | string;
  Type: BusType;
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: BusOperator;
  NextBus: BusArrivalTiming | null;
  NextBus2: BusArrivalTiming | null;
  NextBus3: BusArrivalTiming | null;
}

export interface LtaBusArrivalApiResponse {
  'odata.metadata'?: string;
  BusStopCode: string;
  Services: Array<{
    ServiceNo: string;
    Operator: string;
    NextBus?: Partial<BusArrivalTiming & { Latitude: string; Longitude: string; VisitNumber: string }>;
    NextBus2?: Partial<BusArrivalTiming & { Latitude: string; Longitude: string; VisitNumber: string }>;
    NextBus3?: Partial<BusArrivalTiming & { Latitude: string; Longitude: string; VisitNumber: string }>;
  }>;
}

export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  mrtConnections?: string[];
  services?: string[];
}

export interface LiveVehicle {
  id: string;
  serviceNo: string;
  operator: string;
  lat: number;
  lng: number;
  heading: number;
  load: BusLoad;
  type: BusType;
  feature: string;
  monitored: number;
  originCode: string;
  destinationCode: string;
  estimatedArrival: string;
  targetStopCode: string;
}

export interface BookmarkItem {
  id: string;
  busStopCode: string;
  customLabel?: string;
  addedAt: number;
}

export interface ApiConfiguration {
  endpointUrl: string;
  ltaAccountKey: string;
  refreshIntervalSeconds: number;
}
