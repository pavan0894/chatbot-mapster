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

/**
 * Find properties that are within specific distances of multiple target types
 * Example: Find properties within 2 miles of FedEx and 3 miles of Starbucks
 */
export function findPropertiesWithMultiTargetProximity(
  properties: LocationWithCoordinates[],
  targetTypes: {
    type: string, 
    locations: LocationWithCoordinates[], 
    radius: number
  }[]
): {
  resultProperties: LocationWithCoordinates[],
  connections: Array<{ 
    source: [number, number]; 
    target: [number, number]; 
    targetType: string;
    distance: number 
  }>
} {
  let resultProperties: LocationWithCoordinates[] = [];
  const connections: Array<{ 
    source: [number, number]; 
    target: [number, number]; 
    targetType: string;
    distance: number 
  }> = [];

  // Start with all properties
  resultProperties = [...properties];

  // Filter properties that match ALL target proximity criteria
  targetTypes.forEach(targetData => {
    const { type, locations, radius } = targetData;
    
    // Keep only properties that are within radius of at least one location of this type
    resultProperties = resultProperties.filter(property => {
      const propertyCoords = getCoordinates(property);
      
      // Check if the property is within radius of any location of this type
      for (const location of locations) {
        const locationCoords = getCoordinates(location);
        const distance = calculateDistance(
          propertyCoords[0],
          propertyCoords[1],
          locationCoords[0],
          locationCoords[1]
        );
        
        if (distance <= radius) {
          // Add connection for visualization
          connections.push({
            source: propertyCoords,
            target: locationCoords,
            targetType: type,
            distance
          });
          return true; // This property is within radius of at least one location of this type
        }
      }
      
      return false; // Property is not within radius of any location of this type
    });
  });

  return {
    resultProperties,
    connections
  };
}

/**
 * Parse a multi-target proximity query
 * Example: "find properties within 2 miles of fedex and 3 miles of starbucks"
 */
export function parseMultiTargetQuery(query: string): {
  targetTypes: {
    type: LocationSourceTarget;
    radius: number;
  }[];
} | null {
  const queryLower = query.toLowerCase();
  
  // Check if this is a property search with multiple targets
  if (!queryLower.includes('propert') && 
      !queryLower.includes('warehous') && 
      !queryLower.includes('industrial')) {
    return null;
  }
  
  // Check for phrases indicating multi-target search
  const multiTargetPatterns = [
    /within\s+(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)(?:.*?)(?:and|&)\s*(?:within)?\s*(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)/i,
    /(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)(?:.*?)(?:and|&)\s*(?:within)?\s*(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)/i,
    /near\s*(\w+)(?:.*?)(?:within)?\s*(\d+)\s*miles?(?:.*?)(?:and|&)(?:.*?)near\s*(\w+)(?:.*?)(?:within)?\s*(\d+)\s*miles?/i
  ];
  
  for (const pattern of multiTargetPatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      const targetTypes = [];
      
      // Pattern 1 & 2: within X miles of A and Y miles of B
      if (match[1] && match[2] && match[3] && match[4]) {
        const type1 = normalizeLocationType(match[2]);
        const radius1 = parseInt(match[1], 10);
        const type2 = normalizeLocationType(match[4]); 
        const radius2 = parseInt(match[3], 10);
        
        if (type1 && type2) {
          targetTypes.push({ type: type1 as LocationSourceTarget, radius: radius1 });
          targetTypes.push({ type: type2 as LocationSourceTarget, radius: radius2 });
          return { targetTypes };
        }
      }
    }
  }
  
  // Simpler pattern matching approach as fallback
  const fedexRadius = extractRadiusForType(queryLower, 'fedex');
  const starbucksRadius = extractRadiusForType(queryLower, 'starbucks');
  
  if (fedexRadius > 0 && starbucksRadius > 0) {
    return {
      targetTypes: [
        { type: 'fedex' as LocationSourceTarget, radius: fedexRadius },
        { type: 'starbucks' as LocationSourceTarget, radius: starbucksRadius }
      ]
    };
  }
  
  return null;
}

// Helper function to extract radius for a specific location type
function extractRadiusForType(query: string, type: string): number {
  const patterns = [
    new RegExp(`(\\d+)\\s*miles?\\s*(?:of|from|to)\\s*${type}`, 'i'),
    new RegExp(`${type}\\s*(?:within|in)\\s*(\\d+)\\s*miles?`, 'i'),
    new RegExp(`near\\s*${type}\\s*(?:within|in)\\s*(\\d+)\\s*miles?`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  // Default radius if mentioned but not specified
  if (query.includes(type)) {
    return 5;
  }
  
  return 0;
}

// Helper function to normalize location type names with proper typing
function normalizeLocationType(type: string): LocationSourceTarget | null {
  type = type.toLowerCase();
  
  if (type.includes('fedex') || type.includes('fed') || type.includes('express')) {
    return 'fedex';
  } else if (type.includes('starbucks') || type.includes('coffee') || type.includes('cafe')) {
    return 'starbucks';
  } else if (type.includes('propert') || type.includes('warehouse') || type.includes('industrial')) {
    return 'property';
  }
  
  return null;
}
