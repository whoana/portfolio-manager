"use client";

import { ThemeProvider } from "./ThemeProvider";
import { HelpProvider } from "./HelpProvider";
import SettingsBar from "./SettingsBar";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HelpProvider>
        <SettingsBar />
        {children}
      </HelpProvider>
    </ThemeProvider>
  );
}
