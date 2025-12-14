import React, { useEffect, useState, useRef, useCallback } from 'react';
import Map, { Marker, Source, Layer, MapRef, NavigationControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { DEFAULT_CENTER, ZOOM_LEVEL, FEATURED_CAFES, MAP_STYLE } from './constants';
import { getWalkingRoute, getDetourRoute, getDistance, fetchPointElevation } from './services/mapboxService';
import { curateDestinations } from './services/geminiService';
import { Coordinates, EnrichedDestination } from './types';
import Sidebar from './components/Sidebar';
import { Locate, Menu, List } from 'lucide-react';
import { getOpenStatus } from './utils/openingHours';

// Fix for Vite to handle MapLibre CSS correctly if needed
import 'maplibre-gl/dist/maplibre-gl.css';

const App: React.FC = () => {
  const mapRef = useRef<MapRef>(null);
  
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
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER.lng,
    latitude: DEFAULT_CENTER.lat,
    zoom: ZOOM_LEVEL
  });

  // Debug
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLog, setDebugLog] = useState<string>('');
  const [btnTouchStart, setBtnTouchStart] = useState<number | null>(null);

  // Refs
  const lastCalcLocation = useRef<Coordinates | null>(null);
  const destinationsRef = useRef<EnrichedDestination[]>([]);
  useEffect(() => { destinationsRef.current = destinations; }, [destinations]);

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

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          const coords = { lng: longitude, lat: latitude };
          setUserLocation(coords);
          setGpsLocation(coords);
          setViewState(prev => ({ ...prev, longitude, latitude, zoom: 13 }));
          fetchPointElevation(coords).then(ele => { if (ele !== null) setUserElevation(ele); });
        },
        (err) => console.error("Geolocation error", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Route Logic
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
  }, [userLocation, userElevation]);

  // Handlers
  const handleSelectDestination = useCallback(async (destination: EnrichedDestination) => {
    setSelectedDestination(destination);
    if (!isMobile) setSidebarOpen(true);
    mapRef.current?.flyTo({ center: [destination.coordinates.lng, destination.coordinates.lat], zoom: 14, duration: 1500 });

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
                
                if (mapRef.current && realRoute.geometry?.coordinates) {
                    const coords = realRoute.geometry.coordinates;
                    const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
                    for (const coord of coords) { bounds.extend(coord); }
                    mapRef.current.fitBounds(bounds, { padding: isMobile ? {top: 50, bottom: 400, left: 50, right: 50} : 100 });
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
      }
  }, [userLocation, destinations, userElevation]);

  const handleCategoryFilter = async (type: 'cafe' | 'bar') => {
      const filtered = FEATURED_CAFES.filter(p => p.category === type) as EnrichedDestination[];
      setDestinations(filtered);
      setSelectedDestination(null);
      if (!isMobile) setSidebarOpen(true);
      if (filtered.length > 0) {
          const first = filtered[0];
          mapRef.current?.flyTo({ center: [first.coordinates.lng, first.coordinates.lat], zoom: 12 });
      }
  };

  const handleBack = () => { setSelectedDestination(null); if (isMobile) setSidebarOpen(true); };
  const recenter = () => { 
      const target = userLocation || gpsLocation; 
      if (target) mapRef.current?.flyTo({ center: [target.lng, target.lat], zoom: 14 }); 
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
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        mapLib={maplibregl}
      >
        <NavigationControl position="top-left" />
        {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat} draggable onDragEnd={(e) => setUserLocation({lng: e.lngLat.lng, lat: e.lngLat.lat})}>
                <div className="w-6 h-6 bg-teal-500 rounded-full border-4 border-white shadow-xl animate-pulse cursor-grab active:cursor-grabbing" />
            </Marker>
        )}
        {destinations.map(dest => {
           const isOpen = getOpenStatus(dest.openingHours)?.isOpen;
           const isSelected = selectedDestination?.id === dest.id;
           const isBar = dest.category === 'bar';
           return (
               <Marker key={dest.id} longitude={dest.coordinates.lng} latitude={dest.coordinates.lat} anchor="bottom" onClick={e => { e.originalEvent.stopPropagation(); handleSelectDestination(dest); }}>
                 <div className={`transform transition-all duration-300 cursor-pointer ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'} ${!isOpen ? 'opacity-70 grayscale' : ''}`}>
                    <div className="drop-shadow-md text-3xl">{isBar ? '🍺' : '🥐'}</div>
                    {(isSelected || isDebugMode) && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap shadow-sm border border-stone-200">
                            {dest.name}
                        </div>
                    )}
                 </div>
               </Marker>
           );
        })}
        {selectedDestination?.route?.geometry && (
            <Source id="route" type="geojson" data={selectedDestination.route.geometry}>
                <Layer id="route-line-casing" type="line" paint={{ 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.8 }} />
                <Layer 
                  id="route-line" 
                  type="line" 
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{ 'line-color': '#f59e0b', 'line-width': 5, 'line-opacity': 0.9 }} 
                />
            </Source>
        )}
        {selectedDestination?.route?.viaWaypoint && (
            <Marker longitude={selectedDestination.route.viaWaypoint.coordinates.lng} latitude={selectedDestination.route.viaWaypoint.coordinates.lat} anchor="center">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">🌲</div>
                    <div className="mt-1 bg-white/90 px-2 py-0.5 rounded shadow text-[10px] font-bold text-emerald-800 whitespace-nowrap border border-emerald-100">Via {selectedDestination.route.viaWaypoint.name}</div>
                </div>
            </Marker>
        )}
      </Map>

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

export default App;