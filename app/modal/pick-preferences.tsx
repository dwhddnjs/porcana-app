import { Keyboard, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Icon } from '@/components/ui/icon';
import { HandFistIcon, ShieldIcon, ScaleIcon } from 'lucide-react-native';
import { SectorTag } from '@/components/portfolio/sector-tag';
import { SECTOR_OPTIONS, SECTOR_OPTIONS_KO } from '@/lib/constant/variables';
import { useState } from 'react';
import { useCreatePortfolioMutation } from '@/lib/hooks/mutation/portfolio';

import { ActivityIndicator, useColorScheme } from 'react-native';
import { THEME } from '@/lib/theme';
import Container from '@/components/ui/container';
import { Spacer } from '@/components/ui/spacer';

export type RiskProfileTypes = 'AGGRESSIVE' | 'BALANCED' | 'SAFE' | null;

export default function PickPreferences() {
  const [portfolioName, setPortfolioName] = useState('');
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<RiskProfileTypes>(null);
  const [selectedSector, setSelectedSector] = useState<string[]>([]);

  const colorScheme = useColorScheme() ?? 'light';
  const { mutate: createPortfolio, isPending } = useCreatePortfolioMutation();

  const handleRiskProfileSelect = (profile: RiskProfileTypes) => {
    setSelectedRiskProfile((prev) => (prev === profile ? null : profile));
  };

  const isSectorMaxed = selectedSector.length >= 3;

  const handleSectorSelect = (sector: string) => {
    setSelectedSector((prev) => {
      if (prev.includes(sector)) return prev.filter((s) => s !== sector);
      if (prev.length >= 3) return prev;
      return [...prev, sector];
    });
  };

  const handleNameChange = (text: string) => {
    setPortfolioName(text);
  };

  const isFormValid =
    portfolioName.trim().length > 0 && selectedRiskProfile !== null && selectedSector.length > 0;

  const handleCreatePortfolio = () => {
    if (!isFormValid) return;

    createPortfolio({
      name: portfolioName.trim(),
      riskProfile: selectedRiskProfile.toUpperCase(),
      sectors: selectedSector,
    });
  };

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Container edges={['bottom']}>
      <Pressable onPress={handleDismissKeyboard}>
        <View className="items-center py-3">
          <View className="bg-muted-foreground/40 h-1 w-10 rounded-full" />
        </View>
      </Pressable>
      <ScrollView
        contentContainerClassName="px-[20px] pt-[40px] pb-[20px]"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-y-[48px]">
          <View className="items-center gap-y-[20px] px-5">
            <Text className="text-center text-2xl font-bold">포트폴리오 이름</Text>
            <Input
              placeholder="포트폴리오 이름을 입력하세요"
              value={portfolioName}
              onChangeText={handleNameChange}
              className="border-primary text-md self-center rounded-xl border-2 bg-transparent dark:bg-transparent"
            />
          </View>
          <View className="gap-y-[20px]">
            <Text className="text-center text-2xl font-bold">당신은 리스크 프로필은 ?</Text>
            <View className="flex-row justify-center gap-x-[24px]">
              <Pressable
                onPress={() => handleRiskProfileSelect('AGGRESSIVE')}
                className={`border-primary h-[72px] w-[72px] items-center justify-center gap-y-[2px] rounded-full border-2 ${selectedRiskProfile === 'AGGRESSIVE' ? 'bg-primary' : ''}`}>
                <Icon
                  as={HandFistIcon}
                  className={`size-8 ${selectedRiskProfile === 'AGGRESSIVE' ? 'text-primary-foreground' : 'text-primary'}`}
                />
                <Text
                  className={`text-xs font-semibold ${selectedRiskProfile === 'AGGRESSIVE' ? 'text-primary-foreground' : ''}`}>
                  공격형
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleRiskProfileSelect('BALANCED')}
                className={`border-primary h-[72px] w-[72px] items-center justify-center gap-y-[2px] rounded-full border-2 ${selectedRiskProfile === 'BALANCED' ? 'bg-primary' : ''}`}>
                <Icon
                  as={ScaleIcon}
                  className={`size-8 ${selectedRiskProfile === 'BALANCED' ? 'text-primary-foreground' : 'text-primary'}`}
                />
                <Text
                  className={`text-xs font-semibold ${selectedRiskProfile === 'BALANCED' ? 'text-primary-foreground' : ''}`}>
                  중립형
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleRiskProfileSelect('SAFE')}
                className={`border-primary h-[72px] w-[72px] items-center justify-center gap-y-[2px] rounded-full border-2 ${selectedRiskProfile === 'SAFE' ? 'bg-primary' : ''}`}>
                <Icon
                  as={ShieldIcon}
                  className={`size-8 ${selectedRiskProfile === 'SAFE' ? 'text-primary-foreground' : 'text-primary'}`}
                />
                <Text
                  className={`text-xs font-semibold ${selectedRiskProfile === 'SAFE' ? 'text-primary-foreground' : ''}`}>
                  수비형
                </Text>
              </Pressable>
            </View>
          </View>
          <View className="gap-y-[20px]">
            <Text className="text-center text-2xl font-bold">당신은 관심 섹터는 ?</Text>
            <View className="flex-row flex-wrap justify-center gap-[8px]">
              {SECTOR_OPTIONS_KO.map((sectorKo, index) => {
                const sectorType = SECTOR_OPTIONS[index];
                return (
                  <SectorTag
                    key={sectorType}
                    sectorType={sectorType}
                    label={sectorKo}
                    isSelected={selectedSector.includes(sectorType)}
                    disabled={isSectorMaxed && !selectedSector.includes(sectorType)}
                    onPress={() => handleSectorSelect(sectorType)}
                  />
                );
              })}
            </View>
          </View>
          <Spacer height={140} />
        </View>
      </ScrollView>
      <View className="px-[20px]">
        <Button onPress={handleCreatePortfolio} size={'lg'} disabled={!isFormValid || isPending}>
          {isPending ? (
            <ActivityIndicator color={THEME[colorScheme].primaryForeground} />
          ) : (
            <Text>생성하기</Text>
          )}
        </Button>
      </View>
    </Container>
  );
}
