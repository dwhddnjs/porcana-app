import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import { AssetLibraryItemTypes } from '@/lib/api/asset';
import { CustomSlider } from './custom-slider';

interface WeightAssetItemPropsTypes {
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
}: WeightAssetItemPropsTypes) => {
  const marketCode = asset.symbol ? `${asset.symbol} · ${asset.market}` : asset.market;

  return (
    <View className="bg-background border-primary flex-row items-center gap-3 rounded-xl border px-4 py-3">
      {/* 에셋 이미지 */}
      <View className="bg-muted h-10 w-10 items-center justify-center overflow-hidden rounded-full">
        <Image source={asset.imageUrl} className="h-10 w-10 rounded-full" contentFit="contain" />
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
        </View>

        {/* 슬라이더 */}
        <CustomSlider value={weightPct} onValueChange={onWeightChange} min={0} max={50} />
      </View>
    </View>
  );
};
