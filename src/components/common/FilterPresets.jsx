function FilterPresets({
  presets,
  presetName,
  selectedPresetId,
  transferValue,
  onPresetNameChange,
  onSelectedPresetChange,
  onTransferChange,
  onSave,
  onRename,
  onLoad,
  onDelete,
  onCopyShareLink,
  onExport,
  onImport,
  statusMessage = '',
  emptyMessage = 'Noch keine Presets gespeichert.',
}) {
  return (
    <div className="rounded-2xl border border-surface-700 bg-surface-900/40 p-4 space-y-3">
      <p className="text-xs font-medium text-surface-200 uppercase tracking-wider">Filter-Presets</p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={presetName}
          onChange={(event) => onPresetNameChange(event.target.value)}
          placeholder="Preset-Name"
          aria-label="Preset-Name"
          className="min-w-[180px] flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50"
        />
        <button
          type="button"
          onClick={onSave}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-accent-500 text-black hover:bg-accent-400 transition-colors"
        >
          Preset speichern
        </button>
        <button
          type="button"
          onClick={onRename}
          disabled={!selectedPresetId}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-700 text-surface-100 hover:bg-surface-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preset umbenennen
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedPresetId}
          onChange={(event) => onSelectedPresetChange(event.target.value)}
          aria-label="Preset auswählen"
          className="min-w-[180px] flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50"
        >
          <option value="">Preset auswählen</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onLoad}
          disabled={!selectedPresetId}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-700 text-surface-100 hover:bg-surface-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preset laden
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!selectedPresetId}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-800 text-surface-200 border border-surface-600 hover:text-surface-100 hover:border-surface-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preset löschen
        </button>
        <button
          type="button"
          onClick={onCopyShareLink}
          disabled={!selectedPresetId}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-800 text-surface-200 border border-surface-600 hover:text-surface-100 hover:border-surface-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preset-Link kopieren
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-800 text-surface-200 border border-surface-600 hover:text-surface-100 hover:border-surface-500 transition-colors"
          >
            Presets exportieren
          </button>
          <button
            type="button"
            onClick={onImport}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-surface-700 text-surface-100 hover:bg-surface-600 transition-colors"
          >
            Presets importieren
          </button>
        </div>

        <textarea
          value={transferValue}
          onChange={(event) => onTransferChange(event.target.value)}
          aria-label="Preset-Daten"
          placeholder="Preset-JSON für Export/Import"
          rows={4}
          className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-xs text-surface-100 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50"
        />
      </div>

      {statusMessage && (
        <p role="status" className="text-sm text-surface-200">
          {statusMessage}
        </p>
      )}

      {presets.length === 0 && (
        <p className="text-xs text-surface-300">{emptyMessage}</p>
      )}
    </div>
  )
}

export default FilterPresets

