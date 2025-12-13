import { MAPBOX_TOKEN, SCENIC_ROUTES } from '../constants';
import { Coordinates, Place, RouteData } from '../types';

const BASE_URL = 'https://api.mapbox.com';

// Major parks and scenic spots in Gothenburg with Scenic Score (1-10)
const SCENIC_WAYPOINTS = [
  { name: 'Slottsskogen (Villa Belparc)', lat: 57.6853, lng: 11.9442, scenicScore: 10, isCoastal: false },
  { name: 'Slottsskogen (Observatoriet)', lat: 57.6885, lng: 11.9405, scenicScore: 9, isCoastal: false },
  { name: 'Trädgårdsföreningen', lat: 57.7066, lng: 11.9750, scenicScore: 8, isCoastal: false },
  { name: 'Botaniska Trädgården', lat: 57.6835, lng: 11.9510, scenicScore: 10, isCoastal: false },
  { name: 'Keillers Park (Ramberget)', lat: 57.7210, lng: 11.9360, scenicScore: 9, isCoastal: false },
  { name: 'Vasaparken', lat: 57.6990, lng: 11.9710, scenicScore: 6, isCoastal: false },
  { name: 'Skatås (Motion Central)', lat: 57.7040, lng: 12.0350, scenicScore: 10, isCoastal: false },
  { name: 'Änggårdsbergen', lat: 57.6750, lng: 11.9550, scenicScore: 10, isCoastal: false },
  { name: 'Änggårdsbergen (Axlemossen)', lat: 57.6700, lng: 11.9480, scenicScore: 10, isCoastal: false },
  { name: 'Kungsparken', lat: 57.7020, lng: 11.9700, scenicScore: 7, isCoastal: false },
  { name: 'Röda Sten', lat: 57.6900, lng: 11.9050, scenicScore: 9, isCoastal: true },
  { name: 'Delsjön (Badplats)', lat: 57.6950, lng: 12.0300, scenicScore: 9, isCoastal: true },
  { name: 'Masthuggskyrkan', lat: 57.6950, lng: 11.9360, scenicScore: 8, isCoastal: false },
  { name: 'Eriksbergskranen', lat: 57.7010, lng: 11.9310, scenicScore: 8, isCoastal: true },
  // User Requested Scenic Route Waypoints
  { name: 'Amundön (Säröbanan)', lat: 57.6045, lng: 11.9300, scenicScore: 10, isCoastal: true },
  { name: 'Sannegårdshamnen', lat: 57.7024, lng: 11.9299, scenicScore: 8, isCoastal: true },
  { name: 'Älvsborgsbron (Top View)', lat: 57.6935, lng: 11.9015, scenicScore: 10, isCoastal: true },
  { name: 'Feskekörka (Vallgraven)', lat: 57.7045, lng: 11.9550, scenicScore: 8, isCoastal: true },
  // East Gothenburg Additions
  { name: 'Säveån Strandpromenad', lat: 57.7275, lng: 12.0150, scenicScore: 9, isCoastal: true }, 
  { name: 'Kviberg Park', lat: 57.7340, lng: 12.0300, scenicScore: 8, isCoastal: false }
];

export const searchNearbyPlaces = async (
  coords: Coordinates,
  query: 'cafe' | 'bar'
): Promise<Place[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/geocoding/v5/mapbox.places/${query}.json?proximity=${coords.lng},${coords.lat}&types=poi&limit=8&access_token=${MAPBOX_TOKEN}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch places');
    
    const data = await response.json();
    
    if (!data.features) return [];

    return data.features
      .filter((feature: any) => {
        return (
          feature.center &&
          Array.isArray(feature.center) &&
          feature.center.length === 2 &&
          typeof feature.center[0] === 'number' &&
          Number.isFinite(feature.center[0]) &&
          typeof feature.center[1] === 'number' &&
          Number.isFinite(feature.center[1])
        );
      })
      .map((feature: any) => ({
        id: feature.id,
        name: feature.text,
        address: feature.properties.address || feature.place_name,
        coordinates: {
          lng: feature.center[0],
          lat: feature.center[1],
        },
        category: query,
        elevation: undefined // Will need to be fetched dynamically if not in constants
      }));
  } catch (error) {
    console.error('Mapbox search error:', error);
    return [];
  }
};

