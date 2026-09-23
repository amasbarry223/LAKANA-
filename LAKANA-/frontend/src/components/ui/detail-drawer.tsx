"use client"

import type { ReactNode } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

export interface DetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Tiroir de détail latéral — remplace les modales `fixed inset-0` faites main
 * pour le contenu qui prolonge une carte/ligne (jamais pour répéter ce qui est
 * déjà visible sur le déclencheur, cf. Pattern A du plan de simplification).
 * Basé sur sheet.tsx (Radix : focus trap, ESC, scroll-lock, a11y) avec des
 * classes explicites bg-white/slate pour rester hors du système de tokens
 * gris et compatible avec le mode sombre existant (globals.css).
 */
export function DetailDrawer({ open, onOpenChange, title, subtitle, children, footer }: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-slate-200 bg-white p-0 sm:max-w-md dark:border-slate-800 dark:bg-slate-900"
      >
        <SheetHeader className="border-b border-slate-100 dark:border-slate-800">
          <SheetTitle className="text-slate-900 dark:text-white">{title}</SheetTitle>
          {subtitle && (
            <SheetDescription className="text-slate-500 dark:text-slate-400">{subtitle}</SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <SheetFooter className="border-t border-slate-100 dark:border-slate-800">{footer}</SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
