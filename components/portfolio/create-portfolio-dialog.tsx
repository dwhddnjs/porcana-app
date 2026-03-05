import { useRef } from 'react';
import { TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CreatePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (portfolioName: string) => void;
  showTrigger?: boolean;
}

export const CreatePortfolioDialog = ({
  open,
  onOpenChange,
  onSubmit,
  showTrigger = true,
}: CreatePortfolioDialogProps) => {
  const inputRef = useRef<TextInput>(null);
  const portfolioNameRef = useRef('');

  const handleChangeText = (text: string) => {
    portfolioNameRef.current = text;
  };

  const handleStart = () => {
    const name = portfolioNameRef.current.trim();
    if (name) {
      onSubmit(name);
      portfolioNameRef.current = '';
      inputRef.current?.clear();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size={'lg'}>
            <Text>시작하기</Text>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-lg">새 포트폴리오 이름을 적어주세요</DialogTitle>
        </DialogHeader>
        <Input
          ref={inputRef}
          placeholder="포트폴리오 이름"
          onChangeText={handleChangeText}
        />
        <Button size={'lg'} onPress={handleStart}>
          <Text>시작하기</Text>
        </Button>
      </DialogContent>
    </Dialog>
  );
};
