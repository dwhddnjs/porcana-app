import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router, Link } from 'expo-router';
import { Button } from '@/components/ui/button';
import * as ScreenOrientation from 'expo-screen-orientation';
import Container from '@/components/container';
import { Icon } from '@/components/ui/icon';
import { HandFistIcon, ShieldIcon, ScaleIcon } from 'lucide-react-native';
import { SectorTag } from '@/components/portfolio/sector-tag';
import { SECTOR_OPTIONS, SECTOR_OPTIONS_KO } from '@/lib/constant/variables';
import { useState } from 'react';
import { useArenaStore } from '@/lib/hooks/zustand/use-arena-store';
import { usePickArenaSessionPreferenceMutation } from '@/lib/hooks/mutation/portfolio';

export type RiskProfileTypes = 'AGGRESSIVE' | 'BALANCED' | 'SAFE' | null;

export default function AddModal() {
  const isPresented = router.canGoBack();

  const [selectedRiskProfile, setSelectedRiskProfile] = useState<RiskProfileTypes>(null);
  const [selectedSector, setSelectedSector] = useState<string[]>([]);
  const { name, portfolioId, sessionId, status, currentRound } = useArenaStore();

  const { mutate: pickArenaSessionPreference } = usePickArenaSessionPreferenceMutation();

  const handleRiskProfileSelect = (profile: RiskProfileTypes) => {
    setSelectedRiskProfile((prev) => (prev === profile ? null : profile));
  };

  const handleSectorSelect = (sector: string) => {
    setSelectedSector((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const handleCreatePortfolio = async () => {
    if (!selectedRiskProfile || selectedSector.length === 0) {
      return;
    }
    router.dismiss();

    pickArenaSessionPreference({
      riskProfile: selectedRiskProfile.toUpperCase(),
      sectors: selectedSector,
    });
  };

  return (
    <Container>
      <View className="flex-1 justify-between px-[20px] pt-[120px]">
        <View className="gap-y-[64px]">
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
                    onPress={() => handleSectorSelect(sectorType)}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </View>
      <View className="px-[20px]">
        <Button onPress={handleCreatePortfolio} size={'lg'}>
          <Text>생성하기</Text>
        </Button>
      </View>
    </Container>
  );
}
