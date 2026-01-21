import { create } from 'zustand';

interface ArenaState {
  name: string;
  portfolioId: string;
  setPortfolio: ({ name, portfolioId }: { name: string; portfolioId: string }) => void;
}

export const useArenaStore = create<ArenaState>((set) => ({
  name: '',
  portfolioId: '',
  setPortfolio: ({ name, portfolioId }) => set({ name, portfolioId }),
}));
