import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="enter-nickname" />
      <Stack.Screen name="enter-email" />
      <Stack.Screen name="enter-password" />
    </Stack>
  );
}