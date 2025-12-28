const PREFERENCES_KEY = 'hashdrop-preferences'

export interface UserPreferences {
  autoCopyCode: boolean
  autoDownload: boolean
  errorNotifications: boolean
  // Future preferences can be added here
}

const defaultPreferences: UserPreferences = {
  autoCopyCode: true, // Default to auto-copy enabled
  autoDownload: false, // Default to manual download (safer)
  errorNotifications: true // Default to error notifications enabled
}

export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') return defaultPreferences

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY)
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
  }

  return defaultPreferences
}

export function setPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return

  try {
    const current = getPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save preferences:', error)
  }
}

export function toggleAutoCopyCode(): boolean {
  const current = getPreferences()
  const newValue = !current.autoCopyCode
  setPreferences({ autoCopyCode: newValue })
  return newValue
}

export function toggleAutoDownload(): boolean {
  const current = getPreferences()
  const newValue = !current.autoDownload
  setPreferences({ autoDownload: newValue })
  return newValue
}

export function toggleErrorNotifications(): boolean {
  const current = getPreferences()
  const newValue = !current.errorNotifications
  setPreferences({ errorNotifications: newValue })
  return newValue
}
