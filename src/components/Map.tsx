
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Using the provided Mapbox token
const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoicGF2YW4wODk0IiwiYSI6ImNtOG96eTFocTA1dXoyanBzcXhuYmY3b2kifQ.hxIlEcLal8KBl_1005RHeA';

// Dallas area industrial properties
const INDUSTRIAL_PROPERTIES = [
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

interface MapProps {
  className?: string;
}

const Map: React.FC<MapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState<boolean>(false);

  const initializeMap = () => {
    if (!mapContainer.current || mapInitialized) return;

    try {
      // Initialize map
      mapboxgl.accessToken = DEFAULT_MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        projection: 'globe',
        zoom: 9, // Higher zoom to focus on Dallas area
        center: [-96.7970, 32.7767], // Dallas, TX coordinates
        pitch: 45,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Disable scroll zoom for smoother experience
      map.current.scrollZoom.disable();

      // Add atmosphere and fog effects
      map.current.on('style.load', () => {
        map.current?.setFog({
          color: 'rgb(255, 255, 255)',
          'high-color': 'rgb(200, 200, 225)',
          'horizon-blend': 0.2,
        });

        // Add industrial properties as markers after the map style has loaded
        addIndustrialProperties();
      });

      // Rotation animation settings
      const secondsPerRevolution = 240;
      const maxSpinZoom = 5;
      const slowSpinZoom = 3;
      let userInteracting = false;
      let spinEnabled = true;

      // Spin globe function
      function spinGlobe() {
        if (!map.current) return;
        
        const zoom = map.current.getZoom();
        if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
          let distancePerSecond = 360 / secondsPerRevolution;
          if (zoom > slowSpinZoom) {
            const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= zoomDif;
          }
          const center = map.current.getCenter();
          center.lng -= distancePerSecond;
          map.current.easeTo({ center, duration: 1000, easing: (n) => n });
        }
      }

      // Event listeners for interaction
      map.current.on('mousedown', () => {
        userInteracting = true;
      });
      
      map.current.on('dragstart', () => {
        userInteracting = true;
      });
      
      map.current.on('mouseup', () => {
        userInteracting = false;
        spinGlobe();
      });
      
      map.current.on('touchend', () => {
        userInteracting = false;
        spinGlobe();
      });

      map.current.on('moveend', () => {
        spinGlobe();
      });

      // Start the globe spinning
      spinGlobe();
      
      setMapInitialized(true);
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  // Function to add industrial property markers to the map
  const addIndustrialProperties = () => {
    if (!map.current) return;

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
      new mapboxgl.Marker(el)
        .setLngLat(property.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current);
    });
  };

  useEffect(() => {
    initializeMap();
    
    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className={`relative h-full ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/10" />
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background/20 to-transparent" />
      </div>
    </div>
  );
};

export default Map;
