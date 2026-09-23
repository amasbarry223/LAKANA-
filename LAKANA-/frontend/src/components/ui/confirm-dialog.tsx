"use client"

import * as React from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "warning" | "default"
  icon?: React.ReactNode
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Confirmer la suppression",
  description = "Êtes-vous sûr de vouloir effectuer cette action ? Cette opération est irréversible.",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  variant = "destructive",
  icon,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive"

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xl">
        <AlertDialogHeader className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:mx-0",
              isDestructive
                ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                : variant === "warning"
                ? "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {icon || (isDestructive ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />)}
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <AlertDialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={handleConfirm}
            className={cn(
              isDestructive
                ? "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 dark:bg-rose-600 dark:hover:bg-rose-700"
                : variant === "warning"
                ? "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500"
                : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
            )}
          >
            {loading ? "Chargement..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
