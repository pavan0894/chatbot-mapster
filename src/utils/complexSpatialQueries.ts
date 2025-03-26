import { LocationWithCoordinates, calculateDistance, getCoordinates } from './mapCore';
import { LocationSourceTarget } from '../components/Chatbot';

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

// Function for dynamic triple-type location query
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
