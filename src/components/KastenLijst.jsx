import React, { useState } from 'react';
import Counter from './Counter';
import { SCHUIFDEUR_DEMPING, SCHUIFDEUR_PROFIEL, complexiteitOpties } from '../constants/cabinet';

// Aspect ratio limits (shared with KastPreview)
const MIN_RATIO = 400 / 3000;
const MAX_RATIO = 3000 / 800;

const STANDARD_TYPES = ['Bovenkast', 'Kolomkast', 'Onderkast', 'Ladekast'];
const SCHUIFDEUR_TYPES = ['Onderkast Schuifdeur', 'Kolomkast Schuifdeur'];

const getMiniDimensions = (breedte, hoogte, maxW = 50, maxH = 40) => {
  const rawRatio = breedte / hoogte;
  const ratio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, rawRatio));
  let w, h;
  if (ratio > maxW / maxH) {
    w = maxW;
    h = maxW / ratio;
  } else {
    h = maxH;
    w = maxH * ratio;
  }
  return { width: `${Math.round(w)}px`, height: `${Math.round(h)}px` };
};

// Helper: detect Vrije Kast type (including legacy 'Open Nis HPL')
const isVrijeKastType = (type) => type === 'Vrije Kast' || type === 'Open Nis HPL';

// Helper: get onderdelen (backward compat)
const getOnderdelen = (kast) => kast.vrijeKastOnderdelen || kast.hplOnderdelen || {};

// Helper: get material name for Vrije Kast
const getVrijeKastMateriaalNaam = (kast, plaatMaterialen) => {
  if (kast.vrijeKastMateriaalId !== undefined && kast.vrijeKastMateriaalId !== null) {
    const mat = plaatMaterialen.find(m => m.id === kast.vrijeKastMateriaalId);
    if (mat) return mat.naam;
  }
  if (kast.hplMateriaal !== undefined) {
    const mat = plaatMaterialen[kast.hplMateriaal];
    if (mat) return mat.naam;
  }
  return 'Materiaal onbekend';
};

// Mini preview for the table
const MiniPreview = ({ kast }) => (
  <div
    className={`border border-gray-600 flex-shrink-0 relative ${kast.isOpen ? 'bg-yellow-50' : 'bg-gray-100'}`}
    style={getMiniDimensions(kast.breedte, kast.hoogte)}
  >
    {Array.from({ length: kast.aantalLeggers }).map((_, i) => (
      <div
        key={`l-${i}`}
        className="absolute w-full border-t border-gray-400"
        style={{ top: `${((i + 1) * 100) / (kast.aantalLeggers + 1)}%` }}
      />
    ))}
    {Array.from({ length: kast.aantalTussensteunen }).map((_, i) => (
      <div
        key={`s-${i}`}
        className="absolute h-full border-l border-gray-400"
        style={{ left: `${((i + 1) * 100) / (kast.aantalTussensteunen + 1)}%` }}
      />
    ))}
  </div>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs text-gray-600 block mb-0.5">{label}</label>
    {children}
  </div>
);

const NumInput = ({ value, onChange, min = 0 }) => (
  <input
    type="number"
    min={min}
    value={value ?? 0}
    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
  />
);

