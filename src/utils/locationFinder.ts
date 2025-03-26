
import { LocationWithCoordinates, calculateDistance, getCoordinates } from './mapCore';

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
