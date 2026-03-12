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

  it('speichert ein neues Preset und persistiert es in localStorage', () => {
    const { result } = renderHook(() => useFilterPresets('presets.test'))

    let saveResult
    act(() => {
      saveResult = result.current.savePreset('Meine Auswahl', { sortBy: 'rating', mediaType: 'movie' })
    })

    expect(saveResult).toEqual(expect.objectContaining({ success: true, replaced: false }))
    expect(result.current.presets).toHaveLength(1)
    expect(result.current.presets[0]).toEqual(expect.objectContaining({
      name: 'Meine Auswahl',
      values: { sortBy: 'rating', mediaType: 'movie' },
    }))

    const stored = JSON.parse(localStorage.getItem('presets.test'))
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Meine Auswahl')
  })

  it('ersetzt ein vorhandenes Preset mit gleichem Namen (case-insensitive)', () => {
    const { result } = renderHook(() => useFilterPresets('presets.test'))

    let firstResult
    let secondResult

    act(() => {
      firstResult = result.current.savePreset('Abend', { sortBy: 'popularity' })
    })

    act(() => {
      secondResult = result.current.savePreset('abend', { sortBy: 'date' })
    })

    expect(firstResult.success).toBe(true)
    expect(secondResult).toEqual(expect.objectContaining({ success: true, replaced: true }))
    expect(secondResult.id).toBe(firstResult.id)
    expect(result.current.presets).toHaveLength(1)
    expect(result.current.presets[0]).toEqual(expect.objectContaining({
      id: firstResult.id,
      name: 'abend',
      values: { sortBy: 'date' },
    }))
    expect(result.current.presets[0].updatedAt).toEqual(expect.any(Number))
  })

  it('liefert einen Fehler bei leerem Preset-Namen', () => {
    const { result } = renderHook(() => useFilterPresets('presets.test'))

    let saveResult
    act(() => {
      saveResult = result.current.savePreset('   ', { sortBy: 'rating' })
    })

    expect(saveResult).toEqual({ success: false, error: 'Bitte gib einen Preset-Namen ein.' })
    expect(result.current.presets).toHaveLength(0)
  })

  it('findet und loescht Presets ueber die ID', () => {
    const { result } = renderHook(() => useFilterPresets('presets.test'))

    let id
    act(() => {
      const saveResult = result.current.savePreset('Temp', { mediaType: 'tv' })
      id = saveResult.id
    })

    expect(result.current.getPresetById(id)).toEqual(expect.objectContaining({ name: 'Temp' }))

    let deleted
    act(() => {
      deleted = result.current.deletePreset(id)
    })

    expect(deleted).toBe(true)
    expect(result.current.getPresetById(id)).toBeNull()
    expect(result.current.presets).toEqual([])
    expect(result.current.deletePreset('gibt-es-nicht')).toBe(false)
  })
})
