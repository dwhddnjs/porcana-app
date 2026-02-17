# Create Screen

주어진 인수를 바탕으로 Porcana 앱의 Expo Router 스크린을 생성합니다.

**사용법**: `/create-screen <경로> [설명]`

예시:
- `/create-screen (tabs)/(portfolio)/detail` → `app/(tabs)/(portfolio)/detail.tsx`
- `/create-screen (auth)/verify-email` → `app/(auth)/verify-email.tsx`

## 규칙

1. 파일명은 **kebab-case**
2. 스크린은 **`export default` 함수 선언식** (`export default function MyScreen() {}`)
3. 내부 핸들러/유틸은 **화살표 함수 표현식**
4. 이벤트 핸들러는 JSX 인라인 금지 → 별도 함수로 선언 후 참조
5. 타입/인터페이스에는 `Types` 접미사
6. **Safe Area 처리** 필수 (SafeAreaView 또는 useSafeAreaInsets)
7. 데이터 패칭은 `useGet[Resource]Query()` 훅 사용
8. 뮤테이션은 `use[Action]Mutation()` 훅 사용
9. 글로벌 로딩은 `useLoadingStore` (`show('메시지')` / `hide()`)
10. 한글 UI 텍스트 사용

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

생성 전에 `app/` 디렉토리 구조를 파악하고, 관련 기존 스크린을 읽어 패턴을 맞추세요.
