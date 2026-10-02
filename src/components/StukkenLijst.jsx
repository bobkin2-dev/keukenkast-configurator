import React, { useState } from 'react';
import { berekenStukkenlijst, MATERIAAL_TYPE_LABELS } from '../utils/kastCalculator';

// Per-cabinet editable part list. Generated parts can be resized or removed;
// extra parts can be added. All edits are stored on the kast object
// (stukAanpassingen / extraStukken) and flow straight into the nesting.

const isVrijeKastType = (type) => type === 'Vrije Kast' || type === 'Open Nis HPL';

// Commit on blur / Enter so the nesting doesn't recalculate on every keystroke
const MaatInput = ({ value, basis, onCommit }) => (
  <input
    key={value}
    type="number"
    min="0"
    defaultValue={value}
    onBlur={(e) => {
      const v = parseInt(e.target.value) || 0;
      if (v !== value) onCommit(v);
    }}
    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
    className={`w-20 px-1 py-0.5 border rounded text-xs text-right font-mono ${
      basis !== undefined && value !== basis ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
    }`}
    title={basis !== undefined && value !== basis ? `Berekend: ${basis} mm` : undefined}
  />
);

const LEEG_EXTRA = { naam: '', breedte: '', hoogte: '', materiaalType: 'binnenkast', iv: true };

