import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import { AssetLibraryItemTypes } from '@/lib/api/asset';
import { CustomSlider } from './custom-slider';

interface WeightAssetItemProps {
  asset: AssetLibraryItemTypes;
  weightPct: number;
  onWeightChange: (value: number) => void;
  onRemove: () => void;
}

export const WeightAssetItem = ({
  asset,
  weightPct,
  onWeightChange,
  onRemove,
}: WeightAssetItemProps) => {
  const marketCode = asset.symbol
    ? `${asset.symbol} · ${asset.market}`
    : asset.market;

  return (
    <View className="bg-card flex-row items-center gap-3 rounded-xl px-4 py-3">
      {/* 에셋 이미지 */}
      <View className="bg-muted h-10 w-10 items-center justify-center overflow-hidden rounded-full">
        {asset.imageUrl ? (
          <Image source={asset.imageUrl} className="h-10 w-10 rounded-full" contentFit="contain" />
        ) : (
          <Text className="text-muted-foreground text-sm font-bold">
            {asset.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      {/* 에셋 정보 + 슬라이더 */}
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-foreground text-sm font-bold" numberOfLines={1}>
              {asset.name}
            </Text>
            <Text className="text-muted-foreground text-xs">{marketCode}</Text>
          </View>

          {/* 퍼센트 표시 */}
          <Text className="text-success ml-2 min-w-[40px] text-right text-sm font-bold">
            {weightPct}%
          </Text>

          {/* X 버튼 */}
          <Pressable
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="ml-2 p-1">
            <Icon as={X} size={16} className="text-muted-foreground" />
          </Pressable>
        </View>

        {/* 슬라이더 */}
        <CustomSlider value={weightPct} onValueChange={onWeightChange} min={0} max={100} />
      </View>
    </View>
  );
};
