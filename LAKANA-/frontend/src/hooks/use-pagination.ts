"use client"

import { useEffect, useMemo, useState } from "react"

export interface PageResult<T> {
  data: T[]
  total: number
}

export interface PaginationState<T> {
  data: T[]
  total: number
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  totalPages: number
  loading: boolean
  error: Error | null
  /** Recharge la page courante sans revenir à la page 1 (après une édition/suppression). */
  refetch: () => void
}

/**
 * Pagination pilotée par le serveur : refait un appel à `fetcher` à chaque
 * changement de page, de taille de page, ou de dépendance (filtres, recherche…).
 * `deps` remet la page à 1 (nouvelle recherche/filtre = on repart du début).
 */
export function usePaginatedFetch<T>(
  fetcher: (params: { skip: number; limit: number }) => Promise<PageResult<T>>,
  deps: React.DependencyList,
  options?: { pageSize?: number }
): PaginationState<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(options?.pageSize ?? 20)
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const refetch = () => setReloadToken((t) => t + 1)

  // Toute nouvelle recherche/filtre repart de la page 1
  useEffect(() => {
    setPage(1)
  }, deps)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher({ skip: (page - 1) * pageSize, limit: pageSize })
      .then((result) => {
        if (cancelled) return
        setData(result.data)
        setTotal(result.total)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error(String(err)))
        setData([])
        setTotal(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, pageSize, reloadToken, ...deps])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return { data, total, page, setPage, pageSize, setPageSize, totalPages, loading, error, refetch }
}

export interface SliceState<T> {
  data: T[]
  total: number
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  totalPages: number
}

/**
 * Pagination côté client : découpe un tableau déjà en mémoire (vues dérivées
 * comme sanctions/notifications/structuring, ou historique déjà chargé).
 * Aucun appel réseau — juste un slice réactif.
 */
export function usePageSlice<T>(items: T[], initialPageSize = 20): SliceState<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Si le tableau source rétrécit (filtre plus strict), on ne reste pas bloqué
  // sur une page qui n'existe plus.
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])

  const data = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return {
    data,
    total,
    page,
    setPage,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size)
      setPage(1)
    },
    totalPages,
  }
}
