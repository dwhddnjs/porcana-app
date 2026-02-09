import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { Star, TrendingUp } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Portfolio } from '@/lib/api/portfolio';
import { Spacer } from '../spacer';

type PortfolioListItemProps = {
  portfolio: Portfolio;
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
                  'text-sm',
                  portfolio.totalReturnPct >= 0 ? 'text-link' : 'text-destructive'
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
                  <Image
                    source={asset.imageUrl}
                    className="bg-background border-primary/10 h-8 w-8 rounded-full border"
                    contentFit="contain"
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
                  <Text className="text-success ml-auto text-sm font-semibold">
                    {asset.weight}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
};
