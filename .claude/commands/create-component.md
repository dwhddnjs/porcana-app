# Create Component

주어진 인수를 바탕으로 Porcana 앱의 컴포넌트를 생성합니다.

**사용법**: `/create-component <컴포넌트명> [ui|<feature명>]`

- 두 번째 인수가 `ui`이면 `components/ui/` 에 생성합니다.
- 두 번째 인수가 feature명(예: `portfolio`, `arena`)이면 `components/<feature>/` 에 생성합니다.
- 두 번째 인수를 생략하면 어디에 만들 것인지 물어보세요.

## 규칙

1. 파일명은 반드시 **kebab-case** (예: `my-button.tsx`)
2. 컴포넌트는 **`export` 함수 표현식**으로 작성 (`export const MyButton = () => {}`)
3. 스타일은 **NativeWind + CVA** 사용, 색상은 `global.css` 변수 참조
4. 클래스 병합은 `lib/utils.ts`의 `cn()` 사용
5. 다크/라이트 모드 지원
6. 이벤트 핸들러는 JSX 인라인 금지 → 별도 함수로 선언 후 참조
7. 타입/인터페이스에는 반드시 `Types` 접미사 (예: `MyButtonTypes`)
8. React Native 기본 컴포넌트(Alert, Modal 등)보다 **react-native-reusables** 우선 사용
9. 공용 UI 컴포넌트는 `components/ui/`, feature 컴포넌트는 해당 feature 폴더

## 출력 예시 (ui 컴포넌트)

```tsx
// components/ui/my-button.tsx
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Pressable, Text } from 'react-native';

const myButtonVariants = cva('rounded-lg px-4 py-2', {
  variants: {
    variant: {
      default: 'bg-primary',
      outline: 'border border-primary bg-transparent',
    },
    size: {
      sm: 'h-8',
      md: 'h-10',
      lg: 'h-12',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

type MyButtonTypes = VariantProps<typeof myButtonVariants> & {
  label: string;
  onPress?: () => void;
};

export const MyButton = ({ variant, size, label, onPress }: MyButtonTypes) => {
  return (
    <Pressable className={cn(myButtonVariants({ variant, size }))} onPress={onPress}>
      <Text>{label}</Text>
    </Pressable>
  );
};
```

위 규칙과 예시를 참고하여 사용자가 요청한 컴포넌트를 생성하세요. 생성 전에 관련 기존 컴포넌트를 읽고 패턴을 파악하세요.
