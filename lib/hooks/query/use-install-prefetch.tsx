import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { getPrefetchAssetImages } from '@/lib/api/asset';
import type { PrefetchAssetImageTypes } from '@/lib/api/asset';

// 네트워크 지연/실패로 설치가 막히지 않도록 하는 전체 타임아웃(ms)
// 국장 로고 124개(일부 clearbit 외부 CDN 포함) 프리패칭 여유를 감안해 10초.
const PREFETCH_TIMEOUT = 10000;

type UseInstallPrefetchResultTypes = {
  percent: number;
  isDone: boolean;
};

/**
 * 로고 있는 국장 대형주 아이콘을 expo-image 캐시에 미리 워밍한다.
 * 설치 화면에서 진행률(percent)과 완료 여부(isDone)를 표시하는 데 사용.
 */
export const useInstallPrefetch = (): UseInstallPrefetchResultTypes => {
  const { data, isSuccess, isError } = useQuery<PrefetchAssetImageTypes[]>({
    queryKey: ['install-prefetch'],
    queryFn: getPrefetchAssetImages,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  const [completed, setCompleted] = useState(0);
  const [forceDone, setForceDone] = useState(false);
  const hasStarted = useRef(false);
  const isMounted = useRef(true);

  // 설치 화면이 언마운트된 뒤 프리패치 프라미스가 resolve되어도 setState하지 않도록 가드
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 종목 이미지 순회하며 캐시 워밍 (병렬 실행, 완료 시마다 카운트 증가)
  useEffect(() => {
    if (!isSuccess || !data || hasStarted.current) return;
    hasStarted.current = true;

    if (data.length === 0) {
      setForceDone(true);
      return;
    }

    data.forEach((urls) => {
      ExpoImage.prefetch(urls, { cachePolicy: 'memory-disk' })
        .catch(() => undefined)
        .finally(() => {
          if (isMounted.current) setCompleted((prev) => prev + 1);
        });
    });
  }, [isSuccess, data]);

  // 전체 타임아웃 후 강제 완료
  useEffect(() => {
    const timer = setTimeout(() => setForceDone(true), PREFETCH_TIMEOUT);
    return () => clearTimeout(timer);
  }, []);

  const total = data?.length ?? 0;
  const allPrefetched = isSuccess && total > 0 && completed >= total;
  const isDone = forceDone || isError || allPrefetched || (isSuccess && total === 0);

  const percent = isDone ? 100 : total > 0 ? Math.round((completed / total) * 100) : 0;

  return { percent, isDone };
};
