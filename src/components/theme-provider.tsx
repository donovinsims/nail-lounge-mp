import { useEffect, type ReactNode } from "react";

// Light mode only.
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try { localStorage.setItem("theme", "light"); } catch {}
  }, []);
  return <>{children}</>;
}

export const useTheme = () => ({ theme: "light" as const, toggle: () => {} });

