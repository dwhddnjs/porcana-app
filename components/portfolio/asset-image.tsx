import { View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Text } from '@/components/ui/text';
import { useCallback, useEffect, useState } from 'react';
import { useResolveClassNames } from 'uniwind';
import { cn } from '@/lib/utils';

interface AssetImageProps {
  imageUrl: string | string[] | null;
  name: string;
  className?: string;
  size?: number;
}

// 로고 로딩/전환 중 표시되는 단색 회색 placeholder (bg-muted 톤과 맞춤)
const PLACEHOLDER_BLURHASH = 'L0NdO8fQfQfQfQfQfQfQfQfQfQfQ';

export const AssetImage = ({ imageUrl, name, className, size = 36 }: AssetImageProps) => {
  const resolvedStyle = useResolveClassNames(className || '');
  const imageUrls = Array.isArray(imageUrl) ? imageUrl : imageUrl ? [imageUrl] : [];
  const [urlIndex, setUrlIndex] = useState(0);

  useEffect(() => {
    setUrlIndex(0);
  }, [imageUrl]);

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
        placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
        placeholderContentFit="contain"
        recyclingKey={imageUrls[0] ?? name}
        transition={150}
        style={{ width: size, height: size }}
        onError={handleError}
      />
    </View>
  );
};
