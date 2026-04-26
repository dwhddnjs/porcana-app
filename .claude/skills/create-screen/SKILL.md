---
name: create-screen
description: Porcana 앱의 Expo Router 스크린을 생성합니다. 화면 만들기, 새 페이지 생성, 라우트 추가 시 사용.
argument-hint: "<경로> [설명]"
allowed-tools: Read, Write, Glob, Grep
---

# Create Screen

주어진 인수를 바탕으로 Porcana 앱의 Expo Router 스크린을 생성합니다.

인수: $ARGUMENTS

예시:
- `/create-screen (tabs)/(portfolio)/detail` → `app/(tabs)/(portfolio)/detail.tsx`
- `/create-screen (auth)/verify-email` → `app/(auth)/verify-email.tsx`

> 네이밍, 타입, 이벤트 핸들러 등 일반 규칙은 CLAUDE.md를 따릅니다.

## 절차

1. `app/` 디렉토리 구조 파악
2. 관련 기존 스크린을 읽어 패턴을 맞춤
3. 스크린 생성

## 스크린 전용 규칙

- 스크린은 **`export default` 함수 선언식** (`export default function MyScreen() {}`)
- **레이아웃은 `Container` 컴포넌트** (`components/ui/container.tsx`)를 사용할 것 — SafeAreaView를 직접 쓰지 않고 Container로 감싼다
  - `Container`는 SafeAreaView + 배경색 + Android bottom padding을 자동 처리
  - `edges` prop으로 Safe Area 방향 제어 (기본값: `['top', 'bottom']`)
  - `isKeyboardAvoiding` prop으로 키보드 dismiss 처리 가능
- 데이터 패칭은 `useGet[Resource]Query()` 훅 사용
- 뮤테이션은 `use[Action]Mutation()` 훅 사용
- Expo Router 패턴 참고: https://docs.expo.dev/router/introduction/

## 출력 예시

```tsx
// app/(tabs)/(portfolio)/detail.tsx
import Container from '@/components/ui/container';
import { Text, View } from 'react-native';

export default function DetailScreen() {
  return (
    <Container>
      <View className="flex-1 p-4">
        <Text className="text-foreground text-xl font-bold">상세 화면</Text>
      </View>
    </Container>
  );
}
```
