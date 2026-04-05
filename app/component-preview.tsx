import Container from '@/components/ui/container';
import { Header } from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
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
import { useCallback, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { toast } from 'sonner-native';
import { FlipCard } from '@/components/portfolio/flip-card';

export default function ComponentPreviewScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const [alertOpen, setAlertOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleToastSuccess = useCallback(() => {
    toast.success('성공 토스트입니다');
  }, []);

  const handleToastError = useCallback(() => {
    toast.error('에러 토스트입니다');
  }, []);

  const handleToastWarning = useCallback(() => {
    toast.warning('경고 토스트입니다');
  }, []);

  const handleAlertOpen = useCallback(() => {
    setAlertOpen(true);
  }, []);

  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);
  }, []);

  const availableHeight = screenHeight - 40;
  const cardHeight = Math.min(availableHeight * 0.75, 240); // 최대 240px 제한
  const cardWidth = cardHeight * (2 / 3); // 2:3 비율 유지

  return (
    <Container className="">
      <View className="flex-1 items-center justify-center">
        <FlipCard
          width={cardWidth}
          height={cardHeight}
          index={0}
          onSelect={() => {}}
          isFlipped={true}
          asset={{
            assetId: '5',
            name: 'Apple',
            ticker: 'AAPL',
            sector: 'INFORMATION_TECHNOLOGY',
            market: 'NASDAQ',
            assetClass: 'STOCK',
            currentRiskLevel: 3,
            imageUrl: 'https://logo.clearbit.com/apple.com',
            impactHint: '글로벌 빅테크 대표주',
          }}
        />
      </View>
      <View className="flex-row items-center justify-center">
        <Text>{inputValue}</Text>
      </View>
    </Container>
  );

  // return (
  //   <Container>
  //     <Header title="컴포넌트 프리뷰" />
  //     <ScrollView className="flex-1 px-5" contentContainerClassName="gap-y-8 pb-10 pt-4">
  //       {/* Typography */}
  //       <Section title="Typography">
  //         <Text className="text-3xl font-bold">Heading 3XL Bold</Text>
  //         <Text className="text-2xl font-bold">Heading 2XL Bold</Text>
  //         <Text className="text-xl font-semibold">Heading XL Semibold</Text>
  //         <Text className="text-lg font-medium">Body LG Medium</Text>
  //         <Text className="text-base">Body Base</Text>
  //         <Text className="text-sm text-muted-foreground">Caption SM Muted</Text>
  //       </Section>

  //       <Separator />

  //       {/* Buttons */}
  //       <Section title="Button Variants">
  //         <Button>
  //           <Text className="text-primary-foreground font-medium">Default</Text>
  //         </Button>
  //         <Button variant="destructive">
  //           <Text className="text-destructive-foreground font-medium">Destructive</Text>
  //         </Button>
  //         <Button variant="outline">
  //           <Text className="font-medium">Outline</Text>
  //         </Button>
  //         <Button variant="secondary">
  //           <Text className="font-medium">Secondary</Text>
  //         </Button>
  //         <Button variant="ghost">
  //           <Text className="font-medium">Ghost</Text>
  //         </Button>
  //       </Section>

  //       <Separator />

  //       {/* Button Sizes */}
  //       <Section title="Button Sizes">
  //         <Button size="sm">
  //           <Text className="text-primary-foreground text-sm font-medium">Small</Text>
  //         </Button>
  //         <Button size="default">
  //           <Text className="text-primary-foreground font-medium">Default</Text>
  //         </Button>
  //         <Button size="lg">
  //           <Text className="text-primary-foreground font-medium">Large</Text>
  //         </Button>
  //       </Section>

  //       <Separator />

  //       {/* Input */}
  //       <Section title="Input">
  //         <Input placeholder="기본 Input" value={inputValue} onChangeText={handleInputChange} />
  //       </Section>

  //       <Separator />

  //       {/* Card */}
  //       <Section title="Card">
  //         <Card>
  //           <CardContent className="gap-y-2 p-4">
  //             <Text className="text-lg font-semibold">카드 타이틀</Text>
  //             <Text className="text-muted-foreground text-sm">
  //               카드 내용이 들어갑니다. 설명 텍스트입니다.
  //             </Text>
  //           </CardContent>
  //         </Card>
  //       </Section>

  //       <Separator />

  //       {/* Toast */}
  //       <Section title="Toast">
  //         <View className="flex-row gap-2">
  //           <Button size="sm" onPress={handleToastSuccess} className="flex-1">
  //             <Text className="text-primary-foreground text-sm font-medium">Success</Text>
  //           </Button>
  //           <Button size="sm" variant="destructive" onPress={handleToastError} className="flex-1">
  //             <Text className="text-destructive-foreground text-sm font-medium">Error</Text>
  //           </Button>
  //           <Button size="sm" variant="outline" onPress={handleToastWarning} className="flex-1">
  //             <Text className="text-sm font-medium">Warning</Text>
  //           </Button>
  //         </View>
  //       </Section>

  //       <Separator />

  //       {/* AlertDialog */}
  //       <Section title="AlertDialog">
  //         <Button variant="outline" onPress={handleAlertOpen}>
  //           <Text className="font-medium">AlertDialog 열기</Text>
  //         </Button>
  //       </Section>

  //       <Separator />

  //       {/* Colors */}
  //       <Section title="Theme Colors">
  //         <View className="flex-row flex-wrap gap-2">
  //           <ColorChip label="primary" className="bg-primary" />
  //           <ColorChip label="secondary" className="bg-secondary" />
  //           <ColorChip label="destructive" className="bg-destructive" />
  //           <ColorChip label="success" className="bg-success" />
  //           <ColorChip label="muted" className="bg-muted" />
  //           <ColorChip label="accent" className="bg-accent" />
  //           <ColorChip label="card" className="bg-card" />
  //           <ColorChip label="border" className="bg-border" />
  //         </View>
  //       </Section>
  //     </ScrollView>

  //     <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
  //       <AlertDialogContent>
  //         <AlertDialogHeader>
  //           <AlertDialogTitle>알림 다이얼로그</AlertDialogTitle>
  //           <AlertDialogDescription>이것은 AlertDialog 프리뷰입니다.</AlertDialogDescription>
  //         </AlertDialogHeader>
  //         <AlertDialogFooter className="flex-row">
  //           <AlertDialogCancel className="flex-1">
  //             <Text className="text-foreground font-bold">취소</Text>
  //           </AlertDialogCancel>
  //           <AlertDialogAction className="flex-1">
  //             <Text className="text-primary-foreground font-bold">확인</Text>
  //           </AlertDialogAction>
  //         </AlertDialogFooter>
  //       </AlertDialogContent>
  //     </AlertDialog>
  //   </Container>
  // );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <View className="gap-y-3">
      <Text className="text-muted-foreground text-sm font-bold">{title}</Text>
      {children}
    </View>
  );
};

const ColorChip = ({ label, className }: { label: string; className: string }) => {
  return (
    <View className="items-center gap-y-1">
      <View className={`border-border h-10 w-10 rounded-lg border ${className}`} />
      <Text className="text-muted-foreground text-[10px]">{label}</Text>
    </View>
  );
};
