/**
 * Light/dark theme helpers. Theme is applied by setting a `data-theme` attribute on the
 * <html> element and is mirrored to localStorage so it survives reloads.
 *
 * The dark theme overrides CSS variables in StudentSettingsPage.css so any consumer of
 * the existing `--bg / --surface / --text-main / ...` tokens automatically gets dark
 * colours when the attribute is set.
 */

const STORAGE_KEY = 'smart_campus_theme'
const VALID_THEMES = ['LIGHT', 'DARK']

/** Returns the saved theme ("LIGHT"|"DARK") or "LIGHT" if nothing valid is stored. */
export function getStoredTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && VALID_THEMES.includes(raw.toUpperCase())) {
      return raw.toUpperCase()
    }
  } catch {
    /* ignore */
  }
  return 'LIGHT'
}

export function applyTheme(themeOrPreference) {
  const theme = String(themeOrPreference || 'LIGHT').toUpperCase()
  const next = VALID_THEMES.includes(theme) ? theme : 'LIGHT'
  if (typeof document !== 'undefined' && document.documentElement) {
    if (next === 'DARK') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
  return next
}

export function applyStoredTheme() {
  return applyTheme(getStoredTheme())
}
