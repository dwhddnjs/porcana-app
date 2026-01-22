import { create } from 'zustand';

export interface Asset {
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

interface ArenaState {
  name: string;
  portfolioId: string;
  sessionId: string;
  status: string;
  currentRound: number;
  picked: {
    riskProfile: string;
    sectors: string[];
  } | null;
  selectedCards: Asset[];

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
  addCard: (card: Asset) => void;
  clearCards: () => void;
  resetArena: () => void;
}

export const useArenaStore = create<ArenaState>((set) => ({
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
