
// Core map utility types and calculation functions

// Type for location objects with coordinates
export type LocationWithCoordinates = {
  coordinates: number[] | [number, number];
  name: string;
  description: string;
};

// Import needed type for location sources/targets from Chatbot component
import { LocationSourceTarget } from '../components/Chatbot';

// Convert degrees to radians
export function toRadians(degrees: number): number {
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

// Helper function to get formatted coordinates from location
export function getCoordinates(location: LocationWithCoordinates): [number, number] {
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return [location.coordinates[0], location.coordinates[1]];
  }
  return [0, 0]; // Default if invalid
}

// Fix for the "There is already a source with ID 'connections'" error in Mapbox
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

// Create a map marker element with Google Maps-like appearance
export function createMarkerElement(
  locationType: LocationSourceTarget, 
  options: {
    size?: number,
    primaryColor?: string,
    secondaryColor?: string,
    customIconUrl?: string
  } = {}
): HTMLDivElement {
  const {
    size = locationType === 'property' ? 24 : 32,
    primaryColor = locationType === 'property' ? '#4285F4' : 
                   locationType === 'fedex' ? '#FF6600' : '#00704A',
    secondaryColor = '#FFFFFF',
    customIconUrl = locationType === 'fedex' ? '/fedex-logo.png' : 
                   locationType === 'starbucks' ? '/starbucks-logo.png' : undefined
  } = options;
  
  const el = document.createElement('div');
  el.className = `${locationType}-marker`;
  
  // Base Google Maps-like pin style
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '50% 50% 50% 0';
  el.style.backgroundColor = primaryColor;
  el.style.position = 'relative';
  el.style.transform = 'rotate(-45deg)';
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  
  // For property pins, we make them look like standard Google Maps pins
  if (locationType === 'property') {
    // No inner content needed for property pins
  } else {
    // For FedEx and Starbucks, we add their logos inside a circular area
    const innerCircle = document.createElement('div');
    innerCircle.style.position = 'absolute';
    innerCircle.style.width = `${Math.round(size * 0.75)}px`;
    innerCircle.style.height = `${Math.round(size * 0.75)}px`;
    innerCircle.style.backgroundColor = secondaryColor;
    innerCircle.style.borderRadius = '50%';
    innerCircle.style.top = '50%';
    innerCircle.style.left = '50%';
    innerCircle.style.transform = 'translate(-50%, -50%) rotate(45deg)';
    
    if (customIconUrl) {
      innerCircle.style.backgroundImage = `url('${customIconUrl}')`;
      innerCircle.style.backgroundSize = 'cover';
      innerCircle.style.backgroundPosition = 'center';
    }
    
    el.appendChild(innerCircle);
  }
  
  return el;
}
