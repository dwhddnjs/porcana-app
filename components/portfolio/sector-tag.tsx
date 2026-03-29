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
  onPress: () => void;
}

export const SectorTag = ({ sectorType, label, isSelected, onPress }: SectorTagPropsTypes) => {
  return (
    <Pressable
      onPress={onPress}
      className={`border-primary flex-row items-center justify-center gap-x-[6px] rounded-full border-2 px-[12px] py-[4px] ${isSelected ? 'bg-primary' : ''}`}>
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
