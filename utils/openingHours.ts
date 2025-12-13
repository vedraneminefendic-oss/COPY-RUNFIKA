export interface OpenStatus {
  isOpen: boolean;
  statusText: string;
  colorClass: string;
}

const dayMap: { [key: string]: number } = {
  'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
};

export const getOpenStatus = (hoursString?: string): OpenStatus | null => {
  if (!hoursString) return null;

  const now = new Date();
  const currentDay = now.getDay(); // 0-6
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Previous day index (handling wrap around for Sunday=0 -> Saturday=6)
  const prevDay = (currentDay + 6) % 7;
  // Represent current time as "minutes since start of yesterday" for late-night overlaps
  const currentMinutesPlus24h = currentMinutes + 24 * 60;

  const segments = hoursString.split(',').map(s => s.trim());
  
  let isOpen = false;

  for (const segment of segments) {
    // Regex matches: "Mon-Fri 08:00-17:00" or "Sat 10:00-Late"
    const parts = segment.match(/([A-Z][a-z]{2})(?:-([A-Z][a-z]{2}))?\s+(\d{2}:\d{2})-(Late|\d{2}:\d{2})/);
    
    if (!parts) continue;

    const startDayName = parts[1];
    const endDayName = parts[2];
    const startTimeStr = parts[3];
    const endTimeStr = parts[4];

    const startDay = dayMap[startDayName];
    // If no range (e.g. "Sat"), endDay is same as startDay
    const endDay = endDayName ? dayMap[endDayName] : startDay;

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const startMin = startH * 60 + startM;

    let endMin = 0;
    if (endTimeStr === 'Late') {
      endMin = 27 * 60; // Assume 03:00 AM next day
    } else {
      const [endH, endM] = endTimeStr.split(':').map(Number);
      endMin = endH * 60 + endM;
      // If closing time is earlier than opening (e.g. 16:00 - 01:00), add 24h
      if (endMin < startMin) endMin += 24 * 60;
    }

    // 1. Check if Today matches the day range
    let todayMatches = false;
    if (endDay < startDay) {
        // Range wraps week (e.g. Fri-Mon)
        if (currentDay >= startDay || currentDay <= endDay) todayMatches = true;
    } else {
        if (currentDay >= startDay && currentDay <= endDay) todayMatches = true;
    }

    // If today is a valid day, check if current time is within hours
    if (todayMatches) {
        if (currentMinutes >= startMin && currentMinutes < endMin) {
            isOpen = true;
            break;
        }
    }

    // 2. Check if Yesterday matches the day range (for late night carry-over)
    // Example: It's Saturday 00:30 (currentMinutes = 30).
    // Place is open "Fri-Sat 16:00-01:00".
    // "Yesterday" was Friday. Friday is in range. 
    // We check if (currentMinutes + 24h) is < endMin (25:00).
    let prevDayMatches = false;
    if (endDay < startDay) {
        if (prevDay >= startDay || prevDay <= endDay) prevDayMatches = true;
    } else {
        if (prevDay >= startDay && prevDay <= endDay) prevDayMatches = true;
    }

    if (prevDayMatches) {
        // Check if we are still within the "closing soon" window from yesterday's shift
        if (currentMinutesPlus24h >= startMin && currentMinutesPlus24h < endMin) {
            isOpen = true;
            break;
        }
    }
  }

  return { 
    isOpen, 
    statusText: isOpen ? 'Open' : 'Closed',
    colorClass: isOpen ? 'bg-green-100 text-green-700 border-green-200' : 'bg-rose-100 text-rose-700 border-rose-200'
  };
};