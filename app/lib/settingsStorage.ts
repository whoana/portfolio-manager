export type ThemeName = "claude" | "dark" | "classic";

const THEME_KEY = "etf_theme";
const HELP_KEY = "etf_help_enabled";

export function getSavedTheme(): ThemeName {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "claude" || v === "dark" || v === "classic") return v;
  } catch {}
  return "claude";
}

export function saveTheme(theme: ThemeName): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function getHelpEnabled(): boolean {
  try {
    const v = localStorage.getItem(HELP_KEY);
    if (v === "true") return true;
    if (v === "false") return false;
  } catch {}
  return true;
}

export function saveHelpEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(HELP_KEY, String(enabled));
  } catch {}
}
