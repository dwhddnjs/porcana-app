import { cn } from "@/lib/utils";
import { ColorValue } from "react-native";
import { Edges, SafeAreaView } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";



const Container = ({ children, className, edges = ['top', 'bottom'] }: { children: React.ReactNode, className?: string, edges?: Edges }) => {
    const backgroundColor = useCSSVariable('--color-background');
  
  


    

  return (
    <SafeAreaView style={{
        flex: 1,
    
        backgroundColor: backgroundColor as ColorValue,
    }} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

export default Container;