/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useRef } from 'react';
import { Mic, MicOff, Send, AlertCircle } from 'lucide-react';

import { API_BASE } from '@/lib/apiClient';

type RecordingState = 'idle' | 'recording' | 'processing';

interface TranscribeResponse {
  status: 'ok' | 'error';
  text?: string;
  provider?: string;
  error?: string;
  message?: string;
}

interface CommandResponse {
  status: 'ok' | 'error';
  message?: string;
  text?: string;
  nextStep?: string;
  error?: string;
}

export default function VoiceConsolePage() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setCommandResult(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Create audio blob
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Upload and transcribe
        await uploadAndTranscribe(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecordingState('recording');

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Recording error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access and try again.');
      } else {
        setError(`Failed to start recording: ${err.message}`);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('processing');

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Upload audio and get transcription
  const uploadAndTranscribe = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(`${API_BASE}/api/voice/transcribe`, {
        method: 'POST',
        body: formData,
      });

      const data: TranscribeResponse = await response.json();

      if (!response.ok || data.status === 'error') {
        if (data.message && data.message.includes('not configured')) {
          setError(
            `STT not configured. ${data.message}\n\nYou can still use text input below to test the voice commands.`
          );
        } else {
          setError(data.error || 'Transcription failed');
        }
        setRecordingState('idle');
        return;
      }

      setTranscript(data.text || '');
      setRecordingState('idle');

      // Automatically execute the command
      if (data.text) {
        await executeCommand(data.text);
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(`Network error: ${err.message}`);
      setRecordingState('idle');
    }
  };

  // Execute voice command
  const executeCommand = async (text: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/voice/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: 'shria',
          text,
        }),
      });

      const data: CommandResponse = await response.json();

      if (!response.ok || data.status === 'error') {
        setError(data.error || 'Command execution failed');
        return;
      }

      setCommandResult(data.message || 'Command executed successfully');
    } catch (err: any) {
      console.error('Command error:', err);
      setError(`Failed to execute command: ${err.message}`);
    }
  };

  // Handle text input submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setError(null);
    setCommandResult(null);
    setTranscript(textInput.trim());

    await executeCommand(textInput.trim());
    setTextInput('');
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Voice Console</p>
        <h1 className="text-3xl font-semibold text-white">Voice Command Interface</h1>
        <p className="text-sm text-white/70">
          Record your voice command or type it below. The system will transcribe and execute your request.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Microphone Recording Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Microphone Input</h2>
            <p className="text-sm text-white/70">Click to record, click again to stop and transcribe</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {recordingState === 'idle' && (
              <button
                onClick={startRecording}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-400 shadow-lg hover:bg-emerald-300 transition-all hover:scale-105"
                aria-label="Start recording"
              >
                <Mic className="h-12 w-12 text-slate-900" />
              </button>
            )}

            {recordingState === 'recording' && (
              <button
                onClick={stopRecording}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500 shadow-lg hover:bg-red-400 transition-all animate-pulse"
                aria-label="Stop recording"
              >
                <MicOff className="h-12 w-12 text-white" />
              </button>
            )}

            {recordingState === 'processing' && (
              <div className="flex h-24 w-24 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-400"></div>
              </div>
            )}

            {recordingState === 'recording' && (
              <div className="text-lg font-mono text-emerald-300">
                Recording: {formatTime(recordingTime)}
              </div>
            )}

            {recordingState === 'processing' && (
              <div className="text-sm text-white/70">Processing audio...</div>
            )}
          </div>

          {transcript && (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-300 mb-2">Transcript</p>
              <p className="text-white">{transcript}</p>
            </div>
          )}
        </section>

        {/* Text Input Fallback */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Text Input (Fallback)</h2>
            <p className="text-sm text-white/70">Type your command if microphone is unavailable</p>
          </div>

          <form onSubmit={handleTextSubmit} className="space-y-3">
            <div>
              <label className="text-sm text-white/80 block mb-2">Command</label>
              <textarea
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-emerald-300 focus:outline-none resize-none"
                rows={4}
                placeholder="Type your voice command here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={!textInput.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send Command
            </button>
          </form>

          {commandResult && (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-300 mb-2">Result</p>
              <p className="text-white whitespace-pre-wrap">{commandResult}</p>
            </div>
          )}
        </section>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-amber-300 mb-1">Error</p>
            <p className="text-white/90 whitespace-pre-wrap text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Documentation */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-3">
        <h3 className="text-lg font-semibold text-white">How It Works</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-white/70">
          <li>Click the microphone button to start recording your voice command</li>
          <li>Speak your command clearly (e.g., "block 45 minutes for focus")</li>
          <li>Click the stop button to end recording</li>
          <li>The audio will be uploaded and transcribed automatically</li>
          <li>The transcribed text will be sent to the command processor</li>
          <li>Alternatively, use the text input if the microphone is unavailable</li>
        </ol>

        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wide text-white/50 mb-2">Configuration</p>
          <p className="text-xs text-white/60">
            STT Provider: Set <code className="bg-white/10 px-1 rounded">STT_PROVIDER=openai</code> and{' '}
            <code className="bg-white/10 px-1 rounded">STT_OPENAI_API_KEY</code> in your API environment to enable
            speech-to-text.
          </p>
        </div>
      </section>
    </main>
  );
}
