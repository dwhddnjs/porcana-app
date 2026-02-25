import * as AppleAuthentication from 'expo-apple-authentication';
import { useMutation } from '@tanstack/react-query';
import { UserStateTypes, useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Platform } from 'react-native';
import { appleLogin } from '@/lib/api/auth';
import { parseEmailFromIdentityToken } from '@/lib/constant/function';

export const useAppleAuth = () => {
  const { setTokens, setUser } = useUserStore((state) => state);
  const { show, hide } = useLoadingStore();
  const isProcessingRef = useRef(false);

  const appleLoginMutation = useMutation({
    mutationFn: appleLogin,
    onMutate: () => {
      show('로그인 중...');
    },
    onSuccess: (data) => {
      if (data?.accessToken && data?.refreshToken) {
        setTokens(data.accessToken, data.refreshToken);
        setUser(data as UserStateTypes);
      }
      router.replace('/(tabs)');
      isProcessingRef.current = false;
    },
    onError: (error) => {
      console.error('Apple Login Error:', error);
      isProcessingRef.current = false;
    },
    onSettled: () => {
      hide();
    },
  });

  const handleAppleLogin = async () => {
    // iOS에서만 사용 가능
    if (Platform.OS !== 'ios') {
      console.warn('Apple Sign In is only available on iOS');

      return;
    }

    // 이미 처리 중이면 무시
    if (isProcessingRef.current) {
      return;
    }

    try {
      // Apple Sign In 사용 가능 여부 확인
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Apple Sign In is not available on this device');
        return;
      }

      isProcessingRef.current = true;

      // Apple 로그인 요청
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('credential', credential);

      // credential이 없으면 취소된 것으로 간주
      if (!credential) {
        isProcessingRef.current = false;
        return;
      }

      // credential.email이 null인 경우 identityToken에서 이메일 추출
      const email = credential.email || parseEmailFromIdentityToken(credential.identityToken);
      // 서버로 로그인 요청
      appleLoginMutation.mutate({
        identityToken: credential.authorizationCode || '',
        user: credential.user,
        email: email,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName,
              familyName: credential.fullName.familyName,
            }
          : null,
      });
    } catch (error: any) {
      // 사용자가 취소한 경우
      if (error.code === 'ERR_REQUEST_CANCELED') {
        isProcessingRef.current = false;
        return;
      }

      console.error('Apple Auth Error:', error);
      isProcessingRef.current = false;
    }
  };

  return {
    handleAppleLogin,
    isLoading: isProcessingRef.current || appleLoginMutation.isPending,
  };
};
