import { motion } from 'framer-motion';

interface ModeSelectProps {
  heading: string;
  onStart: () => void;
}

const ModeSelect = ({ heading, onStart }: ModeSelectProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="text-center mb-10 max-w-md"
      >
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-3">
          {heading}
        </h1>
        <p className="text-muted-foreground text-lg font-sans">
          Welcome. Click below to begin.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="px-10 py-5 rounded-xl bg-primary text-primary-foreground font-sans font-semibold text-lg hover:opacity-90 transition-opacity"
      >
        Start Study
      </motion.button>
    </div>
  );
};

export default ModeSelect;
