"use client";

import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useHelp } from "./HelpProvider";
import type { ThemeName } from "@/app/lib/settingsStorage";

const THEMES: { name: ThemeName; label: string }[] = [
  { name: "claude", label: "Claude" },
  { name: "dark", label: "Dark" },
  { name: "classic", label: "Classic" },
  { name: "toss", label: "Toss" },
];

interface SettingsBarProps {
  onDataTransfer?: () => void;
  isIntro?: boolean;
  inline?: boolean;
}

export default function SettingsBar({ onDataTransfer, isIntro, inline }: SettingsBarProps) {
  const { theme, setTheme } = useTheme();
  const { helpEnabled, setHelpEnabled } = useHelp();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: gear icon toggle */}
      {inline ? (
        /* Inline mode: plain button in flow (for mobile header) */
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="설정"
          className={`p-2 rounded-full transition-colors ${
            open ? "text-primary" : "text-muted-foreground hover:bg-table-hover"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      ) : isIntro ? (
        /* Fixed gear icon for intro screen only */
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="설정"
          className={`md:hidden fixed z-[70] w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 top-3 right-3 ${
            open
              ? "bg-primary text-primary-fg shadow-md"
              : "bg-white/10 backdrop-blur-md text-white/70 hover:bg-white/20 hover:text-white"
          }`}
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      ) : null}

      {/* Mobile: expanded panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-[69]"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className={`md:hidden fixed ${isIntro ? "top-12 right-3" : "top-[46px] right-3"} z-[70] bg-card-bg/95 backdrop-blur-md border border-card-border rounded-2xl shadow-lg p-4 space-y-4 animate-fadeIn min-w-[200px]`}>
            {/* Help toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground font-medium">도움말</span>
              <button
                role="switch"
                aria-checked={helpEnabled}
                onClick={() => setHelpEnabled(!helpEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  helpEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    helpEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-card-border" />

            {/* Theme buttons — grid */}
            <div>
              <span className="text-xs text-muted-foreground mb-2 block">테마</span>
              <div className="grid grid-cols-2 gap-1.5">
                {THEMES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setTheme(t.name);
                      setOpen(false);
                    }}
                    className={`px-3 py-2 text-sm rounded-xl transition-colors ${
                      theme === t.name
                        ? "bg-primary text-primary-fg font-semibold"
                        : "bg-table-hover text-muted-foreground hover:bg-card-border"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Data transfer */}
            {onDataTransfer && (
              <>
                <div className="h-px bg-card-border" />
                <button
                  onClick={() => { setOpen(false); onDataTransfer(); }}
                  className="flex items-center gap-2 w-full px-1 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  데이터 관리
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Desktop: always visible inline bar (hidden in inline mode) */}
      {!inline && <div className="hidden md:flex fixed top-2 right-4 z-[70] items-center gap-3 bg-card-bg/90 backdrop-blur-sm border border-card-border rounded-lg shadow-sm px-3 py-1.5">
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

        {/* Data transfer */}
        {onDataTransfer && (
          <>
            <div className="w-px h-4 bg-card-border" />
            <button
              onClick={onDataTransfer}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-table-hover rounded transition-colors"
              title="데이터 내보내기/들여오기"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </>
        )}
      </div>}
    </>
  );
}
