import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Label } from '@/components/ui/label';
import { Controller, useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { KeyboardStickyButton } from '@/components/ui/keyboard-sticky-button';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { useSignupStore } from '@/lib/hooks/zustand/use-signup-store';
import Container from '@/components/ui/container';
import { Header } from '@/components/ui/header';
import { Spacer } from '@/components/ui/spacer';
import { useSignupMutation } from '@/lib/hooks/mutation/auth';
import { PasswordFormDataTypes, passwordSchema } from '@/lib/validations/auth';

export default function EnterPasswordScreen() {
  const router = useRouter();
  const setPassword = useSignupStore((state) => state.setPassword);
  const { nickname, email } = useSignupStore();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormDataTypes>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');
  const { mutate: signup } = useSignupMutation();

  const onSubmit = async (data: PasswordFormDataTypes) => {
    setPassword(data.password);
    const requestBody = {
      nickname,
      email,
      password: data.password,
    };

    signup(requestBody);
  };

  return (
    <Container isKeyboardAvoiding>
      <Header title="" />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View className="flex-1 px-[20px]">
          <Spacer height={24} />
          <View className="gap-y-[24px]">
            <View className="gap-y-[20px]">
              <Label htmlFor="password" className="text-xl font-bold">
                비밀번호를 입력해주세요
              </Label>
              <View className="gap-y-[8px]">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      id="password"
                      placeholder="비밀번호 입력"
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="next"
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
            <Spacer height={24} />
            <View className="gap-y-[20px]">
              <Label htmlFor="confirmPassword" className="text-xl font-bold">
                비밀번호를 확인해주세요
              </Label>
              <View className="gap-y-[8px]">
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      id="confirmPassword"
                      placeholder="비밀번호 재입력"
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
                {errors.confirmPassword && (
                  <Text className="text-destructive text-sm">{errors.confirmPassword.message}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <KeyboardStickyButton
        onPress={handleSubmit(onSubmit)}
        size="lg"
        disabled={!passwordValue.trim() || !confirmPasswordValue.trim()}>
        <Text>회원가입</Text>
      </KeyboardStickyButton>
    </Container>
  );
}
