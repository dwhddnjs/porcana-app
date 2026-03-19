import { View, ScrollView, LayoutChangeEvent } from 'react-native';
import { Text } from '@/components/ui/text';
import { SelectedAssetItem } from './selected-asset-item';
import { AssetLibraryItemTypes } from '@/lib/api/asset';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';

interface DropZoneProps {
  selectedAssets: AssetLibraryItemTypes[];
  onRemoveAsset: (assetId: string) => void;
  isDragOverSV: SharedValue<boolean>;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const DropZone = ({ selectedAssets, onRemoveAsset, isDragOverSV, onLayout }: DropZoneProps) => {
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: isDragOverSV.value ? undefined : undefined,
    opacity: isDragOverSV.value ? 1 : 0,
  }));

  return (
    <View onLayout={onLayout} className="border-border flex-1 rounded-xl border-2 border-dashed p-3">
      {/* 드래그 오버 하이라이트 오버레이 */}
      <Animated.View
        style={borderStyle}
        pointerEvents="none"
        className="bg-primary/10 border-primary absolute inset-0 rounded-xl border-2"
      />

      <Text className="text-primary mb-2 text-base font-bold">
        선택된 에셋 ({selectedAssets.length})
      </Text>

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
          contentContainerStyle={{ gap: 8 }}>
          {selectedAssets.map((asset) => {
            const handleRemove = () => onRemoveAsset(asset.assetId);
            return (
              <SelectedAssetItem key={asset.assetId} asset={asset} onRemove={handleRemove} />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};
