
// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lon1: number, 
  lat1: number, 
  lon2: number, 
  lat2: number
): number {
  // Earth's radius in miles
  const R = 3958.8;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Find locations within a specific radius
export function findLocationsWithinRadius(
  sourceLocations: Array<{ coordinates: [number, number]; name: string; description: string }>,
  targetLocations: Array<{ coordinates: [number, number]; name: string; description: string }>,
  radius: number
): { 
  sourceLocations: Array<{ coordinates: [number, number]; name: string; description: string }>,
  targetLocations: Array<{ coordinates: [number, number]; name: string; description: string }>,
  connections: Array<{ source: [number, number]; target: [number, number]; distance: number }>
} {
  const validSourceLocations: Array<typeof sourceLocations[number]> = [];
  const validTargetLocations: Array<typeof targetLocations[number]> = [];
  const connections: Array<{ source: [number, number]; target: [number, number]; distance: number }> = [];
  
  // Check each source against each target
  sourceLocations.forEach(source => {
    let hasNearbyTarget = false;
    
    targetLocations.forEach(target => {
      const distance = calculateDistance(
        source.coordinates[0], 
        source.coordinates[1], 
        target.coordinates[0], 
        target.coordinates[1]
      );
      
      if (distance <= radius) {
        hasNearbyTarget = true;
        
        // Only add target if not already added
        if (!validTargetLocations.some(loc => 
          loc.coordinates[0] === target.coordinates[0] && 
          loc.coordinates[1] === target.coordinates[1]
        )) {
          validTargetLocations.push(target);
        }
        
        // Add this connection
        connections.push({
          source: source.coordinates,
          target: target.coordinates,
          distance
        });
      }
    });
    
    // If this source has at least one nearby target, add it to valid sources
    if (hasNearbyTarget) {
      validSourceLocations.push(source);
    }
  });
  
  return {
    sourceLocations: validSourceLocations,
    targetLocations: validTargetLocations,
    connections
  };
}
