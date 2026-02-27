"use client";

import { ThemeProvider } from "./ThemeProvider";
import { HelpProvider } from "./HelpProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HelpProvider>
        {children}
      </HelpProvider>
    </ThemeProvider>
  );
}
