
export interface Coordinates {
  lng: number;
  lat: number;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  category: 'cafe' | 'bar';
  elevation?: number; // Meters above sea level
}

export interface RouteStep {
  instruction: string;
  distance: number;
  location?: Coordinates; // For GPX waypoints
}

export interface RouteData {
  distance: number; // meters
  duration: number; // seconds
  geometry: any; // GeoJSON geometry
  steps: RouteStep[];
  elevationGain?: number; // meters
  viaWaypoint?: {
    name: string;
    coordinates: Coordinates;
  };
  isEstimate?: boolean; // New flag: true if calculated via math, false if via Mapbox API
}

export interface EnrichedDestination extends Place {
  route?: RouteData;
  geminiTitle?: string;
  geminiDescription?: string;
  geminiTip?: string;
  openingHours?: string;
  playlistVibe?: string;
  preferredWaypoints?: Coordinates[];
  linkedScenicRouteId?: string;
}

export interface ScenicRoute {
  id: string;
  name: string;
  description: string;
  pointA: Coordinates;
  pointB: Coordinates;
  waypoints: Coordinates[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  image: string; // URL or Placeholder ID
  description: string;
  tags: ('rain' | 'sun' | 'cold' | 'night' | 'general')[];
  affiliateLink: string;
}

declare global {
  interface Window {
    L: any; // Leaflet global
  }
}