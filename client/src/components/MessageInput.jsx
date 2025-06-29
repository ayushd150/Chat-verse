import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, MapPin, Loader, Clock, X, Mic, MicOff, Trash2, Play, Pause } from 'lucide-react';

const MessageInput = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [activeLiveLocation, setActiveLiveLocation] = useState(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const fileInputRef = useRef(null);
  const locationIntervalRef = useRef(null);
  
  // Voice recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Timer effect for recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioBlob(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setShowVoiceRecorder(true);
      
      console.log('🎤 Recording started');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    console.log('🎤 Recording stopped');
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const playVoicePreview = () => {
    if (audioRef.current) {
      if (isPlayingVoice) {
        audioRef.current.pause();
        setIsPlayingVoice(false);
      } else {
        audioRef.current.play();
        setIsPlayingVoice(true);
      }
    }
  };

  const deleteVoiceRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setIsPlayingVoice(false);
    setShowVoiceRecorder(false);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) {
      console.error('❌ No audio blob to send');
      return;
    }

    setIsLoading(true);
    console.log('🎤 Preparing to send voice message...');
    console.log('🎤 Audio blob size:', audioBlob.size);
    console.log('🎤 Audio blob type:', audioBlob.type);
    console.log('🎤 Recording duration:', recordingTime);

    try {
      // Create FormData for voice message
      const formData = new FormData();
      
      // Create a proper file from the blob
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
        type: audioBlob.type || 'audio/webm;codecs=opus'
      });
      
      formData.append('voice', audioFile);
      formData.append('messageType', 'voice');
      formData.append('duration', recordingTime.toString());
      formData.append('mimeType', audioBlob.type || 'audio/webm;codecs=opus');
      
      console.log('🎤 FormData created with entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      // Send FormData to parent component
      await onSendMessage(formData);
      
      console.log('✅ Voice message sent successfully');
      
      // Cleanup after successful send
      deleteVoiceRecording();
      
    } catch (error) {
      console.error('❌ Error sending voice message:', error);
      alert('Failed to send voice message: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
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
      alert('Location shared successfully!');
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
      
      alert(errorMessage);
    } finally {
      setIsLocationLoading(false);
      setShowLocationOptions(false);
    }
  };

  const startLiveLocationSharing = async (duration) => {
    setIsLocationLoading(true);
    setShowLocationOptions(false);

    try {
      const position = await getCurrentLocation();
      await sendLocationUpdate(position, true, duration);

      const endTime = Date.now() + (duration * 60 * 1000);
      setActiveLiveLocation({
        duration,
        endTime,
        startTime: Date.now()
      });

      alert(`Live location sharing started for ${duration} minutes`);

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
        }
      }, 30000);

      setTimeout(() => {
        stopLiveLocationSharing();
      }, duration * 60 * 1000);

    } catch (error) {
      alert('Failed to start live location sharing');
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
    alert('Live location sharing stopped');
    
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
      alert('Failed to send message');
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

      {/* Voice Recorder Interface - FIXED UI */}
      {showVoiceRecorder && (
        <div className="mb-4 p-4 bg-base-200 rounded-lg border shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" />
              Voice Message
            </h4>
            <button
              onClick={deleteVoiceRecording}
              className="text-base-content/60 hover:text-base-content hover:bg-base-300 rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!audioBlob ? (
            // Recording Interface
            <div className="text-center space-y-4">
              <div className="text-3xl font-mono text-primary font-bold">
                {formatTime(recordingTime)}
              </div>

              <div className="flex items-center justify-center gap-2 min-h-[24px]">
                {isRecording && (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-base-content/60 font-medium">
                      {isPaused ? 'Recording Paused' : 'Recording...'}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="btn btn-primary btn-circle btn-lg hover:scale-105 transition-transform"
                    title="Start Recording"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      className="btn btn-secondary btn-circle hover:scale-105 transition-transform"
                      title={isPaused ? "Resume Recording" : "Pause Recording"}
                    >
                      {isPaused ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={stopRecording}
                      className="btn btn-error btn-circle btn-lg hover:scale-105 transition-transform"
                      title="Stop Recording"
                    >
                      <div className="w-4 h-4 bg-white rounded-sm"></div>
                    </button>
                  </>
                )}
              </div>

              <p className="text-sm text-base-content/60">
                {!isRecording 
                  ? 'Tap the microphone to start recording' 
                  : 'Tap square to stop • Tap mic to pause/resume'
                }
              </p>
            </div>
          ) : (
            // Playback Interface - FIXED
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-mono text-primary mb-3 font-bold">
                  {formatTime(recordingTime)}
                </div>
                
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlayingVoice(false)}
                  className="hidden"
                />

                <button
                  onClick={playVoicePreview}
                  className="btn btn-primary btn-circle btn-lg mb-4 hover:scale-105 transition-transform"
                  title={isPlayingVoice ? "Pause Preview" : "Play Preview"}
                >
                  {isPlayingVoice ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </button>
                
                <div className="text-sm text-base-content/60 mb-4">
                  {isPlayingVoice ? 'Playing preview...' : 'Tap to preview your recording'}
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={deleteVoiceRecording}
                  className="btn btn-error btn-sm hover:scale-105 transition-transform"
                  title="Delete Recording"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
                
                <button
                  onClick={sendVoiceMessage}
                  className="btn btn-primary btn-sm hover:scale-105 transition-transform"
                  disabled={isLoading}
                  title="Send Voice Message"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-4 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-32 max-h-32 rounded-lg object-cover border shadow-sm"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md"
          >
            ×
          </button>
        </div>
      )}

      {/* Location Options Modal */}
      {showLocationOptions && (
        <div className="mb-4 p-4 bg-base-200 rounded-lg border shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Share Location
            </h4>
            <button
              onClick={() => setShowLocationOptions(false)}
              className="text-base-content/60 hover:text-base-content hover:bg-base-300 rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleLocationShare}
              className="w-full p-3 text-left bg-base-300 hover:bg-base-100 rounded-lg transition-colors"
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
              className="w-full p-3 text-left bg-base-300 hover:bg-base-100 rounded-lg transition-colors"
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
              className="w-full p-3 text-left bg-base-300 hover:bg-base-100 rounded-lg transition-colors"
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

      {/* Main Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="textarea textarea-bordered w-full resize-none focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="btn btn-ghost btn-sm hover:bg-base-200"
            disabled={isLoading}
            title="Attach Image"
          >
            <Image className="w-4 h-4" />
          </button>

          {/* Voice Recording - FIXED BUTTON */}
          <button
            type="button"
            onClick={startRecording}
            className={`btn btn-ghost btn-sm hover:bg-base-200 ${isRecording ? 'text-red-500' : ''}`}
            disabled={isLoading || isRecording || showVoiceRecorder}
            title="Record Voice Message"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Location Share */}
          <button
            type="button"
            onClick={() => setShowLocationOptions(true)}
            className="btn btn-ghost btn-sm relative hover:bg-base-200"
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
            onClick={handleSubmit}
            className="btn btn-primary btn-sm hover:scale-105 transition-transform"
            disabled={isLoading || (!text.trim() && !image)}
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;