import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Navigation, AlertCircle, Clock, Zap } from 'lucide-react';
import LocationMap from './LocationMap';

const LiveLocationMessage = ({ location, fromMe, messageTimestamp }) => {
  const [distance, setDistance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isActive, setIsActive] = useState(false);

  // Calculate if live location is still active
  useEffect(() => {
    if (location.isLive && location.duration) {
      const endTime = messageTimestamp + (location.duration * 60 * 1000);
      const now = Date.now();
      
      setIsActive(now < endTime);
      
      if (now < endTime) {
        const updateTimer = () => {
          const remaining = Math.max(0, endTime - Date.now());
          setTimeRemaining(remaining);
          
          if (remaining <= 0) {
            setIsActive(false);
          }
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        
        return () => clearInterval(interval);
      }
    }
  }, [location, messageTimestamp]);

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

  const formatTimeRemaining = () => {
    if (!timeRemaining) return '';
    
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
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

  const isLiveAndActive = location.isLive && isActive;

  return (
    <div className={`location-message max-w-sm ${fromMe ? 'ml-auto' : ''}`}>
      {/* Live Location Header */}
      {location.isLive && (
        <div className={`mb-2 p-2 rounded-lg ${isLiveAndActive ? 'bg-blue-900/30 border border-blue-500' : 'bg-gray-800/30 border border-gray-600'}`}>
          <div className="flex items-center gap-2">
            {isLiveAndActive ? (
              <>
                <div className="relative">
                  <Zap size={14} className="text-blue-400" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xs text-blue-400 font-medium">
                  Live Location • {formatTimeRemaining()} remaining
                </span>
              </>
            ) : (
              <>
                <Clock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  Live Location (Expired)
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Map Preview */}
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
          {isLiveAndActive ? 'Live' : 'Location'}
        </div>
        
        {/* Live indicator overlay */}
        {isLiveAndActive && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
        )}
        
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
          <p className="text-xs text-gray-400">
            {new Date(location.timestamp).toLocaleTimeString()}
          </p>
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

        {/* Live Location Duration Info */}
        {location.isLive && location.duration && (
          <div className="text-xs text-gray-400">
            {isLiveAndActive 
              ? `Sharing for ${location.duration} minutes`
              : `Shared for ${location.duration} minutes`
            }
          </div>
        )}
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isLiveAndActive ? 'Live Location' : 'Shared Location'}
                </h3>
                {isLiveAndActive && (
                  <p className="text-sm text-blue-600">
                    Updates every 30 seconds • {formatTimeRemaining()} remaining
                  </p>
                )}
              </div>
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

export default LiveLocationMessage;