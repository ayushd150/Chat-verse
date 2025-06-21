// src/hooks/useLocation.js
import { useState, useCallback } from 'react';

export const useLocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser');
        setError(error);
        reject(error);
        return;
      }

      setIsLoading(true);
      setError(null);

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          resolve(position);
        },
        (error) => {
          setIsLoading(false);
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
              break;
          }
          
          const customError = new Error(errorMessage);
          setError(customError);
          reject(customError);
        },
        options
      );
    });
  }, []);

  const watchLocation = useCallback((callback, options = {}) => {
    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser');
      setError(error);
      return null;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    const watchOptions = { ...defaultOptions, ...options };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setError(null);
        callback(position);
      },
      (error) => {
        let errorMessage = 'Failed to watch location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
            break;
        }
        
        const customError = new Error(errorMessage);
        setError(customError);
        callback(null, customError);
      },
      watchOptions
    );

    return watchId;
  }, []);

  const clearWatch = useCallback((watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  return {
    getCurrentLocation,
    watchLocation,
    clearWatch,
    isLoading,
    error
  };
};