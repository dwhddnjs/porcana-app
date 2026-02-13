import Container from '@/components/container';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/ui/header';
import { Input } from '@/components/ui/input';
import { KeyboardStickyButton } from '@/components/ui/keyboard-sticky-button';
import { Text } from '@/components/ui/text';
import { useUpdateProfileMutation } from '@/lib/hooks/mutation/user';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, accessToken } = useUserStore();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const { mutate } = useUpdateProfileMutation();

  const isDisabled = nickname.trim().length === 0 || nickname.trim() === user?.nickname;
  const onSubmit = () => {
    if (isDisabled) return;
    mutate({ nickname: nickname.trim() });
  };

  return (
    <Container>
      <Header title="닉네임 변경" />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View className="flex-1 px-4 pt-[20px]">
          <Input
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력해주세요"
            autoFocus
            maxLength={20}
          />
        </View>
      </KeyboardAvoidingView>
      <KeyboardStickyButton onPress={onSubmit} size="lg" disabled={isDisabled}>
        <Text>변경</Text>
      </KeyboardStickyButton>
    </Container>
  );
}
