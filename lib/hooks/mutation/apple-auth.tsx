import * as AppleAuthentication from 'expo-apple-authentication';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Platform } from 'react-native';
import { useLoginMutation } from './auth';

export const useAppleAuth = () => {
  const { show, hide } = useLoadingStore();
  const { mutate: login } = useLoginMutation();
  const isProcessingRef = useRef(false);

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') {
      console.warn('Apple Sign In is only available on iOS');
      return;
    }

    if (isProcessingRef.current) return;

    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Apple Sign In is not available on this device');
        return;
      }

      isProcessingRef.current = true;
      show('로그인 중...');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential?.identityToken) {
        isProcessingRef.current = false;
        hide();
        return;
      }

      login(
        {
          provider: 'APPLE',
          code: credential.identityToken,
        },
        {
          onSettled: () => {
            isProcessingRef.current = false;
          },
        }
      );
    } catch (error: any) {
      isProcessingRef.current = false;
      hide();
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      console.error('Apple Auth Error:', error);
    }
  };

  return {
    handleAppleLogin,
    isLoading: isProcessingRef.current,
  };
};
