import { useCallback } from 'react';
import { GestureResponderEvent, Pressable, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import { AssetLibraryItemTypes } from '@/lib/api/asset';
import { getRiskStarColor } from '@/lib/constant/function';

interface SelectedAssetItemPropsTypes {
  asset: AssetLibraryItemTypes;
  index: number;
  onRemove: () => void;
  onPress: () => void;
}

export const SelectedAssetItem = ({ asset, index, onRemove, onPress }: SelectedAssetItemPropsTypes) => {
  const colorScheme = useColorScheme() ?? 'light';

  const handleRemove = useCallback(
    (e: GestureResponderEvent) => {
      e.stopPropagation();
      onRemove();
    },
    [onRemove]
  );

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <Pressable onPress={onPress} className="bg-card border-border relative flex-row items-center gap-2 rounded-lg border p-2 pr-2">
        <Image
          source={asset.imageUrl}
          className="bg-background h-8 w-8 rounded-full"
          contentFit="contain"
          emptyIconClassName="size-4"
        />

        <View className="flex-1">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-foreground max-w-[100px] text-sm font-semibold text-ellipsis">
            {asset.name}
          </Text>
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {asset.symbol}
          </Text>
        </View>

        <View
          className="h-6 w-6 items-center justify-center rounded-full border-[1.5px]"
          style={{ borderColor: getRiskStarColor(asset.currentRiskLevel, colorScheme) }}>
          <Text
            style={{
              color: getRiskStarColor(asset.currentRiskLevel, colorScheme),
              includeFontPadding: false,
              textAlignVertical: 'center',
              lineHeight: 20,
            }}
            className="text-xs font-bold">
            {asset.currentRiskLevel}
          </Text>
        </View>

        <Pressable
          onPress={handleRemove}
          className="bg-background border-muted-foreground absolute -top-2 -right-2 h-5 w-5 items-center justify-center rounded-full border">
          <Icon as={X} size={12} className="text-muted-foreground" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};
