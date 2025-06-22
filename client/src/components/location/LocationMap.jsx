import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationMap = ({ 
  latitude, 
  longitude, 
  accuracy, 
  showAccuracy = true,
  height = '200px',
  interactive = true,
  className = '' 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  useEffect(() => {
    // Cleanup previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (mapRef.current && latitude && longitude) {
      try {
        // Initialize map
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [latitude, longitude],
          zoom: 15,
          zoomControl: interactive,
          dragging: interactive,
          touchZoom: interactive,
          doubleClickZoom: interactive,
          scrollWheelZoom: interactive,
          boxZoom: interactive,
          keyboard: interactive,
          attributionControl: true,
        });

        // Add tile layer with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          detectRetina: true
        });
        
        tileLayer.on('tileerror', function(error) {
          console.warn('Tile loading error:', error);
        });
        
        tileLayer.addTo(mapInstanceRef.current);

        // Create custom marker icon
        const customIcon = L.divIcon({
          html: `
            <div style="
              background-color: #ef4444;
              width: 20px;
              height: 20px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid #fff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
          `,
          className: 'custom-location-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 20]
        });

        // Add marker
        markerRef.current = L.marker([latitude, longitude], { icon: customIcon })
          .addTo(mapInstanceRef.current);

        // Add popup with location info
        const popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <strong style="color: #1f2937;">📍 Shared Location</strong><br/>
            <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
              <div><strong>Latitude:</strong> ${latitude.toFixed(6)}</div>
              <div><strong>Longitude:</strong> ${longitude.toFixed(6)}</div>
              ${accuracy ? `<div><strong>Accuracy:</strong> ±${Math.round(accuracy)}m</div>` : ''}
              <div style="margin-top: 8px;">
                <a href="https://www.google.com/maps?q=${latitude},${longitude}" 
                   target="_blank" 
                   style="color: #3b82f6; text-decoration: none;">
                  📱 Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        `;

        markerRef.current.bindPopup(popupContent, {
          maxWidth: 250,
          closeButton: true
        });

        // Add accuracy circle if provided
        if (showAccuracy && accuracy && accuracy > 0) {
          accuracyCircleRef.current = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.6
          }).addTo(mapInstanceRef.current);

          // Fit map to show both marker and accuracy circle
          const group = L.featureGroup([markerRef.current, accuracyCircleRef.current]);
          mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
        }

        // Handle map loading
        mapInstanceRef.current.whenReady(() => {
          console.log('Map is ready');
          // Force a resize to ensure proper rendering
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 100);
        });

      } catch (error) {
        console.error('Error initializing Leaflet map:', error);
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, accuracy, showAccuracy, interactive]);

  // Handle resize when height changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
  }, [height]);

  if (!latitude || !longitude) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📍</div>
          <div className="text-sm">Invalid location data</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`location-map-container rounded-lg overflow-hidden ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="z-0"
      />
      
      {/* Location info overlay */}
      <div className="bg-white/90 backdrop-blur-sm p-2 text-xs text-gray-700 border-t">
        <div className="flex justify-between items-center">
          <span className="font-mono">
            📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
          {accuracy && (
            <span className="text-blue-600 font-medium">
              ±{Math.round(accuracy)}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationMap;