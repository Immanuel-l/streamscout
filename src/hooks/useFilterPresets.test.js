import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilterPresets } from './useFilterPresets'

describe('useFilterPresets', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('startet mit leerer Preset-Liste wenn nichts gespeichert ist', () => {
    const { result } = renderHook(() => useFilterPresets('presets.test'))
    expect(result.current.presets).toEqual([])
  })

  it('speichert Presets und sortiert sie alphabetisch', () => {
    const { result } = renderHook(() => useFilterPresets('presets.test'))

    act(() => {
      result.current.savePreset('Zeta', { sortBy: 'rating' })
      result.current.savePreset('Alpha', { sortBy: 'date' })
    })

    expect(result.current.presets.map((preset) => preset.name)).toEqual(['Alpha', 'Zeta'])
  })

  it('benennt Presets um und blockiert doppelte Namen', () => {
    const { result } = renderHook(() => useFilterPresets('presets.test'))

    let alphaId
    let betaId
    act(() => {
      alphaId = result.current.savePreset('Alpha', { type: 'movie' }).id
      betaId = result.current.savePreset('Beta', { type: 'tv' }).id
    })

    let renameResult
    act(() => {
      renameResult = result.current.renamePreset(alphaId, 'Gamma')
    })

    expect(renameResult).toEqual({ success: true, id: alphaId })
    expect(result.current.presets.map((preset) => preset.name)).toEqual(['Beta', 'Gamma'])

    let duplicateResult
    act(() => {
      duplicateResult = result.current.renamePreset(betaId, 'gamma')
    })

    expect(duplicateResult).toEqual({ success: false, error: 'Ein Preset mit diesem Namen existiert bereits.' })
  })

  it('exportiert und importiert Presets inkl. Ersetzungen', () => {
    const first = renderHook(() => useFilterPresets('presets.export'))

    act(() => {
      first.result.current.savePreset('Action', { mediaType: 'movie', rating: '7' })
    })

    const exported = first.result.current.exportPresets()
    expect(exported).toContain('Action')

    const second = renderHook(() => useFilterPresets('presets.import'))

    act(() => {
      second.result.current.savePreset('Action', { mediaType: 'tv', rating: '5' })
      second.result.current.savePreset('Drama', { mediaType: 'movie' })
    })

    let importResult
    act(() => {
      importResult = second.result.current.importPresets(exported)
    })

    expect(importResult).toEqual({ success: true, importedCount: 0, replacedCount: 1 })

    const importedAction = second.result.current.presets.find((preset) => preset.name === 'Action')
    expect(importedAction.values).toEqual({ mediaType: 'movie', rating: '7' })
  })

  it('liefert Fehler bei ungültigem Import und löscht Presets per ID', () => {
    const { result } = renderHook(() => useFilterPresets('presets.test'))

    let invalidImport
    act(() => {
      invalidImport = result.current.importPresets('{broken')
    })

    expect(invalidImport).toEqual({ success: false, error: 'Preset-Daten konnten nicht gelesen werden.' })

    let id
    act(() => {
      id = result.current.savePreset('Temp', { mediaType: 'movie' }).id
    })

    expect(result.current.getPresetById(id)).toEqual(expect.objectContaining({ name: 'Temp' }))

    let deleted
    act(() => {
      deleted = result.current.deletePreset(id)
    })

    expect(deleted).toBe(true)
    expect(result.current.getPresetById(id)).toBeNull()
  })
})
