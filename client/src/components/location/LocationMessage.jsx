import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Navigation, AlertCircle } from 'lucide-react';
import LocationMap from './LocationMap'; // Make sure this path is correct

const LocationMessage = ({ location, fromMe }) => {
  const [distance, setDistance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);

  // Debug: Log the location data
  useEffect(() => {
    console.log('LocationMessage received location data:', location);
  }, [location]);

  useEffect(() => {
    // Get user's current location to calculate distance
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });
          
          // Calculate distance
          const dist = calculateDistance(
            userLat, userLng, 
            location.latitude, location.longitude
          );
          setDistance(dist);
        },
        (error) => {
          console.log("Could not get user location:", error);
        }
      );
    }
  }, [location]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const openInMaps = (service) => {
    const { latitude, longitude } = location;
    let url;
    
    switch (service) {
      case 'google':
        url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?ll=${latitude},${longitude}`;
        break;
      case 'openstreetmap':
        url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
        break;
      default:
        url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    }
    
    window.open(url, '_blank');
  };

  // Validate location data
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return (
      <div className="location-message max-w-sm p-4 bg-red-900/20 border border-red-500 rounded-lg">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">Invalid location data</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`location-message max-w-sm ${fromMe ? 'ml-auto' : ''}`}>
      {/* Map Preview using Leaflet */}
      <div className="relative mb-3 rounded-lg overflow-hidden border border-gray-600">
        <LocationMap
          latitude={location.latitude}
          longitude={location.longitude}
          accuracy={location.accuracy}
          height="200px"
          interactive={false}
          showAccuracy={true}
        />
        
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          <MapPin size={12} className="inline mr-1" />
          Live Location
        </div>
        
        {/* Click to expand button */}
        <button
          onClick={() => setShowInteractiveMap(true)}
          className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors"
          title="Click to expand map"
        />
      </div>

      {/* Location Info */}
      <div className="space-y-2 mb-3">
        {location.address && (
          <p className="text-sm font-medium text-white">{location.address}</p>
        )}
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-300 font-mono">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
          {location.timestamp && (
            <p className="text-xs text-gray-400">
              {new Date(location.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {distance !== null && (
            <p className="text-xs text-blue-400 flex items-center">
              <Navigation size={12} className="mr-1" />
              {distance < 1 
                ? `${Math.round(distance * 1000)}m away`
                : `${distance.toFixed(1)}km away`
              }
            </p>
          )}

          {location.accuracy && (
            <p className="text-xs text-gray-400">
              ±{Math.round(location.accuracy)}m
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => openInMaps('google')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-md flex items-center justify-center gap-1 transition-colors"
        >
          <ExternalLink size={12} />
          Google Maps
        </button>
        <button
          onClick={() => openInMaps('openstreetmap')}
          className="bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded-md flex items-center justify-center gap-1 transition-colors"
        >
          <ExternalLink size={12} />
          OpenStreetMap
        </button>
      </div>

      {/* Interactive Map Modal */}
      {showInteractiveMap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Shared Location</h3>
              <button
                onClick={() => setShowInteractiveMap(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="h-96">
              <LocationMap
                latitude={location.latitude}
                longitude={location.longitude}
                accuracy={location.accuracy}
                height="100%"
                interactive={true}
                showAccuracy={true}
              />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                {location.accuracy && (
                  <span>Accuracy: ±{Math.round(location.accuracy)}m</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      
      
    </div>
  );
};

export default LocationMessage;