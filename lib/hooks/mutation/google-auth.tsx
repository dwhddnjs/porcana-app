import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useLoadingStore } from '@/lib/hooks/zustand/use-loading-store';
import { useEffect, useRef } from 'react';
import { useLoginMutation } from './auth';

WebBrowser.maybeCompleteAuthSession();

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
});

const useGoogleAuthIOS = () => {
  const { show, hide } = useLoadingStore();
  const { mutate: login } = useLoginMutation();
  const isProcessingRef = useRef(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

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
    if (isProcessingRef.current || !request) return;

    isProcessingRef.current = true;
    show('로그인 중...');
    await promptAsync();
  };

  return {
    handleGoogleLogin,
    isLoading: isProcessingRef.current,
  };
};

const useGoogleAuthAndroid = () => {
  const { show, hide } = useLoadingStore();
  const { mutate: login } = useLoginMutation();
  const isProcessingRef = useRef(false);

  const handleGoogleLogin = async () => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    show('로그인 중...');

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;

        if (idToken) {
          login(
            {
              provider: 'GOOGLE',
              code: idToken,
            },
            {
              onSettled: () => {
                isProcessingRef.current = false;
              },
            }
          );
          return;
        }
      }

      isProcessingRef.current = false;
      hide();
    } catch (error) {
      isProcessingRef.current = false;
      hide();

      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }
        if (error.code === statusCodes.IN_PROGRESS) {
          return;
        }
      }
      console.error('Google Sign-In Error:', error);
    }
  };

  return {
    handleGoogleLogin,
    isLoading: isProcessingRef.current,
  };
};

export const useGoogleAuth = Platform.OS === 'ios' ? useGoogleAuthIOS : useGoogleAuthAndroid;
