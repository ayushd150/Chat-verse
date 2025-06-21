// src/components/location/LocationShare.jsx
import { useState } from 'react';
import { MapPin, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from '../../hooks/useLocation';

const LocationShare = ({ onLocationShare, disabled = false }) => {
  const [isSharing, setIsSharing] = useState(false);
  const { getCurrentLocation } = useLocation();

  const handleLocationShare = async () => {
    if (disabled) return;
    
    setIsSharing(true);
    
    try {
      const location = await getCurrentLocation();
      
      if (location) {
        onLocationShare({
          type: 'location',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: Date.now()
        });
        
        toast.success('Location shared successfully!');
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      toast.error(error.message || 'Failed to get location');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleLocationShare}
      disabled={disabled || isSharing}
      className={`btn btn-ghost btn-sm ${isSharing ? 'loading' : ''}`}
      title="Share Location"
    >
      {isSharing ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <MapPin className="w-4 h-4" />
      )}
    </button>
  );
};

export default LocationShare;