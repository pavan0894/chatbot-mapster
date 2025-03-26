
// Main entry point for map utilities - re-exports all functionality

// Re-export core utility types and functions
export type { LocationWithCoordinates } from './mapCore';
export { 
  toRadians,
  calculateDistance,
  getCoordinates,
  checkAndRemoveLayers,
  createMarkerElement
} from './mapCore';

// Re-export location finder functionality
export {
  findLocationsWithinRadius
} from './locationFinder';

// Re-export complex spatial queries
export {
  findLocationsWithComplexSpatialQuery,
  findPropertiesWithMultiTargetProximity,
  findLocationsWithTripleTypeProximity
} from './complexSpatialQueries';

// Re-export query parsers
export {
  parseComplexSpatialQuery,
  parseMultiTargetQuery,
  parseAnyMultiLocationQuery
} from './queryParser';
