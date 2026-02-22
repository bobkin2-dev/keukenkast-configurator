import React, { useState } from 'react';
import { TOESTEL_TYPES, TOESTEL_TIERS } from '../data/defaultMaterials';

const KeukentoestellenPanel = ({ keukentoestellen, setKeukentoestellen, toestellenPrijzen }) => {
  const [open, setOpen] = useState(false);
  const updateToestel = (toestelId, field, value) => {
    setKeukentoestellen(prev => ({
      ...prev,
      [toestelId]: {
        ...prev[toestelId],
        [field]: value
      }
    }));
  };

  const toggleToestel = (toestelId) => {
    setKeukentoestellen(prev => {
      const current = prev[toestelId] || {};
      const geselecteerd = !current.geselecteerd;
      return {
        ...prev,
        [toestelId]: {
          ...current,
          geselecteerd,
          tier: current.tier || 'medium',
          aantal: current.aantal || 1,
          naam: current.naam || ''
        }
      };
    });
  };

  const getPrijs = (toestelId, tier) => {
    return toestellenPrijzen?.[toestelId]?.[tier] || 0;
  };

  return (
    <div className="bg-cyan-50 p-4 rounded-lg mb-4 border-2 border-cyan-200">
      <h2
        className="text-lg font-bold text-gray-800 cursor-pointer flex items-center justify-between"
        onClick={() => setOpen(prev => !prev)}
      >
        <span>🍳 Keukentoestellen</span>
        <span className="text-sm text-gray-500">{open ? '▲' : '▼'}</span>
      </h2>
      {open && <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-cyan-300">
              <th className="text-center py-2 px-2 w-8"></th>
              <th className="text-left py-2 px-2">Toestel</th>
              <th className="text-left py-2 px-2">Model / Naam</th>
              <th className="text-left py-2 px-2">Klasse</th>
              <th className="text-center py-2 px-2 w-16">Aantal</th>
              <th className="text-right py-2 px-2">Prijs/st</th>
              <th className="text-right py-2 px-2">Totaal</th>
            </tr>
          </thead>
          <tbody>
            {TOESTEL_TYPES.map(toestel => {
              const sel = keukentoestellen[toestel.id] || {};
              const tier = sel.tier || 'medium';
              const aantal = sel.aantal || 1;
              const prijs = getPrijs(toestel.id, tier);
              const totaal = sel.geselecteerd ? aantal * prijs : 0;

              return (
                <tr
                  key={toestel.id}
                  className={`border-b border-gray-200 ${sel.geselecteerd ? 'bg-cyan-50' : 'opacity-60'}`}
                >
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={sel.geselecteerd || false}
                      onChange={() => toggleToestel(toestel.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="py-2 px-2 font-medium">{toestel.naam}</td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={sel.naam || ''}
                      onChange={(e) => updateToestel(toestel.id, 'naam', e.target.value)}
                      disabled={!sel.geselecteerd}
                      placeholder="bijv. Siemens SN73EX02CE"
                      className="px-2 py-1 border rounded text-sm w-full max-w-[220px] placeholder-gray-400"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <select
                      value={tier}
                      onChange={(e) => updateToestel(toestel.id, 'tier', e.target.value)}
                      disabled={!sel.geselecteerd}
                      className="px-2 py-1 border rounded text-sm w-full max-w-[200px]"
                    >
                      {TOESTEL_TIERS.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={aantal}
                      onChange={(e) => updateToestel(toestel.id, 'aantal', parseInt(e.target.value) || 1)}
                      disabled={!sel.geselecteerd}
                      className="w-14 px-2 py-1 border rounded text-center text-sm"
                    />
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {sel.geselecteerd ? `€${prijs.toFixed(0)}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-semibold font-mono">
                    {sel.geselecteerd ? `€${totaal.toFixed(0)}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </div>
  );
};

export default KeukentoestellenPanel;
