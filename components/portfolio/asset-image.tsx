import { View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Text } from '@/components/ui/text';
import { useCallback, useState } from 'react';
import { useResolveClassNames } from 'uniwind';
import { cn } from '@/lib/utils';

interface AssetImageProps {
  imageUrl: string | string[] | null;
  name: string;
  className?: string;
  size?: number;
}

export const AssetImage = ({ imageUrl, name, className, size = 36 }: AssetImageProps) => {
  const resolvedStyle = useResolveClassNames(className || '');
  const imageUrls = Array.isArray(imageUrl) ? imageUrl : imageUrl ? [imageUrl] : [];
  const [urlIndex, setUrlIndex] = useState(0);

  const handleError = useCallback(() => {
    setUrlIndex((prev) => prev + 1);
  }, []);

  if (urlIndex >= imageUrls.length || imageUrls.length === 0) {
    return (
      <View
        className={cn('bg-muted items-center justify-center rounded-full', className)}
        style={{ width: size, height: size }}>
        <Text className="text-muted-foreground text-sm font-bold">{name.slice(0, 2)}</Text>
      </View>
    );
  }

  return (
    <View
      className={cn('bg-muted rounded-full', className)}
      style={{ width: size, height: size, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <ExpoImage
        source={{ uri: imageUrls[urlIndex] }}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={150}
        style={{ width: size, height: size }}
        onError={handleError}
      />
    </View>
  );
};
