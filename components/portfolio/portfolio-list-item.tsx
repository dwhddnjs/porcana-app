import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { AssetImage } from '@/components/portfolio/asset-image';
import { cn } from '@/lib/utils';
import { Star, TrendingUp } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { PortfolioTypes } from '@/lib/api/portfolio';
import { Spacer } from '@/components/ui/spacer';

type PortfolioListItemProps = {
  portfolio: PortfolioTypes;
  onSelect: (portfolioId: string) => void;
  onSetMain: (portfolioId: string, isMain: boolean) => void;
};

export const PortfolioListItem = ({ portfolio, onSelect, onSetMain }: PortfolioListItemProps) => {
  return (
    <View
      className={cn(
        'border-primary/10 flex-row items-center justify-between rounded-md border px-[16px] py-[12px]',
        portfolio.isMain ? 'bg-primary/5' : 'bg-muted/50'
      )}>
      <Pressable className="flex-1" onPress={() => onSelect(portfolio.portfolioId)}>
        <View className="flex-1 gap-y-[4px]">
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-2">
                <Icon as={TrendingUp} size={18} className="text-primary" />
                <Text className="font-semibold">{portfolio.name}</Text>
              </View>

              <Text
                className={cn(
                  'text-sm font-semibold',
                  portfolio.totalReturnPct >= 0 ? 'text-stock-up' : 'text-stock-down'
                )}>
                {portfolio.totalReturnPct >= 0 ? '+' : ''}
                {portfolio.totalReturnPct.toFixed(2)}%
              </Text>
            </View>

            <Pressable
              onPress={() => onSetMain(portfolio.portfolioId, portfolio.isMain)}
              hitSlop={8}>
              <Icon
                as={Star}
                size={20}
                className={portfolio.isMain ? 'text-yellow-500' : 'text-muted-foreground'}
                fill={portfolio.isMain ? '#eab308' : 'transparent'}
              />
            </Pressable>
          </View>

          {portfolio.topAssets && portfolio.topAssets.length > 0 && (
            <View className="border-primary/10 mt-1 gap-1">
              {portfolio.topAssets.map((asset) => (
                <View key={asset.assetId} className="flex-row items-center gap-3 py-[2px] pt-2">
                  <AssetImage
                    imageUrl={asset.imageUrl}
                    name={asset.name}
                    size={32}
                    className="border-primary/10 border"
                  />
                  <View className="gap-y-[2px]">
                    <Text
                      className="max-w-[100px] text-sm font-semibold"
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {asset.name}
                    </Text>
                    <Text className="text-muted-foreground text-xs">{asset.symbol}</Text>
                  </View>
                  <Text className="text-weight ml-auto text-sm font-semibold">{asset.weight}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
};
