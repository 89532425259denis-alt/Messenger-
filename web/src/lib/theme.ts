export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "devo-plus.theme"

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme
  root.classList.toggle("dark", resolved === "dark")
  root.dataset.theme = resolved
}

export function getStoredTheme(): Theme {
  const value = localStorage.getItem(STORAGE_KEY)
  if (value === "light" || value === "dark" || value === "system") return value
  return "system"
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

export function initTheme() {
  applyTheme(getStoredTheme())
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system")
  })
}