const isValidCoordinate = (coord: any): boolean => {
  return (
    Array.isArray(coord) && 
    coord.length >= 2 && 
    typeof coord[0] === 'number' && Number.isFinite(coord[0]) &&
    typeof coord[1] === 'number' && Number.isFinite(coord[1])
  );
};

export const fetchPointElevation = async (coord: Coordinates): Promise<number | null> => {
    try {
        // Use Mapbox Tilequery API (Terrain V2 contour layer)
        // This is commercial friendly (counts as tile requests) and usually free within generous limits
        const url = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${coord.lng},${coord.lat}.json?layers=contour&limit=1&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        
        const data = await res.json();
        if (data.features && data.features.length > 0) {
            // Contour lines usually have an 'ele' property
            const ele = data.features[0].properties?.ele;
            return typeof ele === 'number' ? ele : null;
        }
        return null;
    } catch (e) {
        console.warn("Failed to fetch point elevation from Mapbox", e);
        return null;
    }
};

const parseRouteResponse = (data: any, startElev?: number, endElev?: number): Omit<RouteData, 'elevationGain'> & { elevationGain?: number } | null => {
  if (!data.routes || data.routes.length === 0) return null;

  const route = data.routes[0];
  
  if (
    !route.geometry || 
    !route.geometry.coordinates || 
    !Array.isArray(route.geometry.coordinates) ||
    !route.geometry.coordinates.every(isValidCoordinate)
  ) {
    console.warn("Received route with invalid geometry coordinates");
    return null;
  }

  const allSteps = route.legs.flatMap((leg: any) => 
    leg.steps.map((step: any) => {
      let location = undefined;
      if (
          step.maneuver && 
          step.maneuver.location && 
          step.maneuver.location.length >= 2 && 
          Number.isFinite(step.maneuver.location[0]) && 
          Number.isFinite(step.maneuver.location[1])
      ) {
          location = { lng: step.maneuver.location[0], lat: step.maneuver.location[1] };
      }

      return {
        instruction: step.maneuver.instruction,
        distance: step.distance,
        location: location
      };
    })
  );
  
  // Calculate Net Elevation if start/end known
  let elevationGain = undefined;
  if (typeof startElev === 'number' && typeof endElev === 'number') {
      const net = endElev - startElev;
      elevationGain = net; // Display net elevation change
  }

  return {
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry,
    steps: allSteps,
    elevationGain
  };
};

const fetchRouteMultiPoint = async (points: Coordinates[], startElev?: number, endElev?: number): Promise<RouteData | null> => {
  try {
    if (points.some(p => !p || typeof p.lng !== 'number' || typeof p.lat !== 'number' || !Number.isFinite(p.lng) || !Number.isFinite(p.lat))) {
      console.warn("Attempted to fetch route with invalid NaN/Infinity coordinates");
      return null;
    }

    const uniquePoints = points.filter((p, index) => {
      if (index === 0) return true;
      const prev = points[index - 1];
      return getDistance(prev, p) > 5;
    });
    
    if (uniquePoints.length < 2 && points.length >= 2) {
        uniquePoints.push(points[points.length - 1]);
    }

    const coordString = uniquePoints.map(p => `${p.lng},${p.lat}`).join(';');
    
    let response = await fetch(
      `${BASE_URL}/directions/v5/mapbox/walking/${coordString}?geometries=geojson&steps=true&exclude=ferry&access_token=${MAPBOX_TOKEN}`
    );
    let data = await response.json();

    if (!response.ok || !data.routes || data.routes.length === 0) {
      response = await fetch(
        `${BASE_URL}/directions/v5/mapbox/walking/${coordString}?geometries=geojson&steps=true&access_token=${MAPBOX_TOKEN}`
      );
      data = await response.json();
    }

    if (!response.ok) throw new Error('Failed to fetch route');
    
    const parsed = parseRouteResponse(data, startElev, endElev);
    if (!parsed) return null;

    return {
      ...parsed,
      isEstimate: false
    };

  } catch (error) {
    console.error('Mapbox multi-point error:', error);
    return null;
  }
};

