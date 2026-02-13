import { Text } from '@/components/ui/text';
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

type DeletePortfolioDialogPropsTypes = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export const DeletePortfolioDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: DeletePortfolioDialogPropsTypes) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>포트폴리오 삭제</AlertDialogTitle>
          <AlertDialogDescription>정말 이 포트폴리오를 삭제하시겠습니까?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row">
          <AlertDialogCancel className="flex-1">
            <Text className="text-foreground font-bold">취소</Text>
          </AlertDialogCancel>
          <AlertDialogAction className="bg-destructive flex-1" onPress={onConfirm}>
            <Text className="text-destructive-foreground text-primary font-bold">삭제</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
