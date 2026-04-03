import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { NicknameFormDataTypes, nicknameSchema } from "@/lib/validations/auth";


export default function EnterNicknameScreen() {
  const router = useRouter();
  const setNickname = useSignupStore((state) => state.setNickname);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NicknameFormDataTypes>({
    resolver: zodResolver(nicknameSchema),
    defaultValues: {
      nickname: '',
    },
  });

  const nicknameValue = watch('nickname');

  const onSubmit = async (data: NicknameFormDataTypes) => {
    setNickname(data.nickname);
    router.push('/(auth)/enter-email');
  };

  return (
    <Container isKeyboardAvoiding>
      <Header title="" />
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        
        <View className="flex-1  px-[20px]">
        <Spacer height={24} />
          <View className="gap-y-[24px]">
            <Label htmlFor="nickname" className="text-xl font-bold">닉네임을 입력해주세요</Label>
            <View className="gap-y-[12px]">
            <Controller
              control={control}
              name="nickname"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  id="nickname"
                  placeholder="닉네임 입력"
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
            {errors.nickname && (
              <Text className="text-destructive text-sm">{errors.nickname.message}</Text>
            )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <KeyboardStickyButton onPress={handleSubmit(onSubmit)} size="lg" disabled={!nicknameValue.trim()}>
        <Text>다음</Text>
      </KeyboardStickyButton>
      </Container>
  );
}
