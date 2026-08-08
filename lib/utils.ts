import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// twMerge "cru" não conhece as cores customizadas do tema (definidas em
// app/globals.css) — sem isto, sobrepor por exemplo bg-popover com
// bg-black/85 via className não é reconhecido como conflito, as duas
// classes ficam na string final, e o resultado passa a depender da ordem
// interna do CSS gerado pelo Tailwind em vez da nossa intenção.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "background", "foreground",
        "card", "card-foreground",
        "popover", "popover-foreground",
        "primary", "primary-foreground",
        "secondary", "secondary-foreground",
        "muted", "muted-foreground",
        "accent", "accent-foreground",
        "destructive",
        "border", "input", "ring",
        "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
        "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
        "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
