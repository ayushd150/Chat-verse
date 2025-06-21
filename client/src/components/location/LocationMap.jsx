// src/components/location/LocationMap.jsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
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
  interactive = true 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
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
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add marker
      markerRef.current = L.marker([latitude, longitude])
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="p-2">
            <strong>Shared Location</strong><br/>
            Lat: ${latitude.toFixed(6)}<br/>
            Lng: ${longitude.toFixed(6)}
            ${accuracy ? `<br/>Accuracy: ${Math.round(accuracy)}m` : ''}
          </div>
        `);

      // Add accuracy circle if provided
      if (showAccuracy && accuracy) {
        accuracyCircleRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2
        }).addTo(mapInstanceRef.current);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, accuracy, showAccuracy, interactive]);

  return (
    <div className="location-map-container rounded-lg overflow-hidden border border-base-300">
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="z-0"
      />
      <div className="p-2 bg-base-100 text-xs text-base-content/70">
        <div className="flex justify-between items-center">
          <span>📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
          {accuracy && (
            <span className="text-info">±{Math.round(accuracy)}m</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationMap;