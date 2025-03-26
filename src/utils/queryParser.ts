
import { LocationSourceTarget } from '../components/Chatbot';

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
    
    // Pattern for simpler "properties within X miles of A and B"
    /propert(?:y|ies)(?:.*?)within\s+(\d+)\s*miles?\s*(?:of|from|to)\s*(\w+)\s*and\s*(\w+)/i,
    
    // Pattern for even simpler mentions of two location types with properties
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

// Helper functions for query parsing

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
    
    // "properties within X miles of type"
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
