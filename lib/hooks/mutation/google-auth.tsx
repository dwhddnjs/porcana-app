import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useLoginMutation } from './auth';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const { show, hide } = useLoadingStore();
  const { mutate: login } = useLoginMutation();

  const isProcessingRef = useRef(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  // response가 업데이트되면 id_token으로 로그인 처리
  useEffect(() => {
    if (!response || !isProcessingRef.current) return;

    if (response.type === 'success' && response.params?.id_token) {
      login(
        {
          provider: 'GOOGLE',
          code: response.params.id_token,
        },
        {
          onSettled: () => {
            isProcessingRef.current = false;
          },
        }
      );
    } else {
      isProcessingRef.current = false;
      hide();
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    if (isProcessingRef.current || !request) {
      return;
    }

    isProcessingRef.current = true;
    show('로그인 중...');
    await promptAsync();
  };

  return {
    handleGoogleLogin,
    isLoading: isProcessingRef.current,
  };
};
