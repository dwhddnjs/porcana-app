/**
 * Base64 URL 디코딩 함수 (React Native 호환)
 * JWT 토큰의 payload 디코딩 등에 사용됩니다.
 */
export const base64UrlDecode = (str: string): string => {
  // base64url을 base64로 변환
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // padding 추가
  while (base64.length % 4) {
    base64 += '=';
  }

  // base64 디코딩
  // React Native에서는 atob가 polyfill되어 있을 수 있지만,
  // 없을 경우를 대비해 직접 디코딩
  if (typeof atob !== 'undefined') {
    return atob(base64);
  }

  // atob가 없는 경우 직접 디코딩 (간단한 base64 디코딩)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;

  base64 = base64.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  while (i < base64.length) {
    const enc1 = chars.indexOf(base64.charAt(i++));
    const enc2 = chars.indexOf(base64.charAt(i++));
    const enc3 = chars.indexOf(base64.charAt(i++));
    const enc4 = chars.indexOf(base64.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }

  return output;
};

/**
 * JWT 토큰의 payload를 파싱하여 객체로 반환합니다.
 * @param token JWT 토큰 문자열
 * @returns 파싱된 payload 객체 또는 null
 */
export const parseJwtPayload = <T = Record<string, any>>(token: string | null): T | null => {
  if (!token) {
    return null;
  }

  try {
    // JWT는 Header.Payload.Signature 형식
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Payload 부분 디코딩 (base64url)
    const payload = parts[1];
    const decoded = base64UrlDecode(payload);
    const parsed = JSON.parse(decoded);

    return parsed as T;
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
};

/**
 * JWT 토큰에서 이메일을 추출합니다.
 * Apple Sign In의 경우 최초 로그인 이후 credential.email이 null이 되지만,
 * identityToken의 payload에는 항상 이메일 정보가 포함되어 있습니다.
 * @param identityToken JWT identityToken 문자열
 * @returns 이메일 주소 또는 null
 */
export const parseEmailFromIdentityToken = (identityToken: string | null): string | null => {
  const payload = parseJwtPayload<{ email?: string }>(identityToken);
  return payload?.email || null;
};

/**
 * 소수점 두 번째 자리에서 반올림하는 함수
 * @param num 반올림할 숫자
 * @returns 소수점 두 번째 자리에서 반올림된 숫자
 */
export const roundToTwoDecimals = (num: number): number => {
  return Number(num.toFixed(2));
};
