"use client";

import { useTheme } from "./ThemeProvider";
import { useHelp } from "./HelpProvider";
import type { ThemeName } from "@/app/lib/settingsStorage";

const THEMES: { name: ThemeName; label: string }[] = [
  { name: "claude", label: "Claude" },
  { name: "dark", label: "Dark" },
  { name: "classic", label: "Classic" },
];

export default function SettingsBar() {
  const { theme, setTheme } = useTheme();
  const { helpEnabled, setHelpEnabled } = useHelp();

  return (
    <div className="fixed top-2 right-4 z-[70] flex items-center gap-3 bg-card-bg/90 backdrop-blur-sm border border-card-border rounded-lg shadow-sm px-3 py-1.5">
      {/* Help toggle */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground select-none">도움말</span>
        <button
          role="switch"
          aria-checked={helpEnabled}
          onClick={() => setHelpEnabled(!helpEnabled)}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            helpEnabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              helpEnabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-card-border" />

      {/* Theme buttons */}
      <div className="flex items-center gap-1">
        {THEMES.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              theme === t.name
                ? "bg-primary text-primary-fg font-semibold"
                : "text-muted-foreground hover:bg-table-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
