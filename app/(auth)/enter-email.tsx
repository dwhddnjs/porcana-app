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
import { EmailFormData, emailSchema } from "@/lib/validations/auth";


export default function EnterEmailScreen() {
  const router = useRouter();
  const setEmail = useSignupStore((state) => state.setEmail);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const emailValue = watch('email');

  const onSubmit = async (data: EmailFormData) => {
    setEmail(data.email);
    router.push('/(auth)/enter-password');
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
            <Label htmlFor="email" className="text-xl font-bold">이메일을 입력해주세요</Label>
            <View className="gap-y-[12px]">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    id="email"
                    placeholder="m@example.com"
                    keyboardType="email-address"
                    autoComplete="email"
                    autoCapitalize="none"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    returnKeyType="next"
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
        </View>
      </KeyboardAvoidingView>
      <KeyboardStickyButton onPress={handleSubmit(onSubmit)} size="lg" disabled={!emailValue.trim()}>
        <Text>다음</Text>
      </KeyboardStickyButton>
    </Container>
  );
}
