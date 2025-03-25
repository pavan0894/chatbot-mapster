
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LOCATION_QUERY_EVENT, LocationQuery } from './Chatbot';
import { findLocationsWithinRadius, LocationWithCoordinates } from '@/utils/mapUtils';

// Using the provided Mapbox token
const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoicGF2YW4wODk0IiwiYSI6ImNtOG96eTFocTA1dXoyanBzcXhuYmY3b2kifQ.hxIlEcLal8KBl_1005RHeA';

// Dallas area industrial properties
const INDUSTRIAL_PROPERTIES: LocationWithCoordinates[] = [
  { name: "Dallas Logistics Hub", coordinates: [-96.7559, 32.7323], description: "Major logistics facility" },
  { name: "Southport Logistics Park", coordinates: [-96.8512, 32.6891], description: "Modern warehouse complex" },
  { name: "Pinnacle Industrial Center", coordinates: [-96.9137, 32.7982], description: "Manufacturing facility" },
  { name: "DFW Commerce Center", coordinates: [-96.9285, 32.8453], description: "Distribution center" },
  { name: "Trinity Industrial District", coordinates: [-96.8212, 32.7651], description: "Mixed industrial use" },
  { name: "GSW Industrial Park", coordinates: [-96.9671, 32.7129], description: "Technology manufacturing" },
  { name: "Valwood Industrial Park", coordinates: [-96.9361, 32.9182], description: "Large industrial complex" },
  { name: "Mockingbird Industrial Center", coordinates: [-96.8312, 32.8375], description: "Warehousing facility" },
  { name: "Redbird Distribution Center", coordinates: [-96.8714, 32.6812], description: "Shipping hub" },
  { name: "Turnpike Distribution Center", coordinates: [-96.9521, 32.8634], description: "Logistics hub" },
  { name: "Dallas Trade Center", coordinates: [-96.7891, 32.8012], description: "Commercial warehousing" },
  { name: "Richardson Tech Park", coordinates: [-96.7329, 32.9543], description: "Technology manufacturing" },
  { name: "Garland Industrial Estate", coordinates: [-96.6384, 32.9127], description: "Manufacturing complex" },
  { name: "Mesquite Industrial District", coordinates: [-96.5991, 32.7735], description: "Distribution facility" },
  { name: "Irving Business Park", coordinates: [-96.9412, 32.8556], description: "Corporate warehousing" },
  { name: "Grand Prairie Industrial", coordinates: [-96.9952, 32.7461], description: "Aerospace manufacturing" },
  { name: "North Dallas Business Center", coordinates: [-96.8201, 32.9253], description: "Mixed industrial" },
  { name: "Arlington Commerce Park", coordinates: [-97.0537, 32.7361], description: "Distribution center" },
  { name: "Farmers Branch Industrial", coordinates: [-96.8891, 32.9367], description: "Light manufacturing" },
  { name: "Addison Technology Park", coordinates: [-96.8315, 32.9721], description: "Electronics production" }
];

// FedEx locations around Dallas
const FEDEX_LOCATIONS: LocationWithCoordinates[] = [
  { name: "FedEx Ship Center - Downtown", coordinates: [-96.8066, 32.7791], description: "Shipping & pickup services" },
  { name: "FedEx Office - Uptown", coordinates: [-96.8031, 32.7956], description: "Printing & shipping services" },
  { name: "FedEx Ground - North Dallas", coordinates: [-96.7351, 32.9119], description: "Package delivery hub" },
  { name: "FedEx Express - Addison", coordinates: [-96.8387, 32.9534], description: "Express shipping center" },
  { name: "FedEx Freight - South Dallas", coordinates: [-96.7865, 32.6953], description: "Freight shipping terminal" },
  { name: "FedEx Office - Richardson", coordinates: [-96.7519, 32.9312], description: "Business services" },
  { name: "FedEx Ship Center - Irving", coordinates: [-96.9513, 32.8379], description: "Shipping & pickup services" },
  { name: "FedEx Ground - Garland", coordinates: [-96.6513, 32.9018], description: "Package sorting facility" },
  { name: "FedEx Office - Plano", coordinates: [-96.7716, 33.0176], description: "Printing & shipping services" },
  { name: "FedEx Express - Mesquite", coordinates: [-96.6102, 32.7651], description: "Express shipping center" },
  { name: "FedEx Ship Center - Lewisville", coordinates: [-96.9945, 33.0317], description: "Shipping & pickup services" },
  { name: "FedEx Freight - Arlington", coordinates: [-97.0678, 32.7231], description: "Freight shipping terminal" },
  { name: "FedEx Office - Las Colinas", coordinates: [-96.9419, 32.8632], description: "Business services" },
  { name: "FedEx Ground - Carrollton", coordinates: [-96.9001, 32.9846], description: "Package delivery hub" },
  { name: "FedEx Express - Grand Prairie", coordinates: [-97.0213, 32.7596], description: "Express shipping center" },
  { name: "FedEx Office - Frisco", coordinates: [-96.8239, 33.0945], description: "Printing & shipping services" },
  { name: "FedEx Ship Center - McKinney", coordinates: [-96.6392, 33.1971], description: "Shipping & pickup services" },
  { name: "FedEx Office - Grapevine", coordinates: [-97.0789, 32.9342], description: "Business services" },
  { name: "FedEx Ground - Denton", coordinates: [-97.1306, 33.2148], description: "Package sorting facility" },
  { name: "FedEx Express - Rockwall", coordinates: [-96.4597, 32.9290], description: "Express shipping center" }
];

