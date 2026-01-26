import {
  Image as ExpoImage,
  type ImageSource,
  type ImageProps as ExpoImageProps,
} from 'expo-image';
import { View, type ImageSourcePropType } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Building2 } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useResolveClassNames } from 'uniwind';
import type { ComponentType } from 'react';

type EmptyImageProps = {
  className?: string;
  iconClassName?: string;
};

type ImageProps = Omit<ExpoImageProps, 'source'> & {
  source?: ImageSource | ImageSourcePropType | string | null;
  emptyImage?: ComponentType<EmptyImageProps>;
  emptyImageClassName?: string;
  emptyIconClassName?: string;
  className?: string;
  tintColor?: string;
};

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export const Image = ({
  source,
  emptyImage: EmptyImageComponent,
  emptyImageClassName,
  emptyIconClassName,
  className,
  contentFit = 'contain',
  tintColor,
  style,
  ...props
}: ImageProps) => {
  // className을 style 객체로 변환
  const resolvedStyle = useResolveClassNames(className || '');

  // source가 없거나 빈 문자열인 경우 emptyImage 표시
  const hasSource =
    source !== null &&
    source !== undefined &&
    (typeof source === 'string' ? source.trim() !== '' : true) &&
    (typeof source === 'number' ? source > 0 : true);

  if (!hasSource) {
    if (EmptyImageComponent) {
      return (
        <EmptyImageComponent
          className={cn(
            'bg-muted items-center justify-center rounded-full',
            emptyImageClassName,
            className
          )}
          iconClassName={emptyIconClassName}
        />
      );
    }

    return (
      <View
        className={cn(
          'bg-muted border-primary/10 h-10 w-10 items-center justify-center rounded-full border',
          emptyImageClassName
        )}>
        <Icon as={Building2} className={cn('text-muted-foreground size-5', emptyIconClassName)} />
      </View>
    );
  }

  // source 타입에 따라 변환
  let imageSource: ImageSource;
  if (typeof source === 'string') {
    // 문자열인 경우 uri로 변환
    imageSource = { uri: source };
  } else if (typeof source === 'number') {
    // require()로 가져온 이미지 (number 타입)
    imageSource = source as ImageSource;
  } else {
    // 이미 ImageSource 형태이거나 ImageSourcePropType
    imageSource = source as ImageSource;
  }

  // tintColor가 있으면 style에 추가
  const imageStyle = tintColor ? [{ tintColor }, resolvedStyle, style] : [resolvedStyle, style];

  return (
    <ExpoImage
      source={imageSource}
      contentFit={contentFit}
      style={imageStyle}
      placeholder={{ blurhash }}
      cachePolicy="memory-disk"
      transition={200}
      {...props}
    />
  );
};
