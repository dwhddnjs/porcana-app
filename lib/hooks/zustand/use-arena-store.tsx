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
  picked: {
    riskProfile: string;
    sectors: string[];
  } | null;
  selectedCards: AssetTypes[];

  setName: (name: string) => void;
  setPicked: (picked: { riskProfile: string; sectors: string[] }) => void;
  addCard: (card: AssetTypes) => void;
  clearCards: () => void;
  resetArena: () => void;
}

export const useArenaStore = create<ArenaStateTypes>((set) => ({
  name: '',
  picked: null,
  selectedCards: [],
  setName: (name) => set({ name }),
  setPicked: (picked) => set({ picked }),
  addCard: (card) =>
    set((state) => ({
      selectedCards: [...state.selectedCards, card],
    })),
  clearCards: () => set({ selectedCards: [] }),
  resetArena: () =>
    set({
      name: '',
      picked: null,
      selectedCards: [],
    }),
}));
