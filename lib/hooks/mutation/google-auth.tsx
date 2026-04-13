import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useRef } from 'react';
import { useLoginMutation } from './auth';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
});

export const useGoogleAuth = () => {
  const { mutate: login } = useLoginMutation();
  const isProcessingRef = useRef(false);

  const handleGoogleLogin = async () => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;

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
    } catch (error) {
      isProcessingRef.current = false;

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
