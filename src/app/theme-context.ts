import { createContext } from 'react';

export type ThemeMode = 'dark' | 'light';

export type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
