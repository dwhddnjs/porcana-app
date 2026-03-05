import Container from '@/components/container';
import { SignInForm } from '@/components/sign-in-form';
import { Spacer } from '@/components/spacer';
import { Header } from '@/components/ui/header';
import { Input } from '@/components/ui/input';
import { KeyboardStickyButton } from '@/components/ui/keyboard-sticky-button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { ProviderTypes } from '@/lib/api/auth';
import { useLoginMutation } from '@/lib/hooks/mutation/auth';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { LoginFormDataTypes, loginSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export default function LoginScreen() {
  const router = useRouter();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const { mutate: login } = useLoginMutation();

  const { accessToken, reset, user } = useUserStore();

  const handleBackPress = () => {
    reset();
    router.replace('/(common)/landing');
  };

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormDataTypes>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  const onSubmit = async (data: LoginFormDataTypes) => {
    const requestBody = {
      email: data.email,
      password: data.password,
      provider: 'EMAIL' as ProviderTypes,
    };
    login(requestBody);
  };

  return (
    <Container isKeyboardAvioding>
      <Header title="이메일 로그인" onBackPress={handleBackPress} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Spacer height={48} />
        <View className="flex-1 gap-y-[48px] px-[20px]">
          <View className="gap-y-[18px]">
            <Label htmlFor="email" className="text-lg font-bold">
              이메일
            </Label>
            <View className="gap-y-[12px]">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    id="email"
                    placeholder="이메일 입력"
                    keyboardType="email-address"
                    autoComplete="email"
                    autoCapitalize="none"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    returnKeyType="done"
                    submitBehavior="submit"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.email && (
                <Text className="text-destructive text-sm">{errors.email.message}</Text>
              )}
            </View>
          </View>
          <View className="gap-y-[18px]">
            <Label htmlFor="password" className="text-lg font-bold">
              비밀번호
            </Label>
            <View className="gap-y-[12px]">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    id="password"
                    placeholder="비밀번호 입력"
                    secureTextEntry
                    autoCapitalize="none"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    returnKeyType="done"
                    submitBehavior="submit"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.password && (
                <Text className="text-destructive text-sm">{errors.password.message}</Text>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <KeyboardStickyButton
        onPress={handleSubmit(onSubmit)}
        size="lg"
        disabled={!emailValue.trim() || !passwordValue.trim()}>
        <Text>로그인</Text>
      </KeyboardStickyButton>
    </Container>
  );
}
