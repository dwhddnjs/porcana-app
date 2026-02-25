---
name: create-screen
description: Expo Router 스크린 파일을 생성. Use when the user asks to create a new screen, page, or route in the Porcana app.
---

# Create Screen

주어진 인수를 바탕으로 Porcana 앱의 Expo Router 스크린을 생성합니다.

**사용법**: `<경로> [설명]`

예시:
- `(tabs)/(portfolio)/detail` → `app/(tabs)/(portfolio)/detail.tsx`
- `(auth)/verify-email` → `app/(auth)/verify-email.tsx`

> 네이밍, 타입, 이벤트 핸들러 등 일반 규칙은 `.cursorrules`를 따릅니다.

## 스크린 전용 규칙

- 스크린은 **`export default` 함수 선언식** (`export default function MyScreen() {}`)
- **Safe Area 처리** 필수 (SafeAreaView 또는 useSafeAreaInsets)
- 데이터 패칭은 `useGet[Resource]Query()` 훅 사용
- 뮤테이션은 `use[Action]Mutation()` 훅 사용
- 글로벌 로딩은 `useLoadingStore` (`show('메시지')` / `hide()`)

## 출력 예시

```tsx
// app/(tabs)/(portfolio)/detail.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

export default function DetailScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-foreground text-xl font-bold">상세 화면</Text>
      </View>
    </SafeAreaView>
  );
}
```

## 절차

1. `app/` 디렉토리 구조를 파악
2. 관련 기존 스크린을 읽어 패턴 맞추기
3. 스크린 파일 생성
