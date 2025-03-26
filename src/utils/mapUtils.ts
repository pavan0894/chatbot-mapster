
// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

// Import needed type for location sources/targets
import { LocationSourceTarget } from '../components/Chatbot';

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
  excludeConnections: Array<{ source: [number, number]; target: [number, number]; distance: number }>
} {
  const resultLocations: LocationWithCoordinates[] = [];
  const includeConnections: Array<{ source: [number, number]; target: [number, number]; distance: number }> = [];
  const excludeConnections: Array<{ source: [number, number]; target: [number, number]; distance: number }> = [];
  
  console.log(`Searching for properties within ${includeRadius} miles of include locations and at least ${excludeRadius} miles from exclude locations`);
  console.log(`Primary locations: ${primaryLocations.length}, Include locations: ${includeLocations.length}, Exclude locations: ${excludeLocations.length}`);
  
  // For each primary location (e.g., properties)
  primaryLocations.forEach(primary => {
    // Get coordinates for primary location
    const primaryCoords: [number, number] = getCoordinates(primary);
    
    // Check if at least one include location is within radius
    let isWithinIncludeRadius = false;
    let closestIncludeLocation: LocationWithCoordinates | null = null;
    let closestIncludeDistance = Number.MAX_VALUE;
    
    // Check all include locations (e.g., FedEx)
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
    if (!isWithinIncludeRadius) {
      return;
    }
    
    // Check if ALL exclude locations are outside radius
    let isOutsideExcludeRadius = true;
    let closestExcludeLocation: LocationWithCoordinates | null = null;
    let closestExcludeDistance = Number.MAX_VALUE;
    
    for (const exclude of excludeLocations) {
      const excludeCoords = getCoordinates(exclude);
      const distance = calculateDistance(
        primaryCoords[0],
        primaryCoords[1],
        excludeCoords[0],
        excludeCoords[1]
      );
      
      // If any exclude location is within exclude radius, this property doesn't qualify
      if (distance <= excludeRadius) {
        isOutsideExcludeRadius = false;
        
        // Still track the closest one for visualization
        if (distance < closestExcludeDistance) {
          closestExcludeDistance = distance;
          closestExcludeLocation = exclude;
        }
      }
    }
    
    // If this primary location meets both criteria, add it to results
    if (isWithinIncludeRadius && isOutsideExcludeRadius && closestIncludeLocation) {
      console.log(`Found property "${primary.name}" that meets criteria`);
      resultLocations.push(primary);
      
      // Add connection to the closest include location
      includeConnections.push({
        source: primaryCoords,
        target: getCoordinates(closestIncludeLocation),
        distance: closestIncludeDistance
      });
    } else if (isWithinIncludeRadius && !isOutsideExcludeRadius && closestIncludeLocation && closestExcludeLocation) {
      console.log(`Property "${primary.name}" is near include but also too near exclude (${closestExcludeDistance.toFixed(2)} miles from exclude)`);
      
      // Add connection to closest exclude location for debugging
      excludeConnections.push({
        source: primaryCoords,
        target: getCoordinates(closestExcludeLocation),
        distance: closestExcludeDistance
      });
    }
  });
  
  console.log(`Found ${resultLocations.length} properties that meet all criteria`);
  
  return {
    resultLocations,
    includeConnections,
    excludeConnections
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
  includeType: LocationSourceTarget;
  excludeType: LocationSourceTarget;
  includeRadius: number;
  excludeRadius: number;
} | null {
  const queryLower = query.toLowerCase();
  
  // Default values
  let primaryType = 'property';
  let includeType: LocationSourceTarget | null = null;
  let excludeType: LocationSourceTarget | null = null;
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
  
  // Improved pattern matching for complex queries like "within X miles of A and Y miles away from B"
  const complexPattern = /within\s+(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)(?:.*?)(?:and|&|but)(?:.*?)(\d+)\s*miles?\s*(?:away|far)(?:.*?)(?:from)\s*(\w+)/i;
  const complexMatch = queryLower.match(complexPattern);
  
  if (complexMatch) {
    console.log("Complex pattern matched:", complexMatch);
    const includeRadius = parseInt(complexMatch[1], 10);
    const includeType = normalizeLocationType(complexMatch[2]);
    const excludeRadius = parseInt(complexMatch[3], 10);
    const excludeType = normalizeLocationType(complexMatch[4]);
    
    if (includeType && excludeType) {
      console.log(`Complex query detected: ${includeRadius} miles of ${includeType} and ${excludeRadius} miles away from ${excludeType}`);
      return {
        primaryType,
        includeType,
        excludeType,
        includeRadius,
        excludeRadius
      };
    }
  }
  
  // Check for specific patterns like "near X but away from Y"
  const proximityPattern = /(near|close\s+to|within|next\s+to)\s+(\w+).*?(away\s+from|far\s+from|not\s+near|outside)\s+(\w+)/i;
  const proximityMatch = queryLower.match(proximityPattern);
  
  if (proximityMatch) {
    const nearType = normalizeLocationType(proximityMatch[2]);
    const farType = normalizeLocationType(proximityMatch[4]);
    
    if (nearType && farType) {
      includeType = nearType;
      excludeType = farType;
      
      // Try to extract radii
      const nearRadiusMatch = queryLower.match(/(\d+)\s*miles?\s*(?:of|from|to)\s*\b(fedex|starbucks)\b/i);
      const farRadiusMatch = queryLower.match(/(\d+)\s*miles?\s*(away|far)\s*(?:from)\s*\b(fedex|starbucks)\b/i);
      
      if (nearRadiusMatch && nearRadiusMatch[2].toLowerCase().includes(String(includeType))) {
        includeRadius = parseInt(nearRadiusMatch[1], 10);
      }
      
      if (farRadiusMatch && farRadiusMatch[3].toLowerCase().includes(String(excludeType))) {
        excludeRadius = parseInt(farRadiusMatch[1], 10);
      }
    }
  } else {
    // Check each type separately if not found with combined pattern
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
    type: LocationSourceTarget, 
    locations: LocationWithCoordinates[], 
    radius: number
  }[]
): {
  resultProperties: LocationWithCoordinates[],
  connections: Array<{ 
    source: [number, number]; 
    target: [number, number]; 
    targetType: LocationSourceTarget;
    distance: number 
  }>
} {
  let resultProperties: LocationWithCoordinates[] = [];
  const connections: Array<{ 
    source: [number, number]; 
    target: [number, number]; 
    targetType: LocationSourceTarget;
    distance: number 
  }> = [];

  // Start with all properties
  resultProperties = [...properties];
  
  console.log(`Starting with ${resultProperties.length} total properties`);
  console.log(`Filtering for ${targetTypes.length} target types:`, targetTypes.map(t => `${t.type} (${t.radius} miles)`).join(', '));

  // Filter properties that match ALL target proximity criteria
  targetTypes.forEach(targetData => {
    const { type, locations, radius } = targetData;
    console.log(`Processing ${type} locations (${locations.length} locations, radius: ${radius} miles)`);
    
    // Keep only properties that are within radius of at least one location of this type
    const matchingProperties: LocationWithCoordinates[] = [];
    const typeConnections: Array<{ 
      source: [number, number]; 
      target: [number, number]; 
      targetType: LocationSourceTarget;
      distance: number 
    }> = [];
    
    resultProperties.forEach(property => {
      const propertyCoords = getCoordinates(property);
      let isWithinRadius = false;
      let closestDistance = Number.MAX_VALUE;
      let closestLocation: [number, number] | null = null;
      
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
          isWithinRadius = true;
          if (distance < closestDistance) {
            closestDistance = distance;
            closestLocation = locationCoords;
          }
        }
      }
      
      if (isWithinRadius && closestLocation) {
        matchingProperties.push(property);
        typeConnections.push({
          source: propertyCoords,
          target: closestLocation,
          targetType: type,
          distance: closestDistance
        });
      }
    });
    
    // Update result properties to only include those that match this criteria
    resultProperties = matchingProperties;
    connections.push(...typeConnections);
    
    console.log(`After filtering for ${type}: ${resultProperties.length} properties remain`);
  });

  return {
    resultProperties,
    connections
  };
}

