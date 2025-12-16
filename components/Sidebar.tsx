import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EnrichedDestination, Product } from '../types';
import { MapPin, Navigation, Loader2, Clock, ArrowLeft, Footprints, SlidersHorizontal as RouteIcon, Dice5, Download, X, Repeat, CloudSun, CloudRain, Sun, Wind, Trees, Mountain, AlertTriangle, Filter, ChevronDown, Info, Mail, Heart, ArrowDownAZ, ShoppingBag } from 'lucide-react';
import { getOpenStatus } from '../utils/openingHours';
import { generateGPX } from '../services/gpxService';
import { EXPOSED_LOCATIONS, RECOMMENDED_GEAR } from '../constants';

// Custom Map Icons
const MapBunIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" fill="#FDE68A" stroke="white" strokeWidth="1" />
    <path d="M12 12 m1 0 a 1 1 0 0 0 -2 0 a 2 2 0 0 0 4 0 a 3 3 0 0 0 -6 0 a 4 4 0 0 0 8 0 a 5 5 0 0 0 -10 0 a 6 6 0 0 0 12 0" opacity="0.8" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="14" cy="9" r="0.6" fill="white" stroke="none" />
    <circle cx="10" cy="13" r="0.6" fill="white" stroke="none" />
    <circle cx="15" cy="14" r="0.6" fill="white" stroke="none" />
    <circle cx="9" cy="8" r="0.6" fill="white" stroke="none" />
    <circle cx="12" cy="15" r="0.6" fill="white" stroke="none" />
  </svg>
);

const MapBeerIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" fill="#FFE4E6" stroke="white" strokeWidth="2" />
    <path d="M16 9h1a2 2 0 0 1 0 4h-1" stroke="#881337" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6h8v11a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V6z" fill="#f43f5e" stroke="#881337" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6c0-1.5 2-2 4-2s4 .5 4 2" fill="white" stroke="#881337" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 9v7" stroke="#881337" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.5 9v7" stroke="#881337" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SortButton = ({ active, onClick, icon: Icon, label, disabled = false }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-3 sm:py-2 sm:px-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
      active 
        ? 'bg-stone-800 text-white border-stone-800 ring-2 ring-stone-200' 
        : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
  >
    {Icon && <Icon size={16} className={active ? "text-stone-200" : "text-stone-400"} />}
    <span>{label}</span>
  </button>
);

