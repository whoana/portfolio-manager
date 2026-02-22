"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ThemeName } from "@/app/lib/settingsStorage";
import { getSavedTheme, saveTheme } from "@/app/lib/settingsStorage";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "claude",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("claude");

  useEffect(() => {
    setThemeState(getSavedTheme());
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    saveTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
