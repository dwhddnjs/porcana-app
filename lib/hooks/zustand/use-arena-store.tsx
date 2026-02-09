import { create } from 'zustand';

export interface AssetTypes {
  assetId: string;
  ticker: string;
  name: string;
  sector: string;
  market: string;
  assetClass: string | null;
  currentRiskLevel: number;
  imageUrl: string;
  impactHint: string;
}

interface ArenaStateTypes {
  name: string;
  portfolioId: string;
  sessionId: string;
  status: string;
  currentRound: number;
  picked: {
    riskProfile: string;
    sectors: string[];
  } | null;
  selectedCards: AssetTypes[];

  setPortfolio: ({
    name,
    portfolioId,
    sessionId,
    status,
    currentRound,
  }: {
    name: string;
    portfolioId: string;
    sessionId: string;
    status: string;
    currentRound: number;
  }) => void;
  setPicked: (picked: { riskProfile: string; sectors: string[] }, currentRound: number) => void;
  addCard: (card: AssetTypes) => void;
  clearCards: () => void;
  resetArena: () => void;
}

export const useArenaStore = create<ArenaStateTypes>((set) => ({
  name: '',
  portfolioId: '',
  sessionId: '',
  status: '',
  currentRound: 0,
  picked: null,
  selectedCards: [],
  setPortfolio: ({ name, portfolioId, sessionId, status, currentRound }) =>
    set({ name, portfolioId, sessionId, status, currentRound }),
  setPicked: (picked, currentRound) => set({ picked, currentRound }),
  addCard: (card) =>
    set((state) => ({
      selectedCards: [...state.selectedCards, card],
    })),
  clearCards: () => set({ selectedCards: [] }),
  resetArena: () =>
    set({
      name: '',
      portfolioId: '',
      sessionId: '',
      status: '',
      currentRound: 0,
      picked: null,
      selectedCards: [],
    }),
}));
