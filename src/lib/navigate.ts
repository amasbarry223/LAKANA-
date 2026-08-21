"use client"

// Lightweight event-based navigation helper so any view can trigger
// a sidebar navigation without prop drilling.
export function navigateTo(label: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lakana-navigate", { detail: label }))
  }
}
