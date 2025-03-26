import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LOCATION_QUERY_EVENT, LocationQuery, API_QUERY_EVENT, COMPLEX_QUERY_EVENT } from './Chatbot';
import { findLocationsWithinRadius, LocationWithCoordinates, checkAndRemoveLayers } from '@/utils/mapUtils';
import { STARBUCKS_LOCATIONS } from '@/data/starbucksLocations';

const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoicGF2YW4wODk0IiwiYSI6ImNtOG96eTFocTA1dXoyanBzcXhuYmY3b2kifQ.hxIlEcLal8KBl_1005RHeA';

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
      el.style.border = '2px solid #FF6600';
      el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.25)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      
      el.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 960 282" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M364 156H273V107H364V156Z" fill="#FF5900"/>
          <path d="M364 229H273V180H364V229Z" fill="#FF5900"/>
          <path d="M720 229H629V156H720V229Z" fill="#FF5900"/>
          <path d="M720 107H629V34H720V107Z" fill="#FF5900"/>
          <path d="M273 34H53V229H149V180H273V229H438V34H273V107H149V34H273Z" fill="#4D148C"/>
          <path d="M546 229H438V34H537V83H485V132H537V180H485V229H546Z" fill="#4D148C"/>
          <path d="M629 34V107H582L629 34Z" fill="#FF5900"/>
          <path d="M798 229H720V34H798L845 107V34H906V229H845V156L798 229Z" fill="#FF5900"/>
        </svg>
      `;
      
      const popup = new mapboxgl.Popup({ 
        offset: [0, 0],
        closeButton: false,
        closeOnClick: true
      }).setHTML(`
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 5px; color: #4D148C;">${location.name}</h3>
          <p style="margin: 0;">${location.description}</p>
        </div>
      `);
      
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat(location.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current);
      
      markers.push(marker);
    });
    
    setActiveMarkers(prev => [...prev, ...markers]);
    setVisibleLocationTypes(prev => prev.includes('fedex') ? prev : [...prev, 'fedex']);
    emitMapContextUpdate({
      visibleLocations: [...visibleLocationTypes, 'fedex'].filter((v, i, a) => a.indexOf(v) === i)
    });
    return locations;
  };

  const addStarbucksLocations = () => {
    if (!map.current) {
      console.error("Map not initialized when adding Starbucks locations");
      return [];
    }
    
    console.log("Adding Starbucks locations markers");
    const markers: mapboxgl.Marker[] = [];
    
    STARBUCKS_LOCATIONS.forEach(location => {
      const el = document.createElement('div');
      el.className = 'starbucks-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#00704A';
      el.style.border = '2px solid #ffffff';
      el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.25)';
      el.style.cursor = 'pointer';
      
      const iconContainer = document.createElement('div');
      iconContainer.style.width = '100%';
      iconContainer.style.height = '100%';
      iconContainer.style.display = 'flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.justifyContent = 'center';
      iconContainer.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
          <line x1="6" y1="2" x2="6" y2="4"></line>
          <line x1="10" y1="2" x2="10" y2="4"></line>
          <line x1="14" y1="2" x2="14" y2="4"></line>
        </svg>
      `;
      el.appendChild(iconContainer);
      
      const popup = new mapboxgl.Popup({ 
        offset: [0, 0],
        closeButton: false,
        closeOnClick: true
      }).setHTML(`
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 5px; color: #00704A;">${location.name}</h3>
          <p style="margin: 0;">${location.description}</p>
        </div>
      `);
      
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat(location.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current);
      
      markers.push(marker);
    });
    
    setActiveMarkers(prev => [...prev, ...markers]);
    setStarbucksLoaded(true);
    setVisibleLocationTypes(prev => prev.includes('starbucks') ? prev : [...prev, 'starbucks']);
    emitMapContextUpdate({
      visibleLocations: [...visibleLocationTypes, 'starbucks'].filter((v, i, a) => a.indexOf(v) === i)
    });
    return STARBUCKS_LOCATIONS;
  };

  const addFilteredLocations = (locations: LocationWithCoordinates[], locationType: string, bgColor: string, borderColor: string) => {
    if (!map.current) {
      console.error("Map not initialized when adding filtered locations");
      return;
    }
    
    console.log(`Adding ${locations.length} filtered ${locationType} locations`);
    const markers: mapboxgl.Marker[] = [];
    
    locations.forEach(location => {
      let el;
      
      if (locationType === 'property') {
        el = document.createElement('div');
        el.className = `${locationType}-marker`;
        el.style.width = '14px';
        el.style.height = '20px';
        el.style.position = 'relative';
        el.style.cursor = 'pointer';
        
        const pinShape = document.createElement('div');
        pinShape.style.width = '14px';
        pinShape.style.height = '14px';
        pinShape.style.borderRadius = '50% 50% 50% 0';
        pinShape.style.background = bgColor;
        pinShape.style.transform = 'rotate(-45deg)';
        pinShape.style.position = 'absolute';
        pinShape.style.top = '0';
        pinShape.style.left = '0';
        pinShape.style.border = `2px solid ${borderColor}`;
        pinShape.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        const pinCenter = document.createElement('div');
        pinCenter.style.width = '4px';
        pinCenter.style.height = '4px';
        pinCenter.style.background = borderColor;
        pinCenter.style.borderRadius = '50%';
        pinCenter.style.position = 'absolute';
        pinCenter.style.top = '5px';
        pinCenter.style.left = '5px';
        
        pinShape.appendChild(pinCenter);
        el.appendChild(pinShape);
      } else {
        el = document.createElement('div');
        el.className = `${locationType}-marker`;
        el.style.width = locationType === 'property' ? '28px' : '24px';
        el.style.height = locationType === 'property' ? '28px' : '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = bgColor;
        el.style.border = `2px solid ${borderColor}`;
        el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.25)';
        el.style.cursor = 'pointer';
        
        if (locationType === 'property') {
          const iconContainer = document.createElement('div');
          iconContainer.style.width = '100%';
          iconContainer.style.height = '100%';
          iconContainer.style.display = 'flex';
          iconContainer.style.alignItems = 'center';
          iconContainer.style.justifyContent = 'center';
          iconContainer.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
            </svg>
          `;
          el.appendChild(iconContainer);
        }
      }
      
      const popup = new mapboxgl.Popup({ 
        offset: locationType === 'property' ? [0, -10] : [0, 0],
        closeButton: false,
        closeOnClick: true
      }).setHTML(`
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 5px;">${location.name}</h3>
          <p style="margin: 0;">${location.description}</p>
        </div>
      `);
      
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: locationType === 'property' ? 'bottom' : 'center',
        pitchAlignment: 'viewport',
        rotationAlignment: 'viewport'
      })
        .setLngLat(location.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current);
      
      markers.push(marker);
    });
    
    setActiveMarkers(prev => [...prev, ...markers]);
    setDisplayedProperties(prev => 
      locationType === 'property' ? [...locations] : prev
    );
  };

  const clearAllMarkers = () => {
    console.log("Clearing all markers");
    activeMarkers.forEach(marker => marker.remove());
    setActiveMarkers([]);
  };

  const clearFilteredLocations = () => {
    if (!map.current) return;
    
    const lineLayerIds = ['connections-layer'];
    checkAndRemoveLayers(map.current, lineLayerIds, 'connections');
    
    setActiveLayers([]);
    setDisplayedProperties([]);
  };

  const addConnectionLines = (connections: Array<{ source: [number, number]; target: [number, number]; distance: number }>) => {
    if (!map.current || connections.length === 0) return;
    
    console.log(`Adding ${connections.length} connection lines to map`);
    
    const geojson = {
      type: 'FeatureCollection',
      features: connections.map(conn => ({
        type: 'Feature',
        properties: {
          distance: conn.distance
        },
        geometry: {
          type: 'LineString',
          coordinates: [conn.source, conn.target]
        }
      }))
    };
    
    const lineLayerIds = ['connections-layer'];
    checkAndRemoveLayers(map.current, lineLayerIds, 'connections');
    
    map.current.addSource('connections', {
      type: 'geojson',
      data: geojson as any
    });
    
    map.current.addLayer({
      id: 'connections-layer',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#555',
        'line-width': 1,
        'line-opacity': 0.6,
        'line-dasharray': [2, 1]
      }
    });
    
    setActiveLayers(prev => [...prev, 'connections-layer']);
  };

  const fitMapToLocations = (coordinates: [number, number][]) => {
    if (!map.current || coordinates.length === 0) return;
    
    console.log("Fitting map to show all filtered locations");
    
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 12
    });
  };

  const handleLocationQuery = (event: CustomEvent<LocationQuery>) => {
    const query = event.detail;
    console.log("Location query received in Map component:", query);
    setCurrentQuery(query);
    
    if (!map.current) {
      console.error("Map not initialized when handling location query");
      return;
    }
    
    clearAllMarkers();
    clearFilteredLocations();
    setVisibleLocationTypes([]);
    
    const isPropertyInDallas = 
      query.source === 'property' && 
      query.isDallasQuery === true;
    
    const isFedExQuery = query.source === 'fedex' || query.target === 'fedex';
    const isStarbucksQuery = query.source === 'starbucks' || query.target === 'starbucks';
    
    if (isPropertyInDallas) {
      console.log("Showing Dallas property locations");
      addFilteredLocations(INDUSTRIAL_PROPERTIES, 'property', '#333', '#fff');
      fitMapToLocations(INDUSTRIAL_PROPERTIES.map(loc => loc.coordinates as [number, number]));
      emitResultsUpdate(INDUSTRIAL_PROPERTIES);
      setVisibleLocationTypes(['property']);
      emitMapContextUpdate({
        visibleLocations: ['property'],
        query,
        properties: INDUSTRIAL_PROPERTIES
      });
      return;
    }
    
    if (!isFedExQuery && !isStarbucksQuery && query.source === 'property' && !isPropertyInDallas) {
      console.log("Non-Dallas property query, not showing property pins");
      emitResultsUpdate([]);
      emitMapContextUpdate({
        visibleLocations: [],
        query
      });
      return;
    }
    
    let sourceData: LocationWithCoordinates[];
    let targetData: LocationWithCoordinates[] | null = null;
    
    if (query.source === 'fedex') {
      sourceData = loadFedExLocations();
      setVisibleLocationTypes(prev => [...prev, 'fedex']);
      if (query.target === 'property') {
        targetData = INDUSTRIAL_PROPERTIES;
        setVisibleLocationTypes(prev => [...prev, 'property']);
      } else if (query.target === 'starbucks') {
        targetData = STARBUCKS_LOCATIONS;
        setVisibleLocationTypes(prev => [...prev, 'starbucks']);
      }
    } else if (query.source === 'starbucks') {
      sourceData = STARBUCKS_LOCATIONS;
      setVisibleLocationTypes(prev => [...prev, 'starbucks']);
      if (query.target === 'property') {
        targetData = INDUSTRIAL_PROPERTIES;
        setVisibleLocationTypes(prev => [...prev, 'property']);
      } else if (query.target === 'fedex') {
        targetData = loadFedExLocations();
        setVisibleLocationTypes(prev => [...prev, 'fedex']);
      }
    } else {
      sourceData = INDUSTRIAL_PROPERTIES;
      setVisibleLocationTypes(prev => [...prev, 'property']);
      if (query.target === 'fedex') {
        targetData = loadFedExLocations();
        setVisibleLocationTypes(prev => [...prev, 'fedex']);
      } else if (query.target === 'starbucks') {
        targetData = STARBUCKS_LOCATIONS;
        setVisibleLocationTypes(prev => [...prev, 'starbucks']);
      }
    }
    
    if (query.source === 'starbucks' && !query.target) {
      console.log("Showing only Starbucks locations with no filtering");
      const starbucksLocations = addStarbucksLocations();
      fitMapToLocations(starbucksLocations.map(loc => loc.coordinates as [number, number]));
      emitResultsUpdate(starbucksLocations);
      setVisibleLocationTypes(['starbucks']);
      emitMapContextUpdate({
        visibleLocations: ['starbucks'],
        query,
        properties: starbucksLocations
      });
      return;
    }
    
    if (query.source === 'fedex' && !query.target) {
      console.log("Showing only FedEx locations with no filtering");
      const fedExLocations = addFedExLocations();
      fitMapToLocations(fedExLocations.map(loc => loc.coordinates as [number, number]));
      emitResultsUpdate(fedExLocations);
      setVisibleLocationTypes(['fedex']);
      emitMapContextUpdate({
        visibleLocations: ['fedex'],
        query,
        properties: fedExLocations
      });
      return;
    }
    
    if (targetData) {
      console.log(`Finding ${query.source} locations within ${query.radius} miles of ${query.target} locations`);
      
      const { sourceLocations, targetLocations, connections } = findLocationsWithinRadius(
        sourceData,
        targetData,
        query.radius
      );
      
      if (connections.length === 0) {
        console.log("No locations found within the radius");
        emitResultsUpdate([]);
        emitMapContextUpdate({
          visibleLocations: [],
          query
        });
        return;
      }
      
      const getMarkerColors = (locationType: string) => {
        switch(locationType) {
          case 'fedex':
            return { bg: '#4D148C', border: '#FF6600' };
          case 'starbucks':
            return { bg: '#00704A', border: '#ffffff' };
          default:
            return { bg: '#E53935', border: '#fff' };
        }
      };
      
      const sourceColors = getMarkerColors(query.source);
      const targetColors = query.target ? getMarkerColors(query.target) : { bg: '#333', border: '#fff' };
      
      addFilteredLocations(sourceLocations, query.source, sourceColors.bg, sourceColors.border);
      
      if (targetLocations.length > 0 && query.target) {
        addFilteredLocations(targetLocations, query.target, targetColors.bg, targetColors.border);
      }
      
      addConnectionLines(connections);
      
      fitMapToLocations([...sourceLocations, ...targetLocations].map(loc => {
        return Array.isArray(loc.coordinates) && loc.coordinates.length >= 2 
          ? [loc.coordinates[0], loc.coordinates[1]] as [number, number]
          : [0, 0] as [number, number];
      }));
      
      emitResultsUpdate([...sourceLocations, ...targetLocations]);
      emitMapContextUpdate({
        visibleLocations: visibleLocationTypes,
        query,
        properties: [...sourceLocations, ...targetLocations]
      });
    }
  };

  const handleComplexQuery = (event: CustomEvent<LocationQuery>) => {
    const query = event.detail;
    console.log("Complex query received in Map component:", query);
    
    if (!map.current || !query.complexQuery) {
      console.error("Map not initialized or invalid complex query");
      return;
    }
    
    clearAllMarkers();
    clearFilteredLocations();
    
    const newVisibleTypes: string[] = [];
    setVisibleLocationTypes(newVisibleTypes);
    
    const { includeType, excludeType, includeRadius, excludeRadius } = query.complexQuery;
    
    console.log(`Processing complex spatial query: properties within ${includeRadius} miles of ${includeType} and ${excludeRadius} miles away from ${excludeType}`);
    
    let includeLocations: LocationWithCoordinates[] = [];
    let excludeLocations: LocationWithCoordinates[] = [];
    
    if (includeType === 'fedex') {
      includeLocations = loadFedExLocations();
      newVisibleTypes.push('fedex');
    } else if (includeType === 'starbucks') {
      includeLocations = STARBUCKS_LOCATIONS;
      newVisibleTypes.push('starbucks');
    }
    
    if (excludeType === 'fedex') {
      excludeLocations = loadFedExLocations();
      newVisibleTypes.push('fedex');
    } else if (excludeType === 'starbucks') {
      excludeLocations = STARBUCKS_LOCATIONS;
      newVisibleTypes.push('starbucks');
    }
    
    const properties = INDUSTRIAL_PROPERTIES;
    
    const getMarkerColors = (locationType: string) => {
      switch(locationType) {
        case 'fedex':
          return { bg: '#4D148C', border: '#FF6600' };
        case 'starbucks':
          return { bg: '#00704A', border: '#ffffff' };
        default:
          return { bg: '#E53935', border: '#fff' };
      }
    };
    
    const includeColors = getMarkerColors(includeType);
    const excludeColors = getMarkerColors(excludeType);
    
    addFilteredLocations(includeLocations, includeType, includeColors.bg, includeColors.border);
    
    addFilteredLocations(excludeLocations, excludeType, excludeColors.bg, excludeColors.border);
    
    setVisibleLocationTypes(newVisibleTypes);
    
    const withinIncludeRadius = findLocationsWithinRadius(
      properties,
      includeLocations,
      includeRadius
    ).sourceLocations;
    
    const withinExcludeRadius = findLocationsWithinRadius(
      properties,
      excludeLocations,
      excludeRadius
    ).sourceLocations;
    
    const filteredProperties = withinIncludeRadius.filter(prop => 
      !withinExcludeRadius.some(excluded => 
        excluded.name === prop.name
      )
    );
    
    if (filteredProperties.length > 0) {
      console.log(`Found ${filteredProperties.length} properties that match complex criteria`);
      
      addFilteredLocations(filteredProperties, 'property', '#E53935', '#fff');
      newVisibleTypes.push('property');
      setVisibleLocationTypes([...newVisibleTypes, 'property']);
      
      const connections = findLocationsWithinRadius(
        filteredProperties,
        includeLocations,
        includeRadius
      ).connections;
      
      addConnectionLines(connections);
      
      const allRelevantLocations = [
        ...filteredProperties,
        ...includeLocations,
        ...excludeLocations
      ];
      
      fitMapToLocations(allRelevantLocations.map(loc => {
        return Array.isArray(loc.coordinates) && loc.coordinates.length >= 2 
          ? [loc.coordinates[0], loc.coordinates[1]] as [number, number]
          : [0, 0] as [number, number];
      }));
      
      emitResultsUpdate(filteredProperties);
      emitMapContextUpdate({
        visibleLocations: [...newVisibleTypes, 'property'],
        query,
        properties: filteredProperties
      });
    } else {
      console.log("No properties found that match complex criteria");
      emitResultsUpdate([]);
      emitMapContextUpdate({
        visibleLocations: newVisibleTypes,
        query
      });
    }
  };

  useEffect(() => {
    console.log("Setting up Map event listeners");
    
    window.addEventListener(LOCATION_QUERY_EVENT, handleLocationQuery as EventListener);
    window.addEventListener(COMPLEX_QUERY_EVENT, handleComplexQuery as EventListener);
    
    return () => {
      console.log("Removing Map event listeners");
      window.removeEventListener(LOCATION_QUERY_EVENT, handleLocationQuery as EventListener);
      window.removeEventListener(COMPLEX_QUERY_EVENT, handleComplexQuery as EventListener);
    };
  }, []);

  return (
    <div ref={mapContainer} className={`w-full h-full ${className}`}></div>
  );
};

export default Map;
