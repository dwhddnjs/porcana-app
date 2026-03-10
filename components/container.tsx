import { ColorValue, Keyboard, Platform, TouchableWithoutFeedback } from 'react-native';
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
  isKeyboardAvioding = false,
}: {
  children: React.ReactNode;
  className?: string;
  edges?: Edges;
  isKeyboardAvioding?: boolean;
}) => {
  const backgroundColor = useCSSVariable('--color-background');
  const needsAndroidBottomPadding = Platform.OS === 'android' && hasBottomEdge(edges);

  if (isKeyboardAvioding) {
    // TODO: Keyboard avoiding view
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: backgroundColor as ColorValue,
            paddingBottom: needsAndroidBottomPadding ? 16 : undefined,
          }}
          edges={edges}>
          {children}
        </SafeAreaView>
      </TouchableWithoutFeedback>
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
