import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Label } from "@/components/ui/label";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { KeyboardStickyButton } from "@/components/ui/keyboard-sticky-button";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { z } from "zod";
import { useRouter } from "expo-router";
import { useSignupStore } from "@/lib/hooks/zustand/use-signup-store";
import Container from "@/components/container";
import { Header } from "@/components/ui/header";
import { Spacer } from "@/components/spacer";
import { useSignupMutation } from "@/lib/hooks/mutation/auth";

const passwordSchema = z.object({
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .max(50, '비밀번호는 50자 이하여야 합니다'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function EnterPasswordScreen() {
  const router = useRouter();
  const setPassword = useSignupStore((state) => state.setPassword);
  const { nickname, email } = useSignupStore();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
    },
  });

  const passwordValue = watch('password');
  const { mutate: signup } = useSignupMutation();

  const onSubmit = async (data: PasswordFormData) => {
    const requestBody = {
      nickname,
      email,
      password: data.password,
    }
    
    signup(requestBody);
    router.replace('/(tabs)');
  };

  return (
    <Container>
      <Header title="" />
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        <View className="flex-1 px-[20px]">
          <Spacer height={24} />
          <View className="gap-y-[24px]">
            <Label htmlFor="password" className="text-xl font-bold">비밀번호를 입력해주세요</Label>
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
      <KeyboardStickyButton onPress={handleSubmit(onSubmit)} size="lg" disabled={!passwordValue.trim()}>
        <Text>회원가입</Text>
      </KeyboardStickyButton>
    </Container>
  );
}
