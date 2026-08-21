"use client"

export type NavigateOptions = {
  clientId?: string
  alertRef?: string
  investigationRef?: string
}

export type NavigateDetail = {
  label: string
  options?: NavigateOptions
}

// Lightweight event-based navigation helper so any view can trigger
// a sidebar navigation without prop drilling.
export function navigateTo(label: string, options?: NavigateOptions) {
  if (typeof window !== "undefined") {
    const detail: NavigateDetail = options ? { label, options } : { label }
    window.dispatchEvent(new CustomEvent("lakana-navigate", { detail }))
  }
}
