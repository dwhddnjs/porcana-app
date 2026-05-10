import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { AssetImage } from '@/components/portfolio/asset-image';
import { Icon } from '@/components/ui/icon';
import { Star, TriangleAlert } from 'lucide-react-native';
import { AssetLibraryItemTypes } from '@/lib/api/asset';
import { getRiskStarColor } from '@/lib/constant/function';
import { sectorLabels } from '@/lib/constant/variables';

interface GhostCardPropsTypes {
  asset: AssetLibraryItemTypes;
  colorScheme: 'light' | 'dark';
}

export const GhostCard = ({ asset, colorScheme }: GhostCardPropsTypes) => {
  return (
    <View className="bg-card border-primary h-full w-full rounded-xl border-[1.5px] px-[8px] py-[8px] opacity-80 shadow-xl shadow-black/40">
      <View className="flex-row items-center gap-[6px]">
        <AssetImage imageUrl={asset.imageUrl} name={asset.name} size={32} />
        <View className="flex-1 gap-[2px]">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-primary text-xs font-bold text-ellipsis">
            {asset.name}
          </Text>
          <Text className="text-muted-foreground text-[10px]" numberOfLines={1}>
            {asset.symbol}
          </Text>
        </View>
      </View>

      {(asset.sector || asset.market) && (
        <View className="mt-1.5 flex-row flex-wrap gap-1">
          {asset.sector && (
            <View className="bg-primary/10 items-center justify-center rounded px-1.5 py-0.5">
              <Text className="text-primary text-[10px] font-semibold">
                {sectorLabels[asset.sector] || asset.sector}
              </Text>
            </View>
          )}
          {asset.market && (
            <View className="border-primary/10 rounded border px-1.5 py-0.5">
              <Text className="text-muted-foreground text-[10px] font-semibold">
                {asset.market}
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="flex-1 items-center justify-center px-[2px]">
        {asset.impactHint ? (
          <Text
            className="text-muted-foreground text-center text-[11px] leading-[15px]"
            numberOfLines={4}>
            {asset.impactHint}
          </Text>
        ) : null}
      </View>

      <View className="mt-auto items-center justify-start gap-1.5">
        <View className="flex-row items-center gap-1">
          <Icon as={TriangleAlert} size={12} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-[10px] font-bold">리스크</Text>
        </View>
        <View className="flex-row items-center gap-1.5 pb-[2px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon
              key={i}
              as={Star}
              size={14}
              color={getRiskStarColor(asset.currentRiskLevel, colorScheme)}
              fill={
                i < asset.currentRiskLevel
                  ? getRiskStarColor(asset.currentRiskLevel, colorScheme)
                  : 'transparent'
              }
            />
          ))}
        </View>
      </View>
    </View>
  );
};
