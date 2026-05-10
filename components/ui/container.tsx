import { ColorValue, KeyboardAvoidingView, Platform } from 'react-native';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

const hasBottomEdge = (edges: Edges): boolean => {
  if (Array.isArray(edges)) {
    return edges.includes('bottom');
  }
  return false;
};

const Container = ({
  children,
  className,
  edges = ['top', 'bottom'],
  isKeyboardAvoiding = false,
}: {
  children: React.ReactNode;
  className?: string;
  edges?: Edges;
  isKeyboardAvoiding?: boolean;
}) => {
  const backgroundColor = useCSSVariable('--color-background');
  const needsAndroidBottomPadding = Platform.OS === 'android' && hasBottomEdge(edges);

  if (isKeyboardAvoiding) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: backgroundColor as ColorValue,
          paddingBottom: needsAndroidBottomPadding ? 16 : undefined,
        }}
        edges={edges}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: backgroundColor as ColorValue,
        paddingBottom: needsAndroidBottomPadding ? 16 : undefined,
      }}
      edges={edges}>
      {children}
    </SafeAreaView>
  );
};

export default Container;
