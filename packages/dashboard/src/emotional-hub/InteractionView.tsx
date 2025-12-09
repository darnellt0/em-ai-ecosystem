'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EmotionalFeature } from './features';

type Message = { role: 'assistant' | 'user'; content: string };

interface Props {
  feature: EmotionalFeature | null;
  onClose: () => void;
}

export const InteractionView = ({ feature, onClose }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feature || !input.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/em-ai/emotional-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: feature.id,
          message: userMessage.content,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach Emotional Session endpoint');
      }

      const data = await response.json();
      const assistant: Message = { role: 'assistant', content: data.reply || 'No reply available.' };
      setMessages((prev) => [...prev, assistant]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {feature && (
        <motion.div
          key={feature.id}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            layoutId={`card-${feature.id}`}
            className={`relative w-full max-w-4xl mx-4 rounded-3xl border ${feature.border} bg-slate-900/80 backdrop-blur-2xl p-6 shadow-2xl`}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <feature.icon className={`h-6 w-6 ${feature.text}`} />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300/80">EM Emotional Hub</p>
                  <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-300 hover:text-white rounded-full px-3 py-1 bg-white/10 border border-white/10"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 mb-16 max-h-[50vh] overflow-y-auto pr-2">
              {messages.length === 0 && (
                <div className="text-sm text-slate-300">
                  Welcome to {feature.title}. How are you feeling? Try something like “I’m feeling overwhelmed…”.
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-white/10 text-white'
                        : 'bg-slate-800/80 text-slate-100 border border-white/5'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-sm text-slate-300 animate-pulse">Thinking...</div>}
              {error && <div className="text-sm text-rose-300">Error: {error}</div>}
            </div>

            <form onSubmit={handleSubmit} className={`fixed left-0 right-0 mx-6 bottom-8 ${feature.shadow}`}>
              <div className="max-w-4xl mx-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me how you feel..."
                  className="flex-1 bg-transparent text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-white/80 text-slate-900 font-semibold hover:bg-white transition disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      )}
    </AnimatePresence>
  );
};
