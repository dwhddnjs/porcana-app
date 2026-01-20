import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router, Link } from 'expo-router';
import { Button } from '@/components/ui/button';
import * as ScreenOrientation from 'expo-screen-orientation';
import Container from '@/components/container';
import { Icon } from '@/components/ui/icon';
import { HandFistIcon, ShieldIcon, ScaleIcon } from 'lucide-react-native';
import { SECTOR_OPTIONS, SECTOR_OPTIONS_KO } from '@/lib/constant/variables';
import { useState } from 'react';

export type RiskProfileTypes = 'aggressive' | 'defensive' | 'neutral' | null;

export default function AddModal() {
  const isPresented = router.canGoBack();

  const [selectedRiskProfile, setSelectedRiskProfile] = useState<RiskProfileTypes>(null);
  const [selectedSector, setSelectedSector] = useState<string[]>([]);
  

  const handleRiskProfileSelect = (profile: RiskProfileTypes) => {
    setSelectedRiskProfile(prev => prev === profile ? null : profile);
  };

  const handleSectorSelect = (sector: string) => {
    setSelectedSector(prev => 
      prev.includes(sector) 
        ? prev.filter(s => s !== sector) 
        : [...prev, sector]
    );
  };

  const handleCreatePortfolio = async () => {
    // 먼저 가로모드로 전환
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
    
    // 방향 전환 후 네비게이션
    router.dismiss();
    router.push('/(portfolio)/create-portfolio');
  };

  return (
    <Container>
      <View className="flex-1 justify-between px-[20px] pt-[120px]">
        <View className="gap-y-[64px]">
          <View className="gap-y-[20px]">
            <Text className="text-center text-2xl font-bold">당신은 리스크 프로필은 ?</Text>
            <View className="flex-row gap-x-[24px] justify-center">
              <Pressable 
                onPress={() => handleRiskProfileSelect('aggressive')}
                className={`border-2 border-primary rounded-full justify-center items-center w-[72px] h-[72px] gap-y-[2px] ${selectedRiskProfile === 'aggressive' ? 'bg-primary' : ''}`}
              >
                <Icon as={HandFistIcon} className={`size-8 ${selectedRiskProfile === 'aggressive' ? 'text-primary-foreground' : 'text-primary'}`} />
                <Text className={`text-xs font-semibold ${selectedRiskProfile === 'aggressive' ? 'text-primary-foreground' : ''}`}>공격형</Text>
              </Pressable>
              <Pressable 
                onPress={() => handleRiskProfileSelect('defensive')}
                className={`border-2 border-primary rounded-full justify-center items-center w-[72px] h-[72px] gap-y-[2px] ${selectedRiskProfile === 'defensive' ? 'bg-primary' : ''}`}
              >
                <Icon as={ShieldIcon} className={`size-8 ${selectedRiskProfile === 'defensive' ? 'text-primary-foreground' : 'text-primary'}`} />
                <Text className={`text-xs font-semibold ${selectedRiskProfile === 'defensive' ? 'text-primary-foreground' : ''}`}>수비형</Text>
              </Pressable>
              <Pressable 
                onPress={() => handleRiskProfileSelect('neutral')}
                className={`border-2 border-primary rounded-full justify-center items-center w-[72px] h-[72px] gap-y-[2px] ${selectedRiskProfile === 'neutral' ? 'bg-primary' : ''}`}
              >
                <Icon as={ScaleIcon} className={`size-8 ${selectedRiskProfile === 'neutral' ? 'text-primary-foreground' : 'text-primary'}`} />
                <Text className={`text-xs font-semibold ${selectedRiskProfile === 'neutral' ? 'text-primary-foreground' : ''}`}>중립형</Text>
              </Pressable>
            </View>
          </View>
          <View className="gap-y-[20px]">
            <Text className="text-center text-2xl font-bold">당신은 관심 섹터는 ?</Text>
            <View className="flex-row justify-center flex-wrap gap-[8px]">
              {SECTOR_OPTIONS_KO.map((sectorKo, index) => {
                const sectorType = SECTOR_OPTIONS[index];
                const isSelected = selectedSector.includes(sectorType);
                return (
                  <Pressable 
                    key={sectorType} 
                    onPress={() => handleSectorSelect(sectorType)}
                    className={`border-2 border-primary rounded-full justify-center items-center px-[12px] py-[4px] ${isSelected ? 'bg-primary' : ''}`}
                  >
                    <Text className={`text-sm ${isSelected ? 'text-primary-foreground' : ''}`}>{sectorKo}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
      <View className="px-[20px]">
        <Button onPress={handleCreatePortfolio} size={"lg"}>
          <Text>생성하기</Text>
        </Button>
      </View>
    </Container>
  );
}
