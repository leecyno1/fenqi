"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "poly-theme";
type ThemeMode = "light" | "dark";

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "切换到浅色主题" : "切换到深色主题"}
      className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-glass-line)] bg-[var(--color-surface-raised)] px-2 py-1.5 text-[0.72rem] font-medium text-[var(--color-ink)] shadow-[var(--shadow-button)] transition hover:-translate-y-0.5"
    >
      <span className="relative flex h-6 w-11 items-center rounded-full bg-[var(--color-toggle-track)] p-0.5 transition">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-toggle-thumb)] text-[var(--color-accent)] shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-transform duration-300 ${isDark ? "translate-x-5" : "translate-x-0"}`}>
          {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </span>
      </span>
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
