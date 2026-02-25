---
name: create-component
description: React Native 컴포넌트를 생성 (공용 UI 또는 feature 컴포넌트). Use when the user asks to create a new component, UI element, or widget in the Porcana app.
---

# Create Component

주어진 인수를 바탕으로 Porcana 앱의 컴포넌트를 생성합니다.

**사용법**: `<컴포넌트명> [ui|<feature명>]`

- 두 번째 인수가 `ui`이면 `components/ui/`에 생성
- 두 번째 인수가 feature명(예: `portfolio`, `arena`)이면 `components/<feature>/`에 생성
- 두 번째 인수를 생략하면 어디에 만들 것인지 물어볼 것

> 네이밍, 타입, 스타일링, 이벤트 핸들러 등 일반 규칙은 `.cursorrules`를 따릅니다.

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

## 절차

1. 관련 기존 컴포넌트를 읽어 패턴 파악
2. react-native-reusables 문서(https://reactnativereusables.com/docs) 확인하여 이미 있으면 활용
3. 컴포넌트 파일 생성
