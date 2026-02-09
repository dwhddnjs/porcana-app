import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useMutation } from '@tanstack/react-query';
import { UserState, useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useLoginMutation, useSignupMutation } from './auth';

WebBrowser.maybeCompleteAuthSession();

const getClientId = () => {
  // 웹 클라이언트 ID (Expo Go 및 웹에서 사용)
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  // iOS 클라이언트 ID
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  // Android 클라이언트 ID
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  if (Platform.OS === 'ios' && iosClientId) {
    return iosClientId;
  }
  if (Platform.OS === 'android' && androidClientId) {
    return androidClientId;
  }
  // Expo Go 또는 웹에서는 웹 클라이언트 ID 사용
  return webClientId;
};

export const useGoogleAuth = () => {
  const { setTokens, setUser } = useUserStore((state) => state);
  const { show, hide } = useLoadingStore();
  const { mutate: login } = useLoginMutation();
  const { mutate: signup } = useSignupMutation();

  const isProcessingRef = useRef(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: getClientId(),
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

    scopes: ['openid', 'profile', 'email'],
  });

  // response가 업데이트되면 id_token으로 로그인 처리
  useEffect(() => {
    if (!response || !isProcessingRef.current) return;

    if (response.type === 'success' && response.params?.id_token) {
      login({
        provider: 'GOOGLE',
        code: response.params.id_token,
      });
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
