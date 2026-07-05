import { Spacer } from '@/components/ui/spacer';
import { Header } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ThemeModeTypes, useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { CheckIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';

const THEME_OPTIONS: { mode: ThemeModeTypes; label: string }[] = [
  { mode: 'dark', label: '다크 모드' },
  { mode: 'light', label: '라이트 모드' },
  { mode: 'system', label: '시스템 기본 설정' },
];

type ThemeOptionRowProps = {
  mode: ThemeModeTypes;
  label: string;
  isSelected: boolean;
  onSelect: (mode: ThemeModeTypes) => void;
};

const ThemeOptionRow = ({ mode, label, isSelected, onSelect }: ThemeOptionRowProps) => {
  const handlePress = useCallback(() => {
    onSelect(mode);
  }, [onSelect, mode]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isSelected}
      className="flex-row items-center px-4 py-3.5 active:opacity-70">
      <Text className="flex-1 text-base">{label}</Text>
      {isSelected && <Icon as={CheckIcon} className="text-primary size-5" />}
    </Pressable>
  );
};

export default function ColorModeScreen() {
  const insets = useSafeAreaInsets();
  const themeMode = useUserStore((s) => s.themeMode);
  const setThemeMode = useUserStore((s) => s.setThemeMode);

  const handleSelect = useCallback(
    (mode: ThemeModeTypes) => {
      if (mode === themeMode) return;
      setThemeMode(mode);
    },
    [themeMode, setThemeMode]
  );

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top }}>
      <Header title="컬러 모드" />

      <View className="px-4 pt-[12px]">
        <View className="bg-card rounded-lg">
          {THEME_OPTIONS.map((option, index) => (
            <View key={option.mode}>
              {index > 0 && <Spacer isDivider className="mx-4" />}
              <ThemeOptionRow
                mode={option.mode}
                label={option.label}
                isSelected={option.mode === themeMode}
                onSelect={handleSelect}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
