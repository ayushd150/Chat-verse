import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';

const VoicePlayer = ({ audioUrl, duration, isOwnMessage = false, messageTime }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (!audio || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * audioDuration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const downloadAudio = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `voice_message_${messageTime || Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={`voice-player flex items-center gap-3 p-3 rounded-lg max-w-xs ${
      isOwnMessage 
        ? 'bg-primary text-primary-content ml-auto' 
        : 'bg-base-200 text-base-content'
    }`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`btn btn-circle btn-sm ${
          isOwnMessage 
            ? 'btn-primary-content bg-primary-content/20 hover:bg-primary-content/30' 
            : 'btn-primary'
        }`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Waveform/Progress */}
      <div className="flex-1 space-y-1">
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="relative h-2 bg-black/20 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div 
            className={`absolute left-0 top-0 h-full rounded-full transition-all ${
              isOwnMessage ? 'bg-primary-content' : 'bg-primary'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Progress Thumb */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              isOwnMessage ? 'bg-primary-content' : 'bg-primary'
            }`}
            style={{ left: `calc(${progressPercentage}% - 6px)` }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-xs opacity-70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadAudio}
        className={`btn btn-ghost btn-xs ${
          isOwnMessage ? 'text-primary-content' : 'text-base-content'
        }`}
        title="Download"
      >
        <Download className="w-3 h-3" />
      </button>
    </div>
  );
};

export default VoicePlayer;