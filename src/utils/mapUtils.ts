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

// Type for location objects that's more flexible with coordinates
export type LocationWithCoordinates = {
  coordinates: number[] | [number, number];
  name: string;
  description: string;
};

// Find locations within a specific radius
export function findLocationsWithinRadius(
  sourceLocations: LocationWithCoordinates[],
  targetLocations: LocationWithCoordinates[],
  radius: number
): { 
  sourceLocations: LocationWithCoordinates[],
  targetLocations: LocationWithCoordinates[],
  connections: Array<{ source: [number, number]; target: [number, number]; distance: number }>
} {
  const validSourceLocations: LocationWithCoordinates[] = [];
  const validTargetLocations: LocationWithCoordinates[] = [];
  const connections: Array<{ source: [number, number]; target: [number, number]; distance: number }> = [];
  
  // Check each source against each target
  sourceLocations.forEach(source => {
    let hasNearbyTarget = false;
    
    // Ensure source coordinates are a tuple of exactly two numbers
    const sourceCoords: [number, number] = Array.isArray(source.coordinates) && source.coordinates.length >= 2 
      ? [source.coordinates[0], source.coordinates[1]]
      : [0, 0]; // Default if invalid
    
    targetLocations.forEach(target => {
      // Ensure target coordinates are a tuple of exactly two numbers
      const targetCoords: [number, number] = Array.isArray(target.coordinates) && target.coordinates.length >= 2
        ? [target.coordinates[0], target.coordinates[1]]
        : [0, 0]; // Default if invalid
      
      const distance = calculateDistance(
        sourceCoords[0], 
        sourceCoords[1], 
        targetCoords[0], 
        targetCoords[1]
      );
      
      if (distance <= radius) {
        hasNearbyTarget = true;
        
        // Only add target if not already added
        if (!validTargetLocations.some(loc => 
          loc.coordinates[0] === targetCoords[0] && 
          loc.coordinates[1] === targetCoords[1]
        )) {
          validTargetLocations.push(target);
        }
        
        // Add this connection
        connections.push({
          source: sourceCoords,
          target: targetCoords,
          distance
        });
      }
    });
    
    // If this source has at least one nearby target, add it to valid sources
    if (hasNearbyTarget) {
      validSourceLocations.push(source);
    }
  });
  
  // If no connections found, return empty arrays to show no markers
  if (connections.length === 0) {
    console.log("No connections found within the specified radius");
  }
  
  return {
    sourceLocations: validSourceLocations,
    targetLocations: validTargetLocations,
    connections
  };
}

/**
 * Find locations that satisfy complex spatial requirements:
 * - Must be within a specified radius of one location type
 * - Must be outside a specified radius of another location type
 */
export function findLocationsWithComplexSpatialQuery(
  primaryLocations: LocationWithCoordinates[],
  includeLocations: LocationWithCoordinates[],
  excludeLocations: LocationWithCoordinates[],
  includeRadius: number,
  excludeRadius: number
): {
  resultLocations: LocationWithCoordinates[],
  includeConnections: Array<{ source: [number, number]; target: [number, number]; distance: number }>,
} {
  const resultLocations: LocationWithCoordinates[] = [];
  const includeConnections: Array<{ source: [number, number]; target: [number, number]; distance: number }> = [];
  
  // For each primary location (e.g., properties)
  primaryLocations.forEach(primary => {
    // Get coordinates for primary location
    const primaryCoords: [number, number] = getCoordinates(primary);
    
    // Check if at least one include location is within radius
    let isWithinIncludeRadius = false;
    let closestIncludeLocation: LocationWithCoordinates | null = null;
    let closestIncludeDistance = Number.MAX_VALUE;
    
    includeLocations.forEach(include => {
      const includeCoords = getCoordinates(include);
      const distance = calculateDistance(
        primaryCoords[0],
        primaryCoords[1],
        includeCoords[0],
        includeCoords[1]
      );
      
      // Check if within include radius
      if (distance <= includeRadius) {
        isWithinIncludeRadius = true;
        
        // Track the closest include location for connections
        if (distance < closestIncludeDistance) {
          closestIncludeDistance = distance;
          closestIncludeLocation = include;
        }
      }
    });
    
    // If not within any include location's radius, skip this primary location
    if (!isWithinIncludeRadius) return;
    
    // Check if all exclude locations are outside radius
    let isOutsideExcludeRadius = true;
    
    for (const exclude of excludeLocations) {
      const excludeCoords = getCoordinates(exclude);
      const distance = calculateDistance(
        primaryCoords[0],
        primaryCoords[1],
        excludeCoords[0],
        excludeCoords[1]
      );
      
      // If any exclude location is within exclude radius, skip this primary location
      if (distance <= excludeRadius) {
        isOutsideExcludeRadius = false;
        break;
      }
    }
    
    // If this primary location meets both criteria, add it to results
    if (isWithinIncludeRadius && isOutsideExcludeRadius && closestIncludeLocation) {
      resultLocations.push(primary);
      
      // Add connection to the closest include location
      includeConnections.push({
        source: primaryCoords,
        target: getCoordinates(closestIncludeLocation),
        distance: closestIncludeDistance
      });
    }
  });
  
  return {
    resultLocations,
    includeConnections
  };
}

