import {
  Brain,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  MemoryStick,
  Compass,
} from 'lucide-react';

export type EmotionalFeatureId =
  | 'mood-sculptor'
  | 'empathy-mirror'
  | 'cognitive-reframer'
  | 'bubble-burster'
  | 'memory-harmonizer'
  | 'future-pathfinder';

export interface EmotionalFeature {
  id: EmotionalFeatureId;
  title: string;
  desc: string;
  color: string;
  text: string;
  border: string;
  shadow: string;
  icon: React.ComponentType<any>;
}

export const FEATURES: EmotionalFeature[] = [
  {
    id: 'mood-sculptor',
    title: 'Mood Sculptor',
    desc: 'Shape your emotional state with grounded reflection.',
    color: 'from-violet-500/30 via-indigo-500/20 to-blue-500/20',
    text: 'text-violet-100',
    border: 'border-violet-500/40',
    shadow: 'shadow-[0_0_25px_rgba(139,92,246,0.35)]',
    icon: Sparkles,
  },
  {
    id: 'empathy-mirror',
    title: 'Empathy Mirror',
    desc: 'See yourself with compassion and clarity.',
    color: 'from-teal-500/30 via-emerald-500/20 to-cyan-500/20',
    text: 'text-emerald-100',
    border: 'border-emerald-500/40',
    shadow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
    icon: HeartHandshake,
  },
  {
    id: 'cognitive-reframer',
    title: 'Cognitive Reframer',
    desc: 'Rewrite limiting beliefs into useful narratives.',
    color: 'from-amber-500/30 via-orange-500/20 to-yellow-500/20',
    text: 'text-amber-100',
    border: 'border-amber-500/40',
    shadow: 'shadow-[0_0_25px_rgba(251,191,36,0.35)]',
    icon: Brain,
  },
  {
    id: 'bubble-burster',
    title: 'Bubble Burster',
    desc: 'Pop stress bubbles before they expand.',
    color: 'from-rose-500/30 via-red-500/20 to-pink-500/20',
    text: 'text-rose-100',
    border: 'border-rose-500/40',
    shadow: 'shadow-[0_0_25px_rgba(244,63,94,0.35)]',
    icon: ShieldCheck,
  },
  {
    id: 'memory-harmonizer',
    title: 'Memory Harmonizer',
    desc: 'Weave past moments into supportive stories.',
    color: 'from-indigo-500/30 via-purple-500/20 to-pink-500/20',
    text: 'text-indigo-100',
    border: 'border-indigo-500/40',
    shadow: 'shadow-[0_0_25px_rgba(99,102,241,0.35)]',
    icon: MemoryStick,
  },
  {
    id: 'future-pathfinder',
    title: 'Future Pathfinder',
    desc: 'Chart the next step with confidence.',
    color: 'from-cyan-500/30 via-blue-500/20 to-sky-500/20',
    text: 'text-cyan-100',
    border: 'border-cyan-500/40',
    shadow: 'shadow-[0_0_25px_rgba(6,182,212,0.35)]',
    icon: Compass,
  },
];
