import { supabase } from '@/lib/supabase/client';

export type ProviderTypes = 'EMAIL' | 'GOOGLE' | 'APPLE';

type SignupRequestTypes = {
  nickname: string;
  email: string;
  password: string;
};

type SignupResponseTypes = {
  userId: string;
};

export const signup = async ({
  nickname,
  email,
  password,
}: SignupRequestTypes): Promise<SignupResponseTypes> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const isAnonymous = sessionData.session?.user?.is_anonymous === true;

  if (isAnonymous) {
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
      data: { nickname },
    });

    let userId: string | undefined;

    if (error) {
      if (error.code === 'same_password') {
        // 비밀번호는 이미 설정됨 → 이메일과 닉네임만 업데이트 (세션은 유지됨)
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          email,
          data: { nickname },
        });
        if (updateError) throw updateError;
        userId = updateData.user?.id;
      } else {
        throw error;
      }
    } else {
      userId = data.user?.id;
    }

    if (!userId) throw new Error('회원가입 실패: 사용자 정보를 확인할 수 없습니다');
    await supabase
      .from('profiles')
      .update({ nickname, is_anonymous: false, provider: 'EMAIL' })
      .eq('user_id', userId);
    return { userId };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error('회원가입 실패: 사용자 정보를 확인할 수 없습니다');
  return { userId };
};

type LoginRequestTypes = {
  email?: string;
  password?: string;
  provider?: ProviderTypes;
  code?: string;
};

type LoginResponseTypes = {
  userId: string;
};

export const login = async ({
  email,
  password,
  provider = 'EMAIL',
  code,
}: LoginRequestTypes): Promise<LoginResponseTypes> => {
  if (provider === 'EMAIL') {
    if (!email || !password) throw new Error('이메일과 비밀번호가 필요합니다');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { userId: data.user.id };
  }

  if (!code) throw new Error('OAuth 토큰이 필요합니다');

  const supabaseProvider = provider === 'GOOGLE' ? 'google' : 'apple';
  // 익명 세션 위에 OAuth identity를 manual-link하는 안전한 모바일 흐름은 Edge Function에서
  // service-role로 처리하는 게 맞아 후속 작업에서 구현. 현 단계는 단순 OAuth 로그인.
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: supabaseProvider,
    token: code,
  });
  if (error) throw error;
  return { userId: data.user.id };
};

type AppleLoginRequestTypes = {
  authorizationCode: string;
  identityToken?: string;
  user?: string;
  email?: string | null;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
};

export const appleLogin = async ({
  authorizationCode,
  identityToken,
}: AppleLoginRequestTypes): Promise<LoginResponseTypes> => {
  const token = identityToken ?? authorizationCode;
  return login({ provider: 'APPLE', code: token });
};

export const checkEmail = async (_args: { email: string }): Promise<{ available: boolean }> => {
  // Supabase는 auth.users 직접 조회를 허용하지 않음. 실제 중복은 signUp 시 검증되며,
  // 사전 체크가 필요하면 별도 Edge Function(check-email)에서 admin client로 조회.
  return { available: true };
};

export const signInAnonymously = async () => {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
