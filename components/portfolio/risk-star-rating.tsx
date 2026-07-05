import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Star, StarHalf } from 'lucide-react-native';
import { getRiskStarColor } from '@/lib/constant/function';

type RiskStarRatingProps = {
  riskLevel: number;
  colorScheme?: 'light' | 'dark';
  size?: number;
};

export const RiskStarRating = ({
  riskLevel,
  colorScheme = 'light',
  size = 16,
}: RiskStarRatingProps) => {
  const fullStars = Math.floor(riskLevel);
  const hasHalfStar = riskLevel % 1 >= 0.5;
  const fillColor = getRiskStarColor(riskLevel, colorScheme);

  return (
    <View className="flex-row items-center gap-1">
      {Array.from({ length: fullStars }).map((_, index) => (
        <Icon key={`full-${index}`} as={Star} size={size} strokeWidth={0} fill={fillColor} />
      ))}
      {hasHalfStar && (
        <Icon key="half" as={StarHalf} size={size} strokeWidth={0} fill={fillColor} />
      )}
    </View>
  );
};
