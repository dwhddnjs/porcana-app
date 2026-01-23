import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useMutation } from '@tanstack/react-query';
import { UserState, useUserStore } from '@/lib/hooks/zustand/use-user-store';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

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
  const isProcessingRef = useRef(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: getClientId(),
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    // Expo Go에서 사용하기 위해 프록시 사용 (필수
    // 오프라인 액세스를 위한 설정 (refresh token 필요시)
    scopes: ['openid', 'profile', 'email'],
  });

  const handleGoogleLogin = async () => {
    // 이미 처리 중이거나 request가 준비되지 않았으면 무시
    if (isProcessingRef.current || !request) {
      return;
    }

    try {
      isProcessingRef.current = true;
      const result = await promptAsync();

      // 사용자가 취소한 경우
      if (result.type === 'dismiss' || result.type === 'error') {
        isProcessingRef.current = false;
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      isProcessingRef.current = false;
    }
  };

  return {
    handleGoogleLogin,
    isLoading: isProcessingRef.current,
  };
};
