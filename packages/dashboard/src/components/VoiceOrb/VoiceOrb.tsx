import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceOrbProps {
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onError?: (error: string) => void;
  apiEndpoint?: string;
  userId?: string;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  onTranscript,
  onResponse,
  onError,
  apiEndpoint = '/api/voice/duplex',
  userId = 'darnell@elevatedmovements.com',
}) => {
  const [state, setState] = useState<OrbState>('idle');
  const [statusText, setStatusText] = useState('Ready');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  const stateColors: Record<OrbState, string> = {
    idle: 'from-violet-600 via-indigo-500 to-sky-500',
    listening: 'from-cyan-400 via-blue-500 to-purple-600',
    processing: 'from-pink-500 via-rose-500 to-pink-500',
    speaking: 'from-emerald-400 via-teal-500 to-emerald-400',
    error: 'from-red-500 via-pink-500 to-red-500',
  };

  const resetToIdle = () => {
    setState('idle');
    setStatusText('Ready');
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length > 0) {
          await processAudio();
        } else {
          resetToIdle();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setState('listening');
      setStatusText('Listening...');
    } catch (err) {
      setState('error');
      setStatusText('Microphone denied');
      onError?.('Microphone access denied');
      setTimeout(resetToIdle, 2000);
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      setState('processing');
      setStatusText('Thinking...');
      mediaRecorderRef.current.stop();
    }
  }, []);

  const processAudio = async () => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    if (blob.size < 1000) {
      resetToIdle();
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('userId', userId);
      formData.append('sessionId', sessionIdRef.current);

      const res = await fetch(apiEndpoint, { method: 'POST', body: formData });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const transcription = res.headers.get('X-Transcription') || '';
      const responseText = res.headers.get('X-Response-Text') || '';

      if (transcription) onTranscript?.(transcription);
      if (responseText) onResponse?.(responseText);

      const audioBlob = await res.blob();
      if (audioBlob.size > 0) {
        setState('speaking');
        setStatusText('Speaking...');
        await playAudio(audioBlob);
      }

      resetToIdle();
    } catch (err: any) {
      setState('error');
      setStatusText('Error');
      onError?.(err.message);
      setTimeout(resetToIdle, 2000);
    }
  };

  const playAudio = (blob: Blob): Promise<void> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.play().catch(() => resolve());
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.button
        className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${stateColors[state]}
                    shadow-2xl cursor-pointer flex items-center justify-center`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        animate={{
          boxShadow: state === 'listening'
            ? '0 0 60px rgba(0, 198, 251, 0.6)'
            : state === 'speaking'
              ? '0 0 60px rgba(56, 239, 125, 0.6)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div className="absolute inset-0 rounded-full bg-inherit blur-xl opacity-50 -z-10" />

        <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {(state === 'listening' || state === 'speaking') && (
          <motion.div
            className="flex gap-1 h-8 items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-white/80 rounded-full"
                animate={{ height: [8, 25, 8] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-white/70 uppercase tracking-widest text-sm">{statusText}</p>
    </div>
  );
};

export default VoiceOrb;