/**
 * Parse a multi-target proximity query
 * Example: "find properties within 2 miles of FedEx and 3 miles of Starbucks"
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
  
  // Improved patterns for multi-target search detection
  const multiTargetPatterns = [
    // Pattern for "within X miles of A and Y miles of B"
    /within\s+(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)(?:.*?)(?:and|&)\s*(?:within)?\s*(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)/i,
    
    // Pattern for "X miles of A and Y miles of B" without "within"
    /(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)(?:.*?)(?:and|&)\s*(?:within)?\s*(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)/i,
    
    // Pattern for "near A within X miles and near B within Y miles"
    /near\s*(\w+)(?:.*?)(?:within)?\s*(\d+)\s*miles?(?:.*?)(?:and|&)(?:.*?)near\s*(\w+)(?:.*?)(?:within)?\s*(\d+)\s*miles?/i,
    
    // NEW: Pattern for simpler "properties within X miles of A and B"
    /propert(?:y|ies)(?:.*?)within\s+(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)\s*and\s*(\w+)/i,
    
    // NEW: Pattern for even simpler mentions of two location types with properties
    /propert(?:y|ies)(?:.*?)(?:near|close to|around|by)\s*(?:both)?\s*(\w+)\s*and\s*(\w+)/i
  ];
  
  // Check all patterns for a match
  for (const pattern of multiTargetPatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      // Handle different pattern matches differently
      if (match.length >= 5 && match[1] && match[2] && match[3] && match[4]) {
        // First three patterns with explicit distances
        const type1 = normalizeLocationType(match[2]);
        const radius1 = parseInt(match[1], 10);
        const type2 = normalizeLocationType(match[4]); 
        const radius2 = parseInt(match[3], 10);
        
        if (type1 && type2) {
          return { 
            targetTypes: [
              { type: type1, radius: radius1 },
              { type: type2, radius: radius2 }
            ] 
          };
        }
      } else if (match.length >= 4 && match[1] && match[2] && match[3]) {
        // Pattern for "properties within X miles of A and B"
        const radius = parseInt(match[1], 10);
        const type1 = normalizeLocationType(match[2]);
        const type2 = normalizeLocationType(match[3]);
        
        if (type1 && type2) {
          return { 
            targetTypes: [
              { type: type1, radius },
              { type: type2, radius }
            ] 
          };
        }
      } else if (match.length >= 3 && match[1] && match[2]) {
        // Simplest pattern with just mentions of locations
        const type1 = normalizeLocationType(match[1]);
        const type2 = normalizeLocationType(match[2]);
        
        if (type1 && type2) {
          // Default radius when not specified
          const defaultRadius = 5;
          return { 
            targetTypes: [
              { type: type1, radius: defaultRadius },
              { type: type2, radius: defaultRadius }
            ] 
          };
        }
      }
    }
  }
  
  // Direct extraction approach for FedEx and Starbucks
  const fedexRadius = extractRadiusForType(queryLower, 'fedex');
  const starbucksRadius = extractRadiusForType(queryLower, 'starbucks');
  
  if (fedexRadius > 0 && starbucksRadius > 0) {
    console.log(`Detected multi-target query: FedEx (${fedexRadius} miles) and Starbucks (${starbucksRadius} miles)`);
    return {
      targetTypes: [
        { type: 'fedex' as LocationSourceTarget, radius: fedexRadius },
        { type: 'starbucks' as LocationSourceTarget, radius: starbucksRadius }
      ]
    };
  }
  
  // If both location types are mentioned but no radius is specified, use default
  if (queryLower.includes('fedex') && queryLower.includes('starbucks') && queryLower.includes('propert')) {
    console.log('Detected multi-target query with default radii');
    return {
      targetTypes: [
        { type: 'fedex' as LocationSourceTarget, radius: 5 },
        { type: 'starbucks' as LocationSourceTarget, radius: 5 }
      ]
    };
  }
  
  return null;
}

// Helper function to extract radius for a specific location type
function extractRadiusForType(query: string, type: string): number {
  const patterns = [
    // "X miles of type"
    new RegExp(`(\\d+)\\s*miles?\\s*(?:of|from|to)\\s*${type}`, 'i'),
    
    // "type within X miles"
    new RegExp(`${type}\\s*(?:within|in)\\s*(\\d+)\\s*miles?`, 'i'),
    
    // "near type within X miles"
    new RegExp(`near\\s*${type}\\s*(?:within|in)\\s*(\\d+)\\s*miles?`, 'i'),
    
    // "within X miles (of|from|to) type"
    new RegExp(`within\\s*(\\d+)\\s*miles?\\s*(?:of|from|to)\\s*${type}`, 'i'),
    
    // NEW: "properties within X miles of type"
    new RegExp(`propert(?:y|ies)\\s*(?:within|in)\\s*(\\d+)\\s*miles?\\s*(?:of|from|to)\\s*${type}`, 'i')
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

// New function for dynamic triple-type location query
export function findLocationsWithTripleTypeProximity(
  primaryLocations: LocationWithCoordinates[],
  sourceLocations: LocationWithCoordinates[],
  targetTypeConfig: {
    [key in LocationSourceTarget]?: {
      locations: LocationWithCoordinates[];
      radius: number;
    };
  }
): {
  resultLocations: LocationWithCoordinates[];
  connections: Array<{
    source: [number, number];
    target: [number, number];
    targetType: LocationSourceTarget;
    distance: number;
  }>;
} {
  let resultLocations: LocationWithCoordinates[] = [...primaryLocations];
  const connections: Array<{
    source: [number, number];
    target: [number, number];
    targetType: LocationSourceTarget;
    distance: number;
  }> = [];

  console.log(`Starting with ${resultLocations.length} total locations`);

  // Process each target type to filter the results
  Object.entries(targetTypeConfig).forEach(([targetTypeStr, data]) => {
    const targetType = targetTypeStr as LocationSourceTarget;
    const { locations, radius } = data;

    if (!locations || locations.length === 0) {
      console.log(`No ${targetType} locations provided, skipping this filter`);
      return;
    }

    console.log(`Filtering for ${targetType} within ${radius} miles (${locations.length} locations)`);

    // For each remaining location, check if it's within radius of at least one target
    const matchingLocations: LocationWithCoordinates[] = [];
    const typeConnections: Array<{
      source: [number, number];
      target: [number, number];
      targetType: LocationSourceTarget;
      distance: number;
    }> = [];

    resultLocations.forEach(location => {
      const locationCoords = getCoordinates(location);
      let isWithinRadius = false;
      let closestDistance = Number.MAX_VALUE;
      let closestTargetLocation: [number, number] | null = null;

      // Check proximity to each target location
      for (const targetLocation of locations) {
        const targetCoords = getCoordinates(targetLocation);
        const distance = calculateDistance(
          locationCoords[0],
          locationCoords[1],
          targetCoords[0],
          targetCoords[1]
        );

        if (distance <= radius) {
          isWithinRadius = true;
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestTargetLocation = targetCoords;
          }
        }
      }

      // If this location is within radius of at least one target, add it
      if (isWithinRadius && closestTargetLocation) {
        matchingLocations.push(location);
        
        typeConnections.push({
          source: locationCoords,
          target: closestTargetLocation,
          targetType,
          distance: closestDistance
        });
      }
    });

    // Update filtered locations
    resultLocations = matchingLocations;
    connections.push(...typeConnections);

    console.log(`After filtering for ${targetType}: ${resultLocations.length} locations remain`);
  });

  return {
    resultLocations,
    connections
  };
}

// NEW: Function to parse queries with any combination of location types
export function parseAnyMultiLocationQuery(query: string): {
  primaryType: LocationSourceTarget;
  targetTypes: {
    [key in LocationSourceTarget]?: {
      radius: number;
    };
  };
} | null {
  const queryLower = query.toLowerCase();
  
  // Determine the primary search type
  let primaryType: LocationSourceTarget = 'property';
  
  // Check what the query is asking for
  if (queryLower.match(/\b(show|find|locate|display|get|list)\b.*\b(propert|warehouse|industrial)\b/i)) {
    primaryType = 'property';
  } else if (queryLower.match(/\b(show|find|locate|display|get|list)\b.*\b(fedex|fed\s*ex|shipping)\b/i)) {
    primaryType = 'fedex';
  } else if (queryLower.match(/\b(show|find|locate|display|get|list)\b.*\b(starbucks|coffee|cafe)\b/i)) {
    primaryType = 'starbucks';
  } else {
    // If no clear primary type, default to property
    primaryType = 'property';
  }
  
  const targetTypes: {
    [key in LocationSourceTarget]?: {
      radius: number;
    };
  } = {};
  
  // Check for references to each location type and extract radii
  const locationTypes: LocationSourceTarget[] = ['property', 'fedex', 'starbucks'];
  
  // Only look for proximity to other types, not the primary type itself
  locationTypes.filter(type => type !== primaryType).forEach(locationType => {
    // Check if this location type is mentioned in the query
    const typePatterns = locationType === 'fedex' 
      ? [/\bfedex\b/i, /\bfed\s*ex\b/i, /\bshipping\b/i]
      : locationType === 'starbucks'
      ? [/\bstarbucks\b/i, /\bcoffee\b/i, /\bcafe\b/i]
      : [/\bpropert(?:y|ies)\b/i, /\bwarehouse(?:s)?\b/i, /\bindustrial\b/i];
    
    const isTypeInQuery = typePatterns.some(pattern => pattern.test(queryLower));
    
    if (isTypeInQuery) {
      // Extract radius for this type
      const radius = extractRadiusForType(queryLower, locationType);
      
      if (radius > 0 || queryLower.match(new RegExp(`\\bnear\\b.*\\b${locationType}\\b`, 'i'))) {
        targetTypes[locationType] = {
          radius: radius > 0 ? radius : 5 // Default to 5 miles if no specific radius
        };
      }
    }
  });
  
  // If we found at least one target type, return the query
  if (Object.keys(targetTypes).length > 0) {
    return {
      primaryType,
      targetTypes
    };
  }
  
  return null;
}