interface MapProps {
  className?: string;
}

const Map: React.FC<MapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState<boolean>(false);
  const [activeMarkers, setActiveMarkers] = useState<mapboxgl.Marker[]>([]);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current || mapInitialized) return;
    
    try {
      console.log("Initializing map...");
      mapboxgl.accessToken = DEFAULT_MAPBOX_TOKEN;
      
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        projection: 'globe',
        zoom: 9,
        center: [-96.7970, 32.7767], // Dallas, TX coordinates
        pitch: 45,
      });
      
      map.current = newMap;
      
      // Add navigation controls
      newMap.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
      
      // Disable scroll zoom for smoother experience
      newMap.scrollZoom.disable();
      
      // Wait for map to load before adding features
      newMap.on('load', () => {
        console.log("Map loaded successfully");
        
        // Add atmosphere and fog effects
        newMap.setFog({
          color: 'rgb(255, 255, 255)',
          'high-color': 'rgb(200, 200, 225)',
          'horizon-blend': 0.2,
        });
        
        // Add industrial properties and FedEx locations as markers
        addIndustrialProperties();
        addFedExLocations();
        
        setMapInitialized(true);
      });
      
      // Rotation animation settings
      const secondsPerRevolution = 240;
      const maxSpinZoom = 5;
      const slowSpinZoom = 3;
      let userInteracting = false;
      let spinEnabled = true;
      
      // Spin globe function
      function spinGlobe() {
        if (!newMap) return;
        
        const zoom = newMap.getZoom();
        if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
          let distancePerSecond = 360 / secondsPerRevolution;
          if (zoom > slowSpinZoom) {
            const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= zoomDif;
          }
          const center = newMap.getCenter();
          center.lng -= distancePerSecond;
          newMap.easeTo({ center, duration: 1000, easing: (n) => n });
        }
      }
      
      // Event listeners for interaction
      newMap.on('mousedown', () => {
        userInteracting = true;
      });
      
      newMap.on('dragstart', () => {
        userInteracting = true;
      });
      
      newMap.on('mouseup', () => {
        userInteracting = false;
        spinGlobe();
      });
      
      newMap.on('touchend', () => {
        userInteracting = false;
        spinGlobe();
      });
      
      newMap.on('moveend', () => {
        spinGlobe();
      });
      
      // Start the globe spinning
      spinGlobe();
      
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [mapInitialized]);

  // Function to add industrial property markers to the map
  const addIndustrialProperties = () => {
    if (!map.current) {
      console.error("Map not initialized when adding industrial properties");
      return;
    }
    
    console.log("Adding industrial properties markers");
    const markers: mapboxgl.Marker[] = [];
    
    INDUSTRIAL_PROPERTIES.forEach(property => {
      // Create a custom marker element
      const el = document.createElement('div');
      el.className = 'industrial-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#333';
      el.style.border = '2px solid #fff';
      el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.25)';
      el.style.cursor = 'pointer';
      
      // Create popup for the marker
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <h3 style="font-weight: bold; margin-bottom: 5px;">${property.name}</h3>
          <p style="margin: 0;">${property.description}</p>
        `);
      
      // Add marker to map
      const marker = new mapboxgl.Marker(el)
        .setLngLat(property.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current);
      
      markers.push(marker);
    });
    
    // Save the markers reference
    setActiveMarkers(prev => [...prev, ...markers]);
  };

  // Function to add FedEx location markers to the map
  const addFedExLocations = () => {
    if (!map.current) {
      console.error("Map not initialized when adding FedEx locations");
      return;
    }
    
    console.log("Adding FedEx locations markers");
    const markers: mapboxgl.Marker[] = [];
    
    FEDEX_LOCATIONS.forEach(location => {
      // Create a custom marker element
      const el = document.createElement('div');
      el.className = 'fedex-marker';
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#4D148C'; // FedEx purple
      el.style.border = '2px solid #FF6600'; // FedEx orange
      el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.25)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      
      // Add FedEx logo/icon
      const icon = document.createElement('div');
      icon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 8.5L12 14L5 8.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 15.5L12 21L19 15.5" stroke="#FF6600" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      el.appendChild(icon);
      
      // Create popup for the marker
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 5px;">
            <h3 style="font-weight: bold; margin-bottom: 5px; color: #4D148C;">${location.name}</h3>
            <p style="margin: 0;">${location.description}</p>
          </div>
        `);
      
      // Add marker to map
      const marker = new mapboxgl.Marker(el)
        .setLngLat(location.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current);
      
      markers.push(marker);
    });
    
    // Save the markers reference
    setActiveMarkers(prev => [...prev, ...markers]);
  };

  // Function to handle location queries
  const handleLocationQuery = (event: CustomEvent<LocationQuery>) => {
    const query = event.detail;
    console.log("Location query received:", query);
    
    if (!map.current) {
      console.error("Map not initialized when handling location query");
      return;
    }
    
    // Remove existing filtered markers and connections
    clearFilteredLocations();
    
    // Hide all existing markers first
    clearAllMarkers();
    
    // Find locations within the radius
    const sourceData = query.source === 'fedex' ? FEDEX_LOCATIONS : INDUSTRIAL_PROPERTIES;
    const targetData = query.source === 'fedex' ? INDUSTRIAL_PROPERTIES : FEDEX_LOCATIONS;
    
    const { sourceLocations, targetLocations, connections } = findLocationsWithinRadius(
      sourceData,
      targetData,
      query.radius
    );
    
    console.log("Found connections:", connections.length);
    
    // If no connections found, show toast and reset map
    if (connections.length === 0) {
      console.log("No locations found within the radius");
      // Add all markers back since there are no filtered results
      addIndustrialProperties();
      addFedExLocations();
      return;
    }
    
    // Add filtered source locations
    addFilteredLocations(sourceLocations, query.source, '#4D148C', '#FF6600');
    
    // Add filtered target locations
    addFilteredLocations(targetLocations, query.source === 'fedex' ? 'property' : 'fedex', '#333', '#fff');
    
    // Add connection lines between locations
    addConnectionLines(connections);
    
    // Fit the map to show all the filtered locations
    fitMapToLocations([...sourceLocations, ...targetLocations].map(loc => {
      // Ensure we have a valid [number, number] tuple
      const coords = Array.isArray(loc.coordinates) && loc.coordinates.length >= 2 
        ? [loc.coordinates[0], loc.coordinates[1]] as [number, number]
        : [0, 0] as [number, number];
      return coords;
    }));
  };

  // Add filtered locations to the map
  const addFilteredLocations = (
    locations: LocationWithCoordinates[],
    locationType: 'fedex' | 'property',
    bgColor: string,
    borderColor: string
  ) => {
    if (!map.current || !locations.length) {
      console.error("Map not initialized or no locations when adding filtered locations");
      return;
    }
    
    const markers: mapboxgl.Marker[] = [];
    
    locations.forEach(location => {
      // Create a custom marker element
      const el = document.createElement('div');
      el.className = `${locationType}-marker-filtered`;
      el.style.width = locationType === 'fedex' ? '28px' : '20px';
      el.style.height = locationType === 'fedex' ? '28px' : '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = bgColor;
      el.style.border = `2px solid ${borderColor}`;
      el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.25), 0 0 0 8px rgba(255,255,255,0.5)';
      el.style.cursor = 'pointer';
      el.style.zIndex = '10';
      
      if (locationType === 'fedex') {
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        
        // Add FedEx logo/icon
        const icon = document.createElement('div');
        icon.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 8.5L12 14L5 8.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 15.5L12 21L19 15.5" stroke="#FF6600" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        el.appendChild(icon);
      }
      
      // Create popup for the marker
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 5px;">
            <h3 style="font-weight: bold; margin-bottom: 5px; ${locationType === 'fedex' ? 'color: #4D148C;' : ''}">${location.name}</h3>
            <p style="margin: 0;">${location.description}</p>
          </div>
        `);
      
      // Ensure coordinates is a valid [number, number] tuple
      const coordinates = Array.isArray(location.coordinates) && location.coordinates.length >= 2 
        ? [location.coordinates[0], location.coordinates[1]] as [number, number]
        : [0, 0] as [number, number];
      
      // Add marker to map
      const marker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current);
      
      markers.push(marker);
    });
    
    // Save the markers reference
    setActiveMarkers(prev => [...prev, ...markers]);
  };

  // Add connection lines between locations
  const addConnectionLines = (
    connections: Array<{ source: [number, number]; target: [number, number]; distance: number }>
  ) => {
    if (!map.current || !connections.length) {
      console.error("Map not initialized or no connections when adding connection lines");
      return;
    }
    
    // Check if source already exists and remove it
    if (map.current.getSource('connections')) {
      activeLayers.forEach(layerId => {
        if (map.current && map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
      });
      map.current.removeSource('connections');
    }
    
    // Add the source for the connection lines
    map.current.addSource('connections', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: connections.map((connection, index) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [connection.source, connection.target]
          },
          properties: {
            id: `connection-${index}`,
            distance: connection.distance.toFixed(2)
          }
        }))
      }
    });
    
    // Add the connection lines layer
    map.current.addLayer({
      id: 'connections-layer',
      type: 'line',
      source: 'connections',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#FF6600',
        'line-width': 2,
        'line-opacity': 0.7,
        'line-dasharray': [2, 1]
      }
    });
    
    // Add the distance labels layer
    map.current.addLayer({
      id: 'connections-labels',
      type: 'symbol',
      source: 'connections',
      layout: {
        'text-field': '{distance} mi',
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
        'text-offset': [0, -0.5],
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 0.6,
        'text-justify': 'auto'
      },
      paint: {
        'text-color': '#333',
        'text-halo-color': '#fff',
        'text-halo-width': 2
      }
    });
    
    // Save active layers
    setActiveLayers(['connections-layer', 'connections-labels']);
  };

  // Fit map to filtered locations
  const fitMapToLocations = (coordinates: [number, number][]) => {
    if (!map.current || !coordinates.length) {
      console.error("Map not initialized or no coordinates when fitting map to locations");
      return;
    }
    
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 11
    });
  };

  // Clear all existing markers
  const clearAllMarkers = () => {
    console.log("Clearing all markers, count:", activeMarkers.length);
    activeMarkers.forEach(marker => marker.remove());
    setActiveMarkers([]);
  };

  // Clear filtered locations
  const clearFilteredLocations = () => {
    // Remove any existing connection layers
    if (map.current) {
      activeLayers.forEach(layerId => {
        if (map.current && map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
      });
      
      // Remove any existing sources
      if (map.current.getSource('connections')) {
        map.current.removeSource('connections');
      }
    }
    
    setActiveLayers([]);
  };

  // Reset map to show all locations
  const resetMap = () => {
    if (!map.current) {
      console.error("Map not initialized when resetting map");
      return;
    }
    
    console.log("Resetting map");
    clearFilteredLocations();
    clearAllMarkers();
    
    // Reset the view
    map.current.flyTo({
      center: [-96.7970, 32.7767], // Dallas
      zoom: 9,
      pitch: 45,
      bearing: 0
    });
    
    // Re-add all markers
    addIndustrialProperties();
    addFedExLocations();
  };

  // Listen for location query events
  useEffect(() => {
    console.log("Setting up event listener for location queries");
    
    const handleLocationQueryTyped = (e: Event) => {
      handleLocationQuery(e as CustomEvent<LocationQuery>);
    };
    
    window.addEventListener(LOCATION_QUERY_EVENT, handleLocationQueryTyped);
    
    // Cleanup
    return () => {
      console.log("Cleaning up map component");
      window.removeEventListener(LOCATION_QUERY_EVENT, handleLocationQueryTyped);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setMapInitialized(false);
    };
  }, []);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/10" />
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background/20 to-transparent" />
      </div>
      
      {/* Reset button */}
      <button 
        onClick={resetMap}
        className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1.5 text-sm rounded-md shadow-md hover:bg-white flex items-center gap-1.5 transition-colors border border-border"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 16h5v5"/>
        </svg>
        Reset Map
      </button>
    </div>
  );
};

export default Map;
