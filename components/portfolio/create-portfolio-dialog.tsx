import { useState } from 'react';
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
}

export const CreatePortfolioDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: CreatePortfolioDialogProps) => {
  const [portfolioName, setPortfolioName] = useState('');

  const handleStart = () => {
    if (portfolioName.trim()) {
      onSubmit(portfolioName);
      setPortfolioName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size={'lg'}>
          <Text>시작하기</Text>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-lg">새 포트폴리오 이름을 적어주세요</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="포트폴리오 이름"
          value={portfolioName}
          onChangeText={setPortfolioName}
        />
        <Button size={'lg'} onPress={handleStart}>
          <Text>시작하기</Text>
        </Button>
      </DialogContent>
    </Dialog>
  );
};
