import { useState, useEffect } from 'react';
import { useGameState, CONDITION_TITLES, CONDITION_HEADINGS } from '../hooks/useGameState';
import ProgressBar from '../components/ProgressBar';
import ModeSelect from '../screens/ModeSelect';
import Glossary from '../screens/Glossary';
import Deal from '../screens/Deal';
import MeetPartners from '../screens/MeetPartners';
import Trade from '../screens/Trade';
import Sort from '../screens/Sort';
import Summary from '../screens/Summary';
import ResearcherView from '../screens/ResearcherView';

const PHASE_LABELS: Record<string, string> = {
  "glossary": "Overview",
  "deal": "Your Hand",
  "meet-partners": "Your Partners",
  "trade": "Trade",
  "sort": "Prioritize",
  "summary": "Summary",
};

const Index = () => {
  const game = useGameState();
  const [showResearcher, setShowResearcher] = useState(false);

  useEffect(() => {
    document.title = CONDITION_TITLES[game.condition];
  }, [game.condition]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd' || e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        setShowResearcher(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);


  const renderScreen = () => {
    switch (game.phase) {
      case "mode-select":
        return <ModeSelect heading={CONDITION_HEADINGS[game.condition]} onStart={() => game.startStudy()} />;
      case "glossary":
        return <Glossary condition={game.condition} onContinue={() => game.dealCards()} />;
      case "deal":
        return <Deal playerHand={game.playerHand} onContinue={() => game.advancePhase("meet-partners")} />;
      case "meet-partners":
        return (
          <MeetPartners
            partners={game.partners}
            partnerProfiles={game.partnerProfiles}
            onContinue={() => game.advancePhase("trade")}
          />
        );
      case "trade":
        return (
          <Trade
            playerHand={game.playerHand}
            partners={game.partners}
            partnerProfiles={game.partnerProfiles}
            makeOffer={game.makeOffer}
            canFinishTrading={game.canFinishTrading}
            partnerMaxedOut={game.partnerMaxedOut}
            onContinue={() => game.advancePhase("sort")}
          />
        );
      case "sort":
        return (
          <Sort
            condition={game.condition}
            playerHand={game.playerHand}
            topN={game.topN}
            finalTop={game.finalTop}
            toggleTop={game.toggleTop}
            onContinue={() => game.advancePhase("summary")}
          />
        );
      case "summary":
        return (
          <Summary
            dealtPlayerHand={game.dealtPlayerHand}
            finalPlayerHand={game.playerHand}
            finalTop={game.finalTop}
            topN={game.topN}
            partnerProfiles={game.partnerProfiles}
            trades={game.trades}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {game.phase !== "mode-select" && (
        <ProgressBar
          currentPhase={game.phaseIndex}
          totalPhases={game.totalPhases}
          phaseLabel={PHASE_LABELS[game.phase] || game.phase}
        />
      )}
      {renderScreen()}
      <button
        onClick={() => setShowResearcher(true)}
        className="fixed bottom-3 right-3 z-40 text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-primary bg-muted/40 hover:bg-muted border border-border rounded-full px-3 py-1.5 font-sans transition-colors"
        title="Researcher view (Ctrl/Cmd+Shift+D)"
      >
        Researcher
      </button>
      {showResearcher && (
        <ResearcherView
          phase={game.phase}
          phaseTiming={game.phaseTiming}
          phaseStartTime={game.phaseStartTime}
          condition={game.condition}
          partners={game.partners}
          partnerProfiles={game.partnerProfiles}
          playerHand={game.playerHand}
          dealtPlayerHand={game.dealtPlayerHand}
          trades={game.trades}
          onClose={() => setShowResearcher(false)}
        />
      )}

    </div>
  );
};

export default Index;
