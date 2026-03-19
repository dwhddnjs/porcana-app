import { AssetLibraryItemTypes, MarketTypes, AssetTypeTypes } from '@/lib/api/asset';
import { create } from 'zustand';

export interface FilterValuesTypes {
  market?: MarketTypes;
  type?: AssetTypeTypes;
  sectors: string[];
  riskLevels: number[];
  sortBy?: 'name' | 'symbol' | 'riskLevel';
  sortDirection?: 'asc' | 'desc';
}

interface CustomPortfolioStateTypes {
  selectedAssets: AssetLibraryItemTypes[];
  filters: FilterValuesTypes;
  quickMode: boolean;
  addAsset: (asset: AssetLibraryItemTypes) => void;
  removeAsset: (assetId: string) => void;
  clearAssets: () => void;
  setFilters: (filters: FilterValuesTypes) => void;
  resetFilters: () => void;
  toggleQuickMode: () => void;
}

const DEFAULT_FILTERS: FilterValuesTypes = {
  sectors: [],
  riskLevels: [],
};

export const useCustomPortfolioStore = create<CustomPortfolioStateTypes>((set) => ({
  selectedAssets: [],
  filters: { ...DEFAULT_FILTERS },
  quickMode: false,
  addAsset: (asset) =>
    set((state) => {
      if (state.selectedAssets.some((a) => a.assetId === asset.assetId)) return state;
      return { selectedAssets: [...state.selectedAssets, asset] };
    }),
  removeAsset: (assetId) =>
    set((state) => ({
      selectedAssets: state.selectedAssets.filter((a) => a.assetId !== assetId),
    })),
  clearAssets: () => set({ selectedAssets: [] }),
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
  toggleQuickMode: () => set((state) => ({ quickMode: !state.quickMode })),
}));
