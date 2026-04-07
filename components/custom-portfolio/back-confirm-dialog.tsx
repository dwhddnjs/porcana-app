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
import { Text } from '@/components/ui/text';

interface BackConfirmDialogPropsTypes {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const BackConfirmDialog = ({ open, onOpenChange, onConfirm }: BackConfirmDialogPropsTypes) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>포트폴리오 생성 취소</AlertDialogTitle>
          <AlertDialogDescription>
            포트폴리오 생성을 취소하고 돌아가시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row">
          <AlertDialogCancel className="flex-1">
            <Text className="text-foreground font-bold">취소</Text>
          </AlertDialogCancel>
          <AlertDialogAction className="flex-1" onPress={onConfirm}>
            <Text className="text-primary-foreground font-bold">돌아가기</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
