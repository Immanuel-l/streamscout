import { useCallback, useEffect, useState } from 'react'

function readPresets(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useFilterPresets(storageKey) {
  const [presets, setPresets] = useState(() => readPresets(storageKey))

  useEffect(() => {
    setPresets(readPresets(storageKey))
  }, [storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(presets))
    } catch {
      // Ignore storage errors (quota/private mode)
    }
  }, [storageKey, presets])

  const savePreset = useCallback((name, values) => {
    const trimmedName = String(name || '').trim()
    if (!trimmedName) {
      return { success: false, error: 'Bitte gib einen Preset-Namen ein.' }
    }

    const existing = presets.find((preset) =>
      preset.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (existing) {
      setPresets((prev) =>
        prev.map((preset) =>
          preset.id === existing.id
            ? {
              ...preset,
              name: trimmedName,
              values,
              updatedAt: Date.now(),
            }
            : preset
        )
      )

      return { success: true, id: existing.id, replaced: true }
    }

    const id = createId()
    setPresets((prev) => [
      {
        id,
        name: trimmedName,
        values,
        createdAt: Date.now(),
      },
      ...prev,
    ])

    return { success: true, id, replaced: false }
  }, [presets])

  const getPresetById = useCallback(
    (id) => presets.find((preset) => preset.id === id) || null,
    [presets]
  )

  const deletePreset = useCallback(
    (id) => {
      if (!id) return false
      const exists = presets.some((preset) => preset.id === id)
      if (!exists) return false
      setPresets((prev) => prev.filter((preset) => preset.id !== id))
      return true
    },
    [presets]
  )

  return {
    presets,
    savePreset,
    getPresetById,
    deletePreset,
  }
}
