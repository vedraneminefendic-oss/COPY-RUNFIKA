import { EnrichedDestination } from '../types';

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const generateGPX = (destination: EnrichedDestination): string => {
  if (!destination.route || !destination.route.geometry || !destination.route.geometry.coordinates) {
    return '';
  }

  const name = destination.geminiTitle || destination.name;
  const description = destination.geminiDescription || `Run to ${destination.name}`;
  const coordinates = destination.route.geometry.coordinates; // Array of [lng, lat]

  // GPX requires timestamps for many devices (Garmin) to accept it as an activity/course.
  const startTime = new Date();
  let currentTime = startTime.getTime();
  
  // Estimate speed.
  const totalDist = destination.route.distance;
  const totalDur = destination.route.duration;
  const avgSpeed = (totalDist > 0 && totalDur > 0) ? totalDist / totalDur : 2.78; 

  // Header
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FikaRun" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>
    <time>${startTime.toISOString()}</time>
  </metadata>
`;

  // Waypoints (Turn Directions)
  if (destination.route.steps && destination.route.steps.length > 0) {
      destination.route.steps.forEach((step, index) => {
          if (step.location) {
              gpx += `  <wpt lat="${step.location.lat}" lon="${step.location.lng}">
    <name>Turn ${index + 1}</name>
    <desc>${escapeXml(step.instruction)}</desc>
    <sym>Flag, Blue</sym>
  </wpt>\n`;
          }
      });
  }

  // Track
  gpx += `  <trk>
    <name>${escapeXml(name)}</name>
    <type>running</type>
    <trkseg>
`;

  let lastCoord: number[] | null = null;

  coordinates.forEach((coord: number[]) => {
    const lng = coord[0];
    const lat = coord[1];
    
    if (lastCoord) {
        const dist = calculateDistance(lastCoord[1], lastCoord[0], lat, lng);
        const timeDiff = (dist / avgSpeed) * 1000;
        currentTime += timeDiff;
    }
    lastCoord = coord;

    const timeStr = new Date(currentTime).toISOString();

    gpx += `      <trkpt lat="${lat}" lon="${lng}">
        <time>${timeStr}</time>
      </trkpt>\n`;
  });

  gpx += `    </trkseg>
  </trk>
</gpx>`;

  return gpx;
};