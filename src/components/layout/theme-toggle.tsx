"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

const OPTIONS = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Avoid a hydration mismatch: the resolved theme is only known client-side.
  const mounted = useMounted();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Changer le thème">
          {mounted && resolvedTheme === "dark" ? (
            <Moon className="size-5" aria-hidden />
          ) : (
            <Sun className="size-5" aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Thème</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={mounted ? theme : undefined} onValueChange={setTheme}>
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="size-4" aria-hidden />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
