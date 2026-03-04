import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import PlaatmateriaalBibliotheekModal from './PlaatmateriaalBibliotheekModal';

// Map type key to the popular-use property name
const typeToCategory = {
  binnen: 'binnenkast',
  buiten: 'buitenzijde',
  tablet: 'tablet'
};

const MaterialenPanel = ({
  type,
  materialen,
  alleMaterialen,
  geselecteerd,
  label,
  color,
  showPrijsAanpassing,
  setShowPrijsAanpassing,
  setGeselecteerd,
  updateMateriaalPrijs,
  onReloadMaterialen,
}) => {
  const [showBibliotheek, setShowBibliotheek] = useState(false);
  const category = typeToCategory[type];
  // Split into popular and other materials
  const popularMaterials = materialen.filter(m => m[category]);
  const otherMaterials = materialen.filter(m => !m[category]);
  const hasOthers = otherMaterials.length > 0;

  return (
    <div className={`bg-${color}-50 p-3 rounded-lg border-2 border-${color}-200 relative`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-bold text-gray-800">{label}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowBibliotheek(true)}
            className="text-gray-500 hover:text-blue-600 text-sm"
            title="Materiaal bibliotheek"
          >
            📚
          </button>
          <button
            onClick={() => setShowPrijsAanpassing(prev => ({ ...prev, [type]: !prev[type] }))}
            className="text-gray-600 hover:text-gray-800"
            title="Prijzen aanpassen"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

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

      {showPrijsAanpassing[type] && materialen[geselecteerd] && (
        <div className="mt-3 space-y-2 p-3 bg-white rounded border border-gray-300">
          <p className="text-xs font-semibold text-gray-700 mb-2">Aanpassen: {materialen[geselecteerd].naam}</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-600">Breedte (mm)</label>
              <input
                type="number"
                value={materialen[geselecteerd].breedte}
                onChange={(e) => updateMateriaalPrijs(type, geselecteerd, 'breedte', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Hoogte (mm)</label>
              <input
                type="number"
                value={materialen[geselecteerd].hoogte}
                onChange={(e) => updateMateriaalPrijs(type, geselecteerd, 'hoogte', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Prijs (€/m²)</label>
              <input
                type="number"
                step="0.1"
                value={materialen[geselecteerd].prijs}
                onChange={(e) => updateMateriaalPrijs(type, geselecteerd, 'prijs', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
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
