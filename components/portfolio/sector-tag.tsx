import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  BrickWall,
  Podcast,
  ShoppingBag,
  ShoppingCart,
  Zap,
  Database,
  BriefcaseMedical,
  Factory,
  Hotel,
  Cpu,
  Plug,
} from 'lucide-react-native';
import { Icon } from '../ui/icon';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

const SECTOR_ICON = {
  MATERIALS: BrickWall,
  COMMUNICATION_SERVICES: Podcast,
  CONSUMER_DISCRETIONARY: ShoppingBag,
  CONSUMER_STAPLES: ShoppingCart,
  ENERGY: Zap,
  FINANCIALS: Database,
  HEALTH_CARE: BriefcaseMedical,
  INDUSTRIALS: Factory,
  REAL_ESTATE: Hotel,
  INFORMATION_TECHNOLOGY: Cpu,
  UTILITIES: Plug,
};

interface SectorTagPropsTypes {
  sectorType: string;
  label: string;
  isSelected: boolean;
  disabled?: boolean;
  onPress: (sectorType: string) => void;
}

export const SectorTag = ({
  sectorType,
  label,
  isSelected,
  disabled,
  onPress,
}: SectorTagPropsTypes) => {
  const handlePress = useCallback(() => {
    onPress(sectorType);
  }, [onPress, sectorType]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={cn(
        'border-primary flex-row items-center justify-center gap-x-[6px] rounded-full border-2 px-[12px] py-[4px]',
        isSelected && 'bg-primary',
        disabled && !isSelected && 'opacity-40'
      )}>
      <Icon
        as={SECTOR_ICON[sectorType as keyof typeof SECTOR_ICON]}
        className={cn('size-4', isSelected ? 'text-primary-foreground' : 'text-foreground')}
      />
      <Text className={`text-sm ${isSelected ? 'text-primary-foreground font-bold' : ''}`}>
        {label}
      </Text>
    </Pressable>
  );
};
