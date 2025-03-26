import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LOCATION_QUERY_EVENT, LocationQuery, API_QUERY_EVENT, COMPLEX_QUERY_EVENT, MULTI_TARGET_QUERY_EVENT, LocationSourceTarget } from './Chatbot';
import { 
  findLocationsWithinRadius, 
  checkAndRemoveLayers, 
  findPropertiesWithMultiTargetProximity,
  getCoordinates,
  findLocationsWithTripleTypeProximity,
  findLocationsWithComplexSpatialQuery,
  parseComplexSpatialQuery,
  calculateDistance
} from '@/utils/mapUtils';
import type { LocationWithCoordinates } from '@/utils/mapUtils';
import { STARBUCKS_LOCATIONS } from '@/data/starbucksLocations';

const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoicGF2YW4wODk0IiwiYSI6ImNtOG96eTFocTA1dXoyanBzcXhuYmY3b2kifQ.hxIlEcLal8KBl_1005RHeA';

const COMPLEX_QUERY_FALLBACK_PROPERTIES: LocationWithCoordinates[] = [
  { 
    name: "Dallas Logistics Hub - FedEx Close", 
    coordinates: [-96.7559, 32.7323], 
    description: "Major logistics facility within 2 miles of FedEx and 4+ miles from Starbucks" 
  },
  { 
    name: "Pinnacle Industrial Center - Strategic Location", 
    coordinates: [-96.9137, 32.7982], 
    description: "Manufacturing facility with optimal logistics placement" 
  }
];

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
  { name: "Addison Technology Park", coordinates: [-96.8315, 32.9721], description: "Electronics production" },
  { name: "Platinum Commerce Center", coordinates: [-96.8833, 32.7012], description: "E-commerce fulfillment center" },
  { name: "Cedar Hill Business Park", coordinates: [-96.9562, 32.5891], description: "Multi-tenant industrial space" },
  { name: "Northlake Logistics Center", coordinates: [-97.1452, 33.0871], description: "Advanced distribution hub" },
  { name: "East Dallas Manufacturing", coordinates: [-96.6912, 32.7891], description: "Specialized manufacturing" },
  { name: "Sunnyvale Industrial Complex", coordinates: [-96.5481, 32.7664], description: "Food processing facility" },
  { name: "Coppell Trade Center", coordinates: [-96.9892, 32.9541], description: "Import/export logistics" },
  { name: "Mountain Creek Business Park", coordinates: [-96.9781, 32.7012], description: "Pharmaceutical production" },
  { name: "Stemmons Corridor Industrial", coordinates: [-96.8791, 32.8112], description: "Rail-served warehousing" },
  { name: "Lewisville Industrial Park", coordinates: [-96.9941, 33.0412], description: "Automation technology center" },
  { name: "Carrollton Commerce Center", coordinates: [-96.9121, 32.9761], description: "Construction materials supply" },
  { name: "Great Southwest Industrial", coordinates: [-97.0401, 32.7561], description: "Aerospace components" },
  { name: "Plano Technology Center", coordinates: [-96.7682, 33.0211], description: "Semiconductor manufacturing" },
  { name: "Seagoville Distribution Hub", coordinates: [-96.5501, 32.6512], description: "Regional distribution" },
  { name: "Blue Mound Industrial", coordinates: [-97.2891, 32.8931], description: "Auto parts manufacturing" },
  { name: "Lake Ray Hubbard Commerce", coordinates: [-96.5231, 32.8561], description: "Consumer goods production" },
  { name: "Alliance Gateway Logistics", coordinates: [-97.2641, 32.9912], description: "International shipping hub" },
  { name: "Midlothian Industrial Park", coordinates: [-96.9941, 32.4821], description: "Steel fabrication center" },
  { name: "Wylie Manufacturing Campus", coordinates: [-96.5341, 33.0161], description: "Electronics assembly" },
  { name: "South Dallas Intermodal", coordinates: [-96.7992, 32.6231], description: "Rail-to-truck transfer facility" },
  { name: "Hutchins Logistics Center", coordinates: [-96.7112, 32.6421], description: "Cold storage distribution" }
];

