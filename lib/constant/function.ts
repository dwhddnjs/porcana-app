import type { DiversityLevelTypes } from '@/lib/api/portfolio';
import { THEME } from '@/lib/theme';

export const getRiskStarColor = (level: number, theme: 'light' | 'dark' = 'light') => {
  if (level <= 2) return THEME[theme].link;
  if (level <= 3) return THEME[theme].success;
  return THEME[theme].destructive;
};

/**
 * DiversityLevelTypes 한글 라벨
 */
export const DIVERSITY_LEVEL_LABELS: Record<DiversityLevelTypes, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
};

/**
 * DiversityLevelTypes에 따른 텍스트 색상 클래스 반환
 */
export const getDiversityLevelColor = (level?: DiversityLevelTypes): string => {
  if (level === 'HIGH') return 'text-link';
  if (level === 'MEDIUM') return 'text-success';
  return 'text-destructive';
};

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

export const formatCurrency = (value: number): string => {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatWithComma = (value: string): string => {
  const num = value.replace(/[^0-9]/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatKoreanUnit = (value: number): string => {
  if (value === 0) return '0';
  const eok = Math.floor(value / 100_000_000);
  const man = Math.floor((value % 100_000_000) / 10_000);
  const rest = value % 10_000;
  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString()}억`);
  if (man > 0) parts.push(`${man.toLocaleString()}만`);
  if (rest > 0) parts.push(rest.toLocaleString());
  return parts.join(' ');
};

export const formatCompactValue = (value: number, currencyUnit: string): string => {
  if (value >= 100_000_000) return `${currencyUnit}${(value / 100_000_000).toFixed(1)}억`;
  if (value >= 1_000_000) return `${currencyUnit}${(value / 1_000_000).toFixed(1)}M`;
  return `${currencyUnit}${Math.round(value).toLocaleString()}`;
};

export const formatSignedCurrency = (value: number): string => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatCurrency(Math.abs(value))}`;
};

export const formatSignedPercent = (value: number): string => {
  const sign = value > 0 ? '+' : value < 0 ? '' : '';
  return `${sign}${roundToTwoDecimals(value)}%`;
};

export const getReturnColorClass = (value: number): string => {
  if (value > 0) return 'text-stock-up';
  if (value < 0) return 'text-stock-down';
  return 'text-muted-foreground';
};