export const getDistance = (p1: Coordinates, p2: Coordinates) => {
  if (!p1 || !p2 || !Number.isFinite(p1.lat) || !Number.isFinite(p1.lng) || !Number.isFinite(p2.lat) || !Number.isFinite(p2.lng)) {
    return Infinity;
  }

  const R = 6371e3;
  const φ1 = p1.lat * Math.PI/180;
  const φ2 = p2.lat * Math.PI/180;
  const Δφ = (p2.lat-p1.lat) * Math.PI/180;
  const Δλ = (p2.lng-p1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  
  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1-clampedA));

  const result = R * c;
  
  if (!Number.isFinite(result) || Number.isNaN(result)) return Infinity;
  return result;
};

const getBestScenicWaypoint = (start: Coordinates, end: Coordinates, targetDistanceMeters: number): (Coordinates & { name: string }) | null => {
  const directDist = getDistance(start, end);
  if (directDist === Infinity) return null;
  
  const ESTIMATED_TORTUOSITY = 1.35; 
  const targetAirDistance = targetDistanceMeters > 0.1 ? targetDistanceMeters / ESTIMATED_TORTUOSITY : 0;

  const mappedCandidates = SCENIC_WAYPOINTS.map(park => {
    const distToPark = getDistance(start, park);
    const distFromPark = getDistance(park, end);
    const totalDist = distToPark + distFromPark;
    
    return {
      ...park,
      distToPark,
      distFromPark,
      totalDist
    };
  });

  const MIN_BUFFER = 400;

  const viable = mappedCandidates.filter(c => {
    if (c.totalDist === Infinity) return false;
    if (c.distToPark < MIN_BUFFER || c.distFromPark < MIN_BUFFER) return false;

    if (targetDistanceMeters > 0.1) {
       if (c.totalDist > Math.max(20000, targetAirDistance * 2.5)) return false;
    } else {
       if (c.totalDist > Math.max(5000, directDist * 3.0)) return false;
    }
    return true;
  });

  if (viable.length === 0) return null;

  if (targetDistanceMeters <= 0.1) {
    viable.sort((a, b) => {
        const addedA = Math.max(0, a.totalDist - directDist);
        const addedB = Math.max(0, b.totalDist - directDist);
        const scoreA = addedA - (a.scenicScore * 400);
        const scoreB = addedB - (b.scenicScore * 400);
        return scoreA - scoreB;
    });
  } else {
    viable.sort((a, b) => {
        const diffA = Math.abs(a.totalDist - targetAirDistance);
        const diffB = Math.abs(b.totalDist - targetAirDistance);
        const scoreA = diffA - (a.scenicScore * 200);
        const scoreB = diffB - (b.scenicScore * 200);
        return scoreA - scoreB;
    });
  }
  
  return viable[0];
};

// --- NEW HELPER: Auto-detect if user is near a Scenic Route ---
const ROUTE_PROXIMITY_THRESHOLD = 800; // meters

