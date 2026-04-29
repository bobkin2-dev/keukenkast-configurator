import React, { useState, useMemo } from 'react';
import { packParts, computeUtilisation } from '../utils/binPack';

const KERF_MM = 4;

const PART_COLORS = [
  { fill: '#dbeafe', stroke: '#3b82f6' },
  { fill: '#fce7f3', stroke: '#ec4899' },
  { fill: '#dcfce7', stroke: '#22c55e' },
  { fill: '#fef3c7', stroke: '#f59e0b' },
  { fill: '#e0e7ff', stroke: '#6366f1' },
  { fill: '#fee2e2', stroke: '#ef4444' },
  { fill: '#ccfbf1', stroke: '#14b8a6' },
  { fill: '#fae8ff', stroke: '#a855f7' },
];

const newId = () => Date.now() + Math.random();

const blankRequest = () => ({
  id: newId(),
  platename: '',
  length: 2800,
  width: 2070,
  thickness: 18,
  grain: false,
  priceMode: 'perPlate', // 'perPlate' | 'perM2'
  price: 0,
  parts: [{ id: newId(), amount: 1, length: 0, width: 0, name: '' }]
});

const PlatePreview = ({ plate, partColorMap, scale }) => {
  const w = plate.length * scale;
  const h = plate.width * scale;
  return (
    <div className="inline-block mr-3 mb-2" style={{ verticalAlign: 'top' }}>
      <svg width={w} height={h} style={{ display: 'block', border: '1.5px solid #6b7280', background: '#f9fafb' }}>
        {plate.placements.map((p, i) => {
          const c = partColorMap[p.sourceId] || PART_COLORS[0];
          const x = p.x * scale;
          const y = p.y * scale;
          const pw = p.w * scale;
          const ph = p.h * scale;
          const showLabel = pw > 36 && ph > 18;
          return (
            <g key={i}>
              <rect x={x} y={y} width={pw} height={ph} fill={c.fill} stroke={c.stroke} strokeWidth="1" />
              {showLabel && (
                <text x={x + pw / 2} y={y + ph / 2} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#374151" style={{ pointerEvents: 'none' }}>
                  {p.name || `${Math.round(p.w)}×${Math.round(p.h)}`}
                </text>
              )}
              <title>{`${p.name || 'onbenoemd'} — ${Math.round(p.w)}×${Math.round(p.h)}mm${p.rotated ? ' (gedraaid)' : ''}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="text-xs text-center text-gray-500 mt-1" style={{ width: w }}>
        Plaat {plate.placements.length} stuk{plate.placements.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

const RequestContainer = ({ request, onUpdate, onRemove }) => {
  const update = (patch) => onUpdate({ ...request, ...patch });
  const updatePart = (id, patch) => {
    update({
      parts: request.parts.map(p => p.id === id ? { ...p, ...patch } : p)
    });
  };
  const addPart = () => {
    update({
      parts: [...request.parts, { id: newId(), amount: 1, length: 0, width: 0, name: '' }]
    });
  };
  const removePart = (id) => {
    update({ parts: request.parts.filter(p => p.id !== id) });
  };

  // Run packing on change
  const packResult = useMemo(() => {
    const validParts = request.parts.filter(p => (p.length || 0) > 0 && (p.width || 0) > 0 && (p.amount || 0) > 0);
    return packParts({
      plateLength: request.length || 0,
      plateWidth: request.width || 0,
      parts: validParts,
      grain: !!request.grain,
      kerf: KERF_MM
    });
  }, [request.length, request.width, request.grain, request.parts]);

  const platesNeeded = packResult.plates.length;
  const utilisation = computeUtilisation(packResult.plates);
  const unfitIds = new Set(packResult.unfit.map(u => u.id));

  // Cost
  const platesCost = (() => {
    if (!request.price) return 0;
    if (request.priceMode === 'perPlate') return platesNeeded * request.price;
    // per m²
    const m2PerPlate = (request.length * request.width) / 1_000_000;
    return platesNeeded * m2PerPlate * request.price;
  })();

  // Color map: each source part ID gets a stable color
  const partColorMap = useMemo(() => {
    const map = {};
    request.parts.forEach((p, i) => {
      map[p.id] = PART_COLORS[i % PART_COLORS.length];
    });
    return map;
  }, [request.parts]);

  // Visual scale for plate preview (max ~280px wide per plate)
  const scale = request.length > 0 ? Math.min(280 / request.length, 200 / request.width, 0.15) : 0.1;

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-3 mb-3 shadow-sm">
      {/* Plate spec header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto_auto_auto] gap-2 items-end mb-2">
        <div>
          <label className="block text-xs text-gray-600">Plaatnaam</label>
          <input
            type="text"
            value={request.platename}
            onChange={(e) => update({ platename: e.target.value })}
            placeholder="bijv. M18 Wit (project)"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Lengte (mm)</label>
          <input
            type="number"
            min="0"
            value={request.length}
            onChange={(e) => update({ length: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Breedte (mm)</label>
          <input
            type="number"
            min="0"
            value={request.width}
            onChange={(e) => update({ width: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Dikte (mm)</label>
          <input
            type="number"
            min="0"
            value={request.thickness}
            onChange={(e) => update({ thickness: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <label className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer pb-1">
          <input
            type="checkbox"
            checked={request.grain}
            onChange={(e) => update({ grain: e.target.checked })}
            className="rounded"
          />
          Grain
        </label>
        <div>
          <label className="block text-xs text-gray-600">Prijs</label>
          <div className="flex">
            <span className="px-2 py-1 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-sm text-gray-500">€</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={request.price}
              onChange={(e) => update({ price: parseFloat(e.target.value) || 0 })}
              className="w-20 px-2 py-1 border border-gray-300 text-sm"
            />
            <select
              value={request.priceMode}
              onChange={(e) => update({ priceMode: e.target.value })}
              className="px-1 py-1 border border-l-0 border-gray-300 rounded-r text-xs bg-white"
            >
              <option value="perPlate">/plaat</option>
              <option value="perM2">/m²</option>
            </select>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-sm"
          title="Container verwijderen"
        >✕</button>
      </div>

      {/* Parts table */}
      <table className="w-full text-sm mb-2">
        <thead>
          <tr className="text-xs text-gray-500 border-b">
            <th className="text-left py-1 w-8"></th>
            <th className="text-left py-1 w-20">Aantal</th>
            <th className="text-left py-1 w-28">Lengte (mm)</th>
            <th className="text-left py-1 w-28">Breedte (mm)</th>
            <th className="text-left py-1">Naam (optioneel)</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {request.parts.map((p, idx) => {
            const isUnfit = unfitIds.has(p.id) && (p.length || 0) > 0 && (p.width || 0) > 0;
            const color = partColorMap[p.id];
            return (
              <tr key={p.id} className={isUnfit ? 'bg-red-50' : ''}>
                <td className="py-1 px-1">
                  <span
                    className="inline-block w-3 h-3 rounded"
                    style={{ backgroundColor: color.fill, border: `1px solid ${color.stroke}` }}
                  />
                </td>
                <td className="py-1 pr-1">
                  <input
                    type="number"
                    min="1"
                    value={p.amount}
                    onChange={(e) => updatePart(p.id, { amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </td>
                <td className="py-1 pr-1">
                  <input
                    type="number"
                    min="0"
                    value={p.length}
                    onChange={(e) => updatePart(p.id, { length: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </td>
                <td className="py-1 pr-1">
                  <input
                    type="number"
                    min="0"
                    value={p.width}
                    onChange={(e) => updatePart(p.id, { width: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </td>
                <td className="py-1 pr-1">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePart(p.id, { name: e.target.value })}
                    placeholder="bijv. zijwand links"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </td>
                <td className="py-1 px-1">
                  {request.parts.length > 1 && (
                    <button
                      onClick={() => removePart(p.id)}
                      className="text-gray-400 hover:text-red-500 text-sm"
                      title="Rij verwijderen"
                    >✕</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={addPart}
        className="text-xs text-blue-600 hover:text-blue-800 hover:underline mb-3"
      >+ Onderdeel</button>

      {/* Result + visual */}
      <div className="border-t border-gray-200 pt-2">
        <div className="flex items-baseline gap-4 text-sm mb-2">
          <span className="font-semibold text-gray-800">
            {platesNeeded} plaat{platesNeeded !== 1 ? 'en' : ''} nodig
          </span>
          {platesNeeded > 0 && (
            <span className="text-xs text-gray-500">
              · {Math.round(utilisation * 100)}% benut · zaagverlies {KERF_MM}mm
            </span>
          )}
          <span className="ml-auto font-bold text-green-700">
            € {platesCost.toFixed(2)}
          </span>
        </div>

        {packResult.unfit.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-2 text-xs text-red-700">
            ⚠️ <strong>{packResult.unfit.length}</strong> onderdeel/onderdelen passen niet op een plaat van {request.length}×{request.width}mm.
            Splits ze op of gebruik een grotere plaat.
          </div>
        )}

        {packResult.plates.length > 0 && (
          <div className="overflow-x-auto bg-gray-50 p-2 rounded border border-gray-200">
            {packResult.plates.map((plate, i) => (
              <PlatePreview key={i} plate={plate} partColorMap={partColorMap} scale={scale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CustomPlaatRequests = ({ requests = [], setRequests }) => {
  const [isOpen, setIsOpen] = useState(true);

  const addRequest = () => setRequests([...requests, blankRequest()]);
  const updateRequest = (id, updated) => setRequests(requests.map(r => r.id === id ? updated : r));
  const removeRequest = (id) => setRequests(requests.filter(r => r.id !== id));

  return (
    <div className="bg-amber-50 p-4 rounded-lg mb-4 border-2 border-amber-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-lg font-bold text-gray-800">
          Op maat plaatmateriaal {requests.length > 0 && <span className="text-gray-500 font-normal text-sm">({requests.length} container{requests.length !== 1 ? 's' : ''})</span>}
        </h2>
        <span className="text-gray-500 text-xl">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-3">
          {requests.map(req => (
            <RequestContainer
              key={req.id}
              request={req}
              onUpdate={(updated) => updateRequest(req.id, updated)}
              onRemove={() => removeRequest(req.id)}
            />
          ))}

          <button
            onClick={addRequest}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm font-medium"
          >
            + Plaatmateriaal toevoegen
          </button>

          {requests.length === 0 && (
            <p className="text-xs text-gray-500 italic mt-2">
              Voeg een plaatmateriaal toe voor onderdelen die niet bij standaardkasten horen.
              Het systeem berekent automatisch het aantal platen op basis van nesting.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomPlaatRequests;
