import { motion } from 'framer-motion';
import { PartnerState } from '../lib/tradeEngine';
import { PartnerDisplay } from '../hooks/useGameState';
import ValueCard from '../components/ValueCard';

interface MeetPartnersProps {
  partners: PartnerState[];
  partnerProfiles: PartnerDisplay[];
  onContinue: () => void;
}

const MeetPartners = ({ partners, partnerProfiles, onContinue }: MeetPartnersProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 max-w-lg"
      >
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-2">
          Your Trading Partners
        </h1>
        <p className="text-muted-foreground font-sans">
          The rest of the cards have been dealt to two other (virtual) players. You must trade at least once with each, but you can make multiple trades until you are satisfied with your hand.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full mb-10">
        {partners.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * i }}
            className="bg-muted/40 border border-border rounded-2xl p-5"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-serif font-bold text-foreground">{partnerProfiles[i]?.name}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {p.hand.map((v, j) => (
                <ValueCard key={v.name} value={v} size="sm" index={j} isPlayer={false} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        className="px-8 py-4 bg-primary text-primary-foreground font-sans font-semibold rounded-xl"
      >
        Start trading →
      </motion.button>
    </div>
  );
};

export default MeetPartners;
