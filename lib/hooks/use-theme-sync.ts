import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { Uniwind } from 'uniwind';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';

let systemScheme: 'light' | 'dark' = Appearance.getColorScheme() ?? 'dark';
let lastSetScheme: 'light' | 'dark' | null = null;

export const useThemeSync = () => {
  const themeMode = useUserStore((s) => s.themeMode);

  useEffect(() => {
    const resolved = themeMode === 'system' ? systemScheme : themeMode;
    if (lastSetScheme === resolved) return;
    lastSetScheme = resolved;
    Uniwind.setTheme(resolved);
  }, [themeMode]);

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      const scheme = (colorScheme as 'light' | 'dark') ?? 'dark';
      if (scheme === lastSetScheme) return;
      systemScheme = scheme;
      if (useUserStore.getState().themeMode === 'system') {
        lastSetScheme = scheme;
        Uniwind.setTheme(scheme);
      }
    });
    return () => listener.remove();
  }, []);
};
