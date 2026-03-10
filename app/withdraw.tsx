import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { useDeleteAccountMutation } from '@/lib/hooks/mutation/user';
import Container from '@/components/container';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { mutate } = useDeleteAccountMutation();

  const handleOpenAlert = () => {
    setIsAlertOpen(true);
  };

  const handleConfirmWithdraw = () => {
    mutate();
  };

  return (
    <Container>
      <Header title="회원탈퇴" rightIcon={ChevronDown} />
      <View className="flex-1 px-4 pt-6">
        <Text className="text-foreground mb-6 text-xl font-semibold">회원탈퇴를 하시겠습니까?</Text>

        <View className="bg-muted rounded-lg p-4">
          <Text className="text-foreground mb-3 text-sm font-medium">탈퇴 시 삭제되는 데이터</Text>
          <View className="gap-2">
            <Text className="text-muted-foreground text-sm">
              • 생성한 모든 포트폴리오 및 구성 종목
            </Text>
            <Text className="text-muted-foreground text-sm">
              • 투자 시뮬레이션 기록 및 수익률 통계
            </Text>
            <Text className="text-muted-foreground text-sm">• 아레나 게임 기록 및 선택 내역</Text>
            <Text className="text-muted-foreground text-sm">• 계정 정보 (이메일, 닉네임 등)</Text>
          </View>
        </View>

        <View className="mt-6 rounded-lg">
          <Text className="text-destructive mb-2 text-sm font-semibold">탈퇴 전 꼭 확인하세요</Text>
          <View className="gap-2">
            <Text className="text-muted-foreground text-sm">
              • 삭제된 데이터는 복구가 불가능합니다.
            </Text>
            <Text className="text-muted-foreground text-sm">
              • 진행 중인 시뮬레이션이 있다면 결과가 저장되지 않습니다.
            </Text>
            <Text className="text-muted-foreground text-sm">
              • 탈퇴 후에도 동일한 이메일로 재가입할 수 있습니다.
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4">
        <Button variant="destructive" size="lg" onPress={handleOpenAlert}>
          <Text className="text-primary">탈퇴하기</Text>
        </Button>
      </View>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 탈퇴하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              모든 데이터가 영구 삭제되며 복구가 불가능합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row">
            <View className="flex-1">
              <AlertDialogCancel className="w-full">
                <Text className="text-primary font-semibold">취소</Text>
              </AlertDialogCancel>
            </View>
            <View className="flex-1">
              <AlertDialogAction className="bg-destructive w-full" onPress={handleConfirmWithdraw}>
                <Text className="text-primary font-semibold">탈퇴하기</Text>
              </AlertDialogAction>
            </View>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
