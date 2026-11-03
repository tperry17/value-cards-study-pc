import { motion } from 'framer-motion';
import { ALL_VALUES } from '../data/values';
import { ALL_ISSUES } from '../data/issues';
import ValueCard from '../components/ValueCard';
import { Condition } from '../hooks/useGameState';

interface GlossaryProps {
  condition: Condition;
  onContinue: () => void;
}

const Glossary = ({ condition, onContinue }: GlossaryProps) => {
  const cards = condition === 'issues' ? ALL_ISSUES : ALL_VALUES.slice(0, 18);

  const heading = condition === 'issues' ? 'The Issues at Play' : 'The Values at Play';
  const body =
    condition === 'issues'
      ? "You've been dealt a hand of issue cards. Each card represents a policy issue. You'll trade with two partners to build the hand that best reflects what matters most to your community."
      : `We're playing a values card game — a reflective exercise where you'll be dealt random value cards, pick the ones that matter most to you, and negotiate trades with two partners. You'll be working with these ${cards.length} values today. Take a moment to read through them.`;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 max-w-lg"
      >
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-2">
          {heading}
        </h1>
        <p className="text-muted-foreground font-sans">{body}</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-10 max-w-5xl">
        {cards.map((c, i) => (
          <ValueCard key={c.name} value={c as { name: string; definition?: string }} size="sm" index={i} />
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        className="px-8 py-4 bg-primary text-primary-foreground font-sans font-semibold rounded-xl transition-colors"
      >
        I'm ready →
      </motion.button>
    </div>
  );
};

export default Glossary;