const StukkenLijst = ({ kast, onChange }) => {
  const [nieuw, setNieuw] = useState(LEEG_EXTRA);
  const stukken = berekenStukkenlijst(kast);
  const aanpassingen = kast.stukAanpassingen || {};
  const extra = kast.extraStukken || [];

  const materiaalOpties = ['binnenkast', 'buitenzijde', 'tablet', ...(isVrijeKastType(kast.type) ? ['vrijeKast'] : [])];

  const setAanpassing = (key, patch) => {
    const huidig = { ...(aanpassingen[key] || {}), ...patch };
    const next = { ...aanpassingen };
    if (!huidig.verwijderd && !(huidig.breedte > 0) && !(huidig.hoogte > 0)) delete next[key];
    else next[key] = huidig;
    onChange({ stukAanpassingen: next });
  };

  const resetAanpassing = (key) => {
    const next = { ...aanpassingen };
    delete next[key];
    onChange({ stukAanpassingen: next });
  };

  const setExtra = (id, patch) =>
    onChange({ extraStukken: extra.map(st => st.id === id ? { ...st, ...patch } : st) });

  const voegExtraToe = () => {
    const breedte = parseInt(nieuw.breedte) || 0;
    const hoogte = parseInt(nieuw.hoogte) || 0;
    if (breedte <= 0 || hoogte <= 0) return;
    onChange({
      extraStukken: [...extra, {
        id: `x${Date.now()}`,
        naam: nieuw.naam.trim() || 'Extra stuk',
        breedte, hoogte,
        materiaalType: nieuw.materiaalType,
        iv: nieuw.iv,
      }]
    });
    setNieuw(LEEG_EXTRA);
  };

  const aantalActief = stukken.filter(s => !s.verwijderd).length;
  const heeftAanpassingen = Object.keys(aanpassingen).length > 0 || extra.length > 0;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-700">
          Stukkenlijst — {aantalActief} stuk{aantalActief !== 1 ? 'ken' : ''}
          <span className="font-normal text-gray-500 ml-2">
            B×H in mm · ↕ draad in de hoogte · ↔ draad in de breedte · wijzigingen gaan direct mee in de nesting
          </span>
        </p>
        {heeftAanpassingen && (
          <button
            onClick={() => onChange({ stukAanpassingen: {}, extraStukken: [] })}
            className="text-xs text-red-600 hover:underline"
          >
            Alle aanpassingen wissen
          </button>
        )}
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 border-b border-slate-200">
            <th className="text-left py-1 px-1 font-medium">Stuk</th>
            <th className="text-left py-1 px-1 font-medium">Onderdeel</th>
            <th className="text-left py-1 px-1 font-medium">Materiaal</th>
            <th className="text-right py-1 px-1 font-medium">B</th>
            <th className="text-right py-1 px-1 font-medium">H</th>
            <th className="text-center py-1 px-1 font-medium">Draad</th>
            <th className="text-right py-1 px-1 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {stukken.map(s => (
            <tr
              key={s.key}
              className={`border-b border-slate-100 ${s.verwijderd ? 'opacity-40 line-through' : ''} ${s.extra ? 'bg-green-50' : ''}`}
            >
              <td className="py-1 px-1">
                {s.extra ? (
                  <input
                    key={s.naam}
                    defaultValue={s.naam}
                    onBlur={(e) => e.target.value !== s.naam && setExtra(s.id, { naam: e.target.value })}
                    className="w-32 px-1 py-0.5 border border-gray-300 rounded text-xs"
                  />
                ) : s.naam}
              </td>
              <td className="py-1 px-1 text-gray-500">{s.onderdeel}</td>
              <td className="py-1 px-1">
                {s.extra ? (
                  <select
                    value={s.materiaalType}
                    onChange={(e) => setExtra(s.id, { materiaalType: e.target.value })}
                    className="px-1 py-0.5 border border-gray-300 rounded text-xs"
                  >
                    {materiaalOpties.map(m => <option key={m} value={m}>{MATERIAAL_TYPE_LABELS[m]}</option>)}
                  </select>
                ) : (MATERIAAL_TYPE_LABELS[s.materiaalType] || s.materiaalType)}
              </td>
              <td className="py-1 px-1 text-right">
                {s.verwijderd ? s.breedte : (
                  <MaatInput
                    value={s.breedte}
                    basis={s.extra ? undefined : s.basisBreedte}
                    onCommit={(v) => s.extra ? setExtra(s.id, { breedte: v }) : setAanpassing(s.key, { breedte: v })}
                  />
                )}
              </td>
              <td className="py-1 px-1 text-right">
                {s.verwijderd ? s.hoogte : (
                  <MaatInput
                    value={s.hoogte}
                    basis={s.extra ? undefined : s.basisHoogte}
                    onCommit={(v) => s.extra ? setExtra(s.id, { hoogte: v }) : setAanpassing(s.key, { hoogte: v })}
                  />
                )}
              </td>
              <td className="py-1 px-1 text-center">
                {s.extra ? (
                  <button
                    onClick={() => setExtra(s.id, { iv: !s.iv })}
                    className="px-1 border border-gray-300 rounded hover:bg-gray-100"
                    title="Draadrichting wisselen"
                  >
                    {s.iv ? '↕' : '↔'}
                  </button>
                ) : (s.iv ? '↕' : '↔')}
              </td>
              <td className="py-1 px-1 text-right whitespace-nowrap">
                {s.extra ? (
                  <button
                    onClick={() => onChange({ extraStukken: extra.filter(st => st.id !== s.id) })}
                    className="text-red-500 hover:text-red-700 px-1"
                    title="Extra stuk verwijderen"
                  >✕</button>
                ) : (
                  <>
                    {(s.aangepast || s.verwijderd) && (
                      <button
                        onClick={() => resetAanpassing(s.key)}
                        className="text-blue-600 hover:text-blue-800 px-1"
                        title="Terug naar berekende waarde"
                      >↺</button>
                    )}
                    {!s.verwijderd && (
                      <button
                        onClick={() => setAanpassing(s.key, { verwijderd: true })}
                        className="text-red-500 hover:text-red-700 px-1"
                        title="Stuk niet meetellen"
                      >✕</button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}

          {/* New extra part */}
          <tr className="bg-white">
            <td className="py-1 px-1">
              <input
                placeholder="Extra stuk"
                value={nieuw.naam}
                onChange={(e) => setNieuw(p => ({ ...p, naam: e.target.value }))}
                className="w-32 px-1 py-0.5 border border-gray-300 rounded text-xs"
              />
            </td>
            <td className="py-1 px-1 text-gray-400 italic">nieuw</td>
            <td className="py-1 px-1">
              <select
                value={nieuw.materiaalType}
                onChange={(e) => setNieuw(p => ({ ...p, materiaalType: e.target.value }))}
                className="px-1 py-0.5 border border-gray-300 rounded text-xs"
              >
                {materiaalOpties.map(m => <option key={m} value={m}>{MATERIAAL_TYPE_LABELS[m]}</option>)}
              </select>
            </td>
            <td className="py-1 px-1 text-right">
              <input
                type="number" min="0" placeholder="B"
                value={nieuw.breedte}
                onChange={(e) => setNieuw(p => ({ ...p, breedte: e.target.value }))}
                className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs text-right font-mono"
              />
            </td>
            <td className="py-1 px-1 text-right">
              <input
                type="number" min="0" placeholder="H"
                value={nieuw.hoogte}
                onChange={(e) => setNieuw(p => ({ ...p, hoogte: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') voegExtraToe(); }}
                className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs text-right font-mono"
              />
            </td>
            <td className="py-1 px-1 text-center">
              <button
                onClick={() => setNieuw(p => ({ ...p, iv: !p.iv }))}
                className="px-1 border border-gray-300 rounded hover:bg-gray-100"
                title="Draadrichting wisselen"
              >
                {nieuw.iv ? '↕' : '↔'}
              </button>
            </td>
            <td className="py-1 px-1 text-right">
              <button
                onClick={voegExtraToe}
                className="bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded text-xs"
              >
                + Stuk
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default StukkenLijst;
