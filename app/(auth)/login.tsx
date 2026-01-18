import { SignInForm } from "@/components/sign-in-form";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <SignInForm />
    </SafeAreaView>
  );
}
