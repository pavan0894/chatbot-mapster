
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// This should be replaced with your actual Mapbox token
// We'll provide a way for users to input this for testing
const DEFAULT_MAPBOX_TOKEN = '';

interface MapProps {
  className?: string;
}

const Map: React.FC<MapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(DEFAULT_MAPBOX_TOKEN);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [mapInitialized, setMapInitialized] = useState<boolean>(false);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken || mapInitialized) return;

    try {
      // Initialize map
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        projection: 'globe',
        zoom: 1.5,
        center: [30, 15],
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

  useEffect(() => {
    if (mapboxToken) {
      initializeMap();
    }
    
    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const handleSubmitToken = (e: React.FormEvent) => {
    e.preventDefault();
    setMapboxToken(tokenInput);
  };

  if (!mapboxToken) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 rounded-3xl bg-secondary/50 ${className}`}>
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-4">Mapbox API Token Required</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Please enter your Mapbox public token to enable the map. You can find this in your Mapbox account dashboard.
          </p>
          <form onSubmit={handleSubmitToken} className="space-y-4">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter Mapbox public token"
              className="w-full px-4 py-2 rounded-lg border border-input bg-background"
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary text-white rounded-lg transition-colors hover:bg-primary/90"
            >
              Initialize Map
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            Get your token at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-3xl overflow-hidden" />
      <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/10" />
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background/20 to-transparent" />
      </div>
    </div>
  );
};

export default Map;