const findBestMatchingScenicRoute = (start: Coordinates, end: Coordinates): string | null => {
  for (const route of SCENIC_ROUTES) {
    if (!route.pointA || !route.pointB) continue;

    const startToA = getDistance(start, route.pointA);
    const startToB = getDistance(start, route.pointB);
    const endToA = getDistance(end, route.pointA);
    const endToB = getDistance(end, route.pointB);

    // Scenario 1: Forward (A -> B)
    if (startToA < ROUTE_PROXIMITY_THRESHOLD && endToB < ROUTE_PROXIMITY_THRESHOLD) return route.id;
    
    // Scenario 2: Reverse (B -> A)
    if (startToB < ROUTE_PROXIMITY_THRESHOLD && endToA < ROUTE_PROXIMITY_THRESHOLD) return route.id;

    // Scenario 3: Loose matching (Starting on a trail, going far)
    if ((startToA < ROUTE_PROXIMITY_THRESHOLD || startToB < ROUTE_PROXIMITY_THRESHOLD) && getDistance(start, end) > 2000) {
        return route.id;
    }
  }
  return null;
};

// --- HELPER: Bidirectional Smart Routing ---
const calculateSmartRoute = async (
  userLocation: Coordinates,
  venueLocation: Coordinates,
  scenicRouteId: string,
  isRoundTrip: boolean,
  startElev?: number,
  endElev?: number
): Promise<RouteData | null> => {
    const routeDef = SCENIC_ROUTES.find(r => r.id === scenicRouteId);
    if (!routeDef || !routeDef.pointA || !routeDef.pointB) return null;

    const distUserToA = getDistance(userLocation, routeDef.pointA);
    const distUserToB = getDistance(userLocation, routeDef.pointB);
    const distAToVenue = getDistance(routeDef.pointA, venueLocation);
    const distBToVenue = getDistance(routeDef.pointB, venueLocation);

    const costForward = distUserToA + distBToVenue;
    const costReverse = distUserToB + distAToVenue;

    let points: Coordinates[] = [];
    let viaName = routeDef.name;
    let mainWaypoint: Coordinates;

    if (costForward <= costReverse) {
        // Forward: A -> B
        points = [userLocation, routeDef.pointA, ...routeDef.waypoints, routeDef.pointB, venueLocation];
        mainWaypoint = routeDef.waypoints[0];
    } else {
        // Reverse: B -> A
        const reversedWaypoints = [...routeDef.waypoints].reverse();
        points = [userLocation, routeDef.pointB, ...reversedWaypoints, routeDef.pointA, venueLocation];
        mainWaypoint = reversedWaypoints[0];
    }

    if (isRoundTrip) {
        points.push(userLocation);
    }

    const routeData = await fetchRouteMultiPoint(points, startElev, endElev);
    if (routeData) {
        return {
            ...routeData,
            viaWaypoint: {
                name: viaName,
                coordinates: mainWaypoint
            }
        };
    }
    return null;
};

