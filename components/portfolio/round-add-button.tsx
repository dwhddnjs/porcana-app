import { LucideIcon, Plus } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { Icon } from '@/components/ui/icon';
import { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useCSSVariable } from 'uniwind';

interface RoundAddButtonProps extends PressableProps {
  style?: StyleProp<PressableProps>;
  onPress: () => void;
  size?: number;
  icon?: LucideIcon;
}

export const RoundAddButton = ({ style, onPress, size = 64, icon = Plus }: RoundAddButtonProps) => {
  const primaryColor = useCSSVariable('--color-primary') as string;

  return (
    <PressableScale
      style={[
        {
          backgroundColor: primaryColor,
          borderRadius: 100,
          padding: 10,
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          right: 20,
          bottom: 20,
        },
        style,
      ]}
      onPress={onPress}>
      <Icon as={icon} className="text-primary-foreground size-8" />
    </PressableScale>
  );
};