interface SidebarProps {
  destinations: EnrichedDestination[];
  onSelect: (destination: EnrichedDestination) => void;
  selectedDestination: EnrichedDestination | null;
  onBack: () => void;
  onCloseSidebar: () => void;
  onSearch: (type: 'cafe' | 'bar') => void;
  onUpdateRoute: (destinationId: string, targetDistanceKm: number, isRoundTrip: boolean, isScenic: boolean) => Promise<void>;
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  isDebugMode: boolean;
  onToggleDebug: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  destinations, 
  onSelect, 
  selectedDestination, 
  onBack, 
  onCloseSidebar, 
  onSearch, 
  onUpdateRoute, 
  isLoading, 
  userLocation, 
  isDebugMode, 
  onToggleDebug, 
  isMobile
}) => {
  // Navigation & UI State
  const [targetDistance, setTargetDistance] = useState<number>(0);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [isScenic, setIsScenic] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // Filtering & Sorting State
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'scenic'>('distance');

  // Debounce State
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Track current destination ID to reset state on change
  const currentDestId = useRef<string | null>(null);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  // Sync slider with current route distance only when a NEW destination is selected
  useEffect(() => {
    if (selectedDestination && selectedDestination.id !== currentDestId.current) {
        currentDestId.current = selectedDestination.id;
        
        if (selectedDestination.route) {
            setTargetDistance(Math.round(selectedDestination.route.distance / 100) / 10);
        } else {
            setTargetDistance(0);
        }
        
        // Reset toggles for new destination
        setIsRoundTrip(false);
        setIsScenic(false);
    }
  }, [selectedDestination]);

  // Mobile Swipe Handlers
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    // Only track if we are at the very top, otherwise we are just scrolling
    if (containerRef.current && containerRef.current.scrollTop === 0) {
        setTouchEndY(null);
        setTouchStartY(e.targetTouches[0].clientY);
    } else {
        setTouchStartY(null);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY) {
        setTouchEndY(e.targetTouches[0].clientY);
    }
  };

  const onTouchEnd = () => {
    if (!touchStartY || !touchEndY) return;
    const distance = touchStartY - touchEndY;
    const isSwipeDown = distance < -75; // Threshold
    
    // Only close if we swiped down and we were at the top
    if (isSwipeDown && isMobile && containerRef.current && containerRef.current.scrollTop === 0) {
      onCloseSidebar();
    }
    setTouchStartY(null);
    setTouchEndY(null);
  };

  const commitRouteUpdate = (dist: number, roundTrip: boolean, scenic: boolean, immediate = false) => {
    if (!selectedDestination) return;
    
    // Clear any pending update
    if (debounceTimer) clearTimeout(debounceTimer);
    
    const doUpdate = async () => {
        setIsOptimizing(true);
        await onUpdateRoute(selectedDestination.id, dist, roundTrip, scenic);
        setIsOptimizing(false);
    };

    if (immediate) {
        doUpdate();
    } else {
        // Set new debounce timer (600ms)
        const timer = setTimeout(doUpdate, 600);
        setDebounceTimer(timer);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ensure we always have a valid number
    let newVal = parseFloat(e.target.value);
    if (!Number.isFinite(newVal)) newVal = 0;
    
    setTargetDistance(newVal);
    // Trigger debounced update
    commitRouteUpdate(newVal, isRoundTrip, isScenic);
  };

  // Immediate update on release for snappier feel
  const handleSliderRelease = () => {
      commitRouteUpdate(targetDistance, isRoundTrip, isScenic, true);
  };

  const handleLoopToggle = () => {
    const newRoundTrip = !isRoundTrip;
    setIsRoundTrip(newRoundTrip);
    commitRouteUpdate(targetDistance, newRoundTrip, isScenic, true);
  };

  const handleScenicToggle = () => {
    const newScenic = !isScenic;
    setIsScenic(newScenic);
    commitRouteUpdate(targetDistance, isRoundTrip, newScenic, true);
  };

  const handleDownloadGPX = () => {
    if (!selectedDestination || !selectedDestination.route) return;
    
    const gpxContent = generateGPX(selectedDestination);
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const filename = `${(selectedDestination.geminiTitle || selectedDestination.name).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSurpriseMe = () => {
    if (processedDestinations.length > 0) {
      const randomDest = processedDestinations[Math.floor(Math.random() * processedDestinations.length)];
      onSelect(randomDest);
    }
  };
  
  // --- GEAR LOGIC ---
  const isDarkOrCold = () => {
      const month = new Date().getMonth();
      // Oct (9) to March (2)
      return month >= 9 || month <= 2;
  };

  const getRecommendedGear = (distance: number): Product[] => {
      const isWinter = isDarkOrCold();
      
      const prioritized = RECOMMENDED_GEAR.filter(item => {
          if (isWinter) {
              if (item.tags.some(t => ['rain', 'cold', 'night'].includes(t))) return true;
          }
          if (distance > 8000) {
              // Simple check for "vest" or "watch" in name or tags, assuming future data update
              const lowerName = item.name.toLowerCase();
              if (lowerName.includes('vest') || lowerName.includes('watch')) return true;
          }
          // Default fallthrough logic for other items if we have them
          return false;
      });

      // If we found specific matches, return them. Otherwise return general.
      if (prioritized.length > 0) return prioritized.slice(0, 2);
      
      // Fallback to general
      return RECOMMENDED_GEAR.filter(item => item.tags.includes('general')).slice(0, 2);
  };

  // --- Filtering & Sorting Logic ---
  const processedDestinations = useMemo(() => {
      let filtered = [...destinations];

      // 1. Filter: Open Now
      if (filterOpenOnly) {
          filtered = filtered.filter(d => {
              const status = getOpenStatus(d.openingHours);
              return status?.isOpen;
          });
      }

      // 2. Sort
      filtered.sort((a, b) => {
          if (sortBy === 'distance') {
              // Push items without routes to the bottom
              const distA = a.route?.distance || Infinity;
              const distB = b.route?.distance || Infinity;
              return distA - distB;
          }
          if (sortBy === 'scenic') {
              // Prioritize explicitly linked scenic routes or preferred waypoints
              const isScenicA = a.linkedScenicRouteId || (a.preferredWaypoints && a.preferredWaypoints.length > 0) ? 1 : 0;
              const isScenicB = b.linkedScenicRouteId || (b.preferredWaypoints && b.preferredWaypoints.length > 0) ? 1 : 0;
              // Higher score first
              return isScenicB - isScenicA;
          }
          // Default: Name
          return a.name.localeCompare(b.name);
      });

      return filtered;
  }, [destinations, filterOpenOnly, sortBy]);


  // Detail View
  if (selectedDestination) {
    const openStatus = getOpenStatus(selectedDestination.openingHours);
    const recommendedGear = selectedDestination.route ? getRecommendedGear(selectedDestination.route.distance) : [];

    return (
      <div 
        ref={containerRef}
        className="h-full w-full bg-white md:border-l border-stone-200 text-stone-800 flex flex-col shadow-2xl overflow-y-auto rounded-t-3xl md:rounded-none scroll-smooth"
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
      >
        {/* Detail Header - Sticky only on desktop */}
        <div className="md:sticky md:top-0 relative z-20 bg-amber-50 p-6 border-b border-amber-100">
          {/* Mobile Handle */}
          {isMobile && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-stone-300 rounded-full" />
          )}

          <div className="flex justify-between items-start pt-2">
            <button 
                onClick={onBack}
                className="p-2 bg-white/80 hover:bg-white rounded-full text-stone-600 transition-colors shadow-sm"
                title="Back to List"
            >
                <ArrowLeft size={20} />
            </button>
            
            <button 
                onClick={onCloseSidebar}
                className="p-2 bg-white/80 hover:bg-white rounded-full text-stone-600 transition-colors shadow-sm md:hidden"
                title="Close to Map"
            >
                <X size={20} />
            </button>
          </div>
          
          <div className="pt-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/60 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-100">
                {selectedDestination.category === 'cafe' ? <MapBunIcon size={16} /> : <MapBeerIcon size={16} />}
                {selectedDestination.category === 'cafe' ? 'Cafe Run' : 'Bar Run'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-black text-stone-900 leading-tight mb-2">
              {selectedDestination.geminiTitle || selectedDestination.name}
            </h1>
            <p className="text-base md:text-lg text-stone-600 font-light leading-relaxed">
              {selectedDestination.geminiDescription}
            </p>
          </div>
        </div>

        {/* Detail Content */}
        <div className="p-6 space-y-8 pb-20 md:pb-6 flex-grow">
          
          {/* Stats Row */}
          {selectedDestination.route && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Distance */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 flex flex-col items-center justify-center text-center">
                <span className="text-xl md:text-2xl font-black text-teal-600 tracking-tight">
                  {selectedDestination.route.isEstimate ? '~' : ''}
                  {(selectedDestination.route.distance / 1000).toFixed(1)}
                </span>
                <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mt-1">km</span>
              </div>

              {/* Elevation */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 flex flex-col items-center justify-center text-center">
                  <Mountain size={20} className="text-stone-500 mb-1" />
                  <span className="text-lg md:text-xl font-bold text-stone-900 leading-tight">
                    {selectedDestination.route.elevationGain !== undefined ? `+${selectedDestination.route.elevationGain}` : '0'}m
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mt-1">Elev</span>
               </div>
            </div>
          )}

          {/* Customize Run Section */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
                 <RouteIcon size={20} className="text-amber-500" />
                 Customize Run
               </h3>
               <span className={`text-sm font-mono font-medium px-2 py-1 rounded transition-colors ${isOptimizing ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-500'}`}>
                 {isOptimizing ? 'Updating...' : (targetDistance === 0 ? 'Fastest' : `${targetDistance.toFixed(1)} km`)}
               </span>
            </div>
            
            <div className="mb-6 px-1 space-y-6">
              <div className="py-2">
                  <input
                    type="range"
                    min={0} 
                    max={20}
                    step={0.5}
                    value={targetDistance}
                    onChange={handleSliderChange}
                    onMouseUp={handleSliderRelease}
                    onTouchEnd={handleSliderRelease}
                    className="w-full h-3 bg-stone-200 rounded-lg cursor-pointer accent-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-500/20"
                  />
                  <div className="flex justify-between text-xs text-stone-400 font-medium px-1 mt-2">
                    <span>Fastest</span>
                    <span>10km</span>
                    <span>20km</span>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Loop Mode Toggle */}
                <div 
                  className={`flex flex-col items-center justify-center gap-2 cursor-pointer p-3 rounded-xl border transition-all active:scale-[0.98] ${isRoundTrip ? 'border-teal-300 bg-teal-50 ring-1 ring-teal-200' : 'border-stone-100 bg-stone-50 hover:border-teal-200'}`}
                  onClick={handleLoopToggle}
                >
                  <Repeat size={18} className={isRoundTrip ? 'text-teal-600' : 'text-stone-400'} />
                  <span className={`text-xs font-bold text-center ${isRoundTrip ? 'text-teal-800' : 'text-stone-500'}`}>Loop</span>
                </div>

                {/* Scenic Mode Toggle */}
                <div 
                  className={`flex flex-col items-center justify-center gap-2 cursor-pointer p-3 rounded-xl border transition-all active:scale-[0.98] ${isScenic ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200' : 'border-stone-100 bg-stone-50 hover:border-emerald-200'}`}
                  onClick={handleScenicToggle}
                >
                  <Trees size={18} className={isScenic ? 'text-emerald-600' : 'text-stone-400'} />
                  <span className={`text-xs font-bold text-center ${isScenic ? 'text-emerald-800' : 'text-stone-500'}`}>Scenic Route</span>
                </div>
              </div>

            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadGPX}
                disabled={isOptimizing || isLoading || selectedDestination.route?.isEstimate}
                className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed border border-stone-200 text-sm"
                title="Export GPX"
              >
                <Download size={20} />
                <span>Download GPX</span>
              </button>
            </div>
          </div>

          {/* Recommended Gear */}
          {recommendedGear.length > 0 && (
             <div className="bg-stone-50 p-5 rounded-xl border border-stone-100">
                <h3 className="text-stone-800 font-bold uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                   <ShoppingBag size={14} /> Recommended Gear
                </h3>
                <div className="space-y-3">
                   {recommendedGear.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 bg-white p-2 rounded-lg border border-stone-200 shadow-sm">
                          <div className="w-12 h-12 bg-stone-100 rounded-md flex items-center justify-center shrink-0">
                             {/* Placeholder Icon */}
                             <div className="w-8 h-8 rounded-full bg-teal-100"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="font-bold text-sm text-stone-900 truncate">{item.name}</p>
                             <p className="text-xs text-stone-500 line-clamp-1">{item.description}</p>
                          </div>
                          <a href={item.affiliateLink} className="text-xs font-bold text-teal-600 hover:text-teal-700 px-2 py-1 bg-teal-50 rounded">
                             Buy
                          </a>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* Pro Tip */}
          {selectedDestination.geminiTip && (
            <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
               <h3 className="text-amber-800 font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                 <Navigation size={14} /> Pro Tip
               </h3>
               <p className="text-amber-900 italic font-medium">
                 "{selectedDestination.geminiTip}"
               </p>
            </div>
          )}

          {/* Info Section */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-stone-800 border-b border-stone-100 pb-2">
              Location Details
            </h3>
            
            <div className="flex items-start gap-3">
              <MapPin className="text-stone-400 shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-bold text-stone-900">{selectedDestination.name}</h4>
                <p className="text-stone-600 leading-relaxed">{selectedDestination.address}</p>
              </div>
            </div>

            {selectedDestination.openingHours && (
              <div className="flex items-start gap-3">
                <Clock className="text-stone-400 shrink-0 mt-1" size={20} />
                <div>
                   <div className="flex items-center gap-3 mb-1">
                     <h4 className="font-bold text-stone-900">Opening Hours</h4>
                     {openStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${openStatus.colorClass}`}>
                            {openStatus.statusText}
                        </span>
                     )}
                   </div>
                   <p className="text-stone-600 text-sm leading-relaxed">{selectedDestination.openingHours}</p>
                </div>
              </div>
            )}
          </div>

          {/* Directions */}
          {selectedDestination.route && selectedDestination.route.steps && !selectedDestination.route.isEstimate && (
            <div className="space-y-4 pb-8">
              <h3 className="font-serif text-xl font-bold text-stone-800 border-b border-stone-100 pb-2 flex items-center gap-2">
                <Footprints size={20} className="text-teal-600" /> 
                Running Directions
              </h3>
              
              <div className="relative pl-2">
                <div className="absolute left-[13px] top-2 bottom-4 w-0.5 bg-stone-200"></div>

                <div className="space-y-4">
                  {selectedDestination.route.steps.map((step, idx) => (
                    <div key={idx} className="relative flex gap-4 items-start group">
                      <div className="z-10 mt-1.5 w-3 h-3 rounded-full bg-white border-2 border-stone-300 group-hover:border-teal-500 group-hover:scale-125 transition-all shrink-0"></div>
                      <div className="text-sm">
                        <p className="text-stone-800 font-medium leading-snug">{step.instruction}</p>
                        <p className="text-stone-400 text-xs mt-0.5 font-mono">
                          {Math.round(step.distance)}m
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="relative flex gap-4 items-start">
                     <div className="z-10 mt-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-amber-500 shrink-0"></div>
                     <div className="text-sm">
                        <p className="text-amber-800 font-bold">Arrive {isRoundTrip ? '& Return' : ''}</p>
                        <p className="text-stone-400 text-xs mt-0.5">{isRoundTrip ? 'You made it back home!' : 'Enjoy the reward.'}</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Default List View (Places) with Swipe Gesture on Header
  return (
    <div 
        ref={containerRef}
        className="h-full w-full bg-white md:border-l border-stone-200 text-stone-800 flex flex-col shadow-2xl relative overflow-y-auto rounded-t-3xl md:rounded-none scroll-smooth"
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
    >
      
      {/* List Header - Sticky on Desktop, Relative on Mobile */}
      <div className="p-6 md:p-8 md:pr-14 border-b border-stone-100 bg-stone-50 relative md:sticky md:top-0 z-20">
        {isMobile && (
            <button 
                onClick={onCloseSidebar} 
                className="absolute top-6 right-6 p-2 bg-stone-100 rounded-full text-stone-500"
                title="Close List"
            >
                <X size={20} />
            </button>
        )}
        
        {/* Mobile Handle */}
        {isMobile && (
           <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-stone-300 rounded-full" />
        )}

        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-black font-serif text-amber-700 leading-tight">
            FikaRun
          </h1>
          <p className="text-stone-500 text-xs md:text-sm font-medium mt-1">
            Gothenburg
          </p>
          
          <div className="mt-3 pt-3 border-t border-stone-200/60">
             <p className="text-stone-600 text-sm leading-relaxed">
               <span className="font-serif italic text-stone-500">Fika (fee-kah):</span> To have coffee, often with pastries.
             </p>
             <p className="text-stone-600 text-sm leading-relaxed mt-2">
               Earn your treat. Discover curated running routes to the best <strong className="text-stone-800">cafes and bars</strong> in town.
             </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => onSearch('cafe')}
            disabled={!userLocation || isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-bold transition-all active:scale-95 border bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200"
          >
            <MapBunIcon size={20} />
            <span className="hidden sm:inline">Cafés</span>
            <span className="sm:hidden">Cafe</span>
          </button>
          
          <button
            onClick={() => onSearch('bar')}
            disabled={!userLocation || isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-bold transition-all active:scale-95 border bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-200"
          >
            <MapBeerIcon size={20} />
            <span className="hidden sm:inline">Bars</span>
            <span className="sm:hidden">Bar</span>
          </button>
          
          <button
            onClick={handleSurpriseMe}
            disabled={!userLocation || isLoading || destinations.length === 0}
            className="flex-none flex items-center justify-center bg-stone-800 hover:bg-stone-700 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg"
          >
            <Dice5 size={24} />
          </button>
        </div>

        {/* --- Advanced Filters (Redesigned) --- */}
        {destinations.length > 0 && (
          <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Filters</h3>
                
                <button
                    onClick={() => setFilterOpenOnly(!filterOpenOnly)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                        filterOpenOnly 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                    }`}
                >
                    <Clock size={14} />
                    <span>Open Now</span>
                    <div className={`w-2 h-2 rounded-full ${filterOpenOnly ? 'bg-green-500' : 'bg-stone-300'}`} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <SortButton 
                    active={sortBy === 'distance'} 
                    onClick={() => setSortBy('distance')} 
                    icon={MapPin} 
                    label="Nearest" 
                    disabled={!userLocation}
                />
                <SortButton 
                    active={sortBy === 'scenic'} 
                    onClick={() => setSortBy('scenic')} 
                    icon={Trees} 
                    label="Scenic" 
                />
                <SortButton 
                    active={sortBy === 'name'} 
                    onClick={() => setSortBy('name')} 
                    icon={ArrowDownAZ} 
                    label="A-Z" 
                />
              </div>
          </div>
        )}
        
        {!userLocation && (
          <div className="mt-4 p-3 bg-stone-100 border border-stone-200 rounded-lg flex items-start gap-2">
            <MapPin className="text-stone-400 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-stone-500">Enable GPS to calculate run distance to these spots.</p>
          </div>
        )}
      </div>

      {/* List Content */}
      <div className="flex-1 p-6 space-y-4 bg-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-4 text-stone-400">
            <Loader2 className="animate-spin text-amber-500" size={32} />
            <p className="font-serif italic">Finding the best spot...</p>
          </div>
        ) : processedDestinations.length === 0 ? (
          <div className="text-center text-stone-400 mt-10 p-4">
            <Navigation className="mx-auto mb-3 opacity-20" size={48} />
            <p>{destinations.length > 0 ? "No spots match your filters." : "Select a category to find your reward."}</p>
          </div>
        ) : (
          processedDestinations.map((place) => {
            const openStatus = getOpenStatus(place.openingHours);
            
            return (
              <div
                key={place.id}
                onClick={() => onSelect(place)}
                className={`group relative p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white border-stone-100 hover:border-amber-200 hover:shadow-md`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight text-stone-900">
                    {place.geminiTitle || place.name}
                  </h3>
                  {place.route && (
                    <span className="bg-stone-100 text-xs font-bold py-1 px-3 rounded-full text-stone-600">
                      {place.route.isEstimate ? '~' : ''}
                      {(place.route.distance / 1000).toFixed(1)} km
                    </span>
                  )}
                </div>
                
                <p className="text-stone-600 text-sm mb-3 leading-relaxed font-light line-clamp-2">
                  {place.geminiDescription || place.address}
                </p>

                <div className="flex items-center gap-2 justify-between">
                    {place.openingHours && (
                        <div className="flex items-start gap-2 text-xs text-stone-500">
                            <Clock size={14} className="mt-0.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{place.openingHours}</span>
                        </div>
                    )}
                    {openStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${openStatus.colorClass}`}>
                            {openStatus.statusText}
                        </span>
                    )}
                </div>
                
                {/* Visual tag for Scenic routes */}
                {(place.linkedScenicRouteId || (place.preferredWaypoints && place.preferredWaypoints.length > 0)) && (
                   <div className="absolute top-[-10px] right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-white flex items-center gap-1">
                      <Trees size={10} /> Scenic
                   </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Footer */}
      <div className="bg-stone-50 border-t border-stone-200 p-4 flex flex-col gap-2 z-20 sticky bottom-0 mt-auto">
          <a 
            href="mailto:hello@fikarun.com?subject=Add%20My%20Spot%20to%20FikaRun"
            className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors shadow-sm text-sm"
          >
            <Mail size={16} />
            <span>Own a spot? Partner with us</span>
          </a>
          <button 
            onClick={() => setShowAboutModal(true)}
            className="w-full py-2 text-stone-500 font-medium text-xs flex items-center justify-center gap-1 hover:text-stone-800 transition-colors"
          >
            <Info size={14} />
            <span>About FikaRun</span>
          </button>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 sticky top-0 h-full">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full relative border border-white/20">
            <button 
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200"
            >
              <X size={18} />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                 <Heart size={32} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Hej!</h2>
              
              <div className="space-y-4 text-stone-600 text-sm leading-relaxed text-left">
                  <p>
                    I built <span className="font-bold text-stone-800">FikaRun</span> because I believe the best runs end with a reward. 
                    Whether it's a cinnamon bun after a long trail run or a cold beer after a city jog, the destination matters.
                  </p>
                  <p>
                    Gothenburg is fantastic for running, but it's easy to get stuck in the same loops. 
                    This guide curates my favorite spots and the most scenic, runner-friendly routes to get there.
                  </p>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                     <h4 className="font-bold text-stone-800 mb-1 text-xs uppercase tracking-wider">The Philosophy</h4>
                     <p className="italic text-stone-500">
                       "Run to eat, run to drink, run to explore."
                     </p>
                  </div>
                  <p className="text-xs text-stone-400 text-center pt-2">
                    Data from Mapbox.
                  </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;