// --- MAIN FUNCTION (UPDATED) ---
export const getWalkingRoute = async (
  start: Coordinates,
  end: Coordinates,
  isRoundTrip: boolean = false,
  isScenic: boolean = false,
  preferredWaypoints?: Coordinates[],
  startElev?: number,
  endElev?: number
): Promise<RouteData | null> => {
  if (!start || !end || !Number.isFinite(start.lng) || !Number.isFinite(start.lat) || !Number.isFinite(end.lng) || !Number.isFinite(end.lat)) {
    return null;
  }

  // 1. AUTO-DETECT SCENIC ROUTE (Highest Priority)
  if (isScenic) {
    const matchingRouteId = findBestMatchingScenicRoute(start, end);
    if (matchingRouteId) {
      console.log(`Auto-detected scenic route: ${matchingRouteId}`);
      const smartRoute = await calculateSmartRoute(start, end, matchingRouteId, isRoundTrip, startElev, endElev);
      if (smartRoute) return smartRoute;
    }
  }

  // 2. Strict Scenic Override (Venues with specific trails)
  if (isScenic && preferredWaypoints && preferredWaypoints.length > 0) {
      let bestStartIndex = 0;
      let minTotalDist = Infinity;

      for (let i = 0; i < preferredWaypoints.length; i++) {
          const distToJoin = getDistance(start, preferredWaypoints[i]);
          let trailDist = 0;
          const remainingWaypoints = preferredWaypoints.slice(i);
          
          for (let j = 0; j < remainingWaypoints.length - 1; j++) {
              trailDist += getDistance(remainingWaypoints[j], remainingWaypoints[j+1]);
          }
          if (remainingWaypoints.length > 0) {
              trailDist += getDistance(remainingWaypoints[remainingWaypoints.length - 1], end);
          } else {
              trailDist = getDistance(start, end);
          }

          const totalCost = distToJoin + trailDist;
          if (totalCost < minTotalDist) {
              minTotalDist = totalCost;
              bestStartIndex = i;
          }
      }
      
      const optimizedWaypoints = preferredWaypoints.slice(bestStartIndex);

      if (optimizedWaypoints.length > 0) {
          const points = [start, ...optimizedWaypoints, end];
          if (isRoundTrip) points.push(start);
          
          const route = await fetchRouteMultiPoint(points, startElev, endElev);
          if (route) {
              return {
                  ...route,
                  viaWaypoint: {
                      name: 'Scenic Trail',
                      coordinates: optimizedWaypoints[0]
                  }
              };
          }
      }
  } 
  
  // 3. Generic Scenic/Blue Mode
  else if (isScenic) {
     const scenicPoint = getBestScenicWaypoint(start, end, 0);
     if (scenicPoint) {
         const points = isRoundTrip ? [start, scenicPoint, end, start] : [start, scenicPoint, end];
         const route = await fetchRouteMultiPoint(points, startElev, endElev);
         if (route) {
             return {
                 ...route,
                 viaWaypoint: {
                     name: scenicPoint.name,
                     coordinates: { lat: scenicPoint.lat, lng: scenicPoint.lng }
                 }
             };
         }
     }
  }

  // 4. Fallback: Direct Route
  const points = isRoundTrip ? [start, end, start] : [start, end];
  return fetchRouteMultiPoint(points, startElev, endElev);
};

const calculateDetourWaypoint = (
  start: Coordinates, 
  end: Coordinates, 
  targetDistanceMeters: number,
  sideMultiplier: number = 1
): Coordinates => {
  if (!start || !end || !Number.isFinite(start.lat) || !Number.isFinite(start.lng) || !Number.isFinite(end.lat) || !Number.isFinite(end.lng)) {
    return end;
  }

  const toRad = (deg: number) => deg * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;

  const lat1 = toRad(start.lat);
  const lon1 = toRad(start.lng);
  const lat2 = toRad(end.lat);
  const lon2 = toRad(end.lng);

  const dLon = lon2 - lon1;
  const Bx = Math.cos(lat2) * Math.cos(dLon);
  const By = Math.cos(lat2) * Math.sin(dLon);
  const lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
  const lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

  const midLat = toDeg(lat3);
  const midLng = toDeg(lon3);

  const metersPerLat = 111132.92 - 559.82 * Math.cos(2 * lat3) + 1.175 * Math.cos(4 * lat3);
  const metersPerLng = 111412.84 * Math.cos(lat3) - 93.5 * Math.cos(3 * lat3);

  const dx = (end.lng - start.lng) * metersPerLng;
  const dy = (end.lat - start.lat) * metersPerLat;
  const directDistance = Math.sqrt(dx * dx + dy * dy);

  if (directDistance < 1e-6 || !Number.isFinite(directDistance)) {
    return end;
  }

  const CIRCUITY_FACTOR = 1.35;
  const safeTarget = Number.isFinite(targetDistanceMeters) ? targetDistanceMeters : 0;
  const adjustedTarget = Math.max(safeTarget / CIRCUITY_FACTOR, directDistance * 1.05);

  let height = 0;
  if (adjustedTarget > directDistance) {
    const val = Math.pow(adjustedTarget / 2, 2) - Math.pow(directDistance / 2, 2);
    if (val > 0) {
        height = Math.sqrt(val);
    } else {
        return end;
    }
  } else {
    return end;
  }

  let perpX = -dy / directDistance;
  let perpY = dx / directDistance;

  perpX *= sideMultiplier;
  perpY *= sideMultiplier;

  const offsetX = perpX * height;
  const offsetY = perpY * height;

  const deltaLng = offsetX / metersPerLng;
  const deltaLat = offsetY / metersPerLat;

  const result = {
    lng: midLng + deltaLng,
    lat: midLat + deltaLat
  };

  if (!Number.isFinite(result.lng) || !Number.isFinite(result.lat)) {
    return end;
  }

  if (Number.isFinite(result.lat) && Number.isFinite(result.lng)) {
      const nearestScenic = SCENIC_WAYPOINTS.find(wp => getDistance(result, wp) < 600);
      if (nearestScenic) {
        return { lat: nearestScenic.lat, lng: nearestScenic.lng };
      }
  }

  return result;
};

