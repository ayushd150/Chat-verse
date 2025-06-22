import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, MapPin, Loader, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const MessageInput = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [activeLiveLocation, setActiveLiveLocation] = useState(null);
  const fileInputRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const getReverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data?.display_name || null;
      }
    } catch (error) {
      console.log('Geocoding failed:', error);
    }
    return null;
  };

  const sendLocationUpdate = async (position, isLive = false, duration = null) => {
    try {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
        isLive,
        duration
      };

      // Get address
      const address = await getReverseGeocode(locationData.latitude, locationData.longitude);
      if (address) {
        locationData.address = address;
      }

      await onSendMessage({
        messageType: 'location',
        location: locationData
      });

      return locationData;
    } catch (error) {
      console.error('Error sending location:', error);
      throw error;
    }
  };

  const handleLocationShare = async () => {
    setIsLocationLoading(true);

    try {
      const position = await getCurrentLocation();
      await sendLocationUpdate(position, false);
      toast.success('Location shared successfully!');
    } catch (error) {
      let errorMessage = 'Failed to get location';
      
      if (error.code) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permission.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
            break;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLocationLoading(false);
      setShowLocationOptions(false);
    }
  };

  const startLiveLocationSharing = async (duration) => {
    setIsLocationLoading(true);
    setShowLocationOptions(false);

    try {
      // Send initial location
      const position = await getCurrentLocation();
      await sendLocationUpdate(position, true, duration);

      const endTime = Date.now() + (duration * 60 * 1000);
      setActiveLiveLocation({
        duration,
        endTime,
        startTime: Date.now()
      });

      toast.success(`Live location sharing started for ${duration} minutes`);

      // Set up interval for live updates (every 30 seconds)
      locationIntervalRef.current = setInterval(async () => {
        try {
          if (Date.now() >= endTime) {
            stopLiveLocationSharing();
            return;
          }

          const newPosition = await getCurrentLocation();
          await sendLocationUpdate(newPosition, true, duration);
        } catch (error) {
          console.error('Error updating live location:', error);
          // Don't stop sharing on single update failure
        }
      }, 30000); // Update every 30 seconds

      // Auto-stop after duration
      setTimeout(() => {
        stopLiveLocationSharing();
      }, duration * 60 * 1000);

    } catch (error) {
      toast.error('Failed to start live location sharing');
      console.error('Live location error:', error);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const stopLiveLocationSharing = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    
    setActiveLiveLocation(null);
    toast.success('Live location sharing stopped');
    
    // Send stop message to other users
    onSendMessage({
      messageType: 'location_stop',
      timestamp: Date.now()
    }).catch(console.error);
  };

  const formatTimeRemaining = () => {
    if (!activeLiveLocation) return '';
    
    const remaining = Math.max(0, activeLiveLocation.endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && !image) {
      return;
    }

    setIsLoading(true);

    try {
      await onSendMessage({
        messageType: 'text',
        text: text.trim(),
        image
      });
      
      setText('');
      removeImage();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-base-300 p-4">
      {/* Live Location Status */}
      {activeLiveLocation && (
        <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-400">
                Live location sharing • {formatTimeRemaining()} remaining
              </span>
            </div>
            <button
              onClick={stopLiveLocationSharing}
              className="text-blue-400 hover:text-blue-300 p-1"
              title="Stop sharing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-4 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-32 max-h-32 rounded-lg object-cover"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Location Options Modal */}
      {showLocationOptions && (
        <div className="mb-4 p-4 bg-base-200 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Share Location</h4>
            <button
              onClick={() => setShowLocationOptions(false)}
              className="text-base-content/60 hover:text-base-content"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleLocationShare}
              className="w-full p-3 text-left bg-base-300 hover:bg-base-200 rounded-lg transition-colors"
              disabled={isLocationLoading}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Current Location</div>
                  <div className="text-sm text-base-content/60">Share your current location once</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => startLiveLocationSharing(5)}
              className="w-full p-3 text-left bg-base-300 hover:bg-base-200 rounded-lg transition-colors"
              disabled={isLocationLoading || activeLiveLocation}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Clock className="w-5 h-5 text-green-500" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <div className="font-medium">Live Location - 5 minutes</div>
                  <div className="text-sm text-base-content/60">Share real-time location for 5 minutes</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => startLiveLocationSharing(10)}
              className="w-full p-3 text-left bg-base-300 hover:bg-base-200 rounded-lg transition-colors"
              disabled={isLocationLoading || activeLiveLocation}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <div className="font-medium">Live Location - 10 minutes</div>
                  <div className="text-sm text-base-content/60">Share real-time location for 10 minutes</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="textarea textarea-bordered w-full resize-none"
            maxLength={1000}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost btn-sm"
            disabled={isLoading}
            title="Attach Image"
          >
            <Image className="w-4 h-4" />
          </button>

          {/* Location Share */}
          <button
            type="button"
            onClick={() => setShowLocationOptions(true)}
            className="btn btn-ghost btn-sm relative"
            disabled={isLocationLoading || isLoading}
            title="Share Location"
          >
            {isLocationLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                {activeLiveLocation && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </button>

          {/* Send Message */}
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isLoading || (!text.trim() && !image)}
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;