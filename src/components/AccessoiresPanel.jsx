import React from 'react';

const AccessoiresPanel = ({ accessoires, updateAccessoire }) => (
  <div className="bg-orange-50 p-3 rounded-lg mb-4 border-2 border-orange-200">
    <h2 className="text-base font-bold text-gray-800 mb-3">Accessoires & Opties</h2>

    <div className="space-y-2">
      {/* First row: Dropdowns */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">Scharnieren</label>
          <select
            value={accessoires.scharnierType}
            onChange={(e) => updateAccessoire('scharnierType', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="110">110° - €{accessoires.scharnier110.toFixed(2)}/st</option>
            <option value="170">155-170° - €{accessoires.scharnier170.toFixed(2)}/st</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-600">Laden</label>
          <select
            value={accessoires.ladeType}
            onChange={(e) => updateAccessoire('ladeType', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="standaard">Standaard - €{accessoires.ladeStandaard.toFixed(2)}/st</option>
            <option value="grote_hoeveelheid">Grote hoeveelheid - €{accessoires.ladeGroteHoeveelheid.toFixed(2)}/st</option>
          </select>
        </div>
      </div>

      {/* Second row: All other options */}
      <div className="grid grid-cols-6 gap-2">
        <div>
          <label className="text-xs text-gray-600">Afplakken Std (€/m)</label>
          <input
            type="number"
            step="0.1"
            value={accessoires.afplakkenStandaard}
            onChange={(e) => updateAccessoire('afplakkenStandaard', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Afplakken Spec (€/m)</label>
          <input
            type="number"
            step="0.1"
            value={accessoires.afplakkenSpeciaal}
            onChange={(e) => updateAccessoire('afplakkenSpeciaal', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Kastpootjes (€/st)</label>
          <input
            type="number"
            step="0.1"
            value={accessoires.kastpootjes}
            onChange={(e) => updateAccessoire('kastpootjes', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Profiel BK (€/m)</label>
          <input
            type="number"
            step="0.1"
            value={accessoires.profielBK}
            onChange={(e) => updateAccessoire('profielBK', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Ophangsysteem (€/st)</label>
          <input
            type="number"
            step="0.1"
            value={accessoires.ophangsysteemBK}
            onChange={(e) => updateAccessoire('ophangsysteemBK', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Handgrepen (€/st)</label>
          <input
            type="number"
            step="0.1"
            value={accessoires.handgrepen}
            onChange={(e) => updateAccessoire('handgrepen', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>
    </div>
  </div>
);

export default AccessoiresPanel;