export const getDetourRoute = async (
  start: Coordinates,
  end: Coordinates,
  targetDistanceKm: number,
  isRoundTrip: boolean = false,
  isScenic: boolean = false,
  preferredWaypoints?: Coordinates[],
  linkedScenicRouteId?: string,
  startElev?: number,
  endElev?: number
): Promise<RouteData | null> => {
  // 1. Smart Scenic Route (Highest Priority if linked explicitly)
  if (isScenic && linkedScenicRouteId) {
      const smartRoute = await calculateSmartRoute(start, end, linkedScenicRouteId, isRoundTrip, startElev, endElev);
      if (smartRoute) return smartRoute;
  }
  
  if (typeof targetDistanceKm !== 'number' || !Number.isFinite(targetDistanceKm) || targetDistanceKm <= 0.1) {
     return getWalkingRoute(start, end, isRoundTrip, isScenic, preferredWaypoints, startElev, endElev);
  }

  const oneWayTargetMeters = isRoundTrip ? (targetDistanceKm * 1000) / 2 : targetDistanceKm * 1000;

  if (isScenic) {
      if (preferredWaypoints && preferredWaypoints.length > 0) {
           return getWalkingRoute(start, end, isRoundTrip, true, preferredWaypoints, startElev, endElev);
      }

      const scenicPoint = getBestScenicWaypoint(start, end, oneWayTargetMeters);
      
      if (scenicPoint) {
          console.log("Found candidate scenic waypoint:", scenicPoint.name);
          const points = isRoundTrip ? [start, scenicPoint, end, start] : [start, scenicPoint, end];
          const route = await fetchRouteMultiPoint(points, startElev, endElev);
          
          if (route) {
              const deviation = Math.abs(route.distance - oneWayTargetMeters);
              const maxAllowedDeviation = oneWayTargetMeters * 0.45;

              if (deviation <= maxAllowedDeviation) {
                 return {
                     ...route,
                     viaWaypoint: {
                         name: scenicPoint.name,
                         coordinates: { lat: scenicPoint.lat, lng: scenicPoint.lng }
                     }
                 };
              }
          }
      }
  }

  try {
    const waypointA = calculateDetourWaypoint(start, end, oneWayTargetMeters, 1);
    const pointsA = isRoundTrip ? [start, waypointA, end, start] : [start, waypointA, end];
    const routeA = await fetchRouteMultiPoint(pointsA, startElev, endElev);

    if (routeA) return routeA;

    const waypointB = calculateDetourWaypoint(start, end, oneWayTargetMeters, -1);
    const pointsB = isRoundTrip ? [start, waypointB, end, start] : [start, waypointB, end];
    const routeB = await fetchRouteMultiPoint(pointsB, startElev, endElev);
    
    if (routeB) return routeB;

    return getWalkingRoute(start, end, isRoundTrip, isScenic, preferredWaypoints, startElev, endElev);

  } catch (error) {
    console.error('Detour calculation critical error:', error);
    return getWalkingRoute(start, end, isRoundTrip, isScenic, preferredWaypoints, startElev, endElev);
  }
};