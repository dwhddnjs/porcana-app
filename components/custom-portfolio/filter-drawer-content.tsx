import { View, Pressable, ScrollView, Switch } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { SectorTag } from '@/components/portfolio/sector-tag';
import { SECTOR_OPTIONS, SECTOR_KO_MAP } from '@/lib/constant/variables';
import { useState } from 'react';
import { MarketTypes, AssetTypeTypes } from '@/lib/api/asset';
import {
  useCustomPortfolioStore,
  FilterValuesTypes,
} from '@/lib/hooks/zustand/use-custom-portfolio-store';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

interface FilterDrawerContentProps {
  navigation: DrawerContentComponentProps['navigation'];
}

export const FilterDrawerContent = ({ navigation }: FilterDrawerContentProps) => {
  const { filters, setFilters, resetFilters, quickMode, toggleQuickMode } =
    useCustomPortfolioStore();
  const [localFilters, setLocalFilters] = useState<FilterValuesTypes>(filters);

  const handleToggleMarket = (market: MarketTypes) => {
    setLocalFilters((prev) => ({
      ...prev,
      market: prev.market === market ? undefined : market,
    }));
  };

  const handleToggleType = (type: AssetTypeTypes) => {
    setLocalFilters((prev) => ({
      ...prev,
      type: prev.type === type ? undefined : type,
    }));
  };

  const handleToggleSector = (sector: string) => {
    setLocalFilters((prev) => {
      const exists = prev.sectors.includes(sector);
      return {
        ...prev,
        sectors: exists ? prev.sectors.filter((s) => s !== sector) : [...prev.sectors, sector],
      };
    });
  };

  const handleToggleRisk = (level: number) => {
    setLocalFilters((prev) => {
      const exists = prev.riskLevels.includes(level);
      return {
        ...prev,
        riskLevels: exists
          ? prev.riskLevels.filter((l) => l !== level)
          : [...prev.riskLevels, level],
      };
    });
  };

  const handleToggleSort = (sortBy: 'name' | 'symbol' | 'riskLevel') => {
    setLocalFilters((prev) => {
      if (prev.sortBy === sortBy) {
        const newDir = prev.sortDirection === 'asc' ? 'desc' : 'asc';
        return { ...prev, sortDirection: newDir };
      }
      return { ...prev, sortBy, sortDirection: 'asc' };
    });
  };

  const handleApply = () => {
    setFilters(localFilters);
    navigation.closeDrawer();
  };

  const handleReset = () => {
    const reset: FilterValuesTypes = {
      market: undefined,
      type: undefined,
      sectors: [],
      riskLevels: [],
      sortBy: undefined,
      sortDirection: undefined,
    };
    setLocalFilters(reset);
    resetFilters();
  };

  return (
    <View className="bg-background flex-1 px-4 pt-12">
      <Text className="text-primary mb-4 text-xl font-bold">필터</Text>

      {/* 퀵모드 스위치 */}
      <View className="border-border mb-4 flex-row items-center justify-between border-b pb-4">
        <View>
          <Text className="text-primary text-sm font-bold">퀵 모드</Text>
          <Text className="text-muted-foreground text-xs">터치만으로 바로 추가</Text>
        </View>
        <Switch value={quickMode} onValueChange={toggleQuickMode} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 20, paddingBottom: 20 }}>
        {/* Market */}
        <View>
          <Text className="text-primary mb-2 text-sm font-bold">마켓</Text>
          <View className="flex-row gap-2">
            {(['US', 'KR'] as MarketTypes[]).map((m) => (
              <ToggleChip
                key={m}
                label={m}
                isSelected={localFilters.market === m}
                onPress={() => handleToggleMarket(m)}
              />
            ))}
          </View>
        </View>

        {/* Type */}
        <View>
          <Text className="text-primary mb-2 text-sm font-bold">종류</Text>
          <View className="flex-row gap-2">
            {(['STOCK', 'ETF'] as AssetTypeTypes[]).map((t) => (
              <ToggleChip
                key={t}
                label={t}
                isSelected={localFilters.type === t}
                onPress={() => handleToggleType(t)}
              />
            ))}
          </View>
        </View>

        {/* Sectors */}
        <View>
          <Text className="text-primary mb-2 text-sm font-bold">섹터</Text>
          <View className="flex-row flex-wrap gap-2">
            {SECTOR_OPTIONS.map((sector) => (
              <SectorTag
                key={sector}
                sectorType={sector}
                label={SECTOR_KO_MAP[sector]}
                isSelected={localFilters.sectors.includes(sector)}
                onPress={() => handleToggleSector(sector)}
              />
            ))}
          </View>
        </View>

        {/* Risk Level */}
        <View>
          <Text className="text-primary mb-2 text-sm font-bold">리스크 레벨</Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <ToggleChip
                key={level}
                label={`${level}`}
                isSelected={localFilters.riskLevels.includes(level)}
                onPress={() => handleToggleRisk(level)}
              />
            ))}
          </View>
        </View>

        {/* Sort */}
        <View>
          <Text className="text-primary mb-2 text-sm font-bold">정렬</Text>
          <View className="flex-row gap-2">
            {(
              [
                { key: 'name', label: '이름' },
                { key: 'symbol', label: '심볼' },
                { key: 'riskLevel', label: '리스크' },
              ] as const
            ).map(({ key, label }) => {
              const isActive = localFilters.sortBy === key;
              const dirLabel = isActive
                ? localFilters.sortDirection === 'asc'
                  ? ' ↑'
                  : ' ↓'
                : '';
              return (
                <ToggleChip
                  key={key}
                  label={`${label}${dirLabel}`}
                  isSelected={isActive}
                  onPress={() => handleToggleSort(key)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View className="flex-row gap-3 pb-6">
        <Button variant="outline" className="flex-1" onPress={handleReset}>
          <Text>초기화</Text>
        </Button>
        <Button className="flex-1" onPress={handleApply}>
          <Text>적용</Text>
        </Button>
      </View>
    </View>
  );
};

interface ToggleChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const ToggleChip = ({ label, isSelected, onPress }: ToggleChipProps) => {
  return (
    <Pressable
      onPress={onPress}
      className={`border-primary rounded-full border-2 px-3 py-1 ${isSelected ? 'bg-primary' : ''}`}>
      <Text className={`text-sm ${isSelected ? 'text-primary-foreground font-bold' : ''}`}>
        {label}
      </Text>
    </Pressable>
  );
};
