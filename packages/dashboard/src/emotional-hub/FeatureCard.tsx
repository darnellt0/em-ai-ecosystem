import { motion } from 'framer-motion';
import { EmotionalFeature } from './features';

interface Props {
  feature: EmotionalFeature;
  index: number;
  onSelect: (feature: EmotionalFeature) => void;
}

export const FeatureCard = ({ feature, index, onSelect }: Props) => {
  const Icon = feature.icon;
  return (
    <motion.button
      layoutId={`card-${feature.id}`}
      onClick={() => onSelect(feature)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur bg-white/5 ${feature.border} p-4 text-left w-full shadow-lg hover:shadow-xl`}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 hover:opacity-80 transition-opacity`} />
      <div className="relative z-10 flex items-start gap-3">
        <div className={`p-3 rounded-xl bg-black/20 ${feature.border}`}>
          <Icon className={`h-6 w-6 ${feature.text}`} />
        </div>
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-slate-200/80">Em Tool</p>
          <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
          <p className="text-sm text-slate-200/80">{feature.desc}</p>
        </div>
      </div>
    </motion.button>
  );
};
