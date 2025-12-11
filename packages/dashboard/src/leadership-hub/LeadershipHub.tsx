'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FEATURES, LeadershipFeature } from './features';
import { FeatureCard } from './FeatureCard';
import { InteractionView } from './InteractionView';
import { Bot } from 'lucide-react';

export const LeadershipHub = () => {
  const [selected, setSelected] = useState<LeadershipFeature | null>(null);

  return (
    <div className="min-h-screen bg-space-900 text-white relative overflow-hidden">
      <div className="absolute -left-20 -top-32 h-72 w-72 rounded-full bg-purple-700/30 blur-3xl animate-blob" />
      <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute left-20 bottom-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl animate-blob animation-delay-4000" />

      <div className="max-w-6xl mx-auto px-4 py-14 relative z-10">
        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-lg">
            <Bot className="h-8 w-8 text-emerald-200" />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300/80">Deep Space Leadership Hub</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-white">
            How are you leading and resting today?
          </h1>
          <p className="text-slate-300 max-w-2xl">
            Strengths-centered leadership tools grounded in rest and I.N.T.E.N.T. Choose a spoke to get guidance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, idx) => (
            <FeatureCard key={feature.id} feature={feature} index={idx} onSelect={setSelected} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        <InteractionView feature={selected} onClose={() => setSelected(null)} />
      </AnimatePresence>
    </div>
  );
};

export default LeadershipHub;