// Fix for the "There is already a source with ID 'connections'" error
export function checkAndRemoveLayers(map: mapboxgl.Map, layerIds: string[], sourceId: string): void {
  // First remove any existing layers
  layerIds.forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  });
  
  // Then remove the source if it exists
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}

// Helper function to get formatted coordinates from location
export function getCoordinates(location: LocationWithCoordinates): [number, number] {
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return [location.coordinates[0], location.coordinates[1]];
  }
  return [0, 0]; // Default if invalid
}

/**
 * Parse a complex spatial query string into a structured format
 * Examples:
 * - "properties within 2 miles of fedex and 4 miles away from starbucks"
 * - "warehouses near fedex but far from starbucks"
 */
export function parseComplexSpatialQuery(query: string): {
  primaryType: string;
  includeType: string;
  excludeType: string;
  includeRadius: number;
  excludeRadius: number;
} | null {
  const queryLower = query.toLowerCase();
  
  // Default values
  let primaryType = 'property';
  let includeType = '';
  let excludeType = '';
  let includeRadius = 2; // Default radius in miles
  let excludeRadius = 2; // Default radius in miles
  
  // Detect primary location type (property, warehouse, etc.)
  if (queryLower.includes('propert')) {
    primaryType = 'property';
  } else if (queryLower.includes('warehouse')) {
    primaryType = 'property'; // We're treating warehouses as properties
  } else if (queryLower.includes('industrial')) {
    primaryType = 'property'; // We're treating industrial facilities as properties
  }
  
  // Detect include location type
  if (queryLower.includes('within') || queryLower.includes('near') || queryLower.includes('close to')) {
    if (queryLower.includes('fedex')) {
      includeType = 'fedex';
      
      // Try to extract radius for include
      const includeRadiusMatch = queryLower.match(/(\d+)\s*miles?\s*(of|from|to)\s*fedex/i);
      if (includeRadiusMatch && includeRadiusMatch[1]) {
        includeRadius = parseInt(includeRadiusMatch[1], 10);
      }
    } else if (queryLower.includes('starbucks')) {
      includeType = 'starbucks';
      
      // Try to extract radius for include
      const includeRadiusMatch = queryLower.match(/(\d+)\s*miles?\s*(of|from|to)\s*starbucks/i);
      if (includeRadiusMatch && includeRadiusMatch[1]) {
        includeRadius = parseInt(includeRadiusMatch[1], 10);
      }
    }
  }
  
  // Detect exclude location type
  if (queryLower.includes('away from') || queryLower.includes('far from') || queryLower.includes('outside')) {
    if (queryLower.includes('fedex')) {
      excludeType = 'fedex';
      
      // Try to extract radius for exclude
      const excludeRadiusMatch = queryLower.match(/(\d+)\s*miles?\s*(away|far)\s*(from)\s*fedex/i);
      if (excludeRadiusMatch && excludeRadiusMatch[1]) {
        excludeRadius = parseInt(excludeRadiusMatch[1], 10);
      }
    } else if (queryLower.includes('starbucks')) {
      excludeType = 'starbucks';
      
      // Try to extract radius for exclude
      const excludeRadiusMatch = queryLower.match(/(\d+)\s*miles?\s*(away|far)\s*(from)\s*starbucks/i);
      if (excludeRadiusMatch && excludeRadiusMatch[1]) {
        excludeRadius = parseInt(excludeRadiusMatch[1], 10);
      }
    }
  }
  
  // If we don't have both include and exclude types, this isn't a complex spatial query
  if (!includeType || !excludeType) {
    return null;
  }
  
  return {
    primaryType,
    includeType,
    excludeType,
    includeRadius,
    excludeRadius
  };
}
