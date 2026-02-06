import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Pressable } from 'react-native';
import { ChevronRightIcon } from 'lucide-react-native';

interface MenuItemProps {
  icon: React.ComponentProps<typeof Icon>['as'];
  label: string;
  onPress: () => void;
  right?: React.ReactNode;
}

export const MenuItem = ({ icon, label, onPress, right }: MenuItemProps) => {
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-3.5 active:opacity-70">
      <Icon as={icon} className="text-foreground size-5" />
      <Text className="ml-3 flex-1 text-base">{label}</Text>
      {right ?? <Icon as={ChevronRightIcon} className="text-muted-foreground size-5" />}
    </Pressable>
  );
};
