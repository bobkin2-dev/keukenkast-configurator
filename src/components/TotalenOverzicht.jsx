import React, { useState, useEffect } from 'react';
import { TOESTEL_TYPES, TOESTEL_TIERS } from '../data/defaultMaterials';
import { SCHUIFDEUR_DEMPING, SCHUIFDEUR_PROFIEL } from '../constants/cabinet';

const TABLETSTEUN_TYPES = [
  { id: '287.45.459', label: 'Hafele 287.45.459 — 380 mm', prijs: 29.19 },
  { id: '287.45.468', label: 'Hafele 287.45.468 — 480 mm', prijs: 33.64 },
  { id: '287.45.477', label: 'Hafele 287.45.477 — 580 mm', prijs: 44.78 },
  { id: '287.45.486', label: 'Hafele 287.45.486 — 680 mm', prijs: 52.57 },
  { id: '287.45.495', label: 'Hafele 287.45.495 — 780 mm', prijs: 57.03 },
];

const TotalenOverzicht = ({
  kastenLijst,
  totalen,
  arbeidUren,
  accessoires,
  extraBeslag,
  materiaalBinnenkast,
  materiaalBuitenzijde,
  materiaalTablet,
  geselecteerdMateriaalBinnen,
  geselecteerdMateriaalBuiten,
  geselecteerdMateriaalTablet,
  alternatieveMateriaal,
  keukentoestellen = {},
  toestellenPrijzen = {},
  schuifbeslagPrijzen = {},
  plaatMaterialen = [],
  beslagBibliotheek = [],
  onSaveBeslagBibliotheek
}) => {
  // State for extra amounts (manual additions)
  const [extraAmounts, setExtraAmounts] = useState({});
  // State for price overrides
  const [priceOverrides, setPriceOverrides] = useState({});
  // State for arbeid (work hours) overrides
  const [arbeidOverrides, setArbeidOverrides] = useState({});
  // State for custom meubelbeslag lines
  const [customBeslag, setCustomBeslag] = useState([]);
  // State for tabletsteun
  const [tabletsteun, setTabletsteun] = useState({ type: '', aantal: 0 });

  // Helper for safe array access
  const safeGet = (arr, idx) => arr?.[idx] || { breedte: 1000, hoogte: 1000, prijs: 0 };

  // Initialize price overrides when materials change
  useEffect(() => {
    const binnenMat = safeGet(materiaalBinnenkast, geselecteerdMateriaalBinnen);
    const buitenMat = safeGet(materiaalBuitenzijde, geselecteerdMateriaalBuiten);
    const tabletMat = safeGet(materiaalTablet, geselecteerdMateriaalTablet);

    const binnenPrijs = (binnenMat.breedte / 1000) * (binnenMat.hoogte / 1000) * binnenMat.prijs;
    const buitenPrijs = (buitenMat.breedte / 1000) * (buitenMat.hoogte / 1000) * buitenMat.prijs;
    const tabletPrijs = (tabletMat.breedte / 1000) * (tabletMat.hoogte / 1000) * tabletMat.prijs;

    setPriceOverrides(prev => ({
      ...prev,
      binnenkast: prev.binnenkast ?? binnenPrijs,
      rug: prev.rug ?? binnenPrijs,
      leggers: prev.leggers ?? binnenPrijs,
      buitenzijde: prev.buitenzijde ?? buitenPrijs,
      tablet: prev.tablet ?? tabletPrijs,
      kantenbandStd: prev.kantenbandStd ?? accessoires.afplakkenStandaard,
      kantenbandSpec: prev.kantenbandSpec ?? accessoires.afplakkenSpeciaal,
      kastpootjes: prev.kastpootjes ?? accessoires.kastpootjes,
      scharnier110: prev.scharnier110 ?? accessoires.scharnier110,
      scharnier170: prev.scharnier170 ?? accessoires.scharnier170,
      profielBK: prev.profielBK ?? accessoires.profielBK,
      ophangsysteem: prev.ophangsysteem ?? accessoires.ophangsysteemBK,
      ladenStd: prev.ladenStd ?? accessoires.ladeStandaard,
      ladenGoedkoper: prev.ladenGoedkoper ?? accessoires.ladeGroteHoeveelheid,
      handgrepen: prev.handgrepen ?? accessoires.handgrepen,
      led: prev.led ?? extraBeslag.prijsLed,
      handdoekdrager: prev.handdoekdrager ?? extraBeslag.prijsHanddoekdrager,
      alubodem600: prev.alubodem600 ?? extraBeslag.prijsAlubodem600,
      alubodem1200: prev.alubodem1200 ?? extraBeslag.prijsAlubodem1200,
      vuilbaksysteem: prev.vuilbaksysteem ?? extraBeslag.prijsVuilbaksysteem,
      bestekbak: prev.bestekbak ?? extraBeslag.prijsBestekbak,
      slot: prev.slot ?? extraBeslag.prijsSlot,
      cylinderslot: prev.cylinderslot ?? extraBeslag.prijsCylinderslot,
      arbeid_tekenwerk: prev.arbeid_tekenwerk ?? 60,
      arbeid_montageWerkhuis: prev.arbeid_montageWerkhuis ?? 40,
      arbeid_plaatsing: prev.arbeid_plaatsing ?? 40,
      arbeid_transport: prev.arbeid_transport ?? 40,
    }));
  }, [materiaalBinnenkast, materiaalBuitenzijde, materiaalTablet, geselecteerdMateriaalBinnen, geselecteerdMateriaalBuiten, geselecteerdMateriaalTablet, accessoires, extraBeslag]);

  const getOverride = (key, defaultVal) => priceOverrides[key] ?? defaultVal;

  const updateArbeidOverride = (key, value) => {
    if (value === '' || value === undefined) {
      setArbeidOverrides(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setArbeidOverrides(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    }
  };

  const updateExtra = (key, value) => {
    if (value === '' || value === undefined) {
      setExtraAmounts(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setExtraAmounts(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    }
  };

  const updateOverride = (key, value) => {
    setPriceOverrides(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  if (kastenLijst.length === 0) return null;

  // Calculate plate prices
  const binnenPlaatPrijs = (materiaalBinnenkast[geselecteerdMateriaalBinnen].breedte / 1000) *
    (materiaalBinnenkast[geselecteerdMateriaalBinnen].hoogte / 1000) *
    materiaalBinnenkast[geselecteerdMateriaalBinnen].prijs;
  const buitenPlaatPrijs = (materiaalBuitenzijde[geselecteerdMateriaalBuiten].breedte / 1000) *
    (materiaalBuitenzijde[geselecteerdMateriaalBuiten].hoogte / 1000) *
    materiaalBuitenzijde[geselecteerdMateriaalBuiten].prijs;
  const tabletPlaatPrijs = (materiaalTablet[geselecteerdMateriaalTablet].breedte / 1000) *
    (materiaalTablet[geselecteerdMateriaalTablet].hoogte / 1000) *
    materiaalTablet[geselecteerdMateriaalTablet].prijs;

  return (
    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Totaallijst Materialen & Arbeid</h2>

      <div className="space-y-3">
        {/* Labor */}
        <div className="bg-white p-3 rounded border">
          <h3 className="font-bold text-gray-700 mb-2">Arbeid</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="text-left py-1">Taak</th>
                <th className="text-right py-1">Uren</th>
                <th className="text-center py-1">Override</th>
                <th className="text-right py-1">€/uur</th>
                <th className="text-center py-1">Override €</th>
                <th className="text-right py-1 font-bold text-gray-700">Totaal €</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'tekenwerk', label: 'Tekenwerk', defaultPrijs: 60 },
                { key: 'montageWerkhuis', label: 'Montage werkhuis', defaultPrijs: 40 },
                { key: 'plaatsing', label: 'Plaatsing', defaultPrijs: 40 },
                { key: 'transport', label: 'Transport', defaultPrijs: 40 },
              ].map(({ key, label, defaultPrijs }) => {
                const calculated = arbeidUren[key];
                const urenOverridden = arbeidOverrides[key] !== undefined;
                const effectiefUren = urenOverridden ? arbeidOverrides[key] : calculated;
                const effectiefPrijs = getOverride(`arbeid_${key}`, defaultPrijs);
                return (
                  <tr key={key}>
                    <td className="py-1">{label}</td>
                    <td className="py-1 text-right font-semibold">{calculated.toFixed(1)}</td>
                    <td className="py-1 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className={`w-16 px-1 py-0.5 border rounded text-center text-xs ${
                          urenOverridden ? 'border-blue-400 bg-blue-50' : ''
                        }`}
                        value={urenOverridden ? arbeidOverrides[key] : ''}
                        placeholder={calculated.toFixed(1)}
                        onChange={(e) => updateArbeidOverride(key, e.target.value)}
                      />
                    </td>
                    <td className="py-1 text-right text-xs">€{defaultPrijs}/u</td>
                    <td className="py-1 text-center">
                      <input type="number" step="1" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={Math.round(effectiefPrijs)} onChange={(e) => updateOverride(`arbeid_${key}`, e.target.value)} />
                    </td>
                    <td className="py-1 text-right font-bold text-green-700">€{Math.round(effectiefUren * effectiefPrijs)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Plate materials */}
        <div className="bg-white p-3 rounded border">
          <h3 className="font-bold text-gray-700 mb-2">Plaatmateriaal</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="text-left py-1">Materiaal</th>
                <th className="text-left py-1">Info</th>
                <th className="text-right py-1">Aantal</th>
                <th className="text-center py-1">Override</th>
                <th className="text-right py-1">Prijs/plaat</th>
                <th className="text-center py-1">Override €</th>
                <th className="text-right py-1 font-bold text-gray-700">Totaal €</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'binnenkast', label: 'Binnenkast', aantal: totalen.platenBinnenkast, info: `${materiaalBinnenkast[geselecteerdMateriaalBinnen].naam} - ${materiaalBinnenkast[geselecteerdMateriaalBinnen].afmeting} mm`, defaultPlaatPrijs: binnenPlaatPrijs },
                { key: 'rug', label: 'Rug (apart)', aantal: totalen.platenRug, info: alternatieveMateriaal.ruggenGebruiken ? materiaalBinnenkast[alternatieveMateriaal.ruggenMateriaal].naam : 'Zelfde als binnenkast', defaultPlaatPrijs: binnenPlaatPrijs },
                { key: 'leggers', label: 'Leggers (apart)', aantal: totalen.platenLeggers, info: alternatieveMateriaal.leggersGebruiken ? materiaalBinnenkast[alternatieveMateriaal.leggersMateriaal].naam : 'Zelfde als binnenkast', defaultPlaatPrijs: binnenPlaatPrijs },
                { key: 'buitenzijde', label: 'Buitenzijde', aantal: totalen.platenBuitenzijde, info: `${materiaalBuitenzijde[geselecteerdMateriaalBuiten].naam} - ${materiaalBuitenzijde[geselecteerdMateriaalBuiten].afmeting} mm`, defaultPlaatPrijs: buitenPlaatPrijs },
                { key: 'tablet', label: 'Tablet', aantal: totalen.platenTablet, info: `${materiaalTablet[geselecteerdMateriaalTablet].naam} - ${materiaalTablet[geselecteerdMateriaalTablet].afmeting} mm`, defaultPlaatPrijs: tabletPlaatPrijs },
                // Dynamic vrije kast material rows
                ...Object.entries(totalen.platenVrijeKast || {}).map(([matRef, { platen, mat }]) => {
                  const plaatPrijs = (mat.breedte / 1000) * (mat.hoogte / 1000) * mat.prijs;
                  return {
                    key: `vrijeKast_${matRef}`,
                    label: 'Vrije Kast',
                    aantal: platen,
                    info: `${mat.naam || 'Onbekend'} - ${mat.afmeting || `${mat.breedte}x${mat.hoogte}`} mm`,
                    defaultPlaatPrijs: plaatPrijs
                  };
                }),
              ].map(({ key, label, aantal, info, defaultPlaatPrijs }) => {
                const aantalOverridden = extraAmounts[key] !== undefined && extraAmounts[key] !== 0;
                const effectiefAantal = aantalOverridden ? extraAmounts[key] : aantal;
                const effectiefPrijs = getOverride(key, defaultPlaatPrijs);
                return (
                  <tr key={key}>
                    <td className="py-1">{label}</td>
                    <td className="py-1 text-xs text-gray-600">{info}</td>
                    <td className="py-1 text-right font-semibold">{aantal}</td>
                    <td className="py-1 text-center">
                      <input
                        type="number"
                        min="0"
                        className={`w-14 px-1 py-0.5 border rounded text-center text-xs ${aantalOverridden ? 'border-blue-400 bg-blue-50' : ''}`}
                        value={aantalOverridden ? extraAmounts[key] : ''}
                        placeholder={aantal}
                        onChange={(e) => updateExtra(key, e.target.value)}
                      />
                    </td>
                    <td className="py-1 text-right text-xs font-semibold">€{Math.ceil(defaultPlaatPrijs)}</td>
                    <td className="py-1 text-center">
                      <input type="number" step="1" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={Math.ceil(effectiefPrijs)} onChange={(e) => updateOverride(key, e.target.value)} />
                    </td>
                    <td className="py-1 text-right font-bold text-green-700">€{Math.ceil(effectiefAantal * effectiefPrijs)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Edge banding */}
        <div className="bg-white p-3 rounded border">
          <h3 className="font-bold text-gray-700 mb-2">Kantenband</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="text-left py-1">Type</th>
                <th className="text-right py-1">Aantal</th>
                <th className="text-center py-1">Override</th>
                <th className="text-right py-1">Prijs</th>
                <th className="text-center py-1">Override €</th>
                <th className="text-right py-1 font-bold text-gray-700">Totaal €</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'kantenbandStd', label: 'Standaard', aantal: totalen.kantenbandStandaard, defaultPrijs: accessoires.afplakkenStandaard, unit: '/m' },
                { key: 'kantenbandSpec', label: 'Speciaal', aantal: totalen.kantenbandSpeciaal, defaultPrijs: accessoires.afplakkenSpeciaal, unit: '/m' },
              ].map(({ key, label, aantal, defaultPrijs, unit }) => {
                const aantalOverridden = extraAmounts[key] !== undefined && extraAmounts[key] !== 0;
                const effectiefAantal = aantalOverridden ? extraAmounts[key] : aantal;
                const effectiefPrijs = getOverride(key, defaultPrijs);
                return (
                  <tr key={key}>
                    <td className="py-1">{label}</td>
                    <td className="py-1 text-right font-semibold">{aantal.toFixed(1)}</td>
                    <td className="py-1 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className={`w-14 px-1 py-0.5 border rounded text-center text-xs ${aantalOverridden ? 'border-blue-400 bg-blue-50' : ''}`}
                        value={aantalOverridden ? extraAmounts[key] : ''}
                        placeholder={aantal.toFixed(1)}
                        onChange={(e) => updateExtra(key, e.target.value)}
                      />
                    </td>
                    <td className="py-1 text-right text-xs">€{defaultPrijs.toFixed(2)}{unit}</td>
                    <td className="py-1 text-center">
                      <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={effectiefPrijs} onChange={(e) => updateOverride(key, e.target.value)} />
                    </td>
                    <td className="py-1 text-right font-bold text-green-700">€{(effectiefAantal * effectiefPrijs).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Hardware */}
        <div className="bg-white p-3 rounded border">
          <h3 className="font-bold text-gray-700 mb-2">Meubelbeslag</h3>

          {/* Berekend beslag */}
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Berekend beslag</h4>
          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Aantal</th>
                <th className="text-center py-1">Override</th>
                <th className="text-right py-1">Prijs</th>
                <th className="text-center py-1">Override €</th>
                <th className="text-right py-1 font-bold text-gray-700">Totaal €</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'kastpootjes', label: 'Kastpootjes', aantal: totalen.kastpootjes, defaultPrijs: accessoires.kastpootjes, unit: '/st' },
                { key: 'scharnier110', label: 'Scharnieren 110°', aantal: totalen.scharnieren110, defaultPrijs: accessoires.scharnier110, unit: '/st' },
                { key: 'scharnier170', label: 'Scharnieren 155/170°', aantal: totalen.scharnieren170, defaultPrijs: accessoires.scharnier170, unit: '/st' },
                { key: 'profielBK', label: 'Profiel BK', aantal: totalen.profielBK, defaultPrijs: accessoires.profielBK, unit: '/m', decimals: 1 },
                { key: 'ophangsysteem', label: 'Ophangsysteem', aantal: totalen.ophangsysteemBK, defaultPrijs: accessoires.ophangsysteemBK, unit: '/st' },
                { key: 'ladenStd', label: 'Laden standaard', aantal: totalen.ladenStandaard, defaultPrijs: accessoires.ladeStandaard, unit: '/st' },
                { key: 'ladenGoedkoper', label: 'Laden goedkoper', aantal: totalen.ladenGoedkoper, defaultPrijs: accessoires.ladeGroteHoeveelheid, unit: '/st' },
                { key: 'handgrepen', label: 'Handgrepen', aantal: totalen.handgrepen, defaultPrijs: accessoires.handgrepen, unit: '/st' },
              ].map(({ key, label, aantal, defaultPrijs, unit, decimals }) => {
                const aantalOverridden = extraAmounts[key] !== undefined && extraAmounts[key] !== 0;
                const effectiefAantal = aantalOverridden ? extraAmounts[key] : aantal;
                const effectiefPrijs = getOverride(key, defaultPrijs);
                const aantalDisplay = decimals ? aantal.toFixed(decimals) : aantal;
                const isZero = aantal === 0 && !aantalOverridden;
                return (
                  <tr key={key} className={isZero ? 'opacity-40' : ''}>
                    <td className="py-1">{label}</td>
                    <td className="py-1 text-right font-semibold">{aantalDisplay}</td>
                    <td className="py-1 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          className="w-5 h-5 rounded bg-gray-200 hover:bg-red-200 text-xs font-bold leading-none"
                          onClick={() => {
                            const step = decimals ? 0.1 : 1;
                            const current = aantalOverridden ? extraAmounts[key] : aantal;
                            const next = Math.max(0, +(current - step).toFixed(1));
                            updateExtra(key, next === aantal ? '' : String(next));
                          }}
                        >-</button>
                        <input
                          type="number"
                          min="0"
                          step={decimals ? '0.1' : '1'}
                          className={`w-12 px-0.5 py-0.5 border rounded text-center text-xs ${aantalOverridden ? 'border-blue-400 bg-blue-50' : ''}`}
                          value={aantalOverridden ? extraAmounts[key] : ''}
                          placeholder={aantalDisplay}
                          onChange={(e) => updateExtra(key, e.target.value)}
                        />
                        <button
                          className="w-5 h-5 rounded bg-gray-200 hover:bg-green-200 text-xs font-bold leading-none"
                          onClick={() => {
                            const step = decimals ? 0.1 : 1;
                            const current = aantalOverridden ? extraAmounts[key] : aantal;
                            const next = +(current + step).toFixed(1);
                            updateExtra(key, String(next));
                          }}
                        >+</button>
                      </div>
                    </td>
                    <td className="py-1 text-right text-xs">€{defaultPrijs.toFixed(2)}{unit}</td>
                    <td className="py-1 text-center">
                      <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={effectiefPrijs} onChange={(e) => updateOverride(key, e.target.value)} />
                    </td>
                    <td className="py-1 text-right font-bold text-green-700">€{(effectiefAantal * effectiefPrijs).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Extra beslag */}
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Extra beslag</h4>
          <table className="w-full text-sm">
            <tbody>
              {[
                { key: 'led', label: 'LED', aantal: extraBeslag.led, defaultPrijs: extraBeslag.prijsLed, unit: '/m', decimals: 1 },
                { key: 'handdoekdrager', label: 'Handdoekdrager', aantal: extraBeslag.handdoekdrager || 0, defaultPrijs: extraBeslag.prijsHanddoekdrager, unit: '/st' },
                { key: 'alubodem600', label: 'Alubodem 600mm', aantal: extraBeslag.alubodem600 || 0, defaultPrijs: extraBeslag.prijsAlubodem600, unit: '/st' },
                { key: 'alubodem1200', label: 'Alubodem 1200mm', aantal: extraBeslag.alubodem1200 || 0, defaultPrijs: extraBeslag.prijsAlubodem1200, unit: '/st' },
                { key: 'vuilbaksysteem', label: 'Vuilbaksysteem', aantal: extraBeslag.vuilbaksysteem || 0, defaultPrijs: extraBeslag.prijsVuilbaksysteem, unit: '/st' },
                { key: 'bestekbak', label: 'Bestekbak', aantal: extraBeslag.bestekbak || 0, defaultPrijs: extraBeslag.prijsBestekbak, unit: '/st' },
                { key: 'slot', label: 'Slot', aantal: extraBeslag.slot || 0, defaultPrijs: extraBeslag.prijsSlot, unit: '/st' },
                { key: 'cylinderslot', label: 'Cylinderslot', aantal: extraBeslag.cylinderslot || 0, defaultPrijs: extraBeslag.prijsCylinderslot, unit: '/st' },
              ].map(({ key, label, aantal, defaultPrijs, unit, decimals }) => {
                const aantalOverridden = extraAmounts[key] !== undefined && extraAmounts[key] !== 0;
                const effectiefAantal = aantalOverridden ? extraAmounts[key] : aantal;
                const effectiefPrijs = getOverride(key, defaultPrijs);
                const aantalDisplay = decimals ? aantal.toFixed(decimals) : aantal;
                const isZero = aantal === 0 && !aantalOverridden;
                return (
                  <tr key={key} className={isZero ? 'opacity-40' : ''}>
                    <td className="py-1">{label}</td>
                    <td className="py-1 text-right font-semibold">{aantalDisplay}</td>
                    <td className="py-1 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          className="w-5 h-5 rounded bg-gray-200 hover:bg-red-200 text-xs font-bold leading-none"
                          onClick={() => {
                            const step = decimals ? 0.1 : 1;
                            const current = aantalOverridden ? extraAmounts[key] : aantal;
                            const next = Math.max(0, +(current - step).toFixed(1));
                            updateExtra(key, next === aantal ? '' : String(next));
                          }}
                        >-</button>
                        <input
                          type="number"
                          min="0"
                          step={decimals ? '0.1' : '1'}
                          className={`w-12 px-0.5 py-0.5 border rounded text-center text-xs ${aantalOverridden ? 'border-blue-400 bg-blue-50' : ''}`}
                          value={aantalOverridden ? extraAmounts[key] : ''}
                          placeholder={aantalDisplay}
                          onChange={(e) => updateExtra(key, e.target.value)}
                        />
                        <button
                          className="w-5 h-5 rounded bg-gray-200 hover:bg-green-200 text-xs font-bold leading-none"
                          onClick={() => {
                            const step = decimals ? 0.1 : 1;
                            const current = aantalOverridden ? extraAmounts[key] : aantal;
                            const next = +(current + step).toFixed(1);
                            updateExtra(key, String(next));
                          }}
                        >+</button>
                      </div>
                    </td>
                    <td className="py-1 text-right text-xs">€{defaultPrijs.toFixed(2)}{unit}</td>
                    <td className="py-1 text-center">
                      <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={effectiefPrijs} onChange={(e) => updateOverride(key, e.target.value)} />
                    </td>
                    <td className="py-1 text-right font-bold text-green-700">€{(effectiefAantal * effectiefPrijs).toFixed(2)}</td>
                  </tr>
                );
              })}
              {/* Tabletsteun Hebgo 125kg */}
              <tr className={!tabletsteun.type && tabletsteun.aantal === 0 ? 'opacity-40' : ''}>
                <td className="py-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs whitespace-nowrap">Tabletsteun Hebgo 125kg</span>
                    <select
                      className="text-xs border rounded px-1 py-0.5 flex-1 min-w-0"
                      value={tabletsteun.type}
                      onChange={(e) => {
                        const selected = TABLETSTEUN_TYPES.find(t => t.id === e.target.value);
                        setTabletsteun(prev => ({
                          type: e.target.value,
                          aantal: e.target.value && prev.aantal === 0 ? 1 : prev.aantal,
                        }));
                        if (selected) {
                          setPriceOverrides(prev => ({ ...prev, tabletsteun: selected.prijs }));
                        }
                      }}
                    >
                      <option value="">— kies type —</option>
                      {TABLETSTEUN_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label} — €{t.prijs.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="py-1 text-right font-semibold">{tabletsteun.aantal}</td>
                <td className="py-1 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      className="w-5 h-5 rounded bg-gray-200 hover:bg-red-200 text-xs font-bold leading-none"
                      onClick={() => setTabletsteun(prev => ({ ...prev, aantal: Math.max(0, prev.aantal - 1) }))}
                    >-</button>
                    <input
                      type="number"
                      min="0"
                      className="w-12 px-0.5 py-0.5 border rounded text-center text-xs"
                      value={tabletsteun.aantal}
                      onChange={(e) => setTabletsteun(prev => ({ ...prev, aantal: parseInt(e.target.value) || 0 }))}
                    />
                    <button
                      className="w-5 h-5 rounded bg-gray-200 hover:bg-green-200 text-xs font-bold leading-none"
                      onClick={() => setTabletsteun(prev => ({ ...prev, aantal: prev.aantal + 1 }))}
                    >+</button>
                  </div>
                </td>
                {(() => {
                  const selected = TABLETSTEUN_TYPES.find(t => t.id === tabletsteun.type);
                  const defaultPrijs = selected?.prijs || 0;
                  const effectiefPrijs = priceOverrides.tabletsteun ?? defaultPrijs;
                  return (
                    <>
                      <td className="py-1 text-right text-xs">€{defaultPrijs.toFixed(2)}/st</td>
                      <td className="py-1 text-center">
                        <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={effectiefPrijs} onChange={(e) => updateOverride('tabletsteun', e.target.value)} />
                      </td>
                      <td className="py-1 text-right font-bold text-green-700">€{(tabletsteun.aantal * effectiefPrijs).toFixed(2)}</td>
                    </>
                  );
                })()}
              </tr>
              {customBeslag.map((line, idx) => {
                const isInLibrary = beslagBibliotheek.some(b => b.label === line.label && b.prijs === line.prijs);
                return (
                <tr key={`custom_${idx}`}>
                  <td className="py-1">
                    <div className="flex items-center gap-0.5">
                      <input
                        type="text"
                        className="flex-1 min-w-0 px-1 py-0.5 border rounded text-xs"
                        value={line.label}
                        placeholder="Omschrijving"
                        onChange={(e) => setCustomBeslag(prev => prev.map((l, i) => i === idx ? { ...l, label: e.target.value } : l))}
                      />
                      {!isInLibrary && line.label && onSaveBeslagBibliotheek && (
                        <button
                          className="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 text-xs leading-none text-amber-700 flex-shrink-0"
                          onClick={() => onSaveBeslagBibliotheek([...beslagBibliotheek, { label: line.label, prijs: line.prijs }])}
                          title="Opslaan in bibliotheek"
                        >★</button>
                      )}
                      {isInLibrary && (
                        <span className="w-5 h-5 flex items-center justify-center text-xs text-amber-400 flex-shrink-0" title="In bibliotheek">★</span>
                      )}
                    </div>
                  </td>
                  <td className="py-1 text-right font-semibold">{line.aantal}</td>
                  <td className="py-1 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        className="w-5 h-5 rounded bg-gray-200 hover:bg-red-200 text-xs font-bold leading-none"
                        onClick={() => setCustomBeslag(prev => prev.map((l, i) => i === idx ? { ...l, aantal: Math.max(0, l.aantal - 1) } : l))}
                      >-</button>
                      <input
                        type="number"
                        min="0"
                        className="w-12 px-0.5 py-0.5 border rounded text-center text-xs"
                        value={line.aantal}
                        onChange={(e) => setCustomBeslag(prev => prev.map((l, i) => i === idx ? { ...l, aantal: parseFloat(e.target.value) || 0 } : l))}
                      />
                      <button
                        className="w-5 h-5 rounded bg-gray-200 hover:bg-green-200 text-xs font-bold leading-none"
                        onClick={() => setCustomBeslag(prev => prev.map((l, i) => i === idx ? { ...l, aantal: l.aantal + 1 } : l))}
                      >+</button>
                    </div>
                  </td>
                  <td className="py-1 text-right text-xs">€{line.prijs.toFixed(2)}/st</td>
                  <td className="py-1 text-center">
                    <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={line.prijs} onChange={(e) => setCustomBeslag(prev => prev.map((l, i) => i === idx ? { ...l, prijs: parseFloat(e.target.value) || 0 } : l))} />
                  </td>
                  <td className="py-1 text-right font-bold text-green-700">
                    <div className="flex items-center justify-end gap-1">
                      €{(line.aantal * line.prijs).toFixed(2)}
                      <button
                        className="w-4 h-4 rounded bg-gray-200 hover:bg-red-300 text-xs leading-none text-red-600"
                        onClick={() => setCustomBeslag(prev => prev.filter((_, i) => i !== idx))}
                        title="Verwijder"
                      >×</button>
                    </div>
                  </td>
                </tr>
                );
              })}
              <tr>
                <td colSpan={6} className="py-1">
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => setCustomBeslag(prev => [...prev, { label: '', aantal: 1, prijs: 0 }])}
                    >+ Nieuwe lijn</button>
                    {beslagBibliotheek.length > 0 && (
                      <>
                        <span className="text-xs text-gray-300">|</span>
                        <select
                          className="text-xs border rounded px-1 py-0.5 text-gray-600"
                          value=""
                          onChange={(e) => {
                            const item = beslagBibliotheek[parseInt(e.target.value)];
                            if (item) {
                              setCustomBeslag(prev => [...prev, { label: item.label, aantal: 1, prijs: item.prijs }]);
                            }
                          }}
                        >
                          <option value="">+ Uit bibliotheek...</option>
                          {beslagBibliotheek.map((item, i) => (
                            <option key={i} value={i}>{item.label} — €{item.prijs.toFixed(2)}</option>
                          ))}
                        </select>
                        <button
                          className="text-xs text-gray-400 hover:text-red-500"
                          onClick={() => {
                            if (window.confirm('Bibliotheek beheren: wil je een item verwijderen?')) {
                              const label = window.prompt('Naam van item om te verwijderen:');
                              if (label && onSaveBeslagBibliotheek) {
                                onSaveBeslagBibliotheek(beslagBibliotheek.filter(b => b.label !== label));
                              }
                            }
                          }}
                          title="Bibliotheek beheren"
                        >⚙</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Keukentoestellen */}
        {(() => {
          const geselecteerdeToestellen = TOESTEL_TYPES.filter(t => keukentoestellen[t.id]?.geselecteerd);
          if (geselecteerdeToestellen.length === 0) return null;

          let totaalToestellen = 0;
          return (
            <div className="bg-white p-3 rounded border">
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">🍳 Keukentoestellen</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 text-left">Toestel</th>
                    <th className="py-1 text-left">Model</th>
                    <th className="py-1 text-left">Klasse</th>
                    <th className="py-1 text-center">Aantal</th>
                    <th className="py-1 text-right">Prijs/st</th>
                    <th className="py-1 text-right">Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {geselecteerdeToestellen.map(toestel => {
                    const sel = keukentoestellen[toestel.id];
                    const tier = sel.tier || 'medium';
                    const aantal = sel.aantal || 1;
                    const prijs = toestellenPrijzen?.[toestel.id]?.[tier] || 0;
                    const totaal = aantal * prijs;
                    totaalToestellen += totaal;
                    const tierLabel = TOESTEL_TIERS.find(t => t.id === tier)?.label || tier;

                    return (
                      <tr key={toestel.id} className="border-b border-gray-100">
                        <td className="py-1">{toestel.naam}</td>
                        <td className="py-1 text-gray-500 italic">{sel.naam || ''}</td>
                        <td className="py-1 text-gray-500">{tierLabel}</td>
                        <td className="py-1 text-center">{aantal}</td>
                        <td className="py-1 text-right font-mono">€{prijs.toFixed(0)}</td>
                        <td className="py-1 text-right font-bold text-green-700">€{totaal.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="py-1" colSpan={5}>Totaal Keukentoestellen</td>
                    <td className="py-1 text-right text-green-800">€{totaalToestellen.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Schuifdeursystemen */}
        {(() => {
          const systemen = totalen.schuifdeursystemen || [];
          const profielen = totalen.profielen || [];
          if (systemen.length === 0 && profielen.length === 0) return null;

          const getDempingLabel = (id) => SCHUIFDEUR_DEMPING.find(d => d.id === id)?.label || id;
          const getProfielLabel = (id) => SCHUIFDEUR_PROFIEL.find(p => p.id === id)?.label || id;

          let totaalSchuifbeslag = 0;

          return (
            <div className="bg-white p-3 rounded border">
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">🚪 Schuifdeursystemen</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 text-left">Item</th>
                    <th className="py-1 text-center">Aantal</th>
                    <th className="py-1 text-right">Prijs/st</th>
                    <th className="py-1 text-right">Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {systemen.map((s, i) => {
                    const prijsKey = `systeem_${s.gewicht}`;
                    const prijs = schuifbeslagPrijzen[prijsKey]?.[s.demping] || 0;
                    const subtotaal = s.aantal * prijs;
                    totaalSchuifbeslag += subtotaal;
                    return (
                      <tr key={`sys-${i}`} className="border-b border-gray-100">
                        <td className="py-1">Schuifdeursysteem {getDempingLabel(s.demping)} ({s.gewicht})</td>
                        <td className="py-1 text-center">{s.aantal}</td>
                        <td className="py-1 text-right font-mono">{prijs > 0 ? `€${prijs.toFixed(0)}` : '-'}</td>
                        <td className="py-1 text-right font-bold text-green-700">{subtotaal > 0 ? `€${subtotaal.toFixed(0)}` : '-'}</td>
                      </tr>
                    );
                  })}
                  {profielen.map((p, i) => {
                    const prijsKey = p.type === 'onderprofiel' ? 'onderprofiel' : `bovenprofiel_${p.gewicht}`;
                    const prijs = schuifbeslagPrijzen[prijsKey]?.[p.maat] || 0;
                    const subtotaal = p.aantal * prijs;
                    totaalSchuifbeslag += subtotaal;
                    return (
                      <tr key={`prof-${i}`} className="border-b border-gray-100">
                        <td className="py-1">{p.type === 'onderprofiel' ? 'Onderprofiel' : 'Bovenprofiel'} {getProfielLabel(p.maat)} ({p.gewicht})</td>
                        <td className="py-1 text-center">{p.aantal}</td>
                        <td className="py-1 text-right font-mono">{prijs > 0 ? `€${prijs.toFixed(0)}` : '-'}</td>
                        <td className="py-1 text-right font-bold text-green-700">{subtotaal > 0 ? `€${subtotaal.toFixed(0)}` : '-'}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="py-1" colSpan={3}>Totaal Schuifbeslag</td>
                    <td className="py-1 text-right text-green-800">€{totaalSchuifbeslag.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default TotalenOverzicht;