const KastEditModal = ({ kast, plaatMaterialen, onSave, onCancel }) => {
  const [d, setD] = useState({ ...kast });

  const set = (field, value) => setD(prev => ({ ...prev, [field]: value }));
  const setNested = (field, key, value) =>
    setD(prev => ({ ...prev, [field]: { ...(prev[field] || {}), [key]: value } }));

  const isStandard = STANDARD_TYPES.includes(d.type);
  const isVrijeKast = isVrijeKastType(d.type);
  const isSchuifdeur = SCHUIFDEUR_TYPES.includes(d.type);
  const isTablet = d.type === 'Tablet';
  const isVaatwasser = d.type === 'Vaatwasserdeur';
  const isZijpaneel = !!d.isZijpaneel;

  const onderdelen = d.vrijeKastOnderdelen || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div>
            <h3 className="text-base font-bold text-gray-800">Kast bewerken</h3>
            <p className="text-xs text-gray-500">{d.type}{d.naam ? ` — ${d.naam}` : ''}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        {/* Form body */}
        <div className="px-5 py-4 space-y-4">

          {/* Optional name (all types except Zijpaneel) */}
          {!isZijpaneel && (
            <Field label="Naam (optioneel)">
              <input
                type="text"
                placeholder="bijv. Hoekopstelling links"
                value={d.naam || ''}
                onChange={(e) => set('naam', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
              />
            </Field>
          )}

          {/* Dimensions */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Afmetingen (mm)</p>
            <div className={`grid gap-2 ${isVaatwasser ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {!isTablet && (
                <Field label="Hoogte">
                  <NumInput value={d.hoogte} onChange={(v) => set('hoogte', v)} />
                </Field>
              )}
              <Field label="Breedte">
                <NumInput value={d.breedte} onChange={(v) => set('breedte', v)} />
              </Field>
              {!isVaatwasser && (
                <Field label={isTablet ? 'Diepte' : 'Diepte'}>
                  <NumInput value={d.diepte} onChange={(v) => set('diepte', v)} />
                </Field>
              )}
              {isTablet && (
                <Field label="Spatwand hoogte">
                  <NumInput value={d.hoogte} onChange={(v) => set('hoogte', v)} />
                </Field>
              )}
            </div>
          </div>

          {/* Standard cabinets */}
          {isStandard && (
            <>
              {/* Open/Dicht toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">Open kast</span>
                <div
                  className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${d.isOpen ? 'bg-yellow-500' : 'bg-gray-300'}`}
                  onClick={() => {
                    const newVal = !d.isOpen;
                    setD(prev => ({ ...prev, isOpen: newVal, aantalDeuren: newVal ? 0 : prev.aantalDeuren || 1 }));
                  }}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${d.isOpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                {d.isOpen && <span className="text-xs text-yellow-700 font-medium">Volledig buitenzijde materiaal</span>}
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-3">
                <Counter label="Leggers" value={d.aantalLeggers || 0} onChange={(v) => set('aantalLeggers', v)} onIncrement={() => set('aantalLeggers', (d.aantalLeggers || 0) + 1)} onDecrement={() => set('aantalLeggers', Math.max(0, (d.aantalLeggers || 0) - 1))} />
                <Counter label="Steunen" value={d.aantalTussensteunen || 0} onChange={(v) => set('aantalTussensteunen', v)} onIncrement={() => set('aantalTussensteunen', (d.aantalTussensteunen || 0) + 1)} onDecrement={() => set('aantalTussensteunen', Math.max(0, (d.aantalTussensteunen || 0) - 1))} />
                <Counter label="Lades" value={d.aantalLades || 0} onChange={(v) => set('aantalLades', v)} onIncrement={() => set('aantalLades', (d.aantalLades || 0) + 1)} onDecrement={() => set('aantalLades', Math.max(0, (d.aantalLades || 0) - 1))} />
                {!d.isOpen && (
                  <Counter label="Deuren" value={d.aantalDeuren || 0} onChange={(v) => set('aantalDeuren', v)} onIncrement={() => set('aantalDeuren', (d.aantalDeuren || 0) + 1)} onDecrement={() => set('aantalDeuren', Math.max(0, (d.aantalDeuren || 0) - 1))} />
                )}
              </div>

              {/* Kolomkast: toestellen */}
              {d.type === 'Kolomkast' && (
                <Field label="Toestellen (+1u/toestel)">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => set('aantalToestellen', num)}
                        className={`flex-1 py-1 rounded text-sm font-semibold ${(d.aantalToestellen || 0) === num ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {/* Paslaten */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Paslaten (mm)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Paslat bovenkant hoogte">
                    <NumInput value={d.topFillerHoogte || 0} onChange={(v) => set('topFillerHoogte', v)} />
                  </Field>
                  <Field label="Paslat zijkant breedte">
                    <NumInput value={d.sideFillerBreedte || 0} onChange={(v) => set('sideFillerBreedte', v)} />
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* Vrije Kast */}
          {isVrijeKast && (
            <>
              <Field label="Materiaal">
                <select
                  value={d.vrijeKastMateriaalId ?? ''}
                  onChange={(e) => set('vrijeKastMateriaalId', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">-- Kies materiaal --</option>
                  {plaatMaterialen.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.naam} — {mat.breedte}×{mat.hoogte} mm — €{mat.prijs.toFixed(2)}/m²
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Complexiteit (montage uren)">
                <select
                  value={d.complexiteit || 'gemiddeld'}
                  onChange={(e) => set('complexiteit', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-orange-50"
                >
                  {complexiteitOpties.map((o) => (
                    <option key={o.key} value={o.key}>{o.label} ({o.uren}u)</option>
                  ))}
                </select>
              </Field>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Onderdelen</p>
                <div className="grid grid-cols-6 gap-2">
                  {['LZ', 'RZ', 'BK', 'OK', 'RUG', 'VK'].map(part => (
                    <label key={part} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onderdelen[part] || false}
                        onChange={(e) => setD(prev => ({
                          ...prev,
                          vrijeKastOnderdelen: { ...prev.vrijeKastOnderdelen, [part]: e.target.checked }
                        }))}
                      />
                      {part}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Counter label="Leggers" value={d.aantalLeggers || 0} onChange={(v) => set('aantalLeggers', v)} onIncrement={() => set('aantalLeggers', (d.aantalLeggers || 0) + 1)} onDecrement={() => set('aantalLeggers', Math.max(0, (d.aantalLeggers || 0) - 1))} />
                <Counter label="Steunen" value={d.aantalTussensteunen || 0} onChange={(v) => set('aantalTussensteunen', v)} onIncrement={() => set('aantalTussensteunen', (d.aantalTussensteunen || 0) + 1)} onDecrement={() => set('aantalTussensteunen', Math.max(0, (d.aantalTussensteunen || 0) - 1))} />
                <Counter label="Deuren" value={d.aantalDeuren || 0} onChange={(v) => set('aantalDeuren', v)} onIncrement={() => set('aantalDeuren', (d.aantalDeuren || 0) + 1)} onDecrement={() => set('aantalDeuren', Math.max(0, (d.aantalDeuren || 0) - 1))} />
              </div>
            </>
          )}

          {/* Schuifdeur types */}
          {isSchuifdeur && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Counter label="Leggers" value={d.aantalLeggers || 0} onChange={(v) => set('aantalLeggers', v)} onIncrement={() => set('aantalLeggers', (d.aantalLeggers || 0) + 1)} onDecrement={() => set('aantalLeggers', Math.max(0, (d.aantalLeggers || 0) - 1))} />
                <Counter label="Steunen" value={d.aantalTussensteunen || 0} onChange={(v) => set('aantalTussensteunen', v)} onIncrement={() => set('aantalTussensteunen', (d.aantalTussensteunen || 0) + 1)} onDecrement={() => set('aantalTussensteunen', Math.max(0, (d.aantalTussensteunen || 0) - 1))} />
              </div>

              <Field label="Demping schuifdeursysteem">
                <select value={d.schuifdeurDemping || 'geen'} onChange={(e) => set('schuifdeurDemping', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                  {SCHUIFDEUR_DEMPING.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>

              <Field label="Bovenprofiel">
                <select value={d.schuifdeurBovenprofiel || '2_5m'} onChange={(e) => set('schuifdeurBovenprofiel', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                  {SCHUIFDEUR_PROFIEL.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>

              {d.type === 'Kolomkast Schuifdeur' && (
                <Field label="Onderprofiel">
                  <select value={d.schuifdeurOnderprofiel || '2_5m'} onChange={(e) => set('schuifdeurOnderprofiel', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                    {SCHUIFDEUR_PROFIEL.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </Field>
              )}

              {/* Paslaten for custom types */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Paslaten (buitenzijde materiaal, mm)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'paslatBovenkant', label: 'Paslat bovenkant' },
                    { key: 'paslatZijkant', label: 'Paslat zijkant' },
                  ].map(({ key, label }) => {
                    const val = d[key] || { breedte: 0, hoogte: 0 };
                    return (
                      <div key={key}>
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <div className="flex gap-1">
                          <input type="number" min="0" placeholder="B" value={val.breedte || 0} onChange={(e) => setNested(key, 'breedte', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" />
                          <input type="number" min="0" placeholder="H" value={val.hoogte || 0} onChange={(e) => setNested(key, 'hoogte', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Tablet */}
          {isTablet && (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={d.spatwand || false} onChange={(e) => set('spatwand', e.target.checked)} className="rounded" />
                Spatwand (+1u, in buitenzijde materiaal)
              </label>

              {/* Paslaten */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Paslaten (buitenzijde materiaal, mm)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'paslatBovenkant', label: 'Paslat bovenkant' },
                    { key: 'paslatZijkant', label: 'Paslat zijkant' },
                  ].map(({ key, label }) => {
                    const val = d[key] || { breedte: 0, hoogte: 0 };
                    return (
                      <div key={key}>
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <div className="flex gap-1">
                          <input type="number" min="0" placeholder="B" value={val.breedte || 0} onChange={(e) => setNested(key, 'breedte', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" />
                          <input type="number" min="0" placeholder="H" value={val.hoogte || 0} onChange={(e) => setNested(key, 'hoogte', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Vaatwasserdeur — paslaten */}
          {isVaatwasser && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Paslaten (mm)</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Paslat bovenkant hoogte">
                  <NumInput value={d.topFillerHoogte || 0} onChange={(v) => set('topFillerHoogte', v)} />
                </Field>
                <Field label="Paslat zijkant breedte">
                  <NumInput value={d.sideFillerBreedte || 0} onChange={(v) => set('sideFillerBreedte', v)} />
                </Field>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-xl">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
          >
            Annuleer
          </button>
          <button
            onClick={() => onSave(d)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm"
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main list component ──────────────────────────────────────────────────────

const KastenLijst = ({ kastenLijst, plaatMaterialen = [], voegZijpaneelToe, kopieerKast, updateKast, verwijderKast }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [editingKast, setEditingKast] = useState(null); // kast object being edited

  if (kastenLijst.length === 0) return null;

  const handleSave = (updatedData) => {
    updateKast(editingKast.id, updatedData);
    setEditingKast(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg mb-4 border-2 border-gray-300 shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-lg font-bold text-gray-800">Kasten Lijst ({kastenLijst.length})</h2>
        <span className="text-gray-500 text-xl">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2 font-semibold">#</th>
                <th className="text-left py-2 px-1 font-semibold"></th>
                <th className="text-left py-2 px-2 font-semibold">Type</th>
                <th className="text-right py-2 px-2 font-semibold">H×B×D (mm)</th>
                <th className="text-center py-2 px-2 font-semibold">Leggers</th>
                <th className="text-center py-2 px-2 font-semibold">Steunen</th>
                <th className="text-center py-2 px-2 font-semibold">Deuren</th>
                <th className="text-center py-2 px-2 font-semibold">Lades</th>
                <th className="text-right py-2 px-2 font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody>
              {kastenLijst.map((kast, index) => (
                <tr
                  key={kast.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${kast.isZijpaneel ? 'bg-yellow-50' : ''}`}
                >
                  <td className="py-2 px-2 text-gray-600">{index + 1}</td>
                  <td className="py-2 px-1">
                    <MiniPreview kast={kast} />
                  </td>
                  <td className="py-2 px-2 font-medium">
                    {kast.type}{kast.naam && <span className="text-gray-500 font-normal"> - {kast.naam}</span>}
                    {kast.isOpen && <span className="text-yellow-600 text-xs ml-1">(open)</span>}
                    {isVrijeKastType(kast.type) && (
                      <>
                        {(() => {
                          const onderdelen = getOnderdelen(kast);
                          const activeOnderdelen = Object.entries(onderdelen).filter(([_, v]) => v).map(([k]) => k);
                          return activeOnderdelen.length > 0 ? (
                            <span className="text-xs text-gray-500 ml-2">
                              ({activeOnderdelen.join(', ')})
                            </span>
                          ) : null;
                        })()}
                        <span className="text-xs text-blue-600 block">
                          {getVrijeKastMateriaalNaam(kast, plaatMaterialen)}
                        </span>
                      </>
                    )}
                    {(() => {
                      const fillers = [];
                      if ((kast.topFillerHoogte || 0) > 0) fillers.push(`paslat boven ${kast.topFillerHoogte}mm`);
                      if ((kast.sideFillerBreedte || 0) > 0) fillers.push(`paslat zij ${kast.sideFillerBreedte}mm`);
                      if (kast.paslatBovenkant && kast.paslatBovenkant.breedte > 0 && kast.paslatBovenkant.hoogte > 0) {
                        fillers.push(`paslat boven ${kast.paslatBovenkant.breedte}×${kast.paslatBovenkant.hoogte}`);
                      }
                      if (kast.paslatZijkant && kast.paslatZijkant.breedte > 0 && kast.paslatZijkant.hoogte > 0) {
                        fillers.push(`paslat zij ${kast.paslatZijkant.breedte}×${kast.paslatZijkant.hoogte}`);
                      }
                      return fillers.length > 0 ? (
                        <span className="text-xs text-blue-600 block">
                          🧩 {fillers.join(', ')}
                        </span>
                      ) : null;
                    })()}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700 font-mono text-xs">
                    {kast.hoogte}×{kast.breedte}×{kast.diepte}
                  </td>
                  <td className="py-2 px-2 text-center">{kast.aantalLeggers || '-'}</td>
                  <td className="py-2 px-2 text-center">{kast.aantalTussensteunen || '-'}</td>
                  <td className="py-2 px-2 text-center">{kast.aantalDeuren || '-'}</td>
                  <td className="py-2 px-2 text-center">{kast.aantalLades || '-'}</td>
                  <td className="py-2 px-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditingKast(kast)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                        title="Bewerken"
                      >
                        Bewerk
                      </button>
                      {!kast.isZijpaneel && (
                        <button
                          onClick={() => voegZijpaneelToe(kast)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs"
                          title="Zijpaneel toevoegen"
                        >
                          Zijpaneel
                        </button>
                      )}
                      <button
                        onClick={() => kopieerKast(kast)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                        title="Kopiëren"
                      >
                        Kopieer
                      </button>
                      <button
                        onClick={() => verwijderKast(kast.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        title="Verwijderen"
                      >
                        Verwijder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editingKast && (
        <KastEditModal
          kast={editingKast}
          plaatMaterialen={plaatMaterialen}
          onSave={handleSave}
          onCancel={() => setEditingKast(null)}
        />
      )}
    </div>
  );
};

export default KastenLijst;
