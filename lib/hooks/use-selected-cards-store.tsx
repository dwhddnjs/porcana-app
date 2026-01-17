import { create } from "zustand";

interface SelectedCardsState {
  selectedCards: number[];
  setSelectedCards: (cards: number[] | ((prev: number[]) => number[])) => void;
  addCard: (card: number) => void;
  clearCards: () => void;
}

export const useSelectedCardsStore = create<SelectedCardsState>((set) => ({
  selectedCards: [],
  setSelectedCards: (cards) =>
    set((state) => ({
      selectedCards:
        typeof cards === "function" ? cards(state.selectedCards) : cards,
    })),
  addCard: (card) =>
    set((state) => ({
      selectedCards: [...state.selectedCards, card],
    })),
  clearCards: () => set({ selectedCards: [] }),
}));
