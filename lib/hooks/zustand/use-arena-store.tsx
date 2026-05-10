import { create } from 'zustand';

export interface AssetTypes {
  assetId: string;
  ticker: string;
  name: string;
  sector: string;
  market: string;
  assetClass: string | null;
  currentRiskLevel: number;
  imageUrl: string | string[];
  impactHint: string;
}

interface ArenaStateTypes {
  name: string;
  picked: {
    riskProfile: string;
    sectors: string[];
  } | null;
  selectedCards: AssetTypes[];
  shownAssetIds: string[];

  setName: (name: string) => void;
  setPicked: (picked: { riskProfile: string; sectors: string[] }) => void;
  addCard: (card: AssetTypes) => void;
  addShown: (ids: string[]) => void;
  clearCards: () => void;
  resetArena: () => void;
}

export const useArenaStore = create<ArenaStateTypes>((set) => ({
  name: '',
  picked: null,
  selectedCards: [],
  shownAssetIds: [],
  setName: (name) => set({ name }),
  setPicked: (picked) => set({ picked }),
  addCard: (card) =>
    set((state) => ({
      selectedCards: [...state.selectedCards, card],
    })),
  addShown: (ids) =>
    set((state) => {
      const merged = new Set(state.shownAssetIds);
      ids.forEach((id) => merged.add(id));
      if (merged.size === state.shownAssetIds.length) return state;
      return { shownAssetIds: Array.from(merged) };
    }),
  clearCards: () => set({ selectedCards: [], shownAssetIds: [] }),
  resetArena: () =>
    set({
      name: '',
      picked: null,
      selectedCards: [],
      shownAssetIds: [],
    }),
}));
