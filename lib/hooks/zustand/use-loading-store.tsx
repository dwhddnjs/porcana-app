import { create } from 'zustand';

interface LoadingStateTypes {
  isLoading: boolean;
  message?: string;
  show: (message?: string) => void;
  hide: () => void;
}

export const useLoadingStore = create<LoadingStateTypes>()((set) => ({
  isLoading: false,
  message: undefined,
  show: (message?: string) => set({ isLoading: true, message }),
  hide: () => set({ isLoading: false, message: undefined }),
}));
