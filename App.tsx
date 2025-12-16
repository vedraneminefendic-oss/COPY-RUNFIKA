import React, { useEffect, useState, useRef, useCallback, Component, ReactNode } from 'react';
import maplibregl from 'maplibre-gl';
import { DEFAULT_CENTER, ZOOM_LEVEL, FEATURED_CAFES, MAP_STYLE } from './constants';
import { getWalkingRoute, getDetourRoute, getDistance, fetchPointElevation } from './services/mapboxService';
import { curateDestinations } from './services/geminiService';
import { Coordinates, EnrichedDestination } from './types';
import Sidebar from './components/Sidebar';
import { Locate, Menu, List, AlertTriangle } from 'lucide-react';
import { getOpenStatus } from './utils/openingHours';

// FIX: Set worker URL to CDN to avoid "Blocked a frame" errors in sandboxed environments.
// We strictly use version 4.7.1 to match package.json and CSS.
try {
  // @ts-ignore
  maplibregl.workerUrl = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl-csp-worker.js";
} catch (e) {
  console.warn("Failed to set maplibregl workerUrl", e);
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-stone-100 p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">Application Error</h2>
            <p className="text-stone-500 text-sm mb-4">Something went wrong while loading the map.</p>
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-left overflow-auto max-h-40 mb-6">
              <code className="text-xs text-red-600 font-mono">{this.state.error?.message || 'Unknown Error'}</code>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  // Refs for MapLibre Native implementation
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const routeViaMarkerRef = useRef<maplibregl.Marker | null>(null);
  const lastCalcLocation = useRef<Coordinates | null>(null);

  // State
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [userElevation, setUserElevation] = useState<number | undefined>(undefined);
  const [gpsLocation, setGpsLocation] = useState<Coordinates | null>(null);
  const [destinations, setDestinations] = useState<EnrichedDestination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<EnrichedDestination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Debug & UI
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLog, setDebugLog] = useState<string>('');
  const [btnTouchStart, setBtnTouchStart] = useState<number | null>(null);

  // Mobile Check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initial Data
  useEffect(() => {
    if (!hasInitialLoaded) {
      setDestinations(FEATURED_CAFES as EnrichedDestination[]);
      setHasInitialLoaded(true);
    }
  }, [hasInitialLoaded]);

  // --- MAP INITIALIZATION (Vanilla MapLibre) ---
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
        zoom: ZOOM_LEVEL,
        attributionControl: false,
        // Disable refresh expiration to avoid some timer issues
        refreshExpiredTiles: false,
        // Critical: disable trackResize if looking for stability in iframes
        trackResize: true
      });

      map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-left');

      map.current.on('load', () => {
        // Initialize Route Source and Layers
        if (!map.current) return;

        // Check if source already exists (hot reload safety)
        if (!map.current.getSource('route')) {
            map.current.addSource('route', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });

            // White casing (border)
            map.current.addLayer({
              id: 'route-line-casing',
              type: 'line',
              source: 'route',
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: {
                'line-color': '#ffffff',
                'line-width': 8,
                'line-opacity': 0.8
              }
            });

            // Orange line
            map.current.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route',
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: {
                'line-color': '#f59e0b',
                'line-width': 5,
                'line-opacity': 0.9
              }
            });
        }
      });
      
      map.current.on('error', (e) => {
          console.error("MapLibre Error:", e);
          setDebugLog(prev => prev + `\nMapErr: ${e.error?.message}`);
      });

    } catch (err: any) {
      console.error("Map Initialization Failed:", err);
      setDebugLog(prev => prev + `\nInitFail: ${err?.message}`);
      throw err; // Re-throw to hit ErrorBoundary
    }

    // Cleanup
    return () => {
      // We generally don't destroy the map on unmount in React 18 strict mode dev 
      // to avoid flash, but proper cleanup is good.
      // map.current?.remove();
      // map.current = null;
    };

  }, []);

  // --- MARKER MANAGEMENT (Vanilla DOM) ---
  useEffect(() => {
    if (!map.current || destinations.length === 0) return;

    // 1. Clear existing markers
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    destinations.forEach(dest => {
      const isBar = dest.category === 'bar';
      const openStatus = getOpenStatus(dest.openingHours);
      const isOpen = openStatus?.isOpen;
      
      // Create DOM element
      const el = document.createElement('div');
      el.className = 'marker-container group relative cursor-pointer transition-transform duration-300';
      
      // Basic Style (Icon)
      const icon = document.createElement('div');
      icon.innerHTML = isBar ? '🍺' : '🥐';
      icon.className = `drop-shadow-md text-3xl transition-transform duration-300 transform hover:scale-110 z-10 ${!isOpen ? 'opacity-70 grayscale' : ''}`;
      el.appendChild(icon);

      // Label (hidden by default, shown on select/debug)
      const label = document.createElement('div');
      label.className = 'absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap shadow-sm border border-stone-200 hidden z-20';
      label.innerText = dest.name;
      el.appendChild(label);

      // Store refs in the DOM element for easy access during updates
      (el as any)._label = label;
      (el as any)._icon = icon;

      // Click Handler
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectDestination(dest);
      });

      // Add to Map
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([dest.coordinates.lng, dest.coordinates.lat])
        .addTo(map.current!);

      markersRef.current[dest.id] = marker;
    });

  }, [destinations]); // Re-run when list changes

  // --- UPDATE MARKER VISUALS (Selection) ---
  useEffect(() => {
    Object.keys(markersRef.current).forEach(id => {
      const marker = markersRef.current[id];
      const el = marker.getElement();
      const label = (el as any)._label;
      const icon = (el as any)._icon;
      
      if (selectedDestination?.id === id) {
        // Selected State
        icon.classList.add('scale-125', 'z-50');
        icon.classList.remove('hover:scale-110', 'z-10');
        label.classList.remove('hidden');
        el.style.zIndex = '50';
      } else {
        // Normal State
        icon.classList.remove('scale-125', 'z-50');
        icon.classList.add('hover:scale-110', 'z-10');
        if (!isDebugMode) label.classList.add('hidden');
        el.style.zIndex = 'auto';
      }
      
      if (isDebugMode) label.classList.remove('hidden');
    });
  }, [selectedDestination, isDebugMode]);


  // --- USER LOCATION MARKER ---
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-teal-500 rounded-full border-4 border-white shadow-xl animate-pulse cursor-grab active:cursor-grabbing';
      
      userMarkerRef.current = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
        
      userMarkerRef.current.on('dragend', () => {
        const lngLat = userMarkerRef.current!.getLngLat();
        setUserLocation({ lng: lngLat.lng, lat: lngLat.lat });
      });
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation]);


  // --- ROUTE & VIA MARKER RENDERING ---
  useEffect(() => {
    if (!map.current) return;

    // 1. Update Line
    const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
    if (source) {
      if (selectedDestination?.route?.geometry) {
        source.setData(selectedDestination.route.geometry);
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }

    // 2. Update Via Waypoint Marker
    if (selectedDestination?.route?.viaWaypoint) {
       const wp = selectedDestination.route.viaWaypoint;
       
       if (!routeViaMarkerRef.current) {
           const el = document.createElement('div');
           el.className = 'flex flex-col items-center';
           el.innerHTML = `
             <div class="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">🌲</div>
             <div class="mt-1 bg-white/90 px-2 py-0.5 rounded shadow text-[10px] font-bold text-emerald-800 whitespace-nowrap border border-emerald-100">Via ${wp.name}</div>
           `;
           routeViaMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
             .setLngLat([wp.coordinates.lng, wp.coordinates.lat])
             .addTo(map.current);
       } else {
           // Update pos
           routeViaMarkerRef.current.setLngLat([wp.coordinates.lng, wp.coordinates.lat]);
           // Update text (simple innerHTML replace)
           const el = routeViaMarkerRef.current.getElement();
           el.innerHTML = `
             <div class="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">🌲</div>
             <div class="mt-1 bg-white/90 px-2 py-0.5 rounded shadow text-[10px] font-bold text-emerald-800 whitespace-nowrap border border-emerald-100">Via ${wp.name}</div>
           `;
       }
    } else {
       if (routeViaMarkerRef.current) {
           routeViaMarkerRef.current.remove();
           routeViaMarkerRef.current = null;
       }
    }

  }, [selectedDestination]);


  // --- GEOLOCATION INIT ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          const coords = { lng: longitude, lat: latitude };
          setUserLocation(coords);
          setGpsLocation(coords);
          
          if (map.current) {
              map.current.flyTo({ center: [longitude, latitude], zoom: 13 });
          }
          
          fetchPointElevation(coords).then(ele => { if (ele !== null) setUserElevation(ele); });
        },
        (err) => console.error("Geolocation error", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // --- CALCULATE ROUTES LOGIC (Unchanged) ---
  useEffect(() => {
    const updateRoutes = async () => {
      const isLocChanged = !lastCalcLocation.current || 
        (userLocation && getDistance(userLocation, lastCalcLocation.current) > 20); 

      if (userLocation && destinations.length > 0 && !isLoading && isLocChanged) {
        setIsLoading(true);
        lastCalcLocation.current = userLocation;
        try {
           const placesWithEstimates = destinations.map(d => {
             const dist = getDistance(userLocation, d.coordinates);
             const estWalkDist = dist * 1.35; 
             let netElev = undefined;
             if (d.elevation !== undefined && userElevation !== undefined) netElev = d.elevation - userElevation;
             return { ...d, route: { distance: estWalkDist, duration: estWalkDist / 1.4, geometry: { coordinates: [] }, steps: [], isEstimate: true, elevationGain: netElev } };
           });
           const curated = await curateDestinations(placesWithEstimates);
           curated.sort((a, b) => (a.route?.distance || Infinity) - (b.route?.distance || Infinity));
           setDestinations(curated);
           if (selectedDestination) {
               const updated = curated.find(d => d.id === selectedDestination.id);
               if (updated) setSelectedDestination(updated);
           }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
      }
    };
    updateRoutes();
  }, [userLocation, userElevation]); // Note: destinations dependency removed to avoid loops, triggering only on loc/elev change

  // --- HANDLERS ---
  const handleSelectDestination = useCallback(async (destination: EnrichedDestination) => {
    setSelectedDestination(destination);
    if (!isMobile) setSidebarOpen(true);
    
    map.current?.flyTo({ center: [destination.coordinates.lng, destination.coordinates.lat], zoom: 14, duration: 1500 });

    if (userLocation && (!destination.route || destination.route.isEstimate)) {
        setIsLoading(true);
        try {
            const realRoute = await getWalkingRoute(
                userLocation, destination.coordinates, false, false,
                destination.preferredWaypoints, userElevation, destination.elevation
            );
            if (realRoute) {
                const updated = { ...destination, route: realRoute };
                setSelectedDestination(updated);
                setDestinations(prev => prev.map(d => d.id === destination.id ? updated : d));
                
                if (map.current && realRoute.geometry?.coordinates) {
                    const coords = realRoute.geometry.coordinates;
                    const bounds = new maplibregl.LngLatBounds(coords[0] as any, coords[0] as any);
                    for (const coord of coords) { bounds.extend(coord as any); }
                    map.current.fitBounds(bounds, { padding: isMobile ? {top: 50, bottom: 400, left: 50, right: 50} : 100 });
                }
            }
        } finally { setIsLoading(false); }
    }
  }, [userLocation, isMobile, userElevation]);

  const handleUpdateRoute = useCallback(async (destId: string, dist: number, roundTrip: boolean, scenic: boolean) => {
      if (!userLocation) return;
      const dest = destinations.find(d => d.id === destId);
      if (!dest) return;
      const newRoute = await getDetourRoute(
          userLocation, dest.coordinates, dist, roundTrip, scenic,
          dest.preferredWaypoints, dest.linkedScenicRouteId, userElevation, dest.elevation
      );
      if (newRoute) {
          const updated = { ...dest, route: newRoute };
          setSelectedDestination(updated);
          setDestinations(prev => prev.map(d => d.id === destId ? updated : d));
          
          // Fit bounds to new route
          if (map.current && newRoute.geometry?.coordinates) {
              const coords = newRoute.geometry.coordinates;
              const bounds = new maplibregl.LngLatBounds(coords[0] as any, coords[0] as any);
              for (const coord of coords) { bounds.extend(coord as any); }
              map.current.fitBounds(bounds, { padding: isMobile ? {top: 50, bottom: 400, left: 50, right: 50} : 100 });
          }
      }
  }, [userLocation, destinations, userElevation, isMobile]);

  const handleCategoryFilter = async (type: 'cafe' | 'bar') => {
      const filtered = FEATURED_CAFES.filter(p => p.category === type) as EnrichedDestination[];
      setDestinations(filtered);
      setSelectedDestination(null);
      if (!isMobile) setSidebarOpen(true);
      if (filtered.length > 0 && map.current) {
          const first = filtered[0];
          map.current.flyTo({ center: [first.coordinates.lng, first.coordinates.lat], zoom: 12 });
      }
  };

  const handleBack = () => { setSelectedDestination(null); if (isMobile) setSidebarOpen(true); };
  
  const recenter = () => { 
      const target = userLocation || gpsLocation; 
      if (target && map.current) map.current.flyTo({ center: [target.lng, target.lat], zoom: 14 }); 
  };
  
  const getSidebarClasses = () => {
    if (!isMobile) return `absolute inset-y-0 right-0 w-96 z-[20] shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`;
    const base = "fixed left-0 right-0 z-[30] transition-transform duration-300 bg-white shadow-xl rounded-t-3xl flex flex-col";
    if (selectedDestination) return `${base} bottom-0 h-[65vh] translate-y-0`;
    if (sidebarOpen) return `${base} bottom-0 h-[55vh] translate-y-0`;
    return `${base} bottom-0 h-[55vh] translate-y-full`;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-100">
      
      {/* MAP CONTAINER */}
      <div ref={mapContainer} className="w-full h-full" />

      {isMobile && !sidebarOpen && !selectedDestination && (
         <button onClick={() => setSidebarOpen(true)} onTouchStart={(e) => setBtnTouchStart(e.targetTouches[0].clientY)} onTouchEnd={(e) => { if (btnTouchStart && btnTouchStart - e.changedTouches[0].clientY > 50) setSidebarOpen(true); }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10] bg-stone-900 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-transform"><List size={20} /> Explore Spots</button>
      )}
      
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block absolute top-4 right-4 z-[20] bg-white text-stone-800 p-2 rounded-lg shadow-lg border border-stone-200"><Menu size={20} /></button>
      
      <div className={getSidebarClasses()}>
        <Sidebar destinations={destinations} selectedDestination={selectedDestination} onSelect={handleSelectDestination} onBack={handleBack} onCloseSidebar={() => setSidebarOpen(false)} onSearch={handleCategoryFilter} onUpdateRoute={handleUpdateRoute} isLoading={isLoading} userLocation={userLocation} isDebugMode={isDebugMode} onToggleDebug={() => setIsDebugMode(!isDebugMode)} isMobile={isMobile} />
      </div>
      
      <button onClick={recenter} className={`absolute z-[10] bg-white hover:bg-stone-50 text-teal-600 p-3 rounded-full shadow-xl border border-stone-200 transition-all active:scale-95 md:bottom-8 md:left-8 md:right-auto md:top-auto top-20 right-4 ${isMobile && selectedDestination ? 'top-4 right-4' : ''} `}><Locate size={24} /></button>
      
      {isDebugMode && (<div className="absolute top-0 left-0 bg-black/80 text-green-400 p-2 text-xs font-mono w-64 h-32 overflow-auto pointer-events-none z-[100]">DEBUG: {debugLog}</div>)}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;