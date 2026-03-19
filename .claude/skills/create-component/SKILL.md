---
name: create-component
description: Porcana 앱의 React Native 컴포넌트를 생성합니다. 컴포넌트 만들기, UI 컴포넌트 생성, feature 컴포넌트 생성 시 사용.
argument-hint: "<컴포넌트명> [ui|<feature명>]"
allowed-tools: Read, Write, Glob, Grep
---

# Create Component

주어진 인수를 바탕으로 Porcana 앱의 컴포넌트를 생성합니다.

인수: $ARGUMENTS

- 두 번째 인수가 `ui`이면 `components/ui/` 에 생성합니다.
- 두 번째 인수가 feature명(예: `portfolio`, `arena`)이면 `components/<feature>/` 에 생성합니다.
- 두 번째 인수를 생략하면 어디에 만들 것인지 물어보세요.

> 네이밍, 스타일링, 타입, 이벤트 핸들러 등 일반 규칙은 CLAUDE.md를 따릅니다.

## 절차

1. 기존 관련 컴포넌트를 읽어 패턴 파악
2. 컴포넌트 생성

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
