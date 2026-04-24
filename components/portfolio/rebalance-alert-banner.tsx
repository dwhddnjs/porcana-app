import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { TriangleAlert } from 'lucide-react-native';
import { type RebalanceStatusResponseTypes } from '@/lib/api/portfolio';

type RebalanceAlertBannerPropsTypes = {
  status: RebalanceStatusResponseTypes;
};

export const RebalanceAlertBanner = ({ status }: RebalanceAlertBannerPropsTypes) => {
  if (!status.needsRebalancing || status.summary.overThresholdCount <= 0) {
    return null;
  }

  return (
    <View className="bg-stock-up-muted flex-row items-center gap-[10px] rounded-xl px-[14px] py-[12px]">
      <Icon as={TriangleAlert} size={18} className="text-stock-up" />
      <View className="flex-1 gap-[2px]">
        <Text className="text-stock-up text-sm font-semibold">리밸런싱이 필요해요</Text>
        <Text className="text-muted-foreground text-xs">
          {status.summary.overThresholdCount}개 자산이 목표 비중에서 {status.thresholdPct}% 이상
          벗어났어요
        </Text>
      </View>
    </View>
  );
};
