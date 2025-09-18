export interface GasStation {
  id: string;
  name?: string;
  brand?: string;
  address?: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  fuels: Fuel[];
  services?: string[];
  lastUpdate?: string;
  // Opening hours
  openingHours?: OpeningHours;
  // Additional metadata
  automate24h?: boolean; // 24h automated service
  highway?: boolean; // Highway location
  freeAccess?: boolean; // Free access (not restricted)
}

export interface OpeningHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  closed?: boolean;
  hours?: TimeRange[];
}

export interface TimeRange {
  open: string; // HH:MM format
  close: string; // HH:MM format
}

export interface Fuel {
  id: string;
  name: string;
  price?: number;
  lastUpdate?: string;
}

export interface StationStats {
  totalStations: number;
  lastUpdate?: string;
}

export interface MapFilters {
  fuelType: string;
  maxStations: number | null; // null for "ALL"
  maxPrice: number | null;
  maxDistance: number | null;
  location: string;
  userLatitude: number | null;
  userLongitude: number | null;
  // Top N stations feature
  topN: number | null; // null for disabled
  topNOrderBy: 'distance' | 'price';
}