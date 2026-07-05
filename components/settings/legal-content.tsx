import { Spacer } from '../ui/spacer';
import { Text } from '../ui/text';
import type { LegalSectionTypes } from '@/lib/constant/legal';
import { ScrollView, View } from 'react-native';

interface LegalContentProps {
  sections: LegalSectionTypes[];
}

export const LegalContent = ({ sections }: LegalContentProps) => {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pt-2 pb-10 gap-6"
      showsVerticalScrollIndicator={false}>
      {sections.map((section) => (
        <View key={section.title} className="gap-2">
          <Text className="text-foreground text-base font-semibold">{section.title}</Text>
          <Text className="text-muted-foreground text-sm leading-6">{section.body}</Text>
        </View>
      ))}

      <Spacer height={120} />
    </ScrollView>
  );
};
