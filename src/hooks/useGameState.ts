import { useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { Value, ALL_VALUES } from '../data/values';
import { ALL_ISSUES } from '../data/issues';
import {
  PartnerState,
  Ranking,
  TradeConfig,
  DEFAULT_TRADE_CONFIG,
  dealThreeHands,
  buildSolvableRanking,
  makePartner,
  validateOffer,
  decideOffer,
  applyAcceptedTrade,
  applyRejectedTrade,
  hasAcceptableTrade,
  canFinishTrading as engineCanFinish,
} from '../lib/tradeEngine';

export type GamePhase =
  | "mode-select"
  | "glossary"
  | "deal"
  | "meet-partners"
  | "trade"
  | "sort"
  | "summary";

export type Condition = "values" | "issues";

/** Single active study condition. Change to "values" to re-enable that deck. */
const ACTIVE_CONDITION: Condition = "issues";

export interface PartnerDisplay {
  id: string;
  name: string;
  avatar: string;
}

const PARTNER_DISPLAY: PartnerDisplay[] = [
  { id: "A", name: "Partner A", avatar: "🟦" },
  { id: "B", name: "Partner B", avatar: "🟨" },
];

export interface TradeRecord {
  order: number;
  partnerId: string;
  gave: string;
  received: string | null;
  accepted: boolean;
}

export interface OfferOutcome {
  ok: boolean;
  reason?: string;
  accepted?: boolean;
}

const PHASE_ORDER: GamePhase[] = [
  "mode-select", "glossary", "deal", "meet-partners",
  "trade", "sort", "summary",
];

export const useGameState = (config: TradeConfig = DEFAULT_TRADE_CONFIG) => {
  const [phase, setPhase] = useState<GamePhase>("mode-select");
  const [condition, setCondition] = useState<Condition>(ACTIVE_CONDITION);
  const [phaseStartTime, setPhaseStartTime] = useState<number>(Date.now());
  const [phaseTiming, setPhaseTiming] = useState<Record<string, number>>({});

  const saveSessionRef = useRef<((t: Record<string, number>) => void) | null>(null);

  const advancePhase = useCallback((next: GamePhase) => {
    const elapsed = Date.now() - phaseStartTime;
    const newTiming = { ...phaseTiming, [phase]: elapsed };
    setPhaseTiming(newTiming);
    setPhaseStartTime(Date.now());
    setPhase(next);
    if (next === "summary") {
      saveSessionRef.current?.(newTiming);
    }
  }, [phase, phaseStartTime, phaseTiming]);

  const [dealtPlayerHand, setDealtPlayerHand] = useState<Value[]>([]);
  const [playerHand, setPlayerHand] = useState<Value[]>([]);
  const [partners, setPartners] = useState<PartnerState[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);

  const [finalTop, setFinalTop] = useState<string[]>([]);

  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const totalPhases = PHASE_ORDER.length - 1; // exclude mode-select

  const topN = 3;

  const partnerProfiles = PARTNER_DISPLAY;

  const startStudy = useCallback(() => {
    const assigned: Condition = ACTIVE_CONDITION;
    setCondition(assigned);
    advancePhase("glossary");
  }, [advancePhase]);

  const dealCards = useCallback(() => {
    const pool: Value[] =
      condition === "issues"
        ? (ALL_ISSUES as Value[])
        : ALL_VALUES.slice(0, 18);
    const [pHand, hA, hB] = dealThreeHands(pool);

    const rankA: Ranking = buildSolvableRanking(pool, pHand, hA);
    const rankB: Ranking = buildSolvableRanking(pool, pHand, hB);

    setDealtPlayerHand(pHand);
    setPlayerHand(pHand);
    setPartners([makePartner("A", hA, rankA), makePartner("B", hB, rankB)]);
    setTrades([]);
    setPhase("deal");
  }, [condition]);

  const makeOffer = useCallback(
    (partnerId: string, giveName: string, getName: string): OfferOutcome => {
      const idx = partners.findIndex((p) => p.id === partnerId);
      if (idx === -1) return { ok: false, reason: "Unknown partner." };

      const partner = partners[idx];
      const validation = validateOffer(playerHand, partner, giveName, getName);
      if (!validation.ok) {
        const reason = "reason" in validation ? validation.reason : undefined;
        return { ok: false, reason };
      }

      const accepted = decideOffer(partner, giveName, getName);
      if (accepted) {
        const res = applyAcceptedTrade(playerHand, partner, giveName, getName);
        setPlayerHand(res.playerHand);
        setPartners((prev) => prev.map((p, i) => (i === idx ? res.partner : p)));
      } else {
        const updated = applyRejectedTrade(partner);
        setPartners((prev) => prev.map((p, i) => (i === idx ? updated : p)));
      }

      setTrades((prev) => [
        ...prev,
        {
          order: prev.length + 1,
          partnerId,
          gave: giveName,
          received: accepted ? getName : null,
          accepted,
        },
      ]);

      return { ok: true, accepted };
    },
    [partners, playerHand]
  );

  const canFinishTrading = useMemo(
    () => partners.length > 0 && engineCanFinish(playerHand, partners, config),
    [playerHand, partners, config]
  );

  const partnerMaxedOut = useCallback(
    (partnerId: string): boolean => {
      const p = partners.find((x) => x.id === partnerId);
      return !!p && !hasAcceptableTrade(playerHand, p);
    },
    [partners, playerHand]
  );

  const toggleTop = useCallback(
    (name: string) => {
      setFinalTop((prev) => {
        if (prev.includes(name)) return prev.filter((n) => n !== name);
        if (prev.length < topN) return [...prev, name];
        return prev;
      });
    },
    [topN]
  );

  const saveSession = useCallback(async (timingOverride?: Record<string, number>) => {
    const timing = timingOverride ?? phaseTiming;
    const rankingToList = (r: Ranking) =>
      Object.entries(r).sort((a, b) => a[1] - b[1]).map(([name]) => name);
    // Spread into plain objects so they type-check as Supabase Json.
    const tradesJson = trades.map((t) => ({ ...t }));
    const payload: TablesInsert<"sessions"> = {
      condition,
      deck_version: condition === "issues" ? "issues-20" : "values-18",
      dealt_hand: dealtPlayerHand.map(v => v.name),
      final_hand: playerHand.map(v => v.name),
      top_selection: finalTop,
      total_offers: trades.length,
      successful_trades: trades.filter(t => t.accepted).length,
      trades: tradesJson,
      timing,
      partner_rankings: partners.map(p => ({ id: p.id, ranking: rankingToList(p.ranking) })),
      raw: {
        sessionId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        condition,
        dealtHand: dealtPlayerHand.map(v => v.name),
        finalHand: playerHand.map(v => v.name),
        topSelection: { n: topN, values: finalTop },
        trades: tradesJson,
        timing,
      },
    };
    const { error } = await supabase.from('sessions').insert(payload);
    if (error) console.error('Failed to save session:', error);
  }, [condition, dealtPlayerHand, playerHand, finalTop, trades, phaseTiming, partners, topN]);

  saveSessionRef.current = saveSession;

  const resetGame = useCallback(() => {
    setPhase("mode-select");
    setDealtPlayerHand([]);
    setPlayerHand([]);
    setPartners([]);
    setTrades([]);
    setFinalTop([]);
    setPhaseStartTime(Date.now());
    setPhaseTiming({});
  }, []);

  const exportData = useCallback(() => {
    const rankingToList = (r: Ranking) =>
      Object.entries(r).sort((a, b) => a[1] - b[1]).map(([name]) => name);

    const data = {
      sessionId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      condition,
      partners: partners.map((p) => ({
        id: p.id,
        privateRanking: rankingToList(p.ranking),
        successfulTrades: p.successes,
        offersReceived: p.offersMade,
      })),
      dealtHand: dealtPlayerHand.map((v) => v.name),
      trades,
      finalHand: playerHand.map((v) => v.name),
      topSelection: { n: topN, values: finalTop },
      timing: phaseTiming,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `value-cards-session-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [condition, partners, dealtPlayerHand, trades, playerHand, topN, finalTop, phaseTiming]);

  return {
    phase, setPhase, advancePhase, phaseIndex, totalPhases,
    phaseTiming, phaseStartTime,
    condition, startStudy,
    dealtPlayerHand, playerHand,
    partners, partnerProfiles, partnerMaxedOut,
    trades,
    topN, finalTop, toggleTop,
    dealCards, makeOffer, canFinishTrading,
    resetGame, exportData,
  };
};
