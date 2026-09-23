import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFacteur(facteur: any): string {
  if (!facteur) return ""
  if (typeof facteur === "string") return facteur
  if (typeof facteur === "object") {
    return facteur.description || facteur.critere || JSON.stringify(facteur)
  }
  return String(facteur)
}

