import React, { useState } from 'react';
import PlaatmateriaalBibliotheekModal from './PlaatmateriaalBibliotheekModal';

// Map type key to the popular-use property name
const typeToCategory = {
  binnen: 'binnenkast',
  buiten: 'buitenzijde',
  tablet: 'tablet'
};

// Empty custom material template
const emptyCustom = () => ({
  naam: '',
  breedte: 3050,   // grain direction / plateLength
  hoogte: 1525,    // cross-grain  / plateWidth
  prijs: 0,        // €/m²
  grain: true,     // enforce grain direction in nesting
  isCustom: true,
});

const MaterialenPanel = ({
  type,
  materialen,
  alleMaterialen,
  geselecteerd,
  label,
  color,
  setGeselecteerd,
  onReloadMaterialen,
  customMateriaal,
  onCustomMateriaalChange,
}) => {
  const [showBibliotheek, setShowBibliotheek] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(!!customMateriaal);
  const category = typeToCategory[type];

  const popularMaterials = materialen.filter(m => m[category]);
  const otherMaterials = materialen.filter(m => !m[category]);
  const hasOthers = otherMaterials.length > 0;

  const isCustomActive = !!customMateriaal?.naam;

  // Local draft for the custom form (separate from committed state)
  const [draft, setDraft] = useState(customMateriaal || emptyCustom());

  const handleDraftChange = (field, value) => {
    const updated = { ...draft, [field]: value };
    setDraft(updated);
    if (updated.naam.trim()) {
      onCustomMateriaalChange({ ...updated, naam: updated.naam.trim() });
    } else {
      onCustomMateriaalChange(null);
    }
  };

  const handleClearCustom = () => {
    const fresh = emptyCustom();
    setDraft(fresh);
    onCustomMateriaalChange(null);
    setShowCustomForm(false);
  };

  return (
    <div className={`bg-${color}-50 p-3 rounded-lg border-2 border-${color}-200 relative`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-800">{label}</h2>
          {isCustomActive && (
            <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 rounded px-1.5 py-0.5 font-semibold">
              Eigen ✓
            </span>
          )}
        </div>
        <button
          onClick={() => setShowBibliotheek(true)}
          className="text-gray-500 hover:text-blue-600 text-sm"
          title="Materiaal bibliotheek"
        >
          📚
        </button>
      </div>

      {/* Standard dropdown — dimmed when custom material is active */}
      <div className={isCustomActive ? 'opacity-40 pointer-events-none' : ''}>
        <select
          value={geselecteerd}
          onChange={(e) => setGeselecteerd(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {popularMaterials.length > 0 && (
            <optgroup label="Populair">
              {materialen.map((mat, index) => (
                mat[category] && (
                  <option key={index} value={index}>
                    {mat.naam} - {mat.afmeting} mm - €{mat.prijs.toFixed(2)}/m²
                  </option>
                )
              ))}
            </optgroup>
          )}
          {hasOthers && (
            <optgroup label="Overige">
              {materialen.map((mat, index) => (
                !mat[category] && (
                  <option key={index} value={index}>
                    {mat.naam} - {mat.afmeting} mm - €{mat.prijs.toFixed(2)}/m²
                  </option>
                )
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Toggle link for custom material */}
      <button
        onClick={() => setShowCustomForm(s => !s)}
        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
      >
        {showCustomForm ? '▲ Verberg eigen materiaal' : '▼ Eigen materiaal invoeren (offerte-specifiek)'}
      </button>

      {/* Custom material form */}
      {showCustomForm && (
        <div className="mt-2 bg-amber-50 border border-amber-300 rounded p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-amber-900">
              Eigen materiaal — overschrijft dropdown
            </p>
            {isCustomActive && (
              <button
                onClick={handleClearCustom}
                className="text-xs text-red-600 hover:text-red-800"
                title="Eigen materiaal verwijderen"
              >
                ✕ Wis
              </button>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-600">Naam materiaal *</label>
            <input
              type="text"
              placeholder="bijv. Dekton Kazan, Fenix NTM…"
              value={draft.naam}
              onChange={(e) => handleDraftChange('naam', e.target.value)}
              className={`w-full px-2 py-1.5 border rounded text-sm ${
                isCustomActive ? 'border-amber-400 bg-white' : 'border-gray-300'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">
                Lengte korrel (mm)
                <span className="text-gray-400 ml-1" title="Grain direction — e.g. 3050mm for standard chipboard">ℹ</span>
              </label>
              <input
                type="number"
                min="100"
                value={draft.breedte}
                onChange={(e) => handleDraftChange('breedte', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Breedte (mm)</label>
              <input
                type="number"
                min="100"
                value={draft.hoogte}
                onChange={(e) => handleDraftChange('hoogte', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">Prijs (€/m²)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={draft.prijs}
              onChange={(e) => handleDraftChange('prijs', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.grain}
              onChange={(e) => handleDraftChange('grain', e.target.checked)}
              className="rounded"
            />
            <span className="text-xs text-gray-700">
              Korrelrichting vastzetten bij nesting
              <span className="text-gray-400 ml-1" title="When enabled, parts cannot be rotated 90° during bin-packing">ℹ</span>
            </span>
          </label>

          {isCustomActive && (
            <p className="text-xs text-amber-700 font-medium">
              ✓ Actief: {draft.naam} — {draft.breedte}×{draft.hoogte}mm — €{Number(draft.prijs).toFixed(2)}/m²
              {draft.grain ? ' · korrel vergrendeld' : ''}
            </p>
          )}
        </div>
      )}

      {showBibliotheek && (
        <PlaatmateriaalBibliotheekModal
          materialen={alleMaterialen}
          onClose={() => setShowBibliotheek(false)}
          onReload={onReloadMaterialen}
        />
      )}
    </div>
  );
};

export default MaterialenPanel;
