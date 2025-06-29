import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Timer effect
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

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
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

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Convert blob to file
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
        type: audioBlob.type || 'audio/webm'
      });
      
      // Append file and duration to FormData
      formData.append('voice', audioFile);
      formData.append('duration', recordingTime.toString());
      formData.append('messageType', 'voice');

      console.log('🎤 VoiceRecorder sending FormData:', formData);
      console.log('🎤 FormData entries:');
      for (let pair of formData.entries()) {
        console.log('  ', pair[0], pair[1]);
      }

      // Call the parent component's onSendVoice function with FormData
      await onSendVoice(formData);
      
      // Cleanup and close modal
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Close the recorder modal
      onCancel();
      
      toast.success('Voice message sent!');
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Voice Message</h3>
          <button
            onClick={onCancel}
            className="btn btn-ghost btn-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recording Controls */}
        {!audioBlob && (
          <div className="text-center space-y-4">
            {/* Timer */}
            <div className="text-2xl font-mono text-primary">
              {formatTime(recordingTime)}
            </div>

            {/* Recording Status */}
            <div className="flex items-center justify-center gap-2">
              {isRecording && (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-base-content/60">
                    {isPaused ? 'Paused' : 'Recording...'}
                  </span>
                </>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="btn btn-primary btn-circle btn-lg"
                >
                  <Mic className="w-6 h-6" />
                </button>
              ) : (
                <>
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="btn btn-secondary btn-circle"
                  >
                    {isPaused ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={stopRecording}
                    className="btn btn-error btn-circle btn-lg"
                  >
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                  </button>
                </>
              )}
            </div>

            {/* Recording Tip */}
            <p className="text-sm text-base-content/60">
              {!isRecording 
                ? 'Tap to start recording' 
                : 'Tap square to stop, mic to pause/resume'
              }
            </p>
          </div>
        )}

        {/* Playback Controls */}
        {audioBlob && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-mono text-primary mb-2">
                {formatTime(recordingTime)}
              </div>
              
              {/* Audio Element */}
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              {/* Play Button */}
              <button
                onClick={playAudio}
                className="btn btn-primary btn-circle btn-lg mb-4"
              >
                {isPlaying ? (
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                ) : (
                  <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <button
                onClick={deleteRecording}
                className="btn btn-error btn-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
              
              <button
                onClick={sendVoiceMessage}
                className="btn btn-primary btn-sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;