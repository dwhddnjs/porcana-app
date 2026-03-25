import { useMemo } from 'react';
import { View, ScrollView, LayoutChangeEvent } from 'react-native';
import { Text } from '@/components/ui/text';
import { SelectedAssetItem } from './selected-asset-item';
import { AssetLibraryItemTypes } from '@/lib/api/asset';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';

interface DropZonePropsTypes {
  selectedAssets: AssetLibraryItemTypes[];
  onRemoveAsset: (assetId: string) => void;
  isDragOverSV: SharedValue<boolean>;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const DropZone = ({
  selectedAssets,
  onRemoveAsset,
  isDragOverSV,
  onLayout,
}: DropZonePropsTypes) => {
  const reversedAssets = useMemo(() => [...selectedAssets].reverse(), [selectedAssets]);

  const borderStyle = useAnimatedStyle(() => ({
    opacity: isDragOverSV.value ? 1 : 0,
  }));

  return (
    <View onLayout={onLayout} className="border-border flex-1 overflow-hidden rounded-xl border-[1.5px]">
      {/* 드래그 오버 하이라이트 오버레이 */}
      <Animated.View
        style={borderStyle}
        pointerEvents="none"
        className="bg-primary/10 border-primary absolute inset-0 z-0 rounded-xl border-2"
      />

      {/* 헤더 */}
      <View className="z-10 flex-row items-center justify-between px-3 pt-3">
        <Text className="text-primary text-base font-bold">선택한 종목</Text>
        <Text className="text-muted-foreground text-sm font-semibold">
          {selectedAssets.length} / 10
        </Text>
      </View>

      {selectedAssets.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground text-center text-sm">
            카드를 드래그하여{'\n'}추가하세요
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            paddingTop: 12,
            paddingBottom: 8,
            paddingHorizontal: 12,
          }}>
          {reversedAssets.map((asset, index) => {
            const handleRemove = () => onRemoveAsset(asset.assetId);
            return (
              <SelectedAssetItem
                key={asset.assetId}
                asset={asset}
                index={index}
                onRemove={handleRemove}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};
