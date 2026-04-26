import { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatWithComma, formatKoreanUnit } from '@/lib/constant/function';
import * as Haptics from 'expo-haptics';

type AmountInputPropsTypes = {
  value: string;
  onChangeText: (text: string) => void;
  isUsd: boolean;
  children?: React.ReactNode;
};

export const AmountInput = ({ value, onChangeText, isUsd, children }: AmountInputPropsTypes) => {
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText(text);
  };

  const numericValue = parseInt(value, 10);
  const currencyLabel = isUsd ? '달러' : '원';

  return (
    <View className="items-center py-[24px]">
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="numeric"
        style={{ position: 'absolute', opacity: 0, height: 0 }}
      />
      <View className="w-full">
        <Pressable onPress={handleFocus} className="px-[16px]">
          {value && numericValue >= 10000 && (
            <Text
              className="text-muted-foreground text-right text-sm font-semibold"
              style={{ position: 'absolute', top: -26, right: 16 }}>
              {formatKoreanUnit(numericValue)}
              {currencyLabel}
            </Text>
          )}
          <Text
            className={`text-center text-5xl font-bold ${value ? 'text-foreground' : 'text-muted'}`}
            adjustsFontSizeToFit
            numberOfLines={1}>
            {value ? formatWithComma(value) : '0'}
            <Text className="text-2xl">{isUsd ? ' $' : ' 원'}</Text>
          </Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
};
