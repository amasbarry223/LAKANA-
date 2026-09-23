"use client"

import React, { useState, useMemo } from "react"
import { SlidersHorizontal, Check, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface SmartColumn<T> {
  key: string
  label: string
  primary?: boolean
  defaultVisible?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
  headerClassName?: string
  align?: "left" | "center" | "right"
}

export interface SmartTableProps<T extends Record<string, any>> {
  data: T[]
  columns: SmartColumn<T>[]
  onRowClick?: (item: T) => void
  renderActions?: (item: T) => React.ReactNode
  loading?: boolean
  emptyMessage?: string
  className?: string
  actionsHeaderLabel?: string
  showColumnToggle?: boolean
}

export function SmartTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  renderActions,
  loading = false,
  emptyMessage = "Aucun élément à afficher",
  className,
  actionsHeaderLabel = "Actions",
  showColumnToggle = true,
}: SmartTableProps<T>) {
  // Par défaut, colonnes primaires ou defaultVisible = true
  const initialKeys = useMemo(
    () =>
      columns
        .filter((c) => c.primary || c.defaultVisible !== false)
        .map((c) => c.key),
    [columns]
  )

  const [visibleKeys, setVisibleKeys] = useState<string[]>(initialKeys)

  const activeColumns = useMemo(
    () => columns.filter((c) => visibleKeys.includes(c.key)),
    [columns, visibleKeys]
  )

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const resetColumns = () => {
    setVisibleKeys(initialKeys)
  }

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      {showColumnToggle && columns.some((c) => !c.primary) && (
        <div className="flex items-center justify-end px-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <SlidersHorizontal className="h-3 w-3 text-slate-400" />
                <span>Colonnes ({activeColumns.length}/{columns.length})</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuLabel className="flex items-center justify-between text-xs">
                <span>Colonnes visibles</span>
                <button
                  type="button"
                  onClick={resetColumns}
                  className="text-2xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Rétablir
                </button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleKeys.includes(col.key)}
                  disabled={col.primary}
                  onCheckedChange={() => toggleColumn(col.key)}
                  className="cursor-pointer text-xs"
                >
                  <span className="flex-1 truncate">{col.label}</span>
                  {col.primary && (
                    <span className="ml-1 text-2xs text-slate-400">(Fixe)</span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                {activeColumns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.headerClassName
                    )}
                  >
                    {col.label}
                  </th>
                ))}
                {renderActions && (
                  <th className="px-4 py-3 text-right">{actionsHeaderLabel}</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td
                    colSpan={activeColumns.length + (renderActions ? 1 : 0)}
                    className="py-12 text-center text-slate-400"
                  >
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin text-indigo-500" />
                    <p className="mt-2 text-xs font-medium">Chargement des données...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeColumns.length + (renderActions ? 1 : 0)}
                    className="py-10 text-center text-sm text-slate-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, rowIdx) => {
                  const rowKey = item.id || item.ref || item.codeClient || rowIdx
                  return (
                    <tr
                      key={String(rowKey)}
                      onClick={() => onRowClick?.(item)}
                      className={cn(
                        "group transition-colors",
                        onRowClick
                          ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                          : "hover:bg-slate-50/40 dark:hover:bg-slate-800/30"
                      )}
                    >
                      {activeColumns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-sm text-slate-700 dark:text-slate-200",
                            col.align === "center" && "text-center",
                            col.align === "right" && "text-right",
                            col.className
                          )}
                        >
                          {col.render ? col.render(item) : String(item[col.key] ?? "")}
                        </td>
                      ))}

                      {renderActions && (
                        <td className="px-4 py-3 text-right">
                          {renderActions(item)}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