function getFedExLocations(): LocationWithCoordinates[] {
  console.log("Dynamically loading FedEx locations");
  return [
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
}

export const MAP_RESULTS_UPDATE_EVENT = 'map-results-update';
export const DYNAMIC_QUERY_EVENT = 'dynamic-query-event';

export function emitResultsUpdate(properties: LocationWithCoordinates[]) {
  console.log("Emitting map results update with properties:", properties);
  const event = new CustomEvent(MAP_RESULTS_UPDATE_EVENT, { 
    detail: { properties } 
  });
  window.dispatchEvent(event);
}

export function emitMapContextUpdate(context: {
  visibleLocations?: string[],
  query?: LocationQuery,
  properties?: LocationWithCoordinates[]
}) {
  console.log("Emitting map context update:", context);
  const event = new CustomEvent('map-context-update', { 
    detail: context 
  });
  window.dispatchEvent(event);
}

interface MapProps {
  className?: string;
}

type LocationType = 'fedex' | 'property' | 'starbucks';

interface LocationQueryExtension {
  complexSpatialQuery?: {
    includeType: LocationSourceTarget;
    excludeType: LocationSourceTarget;
    includeRadius: number;
    excludeRadius: number;
  };
  multiTargetQuery?: {
    targetTypes: {
      type: LocationSourceTarget;
      radius: number;
    }[];
  };
  dynamicQuery?: {
    primaryType: LocationSourceTarget;
    targetTypes: {
      [key in LocationSourceTarget]?: {
        radius: number;
      };
    };
  };
}

declare module './Chatbot' {
  interface LocationQuery extends LocationQueryExtension {}
}

const Map: React.FC<MapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState<boolean>(false);
  const [activeMarkers, setActiveMarkers] = useState<mapboxgl.Marker[]>([]);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [fedExLocations, setFedExLocations] = useState<LocationWithCoordinates[]>([]);
  const [fedExLoaded, setFedExLoaded] = useState<boolean>(false);
  const [starbucksLoaded, setStarbucksLoaded] = useState<boolean>(false);
  const [displayedProperties, setDisplayedProperties] = useState<LocationWithCoordinates[]>([]);
  const [visibleLocationTypes, setVisibleLocationTypes] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState<LocationQuery | null>(null);
  const [preserveProperties, setPreserveProperties] = useState<boolean>(true);

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
        center: [-96.7970, 32.7767],
        pitch: 45,
      });
      
      map.current = newMap;
      
      newMap.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
      
      newMap.scrollZoom.disable();
      
      newMap.on('load', () => {
        console.log("Map loaded successfully");
        
        newMap.setFog({
          color: 'rgb(255, 255, 255)',
          'high-color': 'rgb(200, 200, 225)',
          'horizon-blend': 0.2,
        });
        
        setMapInitialized(true);
      });
      
      const secondsPerRevolution = 240;
      const maxSpinZoom = 5;
      const slowSpinZoom = 3;
      let userInteracting = false;
      let spinEnabled = true;
      
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
      
      spinGlobe();
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [mapInitialized]);

  useEffect(() => {
    if (!mapInitialized) return;
    
    console.log("Setting up map event listeners");
    
    const handleLocationQuery = (e: Event) => {
      console.log("Map received location query event:", (e as CustomEvent).detail);
      const query = (e as CustomEvent).detail as LocationQuery;
      setCurrentQuery(query);
      
      // Only clear non-property markers to preserve property pins
      clearNonPropertyMarkers();
      clearFilteredLocations(false);
      
      let sourceLocs: LocationWithCoordinates[] = [];
      let targetLocs: LocationWithCoordinates[] = [];
      
      if (query.source === 'property') {
        sourceLocs = [...INDUSTRIAL_PROPERTIES];
      } else if (query.source === 'fedex') {
        sourceLocs = loadFedExLocations();
      } else if (query.source === 'starbucks') {
        sourceLocs = [...STARBUCKS_LOCATIONS];
        setStarbucksLoaded(true);
      }
      
      if (query.target) {
        if (query.target === 'property') {
          targetLocs = [...INDUSTRIAL_PROPERTIES];
        } else if (query.target === 'fedex') {
          targetLocs = loadFedExLocations();
        } else if (query.target === 'starbucks') {
          targetLocs = [...STARBUCKS_LOCATIONS];
          setStarbucksLoaded(true);
        }
        
        const { sourceLocations, targetLocations, connections } = findLocationsWithinRadius(
          sourceLocs,
          targetLocs,
          query.radius
        );
        
        console.log(`Found ${sourceLocations.length} ${query.source} locations within ${query.radius} miles of ${query.target}`);
        
        if (query.source === 'property') {
          if (preserveProperties) {
            // Keep existing property markers and add new ones
            addFilteredLocations(sourceLocations, 'property', '#3B82F6', '#1E40AF', true);
          } else {
            addFilteredLocations(sourceLocations, 'property', '#3B82F6', '#1E40AF');
          }
        } else if (query.source === 'fedex') {
          addFilteredLocations(sourceLocations, 'fedex', '#FFFFFF', '#FF6600');
        } else if (query.source === 'starbucks') {
          addFilteredLocations(sourceLocations, 'starbucks', '#00704A', '#ffffff');
        }
        
        if (query.target === 'property') {
          if (preserveProperties) {
            // Keep existing property markers and add new ones
            addFilteredLocations(targetLocations, 'property', '#3B82F6', '#1E40AF', true);
          } else {
            addFilteredLocations(targetLocations, 'property', '#3B82F6', '#1E40AF');
          }
        } else if (query.target === 'fedex') {
          addFilteredLocations(targetLocations, 'fedex', '#FFFFFF', '#FF6600');
        } else if (query.target === 'starbucks') {
          addFilteredLocations(targetLocations, 'starbucks', '#00704A', '#ffffff');
        }
        
        addConnectionLines(connections);
        
        const allCoordinates = [...sourceLocations, ...targetLocations].map(loc => loc.coordinates as [number, number]);
        fitMapToLocations(allCoordinates);
        
        if (query.source === 'property') {
          emitResultsUpdate(sourceLocations);
        }
      } else {
        if (query.source === 'property') {
          if (preserveProperties) {
            // Keep existing property markers and add new ones
            addFilteredLocations(sourceLocs, 'property', '#3B82F6', '#1E40AF', true);
          } else {
            addFilteredLocations(sourceLocs, 'property', '#3B82F6', '#1E40AF');
          }
          fitMapToLocations(sourceLocs.map(loc => loc.coordinates as [number, number]));
          emitResultsUpdate(sourceLocs);
        } else if (query.source === 'fedex') {
          addFilteredLocations(sourceLocs, 'fedex', '#FFFFFF', '#FF6600');
          fitMapToLocations(sourceLocs.map(loc => loc.coordinates as [number, number]));
        } else if (query.source === 'starbucks') {
          addFilteredLocations(sourceLocs, 'starbucks', '#00704A', '#ffffff');
          fitMapToLocations(sourceLocs.map(loc => loc.coordinates as [number, number]));
        }
      }
    };
    
    const handleComplexQuery = (e: Event) => {
      console.log("Map received complex query event:", (e as CustomEvent).detail);
      const query = (e as CustomEvent).detail as LocationQuery;
      
      if (!query.complexSpatialQuery) {
        console.error("Received complex query event but no complexSpatialQuery data");
        return;
      }
      
      setCurrentQuery(query);
      // Only clear non-property markers to preserve property pins
      clearNonPropertyMarkers();
      clearFilteredLocations(false);
      
      const { includeType, excludeType, includeRadius, excludeRadius } = query.complexSpatialQuery;
      
      console.log(`Complex spatial query: Find properties within ${includeRadius} miles of ${includeType} and at least ${excludeRadius} miles from ${excludeType}`);
      
      let includeLocations: LocationWithCoordinates[] = [];
      let excludeLocations: LocationWithCoordinates[] = [];
      
      if (includeType === 'fedex') {
        includeLocations = loadFedExLocations();
      } else if (includeType === 'starbucks') {
        includeLocations = [...STARBUCKS_LOCATIONS];
        setStarbucksLoaded(true);
      } else if (includeType === 'property') {
        includeLocations = [...INDUSTRIAL_PROPERTIES];
      }
      
      if (excludeType === 'fedex') {
        excludeLocations = loadFedExLocations();
      } else if (excludeType === 'starbucks') {
        excludeLocations = [...STARBUCKS_LOCATIONS];
        setStarbucksLoaded(true);
      } else if (excludeType === 'property') {
        excludeLocations = [...INDUSTRIAL_PROPERTIES];
      }
      
      const result = findLocationsWithComplexSpatialQuery(
        INDUSTRIAL_PROPERTIES,
        includeLocations,
        excludeLocations,
        includeRadius,
        excludeRadius
      );
      
      console.log(`Found ${result.resultLocations.length} properties that meet complex spatial criteria`);
      
      // Add property locations with preservation flag
      addFilteredLocations(result.resultLocations, 'property', '#3B82F6', '#1E40AF', preserveProperties);
      
      const connectedIncludeLocations = new Set<string>();
      result.includeConnections.forEach(conn => {
        const targetCoord = conn.target.toString();
        connectedIncludeLocations.add(targetCoord);
      });
      
      addConnectionLines(result.includeConnections);
      
      const visibleIncludeLocations = includeLocations.filter(loc => {
        const coord = getCoordinates(loc).toString();
        return connectedIncludeLocations.has(coord);
      });
      
      if (includeType === 'fedex') {
        addFilteredLocations(visibleIncludeLocations, 'fedex', '#FFFFFF', '#FF6600');
      } else if (includeType === 'starbucks') {
        addFilteredLocations(visibleIncludeLocations, 'starbucks', '#00704A', '#ffffff');
      }
      
      if (result.excludeConnections && result.excludeConnections.length > 0) {
        console.log(`Showing ${result.excludeConnections.length} exclude connections for debugging`);
        addExcludeConnectionLines(result.excludeConnections);
      }
      
      const allCoordinates = [
        ...result.resultLocations.map(loc => loc.coordinates as [number, number]),
        ...result.includeConnections.map(conn => conn.target),
      ];
      
      fitMapToLocations(allCoordinates);
      
      emitResultsUpdate(result.resultLocations);
    };
    
    const handleMultiTargetQuery = (e: Event) => {
      console.log("Map received multi-target query event:", (e as CustomEvent).detail);
      const query = (e as CustomEvent).detail as LocationQuery;
      
      if (!query.multiTargetQuery) {
        console.error("Received multi-target query event but no multiTargetQuery data");
        return;
      }
      
      setCurrentQuery(query);
      // Only clear non-property markers to preserve property pins
      clearNonPropertyMarkers();
      clearFilteredLocations(false);
      
      const { targetTypes } = query.multiTargetQuery;
      
      const targetDataArray = targetTypes.map(targetData => {
        let locations: LocationWithCoordinates[] = [];
        
        if (targetData.type === 'fedex') {
          locations = loadFedExLocations();
        } else if (targetData.type === 'starbucks') {
          locations = [...STARBUCKS_LOCATIONS];
          setStarbucksLoaded(true);
        } else if (targetData.type === 'property') {
          locations = [...INDUSTRIAL_PROPERTIES];
        }
        
        return {
          type: targetData.type,
          locations,
          radius: targetData.radius
        };
      });
      
      const result = findPropertiesWithMultiTargetProximity(
        INDUSTRIAL_PROPERTIES,
        targetDataArray
      );
      
      // Add property locations with preservation flag
      addFilteredLocations(result.resultProperties, 'property', '#3B82F6', '#1E40AF', preserveProperties);
      
      const connectedTargets = new Map<LocationSourceTarget, Set<string>>();
      
      targetTypes.forEach(targetData => {
        connectedTargets.set(targetData.type, new Set<string>());
      });
      
      result.connections.forEach(conn => {
        const targetCoord = conn.target.toString();
        const targetType = conn.targetType;
        
        const targetSet = connectedTargets.get(targetType);
        if (targetSet) {
          targetSet.add(targetCoord);
        }
      });
      
      addConnectionLines(result.connections);
      
      targetDataArray.forEach(targetData => {
        const targetSet = connectedTargets.get(targetData.type);
        
        if (targetSet) {
          const connectedLocations = targetData.locations.filter(loc => {
            const coord = getCoordinates(loc).toString();
            return targetSet.has(coord);
          });
          
          if (targetData.type === 'fedex') {
            addFilteredLocations(connectedLocations, 'fedex', '#FFFFFF', '#FF6600');
          } else if (targetData.type === 'starbucks') {
            addFilteredLocations(connectedLocations, 'starbucks', '#00704A', '#ffffff');
          } else if (targetData.type === 'property') {
            // Add property locations with preservation flag
            addFilteredLocations(connectedLocations, 'property', '#3B82F6', '#1E40AF', preserveProperties);
          }
        }
      });
      
      const allCoordinates = [
        ...result.resultProperties.map(loc => loc.coordinates as [number, number]),
        ...result.connections.map(conn => conn.target)
      ];
      
      fitMapToLocations(allCoordinates);
      
      emitResultsUpdate(result.resultProperties);
    };
    
    const handleDynamicQuery = (e: Event) => {
      console.log("Map received dynamic query event:", (e as CustomEvent).detail);
      const query = (e as CustomEvent).detail as LocationQuery;
      
      if (!query.dynamicQuery) {
        console.error("Received dynamic query event but no dynamicQuery data");
        return;
      }
      
      setCurrentQuery(query);
      // Only clear non-property markers to preserve property pins
      clearNonPropertyMarkers();
      clearFilteredLocations(false);
      
      const { primaryType, targetTypes } = query.dynamicQuery;
      
      const targetTypeConfig: {
        [key in LocationSourceTarget]?: {
          locations: LocationWithCoordinates[];
          radius: number;
        };
      } = {};
      
      Object.entries(targetTypes).forEach(([typeStr, config]) => {
        const type = typeStr as LocationSourceTarget;
        
        if (type === 'fedex') {
          targetTypeConfig[type] = {
            locations: loadFedExLocations(),
            radius: config.radius
          };
        } else if (type === 'starbucks') {
          targetTypeConfig[type] = {
            locations: [...STARBUCKS_LOCATIONS],
            radius: config.radius
          };
          setStarbucksLoaded(true);
        } else if (type === 'property') {
          targetTypeConfig[type] = {
            locations: [...INDUSTRIAL_PROPERTIES],
            radius: config.radius
          };
        }
      });
      
      let primaryLocations: LocationWithCoordinates[] = [];
      
      if (primaryType === 'property') {
        primaryLocations = [...INDUSTRIAL_PROPERTIES];
      } else if (primaryType === 'fedex') {
        primaryLocations = loadFedExLocations();
      } else if (primaryType === 'starbucks') {
        primaryLocations = [...STARBUCKS_LOCATIONS];
        setStarbucksLoaded(true);
      }
      
      const result = findLocationsWithTripleTypeProximity(
        primaryLocations,
        primaryLocations,
        targetTypeConfig
      );
      
      if (primaryType === 'property') {
        // Add property locations with preservation flag
        addFilteredLocations(result.resultLocations, 'property', '#3B82F6', '#1E40AF', preserveProperties);
      } else if (primaryType === 'fedex') {
        addFilteredLocations(result.resultLocations, 'fedex', '#FFFFFF', '#FF6600');
      } else if (primaryType === 'starbucks') {
        addFilteredLocations(result.resultLocations, 'starbucks', '#00704A', '#ffffff');
      }
      
      const connectedTargets = new Map<LocationSourceTarget, Set<string>>();
      
      Object.keys(targetTypes).forEach(typeStr => {
        connectedTargets.set(typeStr as LocationSourceTarget, new Set<string>());
      });
      
      result.connections.forEach(conn => {
        const targetCoord = conn.target.toString();
        const targetType = conn.targetType;
        
        const targetSet = connectedTargets.get(targetType);
        if (targetSet) {
          targetSet.add(targetCoord);
        }
      });
      
      addConnectionLines(result.connections);
      
      Object.entries(targetTypeConfig).forEach(([typeStr, config]) => {
        const targetType = typeStr as LocationSourceTarget;
        const targetSet = connectedTargets.get(targetType);
        
        if (targetSet && targetType !== primaryType) {
          const connectedLocations = config.locations.filter(loc => {
            const coord = getCoordinates(loc).toString();
            return targetSet.has(coord);
          });
          
          if (targetType === 'fedex') {
            addFilteredLocations(connectedLocations, 'fedex', '#FFFFFF', '#FF6600');
          } else if (targetType === 'starbucks') {
            addFilteredLocations(connectedLocations, 'starbucks', '#00704A', '#ffffff');
          } else if (targetType === 'property') {
            // Add property locations with preservation flag
            addFilteredLocations(connectedLocations, 'property', '#3B82F6', '#1E40AF', preserveProperties);
          }
        }
      });
      
      const allCoordinates = [
        ...result.resultLocations.map(loc => loc.coordinates as [number, number]),
        ...result.connections.map(conn => conn.target)
      ];
      
      fitMapToLocations(allCoordinates);
      
      if (primaryType === 'property') {
        emitResultsUpdate(result.resultLocations);
      }
    };
    
    window.addEventListener(LOCATION_QUERY_EVENT, handleLocationQuery);
    window.addEventListener(COMPLEX_QUERY_EVENT, handleComplexQuery);
    window.addEventListener(MULTI_TARGET_QUERY_EVENT, handleMultiTargetQuery);
    window.addEventListener(DYNAMIC_QUERY_EVENT, handleDynamicQuery);
    
    return () => {
      window.removeEventListener(LOCATION_QUERY_EVENT, handleLocationQuery);
      window.removeEventListener(COMPLEX_QUERY_EVENT, handleComplexQuery);
      window.removeEventListener(MULTI_TARGET_QUERY_EVENT, handleMultiTargetQuery);
      window.removeEventListener(DYNAMIC_QUERY_EVENT, handleDynamicQuery);
    };
  }, [mapInitialized, visibleLocationTypes, preserveProperties]);

  const loadFedExLocations = () => {
    if (fedExLoaded) {
      console.log("FedEx locations already loaded");
      return fedExLocations;
    }
    
    console.log("Loading FedEx locations dynamically");
    const locations = getFedExLocations();
    setFedExLocations(locations);
    setFedExLoaded(true);
    return locations;
  };

  const addFedExLocations = () => {
    if (!map.current) {
      console.error("Map not initialized when adding FedEx locations");
      return [];
    }
    
    const locations = loadFedExLocations();
    
    console.log("Adding FedEx locations markers");
    const markers: mapboxgl.Marker[] = [];
    
    locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'fedex-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#FFFFFF';
      el.style.backgroundImage = "url('/fedex-logo.png')";
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.border = '2px solid #FF6600';
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat(location.coordinates as [number, number])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${location.name}</h3><p>${location.description}</p>`)
        )
        .addTo(map.current);
      
      markers.push(marker);
    });
    
    setActiveMarkers(prev => [...prev, ...markers]);
    return markers;
  };
  
  const addStarbucksLocations = () => {
    if (!map.current) {
      console.error("Map not initialized when adding Starbucks locations");
      return [];
    }
    
    if (!starbucksLoaded) {
      setStarbucksLoaded(true);
    }
    
    console.log("Adding Starbucks locations markers");
    const markers: mapboxgl.Marker[] = [];
    
    STARBUCKS_LOCATIONS.forEach(location => {
      const el = document.createElement('div');
      el.className = 'starbucks-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#FFFFFF';
      el.style.backgroundImage = "url('/starbucks-logo.png')";
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.border = '2px solid #00704A';
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat(location.coordinates as [number, number])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${location.name}</h3><p>${location.description}</p>`)
        )
        .addTo(map.current);
      
      markers.push(marker);
    });
    
    setActiveMarkers(prev => [...prev, ...markers]);
    return markers;
  };

  // New function to clear only non-property markers
  const clearNonPropertyMarkers = () => {
    console.log("Clearing only non-property markers");
    
    const propertyMarkers: mapboxgl.Marker[] = [];
    const nonPropertyMarkers: mapboxgl.Marker[] = [];
    
    activeMarkers.forEach(marker => {
      const element = marker.getElement();
      if (element.className.includes('property-marker')) {
        propertyMarkers.push(marker);
      } else {
        nonPropertyMarkers.push(marker);
        marker.remove();
      }
    });
    
    console.log(`Preserving ${propertyMarkers.length} property markers`);
    setActiveMarkers(propertyMarkers);
    
    // Update visible location types
    const newVisibleTypes = [...visibleLocationTypes];
    if (newVisibleTypes.includes('fedex')) {
      newVisibleTypes.splice(newVisibleTypes.indexOf('fedex'), 1);
    }
    if (newVisibleTypes.includes('starbucks')) {
      newVisibleTypes.splice(newVisibleTypes.indexOf('starbucks'), 1);
    }
    setVisibleLocationTypes(newVisibleTypes);
  };

  const addFilteredLocations = (
    locations: LocationWithCoordinates[],
    locationType: 'property' | 'fedex' | 'starbucks',
    backgroundColor: string,
    borderColor: string,
    preserveExisting: boolean = false
  ) => {
    if (!map.current) {
      console.error("Map not initialized when adding filtered locations");
      return;
    }
    
    console.log(`Adding ${locations.length} ${locationType} locations (preserveExisting: ${preserveExisting})`);
    const markers: mapboxgl.Marker[] = [];
    
    // If preserving existing markers and this is a property, skip locations that are already on the map
    const existingLocationCoords = new Set<string>();
    
    if (preserveExisting && locationType === 'property') {
      activeMarkers.forEach(marker => {
        const element = marker.getElement();
        if (element.className.includes('property-marker')) {
          const lngLat = marker.getLngLat();
          existingLocationCoords.add(`${lngLat.lng},${lngLat.lat}`);
        }
      });
      
      console.log(`Already displaying ${existingLocationCoords.size} property locations`);
    }
    
    setVisibleLocationTypes(prev => {
      if (!prev.includes(locationType)) {
        return [...prev, locationType];
      }
      return prev;
    });
    
    locations.forEach(location => {
      // Skip if this location is already displayed and we're preserving existing markers
      if (preserveExisting && locationType === 'property') {
        const locationCoord = location.coordinates.toString();
        if (existingLocationCoords.has(locationCoord)) {
          console.log(`Skipping already displayed property at ${locationCoord}`);
          return;
        }
      }
      
      const el = document.createElement('div');
      el.className = `${locationType}-marker`;
      
      if (locationType === 'fedex') {
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#FFFFFF';
        el.style.backgroundImage = "url('/fedex-logo.png')";
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.border = '2px solid #FF6600';
      } else if (locationType === 'starbucks') {
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#FFFFFF';
        el.style.backgroundImage = "url('/starbucks-logo.png')";
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.border = '2px solid #00704A';
      } else {
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = backgroundColor;
        el.style.border = `2px solid ${borderColor}`;
      }
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat(location.coordinates as [number, number])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${location.name}</h3><p>${location.description}</p>`)
        )
        .addTo(map.current);
      
      markers.push(marker);
    });
    
    setActiveMarkers(prev => [...prev, ...markers]);
    
    if (locationType === 'property' && !preserveExisting) {
      setDisplayedProperties(locations);
    } else if (locationType === 'property' && preserveExisting) {
      setDisplayedProperties(prev => {
        // Combine existing and new properties, avoiding duplicates
        const existingIds = new Set(prev.map(p => p.name));
        const newProps = locations.filter(p => !existingIds.has(p.name));
        return [...prev, ...newProps];
      });
    }
  };

  const clearAllMarkers = () => {
    console.log("Clearing all markers");
    
    activeMarkers.forEach(marker => marker.remove());
    setActiveMarkers([]);
    setDisplayedProperties([]);
    setVisibleLocationTypes([]);
  };

  const clearFilteredLocations = (clearProperties: boolean = true) => {
    if (!map.current) return;
    
    console.log(`Clearing filtered locations and connection lines (clearProperties: ${clearProperties})`);
    
    checkAndRemoveLayers(map.current, activeLayers, 'connections');
    checkAndRemoveLayers(map.current, activeLayers, 'exclude-connections');
    setActiveLayers([]);
    
    if (clearProperties) {
      clearAllMarkers();
    }
  };

  const addConnectionLines = (
    connections: Array<{ 
      source: [number, number]; 
      target: [number, number]; 
      distance: number;
      targetType?: LocationSourceTarget;
    }>
  ) => {
    if (!map.current || connections.length === 0) return;
    
    console.log(`Adding ${connections.length} connection lines`);
    
    const layerId = 'connections-layer';
    const sourceId = 'connections';
    
    checkAndRemoveLayers(map.current, [...activeLayers, layerId], sourceId);
    
    const features = connections.map(conn => {
      const targetType = conn.targetType || 'default';
      
      let lineColor = '#4B5563';
      
      if (targetType === 'fedex') {
        lineColor = '#FF6600';
      } else if (targetType === 'starbucks') {
        lineColor = '#00704A';
      } else if (targetType === 'property') {
        lineColor = '#3B82F6';
      }
      
      return {
        type: 'Feature' as const,
        properties: {
          distance: conn.distance,
          description: `Distance: ${conn.distance.toFixed(2)} miles`,
          targetType,
          color: lineColor
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [conn.source, conn.target]
        }
      };
    });
    
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });
    
    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-dasharray': [2, 1]
      }
    });
    
    setActiveLayers(prev => [...prev, layerId]);
  };

  const addExcludeConnectionLines = (
    connections: Array<{ 
      source: [number, number]; 
      target: [number, number]; 
      distance: number;
    }>
  ) => {
    if (!map.current || connections.length === 0) return;
    
    console.log(`Adding ${connections.length} exclude connection lines`);
    
    const layerId = 'exclude-connections-layer';
    const sourceId = 'exclude-connections';
    
    checkAndRemoveLayers(map.current, [...activeLayers, layerId], sourceId);
    
    const features = connections.map(conn => ({
      type: 'Feature' as const,
      properties: {
        distance: conn.distance,
        description: `Excluded: ${conn.distance.toFixed(2)} miles`
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: [conn.source, conn.target]
      }
    }));
    
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });
    
    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#EF4444',
        'line-width': 1.5,
        'line-dasharray': [1, 2]
      }
    });
    
    setActiveLayers(prev => [...prev, layerId]);
  };

  const fitMapToLocations = (coordinates: [number, number][]) => {
    if (!map.current || coordinates.length === 0) {
      console.warn("Cannot fit map to locations: Map not initialized or coordinates empty");
      return;
    }
    
    console.log(`Fitting map to ${coordinates.length} coordinates`);
    
    try {
      const bounds = coordinates.reduce((bbox, coord) => {
        return bbox.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    } catch (error) {
      console.error("Error fitting map to coordinates:", error);
    }
  };

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default Map;
