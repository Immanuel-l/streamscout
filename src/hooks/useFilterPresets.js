import { useCallback, useEffect, useState } from 'react'

function sortPresets(presets) {
  return [...presets].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
}

function sanitizePreset(input) {
  if (!input || typeof input !== 'object') return null
  const name = String(input.name || '').trim()
  if (!name) return null

  return {
    id: String(input.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    name,
    values: input.values ?? {},
    createdAt: Number(input.createdAt) || Date.now(),
    updatedAt: Number(input.updatedAt) || undefined,
  }
}

function readPresets(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const sanitized = parsed
      .map(sanitizePreset)
      .filter(Boolean)

    return sortPresets(sanitized)
  } catch {
    return []
  }
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function mergeImportedPresets(existingPresets, importedPresets) {
  const byName = new Map(existingPresets.map((preset) => [preset.name.toLowerCase(), preset]))
  let replacedCount = 0
  let importedCount = 0

  for (const preset of importedPresets) {
    const key = preset.name.toLowerCase()
    const existing = byName.get(key)

    if (existing) {
      byName.set(key, {
        ...existing,
        name: preset.name,
        values: preset.values,
        updatedAt: Date.now(),
      })
      replacedCount += 1
      continue
    }

    byName.set(key, {
      id: createId(),
      name: preset.name,
      values: preset.values,
      createdAt: Date.now(),
    })
    importedCount += 1
  }

  return {
    merged: sortPresets([...byName.values()]),
    replacedCount,
    importedCount,
  }
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
      setPresets((prev) => sortPresets(
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
      ))

      return { success: true, id: existing.id, replaced: true }
    }

    const id = createId()
    setPresets((prev) => sortPresets([
      {
        id,
        name: trimmedName,
        values,
        createdAt: Date.now(),
      },
      ...prev,
    ]))

    return { success: true, id, replaced: false }
  }, [presets])

  const renamePreset = useCallback((id, name) => {
    const trimmedName = String(name || '').trim()
    if (!trimmedName) {
      return { success: false, error: 'Bitte gib einen neuen Preset-Namen ein.' }
    }

    const preset = presets.find((item) => item.id === id)
    if (!preset) {
      return { success: false, error: 'Preset nicht gefunden.' }
    }

    const duplicate = presets.find((item) =>
      item.id !== id && item.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (duplicate) {
      return { success: false, error: 'Ein Preset mit diesem Namen existiert bereits.' }
    }

    setPresets((prev) => sortPresets(
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            name: trimmedName,
            updatedAt: Date.now(),
          }
          : item
      )
    ))

    return { success: true, id }
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

  const exportPresets = useCallback(() => {
    const payload = presets.map((preset) => ({
      name: preset.name,
      values: preset.values,
    }))

    return JSON.stringify(payload, null, 2)
  }, [presets])

  const importPresets = useCallback((serialized) => {
    const raw = String(serialized || '').trim()
    if (!raw) {
      return { success: false, error: 'Bitte füge Preset-Daten zum Import ein.' }
    }

    try {
      const parsed = JSON.parse(raw)
      const source = Array.isArray(parsed) ? parsed : parsed?.presets
      if (!Array.isArray(source)) {
        return { success: false, error: 'Ungültiges Preset-Format.' }
      }

      const imported = source
        .map((item) => ({
          name: String(item?.name || '').trim(),
          values: item?.values ?? {},
        }))
        .filter((item) => item.name)

      if (imported.length === 0) {
        return { success: false, error: 'Keine gültigen Presets gefunden.' }
      }

      const { merged, importedCount, replacedCount } = mergeImportedPresets(presets, imported)
      setPresets(merged)

      return { success: true, importedCount, replacedCount }
    } catch {
      return { success: false, error: 'Preset-Daten konnten nicht gelesen werden.' }
    }
  }, [presets])

  return {
    presets,
    savePreset,
    renamePreset,
    getPresetById,
    deletePreset,
    exportPresets,
    importPresets,
  }
}
