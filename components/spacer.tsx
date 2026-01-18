import { StyleProp, View, ViewStyle } from 'react-native';


interface SpacerProps {
    height?: number;
    isDivider?: boolean;
}

export const Spacer = ({ height = 20, isDivider = false, }: SpacerProps) => {
    return isDivider ? (
        <View className='h-[1px] bg-border-muted' />
    ) : (
        <View className={`h-[${height}px]`} />
    );
};

