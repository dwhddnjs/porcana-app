import { cn } from '@/lib/utils';
import * as SelectPrimitive from '@rn-primitives/select';
import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Option = SelectPrimitive.Option;

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<SelectPrimitive.TriggerRef, SelectPrimitive.TriggerProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'border-input bg-background flex h-10 flex-row items-center justify-between rounded-md border px-3 py-2',
        props.disabled && 'opacity-50',
        className
      )}
      {...props}>
      <>{children}</>
      <Icon as={ChevronDown} size={16} className="text-muted-foreground ml-2" />
    </SelectPrimitive.Trigger>
  )
);
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = React.forwardRef<
  SelectPrimitive.ContentRef,
  SelectPrimitive.ContentProps & { portalHost?: string }
>(({ className, children, position = 'popper', portalHost, ...props }, ref) => {
  const insets = useSafeAreaInsets();
  return (
    <SelectPrimitive.Portal hostName={portalHost}>
      <SelectPrimitive.Overlay style={StyleSheet.absoluteFill}>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            'bg-popover border-border z-50 min-w-[8rem] rounded-md border py-1 shadow-md shadow-black/5',
            position === 'popper' && 'max-h-60',
            className
          )}
          position={position}
          insets={{ top: insets.top, bottom: insets.bottom }}
          sideOffset={4}
          {...props}>
          {children}
        </SelectPrimitive.Content>
      </SelectPrimitive.Overlay>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = 'SelectContent';

const SelectLabel = React.forwardRef<SelectPrimitive.LabelRef, SelectPrimitive.LabelProps>(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.Label
      ref={ref}
      className={cn('text-foreground px-2 py-1.5 text-sm font-semibold', className)}
      {...props}
    />
  )
);
SelectLabel.displayName = 'SelectLabel';

const SelectItem = React.forwardRef<SelectPrimitive.ItemRef, SelectPrimitive.ItemProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'flex-row items-center gap-2 rounded-sm px-2 py-2 active:bg-accent',
        props.disabled && 'opacity-50',
        className
      )}
      {...props}>
      <View className="h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icon as={Check} size={14} className="text-primary" />
        </SelectPrimitive.ItemIndicator>
      </View>
      <SelectPrimitive.ItemText className="text-foreground text-sm" />
    </SelectPrimitive.Item>
  )
);
SelectItem.displayName = 'SelectItem';

const SelectSeparator = React.forwardRef<
  SelectPrimitive.SeparatorRef,
  SelectPrimitive.SeparatorProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('bg-muted -mx-1 my-1 h-px', className)}
    {...props}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type Option,
};
