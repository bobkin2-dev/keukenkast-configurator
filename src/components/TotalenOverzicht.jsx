import React, { useState, useEffect } from 'react';
import { TOESTEL_TYPES, TOESTEL_TIERS } from '../data/defaultMaterials';

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
  toestellenPrijzen = {}
}) => {
  // State for extra amounts (manual additions)
  const [extraAmounts, setExtraAmounts] = useState({});
  // State for price overrides
  const [priceOverrides, setPriceOverrides] = useState({});

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
    }));
  }, [materiaalBinnenkast, materiaalBuitenzijde, materiaalTablet, geselecteerdMateriaalBinnen, geselecteerdMateriaalBuiten, geselecteerdMateriaalTablet, accessoires, extraBeslag]);

  const getExtra = (key) => extraAmounts[key] || 0;
  const getOverride = (key, defaultVal) => priceOverrides[key] ?? defaultVal;

  const updateExtra = (key, value) => {
    setExtraAmounts(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const updateOverride = (key, value) => {
    setPriceOverrides(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const calculateTotal = (aantal, extraKey, overrideKey, defaultPrice) => {
    const extra = getExtra(extraKey);
    const price = getOverride(overrideKey, defaultPrice);
    return ((aantal + extra) * price).toFixed(2);
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
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Tekenwerk:</span>
              <span className="font-semibold">{arbeidUren.tekenwerk.toFixed(1)} uur</span>
            </div>
            <div className="flex justify-between">
              <span>Montage werkhuis:</span>
              <span className="font-semibold">{arbeidUren.montageWerkhuis.toFixed(1)} uur</span>
            </div>
            <div className="flex justify-between">
              <span>Plaatsing:</span>
              <span className="font-semibold">{arbeidUren.plaatsing.toFixed(1)} uur</span>
            </div>
            <div className="flex justify-between">
              <span>Transport:</span>
              <span className="font-semibold">{arbeidUren.transport.toFixed(1)} uur</span>
            </div>
          </div>
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
                <th className="text-center py-1">Extra</th>
                <th className="text-right py-1">Prijs/m²</th>
                <th className="text-right py-1">Prijs/plaat</th>
                <th className="text-center py-1">Override €</th>
                <th className="text-left py-1"></th>
                <th className="text-right py-1 font-bold text-gray-700">Totaal €</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">Binnenkast</td>
                <td className="py-1 text-xs text-gray-600">{materiaalBinnenkast[geselecteerdMateriaalBinnen].naam} - {materiaalBinnenkast[geselecteerdMateriaalBinnen].afmeting} mm</td>
                <td className="py-1 text-right font-semibold">{totalen.platenBinnenkast}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('binnenkast')} onChange={(e) => updateExtra('binnenkast', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{materiaalBinnenkast[geselecteerdMateriaalBinnen].prijs.toFixed(2)}/m²</td>
                <td className="py-1 text-right text-xs font-semibold">€{Math.ceil(binnenPlaatPrijs)}</td>
                <td className="py-1 text-center">
                  <input type="number" step="1" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={Math.ceil(getOverride('binnenkast', binnenPlaatPrijs))} onChange={(e) => updateOverride('binnenkast', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">platen</td>
                <td className="py-1 text-right font-bold text-green-700">€{Math.ceil((totalen.platenBinnenkast + getExtra('binnenkast')) * getOverride('binnenkast', binnenPlaatPrijs))}</td>
              </tr>

              <tr>
                <td className="py-1">Rug (apart)</td>
                <td className="py-1 text-xs text-gray-600">{alternatieveMateriaal.ruggenGebruiken ? materiaalBinnenkast[alternatieveMateriaal.ruggenMateriaal].naam : 'Zelfde als binnenkast'}</td>
                <td className="py-1 text-right font-semibold">{totalen.platenRug}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('rug')} onChange={(e) => updateExtra('rug', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{materiaalBinnenkast[geselecteerdMateriaalBinnen].prijs.toFixed(2)}/m²</td>
                <td className="py-1 text-right text-xs font-semibold">€{Math.ceil(binnenPlaatPrijs)}</td>
                <td className="py-1 text-center">
                  <input type="number" step="1" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={Math.ceil(getOverride('rug', binnenPlaatPrijs))} onChange={(e) => updateOverride('rug', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">platen</td>
                <td className="py-1 text-right font-bold text-green-700">€{Math.ceil((totalen.platenRug + getExtra('rug')) * getOverride('rug', binnenPlaatPrijs))}</td>
              </tr>

              <tr>
                <td className="py-1">Leggers (apart)</td>
                <td className="py-1 text-xs text-gray-600">{alternatieveMateriaal.leggersGebruiken ? materiaalBinnenkast[alternatieveMateriaal.leggersMateriaal].naam : 'Zelfde als binnenkast'}</td>
                <td className="py-1 text-right font-semibold">{totalen.platenLeggers}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('leggers')} onChange={(e) => updateExtra('leggers', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{materiaalBinnenkast[geselecteerdMateriaalBinnen].prijs.toFixed(2)}/m²</td>
                <td className="py-1 text-right text-xs font-semibold">€{Math.ceil(binnenPlaatPrijs)}</td>
                <td className="py-1 text-center">
                  <input type="number" step="1" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={Math.ceil(getOverride('leggers', binnenPlaatPrijs))} onChange={(e) => updateOverride('leggers', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">platen</td>
                <td className="py-1 text-right font-bold text-green-700">€{Math.ceil((totalen.platenLeggers + getExtra('leggers')) * getOverride('leggers', binnenPlaatPrijs))}</td>
              </tr>

              <tr>
                <td className="py-1">Buitenzijde</td>
                <td className="py-1 text-xs text-gray-600">{materiaalBuitenzijde[geselecteerdMateriaalBuiten].naam} - {materiaalBuitenzijde[geselecteerdMateriaalBuiten].afmeting} mm</td>
                <td className="py-1 text-right font-semibold">{totalen.platenBuitenzijde}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('buitenzijde')} onChange={(e) => updateExtra('buitenzijde', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{materiaalBuitenzijde[geselecteerdMateriaalBuiten].prijs.toFixed(2)}/m²</td>
                <td className="py-1 text-right text-xs font-semibold">€{Math.ceil(buitenPlaatPrijs)}</td>
                <td className="py-1 text-center">
                  <input type="number" step="1" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={Math.ceil(getOverride('buitenzijde', buitenPlaatPrijs))} onChange={(e) => updateOverride('buitenzijde', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">platen</td>
                <td className="py-1 text-right font-bold text-green-700">€{Math.ceil((totalen.platenBuitenzijde + getExtra('buitenzijde')) * getOverride('buitenzijde', buitenPlaatPrijs))}</td>
              </tr>

              <tr>
                <td className="py-1">Tablet (standaard)</td>
                <td className="py-1 text-xs text-gray-600">{materiaalTablet[geselecteerdMateriaalTablet].naam} - {materiaalTablet[geselecteerdMateriaalTablet].afmeting} mm</td>
                <td className="py-1 text-right font-semibold">{totalen.platenTablet}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('tablet')} onChange={(e) => updateExtra('tablet', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{materiaalTablet[geselecteerdMateriaalTablet].prijs.toFixed(2)}/m²</td>
                <td className="py-1 text-right text-xs font-semibold">€{Math.ceil(tabletPlaatPrijs)}</td>
                <td className="py-1 text-center">
                  <input type="number" step="1" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={Math.ceil(getOverride('tablet', tabletPlaatPrijs))} onChange={(e) => updateOverride('tablet', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">platen</td>
                <td className="py-1 text-right font-bold text-green-700">€{Math.ceil((totalen.platenTablet + getExtra('tablet')) * getOverride('tablet', tabletPlaatPrijs))}</td>
              </tr>
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
                <th className="text-center py-1">Extra</th>
                <th className="text-right py-1">Prijs</th>
                <th className="text-center py-1">Override €</th>
                <th className="text-left py-1"></th>
                <th className="text-right py-1 font-bold text-gray-700">Totaal €</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">Standaard</td>
                <td className="py-1 text-right font-semibold">{totalen.kantenbandStandaard.toFixed(1)}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('kantenbandStd')} onChange={(e) => updateExtra('kantenbandStd', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.afplakkenStandaard.toFixed(2)}/m</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('kantenbandStd', accessoires.afplakkenStandaard)} onChange={(e) => updateOverride('kantenbandStd', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">lm</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.kantenbandStandaard, 'kantenbandStd', 'kantenbandStd', accessoires.afplakkenStandaard)}</td>
              </tr>
              <tr>
                <td className="py-1">Speciaal</td>
                <td className="py-1 text-right font-semibold">{totalen.kantenbandSpeciaal.toFixed(1)}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('kantenbandSpec')} onChange={(e) => updateExtra('kantenbandSpec', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.afplakkenSpeciaal.toFixed(2)}/m</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('kantenbandSpec', accessoires.afplakkenSpeciaal)} onChange={(e) => updateOverride('kantenbandSpec', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">lm</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.kantenbandSpeciaal, 'kantenbandSpec', 'kantenbandSpec', accessoires.afplakkenSpeciaal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Hardware */}
        <div className="bg-white p-3 rounded border">
          <h3 className="font-bold text-gray-700 mb-2">Meubelbeslag</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Aantal</th>
                <th className="text-center py-1">Extra</th>
                <th className="text-right py-1">Prijs</th>
                <th className="text-center py-1">Override €</th>
                <th className="text-left py-1"></th>
                <th className="text-right py-1 font-bold text-gray-700">Totaal €</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">📍 Kastpootjes</td>
                <td className="py-1 text-right font-semibold">{totalen.kastpootjes}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('kastpootjes')} onChange={(e) => updateExtra('kastpootjes', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.kastpootjes.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('kastpootjes', accessoires.kastpootjes)} onChange={(e) => updateOverride('kastpootjes', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.kastpootjes, 'kastpootjes', 'kastpootjes', accessoires.kastpootjes)}</td>
              </tr>
              <tr>
                <td className="py-1">🔗 Scharnieren 110°</td>
                <td className="py-1 text-right font-semibold">{totalen.scharnieren110}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('scharnier110')} onChange={(e) => updateExtra('scharnier110', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.scharnier110.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('scharnier110', accessoires.scharnier110)} onChange={(e) => updateOverride('scharnier110', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.scharnieren110, 'scharnier110', 'scharnier110', accessoires.scharnier110)}</td>
              </tr>
              <tr>
                <td className="py-1">🔗 Scharnieren 155/170°</td>
                <td className="py-1 text-right font-semibold">{totalen.scharnieren170}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('scharnier170')} onChange={(e) => updateExtra('scharnier170', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.scharnier170.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('scharnier170', accessoires.scharnier170)} onChange={(e) => updateOverride('scharnier170', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.scharnieren170, 'scharnier170', 'scharnier170', accessoires.scharnier170)}</td>
              </tr>
              <tr>
                <td className="py-1">📏 Profiel BK</td>
                <td className="py-1 text-right font-semibold">{totalen.profielBK.toFixed(1)}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('profielBK')} onChange={(e) => updateExtra('profielBK', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.profielBK.toFixed(2)}/m</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('profielBK', accessoires.profielBK)} onChange={(e) => updateOverride('profielBK', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">lm</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.profielBK, 'profielBK', 'profielBK', accessoires.profielBK)}</td>
              </tr>
              <tr>
                <td className="py-1">🧲 Ophangsysteem</td>
                <td className="py-1 text-right font-semibold">{totalen.ophangsysteemBK}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('ophangsysteem')} onChange={(e) => updateExtra('ophangsysteem', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.ophangsysteemBK.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('ophangsysteem', accessoires.ophangsysteemBK)} onChange={(e) => updateOverride('ophangsysteem', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.ophangsysteemBK, 'ophangsysteem', 'ophangsysteem', accessoires.ophangsysteemBK)}</td>
              </tr>
              <tr>
                <td className="py-1">🗄️ Laden standaard</td>
                <td className="py-1 text-right font-semibold">{totalen.ladenStandaard}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('ladenStd')} onChange={(e) => updateExtra('ladenStd', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.ladeStandaard.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('ladenStd', accessoires.ladeStandaard)} onChange={(e) => updateOverride('ladenStd', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.ladenStandaard, 'ladenStd', 'ladenStd', accessoires.ladeStandaard)}</td>
              </tr>
              <tr>
                <td className="py-1">🗃️ Laden goedkoper</td>
                <td className="py-1 text-right font-semibold">{totalen.ladenGoedkoper}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('ladenGoedkoper')} onChange={(e) => updateExtra('ladenGoedkoper', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.ladeGroteHoeveelheid.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('ladenGoedkoper', accessoires.ladeGroteHoeveelheid)} onChange={(e) => updateOverride('ladenGoedkoper', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.ladenGoedkoper, 'ladenGoedkoper', 'ladenGoedkoper', accessoires.ladeGroteHoeveelheid)}</td>
              </tr>
              <tr>
                <td className="py-1">🚪 Handgrepen</td>
                <td className="py-1 text-right font-semibold">{totalen.handgrepen}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('handgrepen')} onChange={(e) => updateExtra('handgrepen', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{accessoires.handgrepen.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('handgrepen', accessoires.handgrepen)} onChange={(e) => updateOverride('handgrepen', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(totalen.handgrepen, 'handgrepen', 'handgrepen', accessoires.handgrepen)}</td>
              </tr>
              <tr>
                <td className="py-1">💡 LED</td>
                <td className="py-1 text-right font-semibold">{extraBeslag.led}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('led')} onChange={(e) => updateExtra('led', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{extraBeslag.prijsLed.toFixed(2)}/m</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('led', extraBeslag.prijsLed)} onChange={(e) => updateOverride('led', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">lm</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(extraBeslag.led, 'led', 'led', extraBeslag.prijsLed)}</td>
              </tr>
              <tr>
                <td className="py-1">🧺 Handdoekdrager</td>
                <td className="py-1 text-right font-semibold">{extraBeslag.handdoekdrager || 0}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('handdoekdrager')} onChange={(e) => updateExtra('handdoekdrager', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{extraBeslag.prijsHanddoekdrager.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('handdoekdrager', extraBeslag.prijsHanddoekdrager)} onChange={(e) => updateOverride('handdoekdrager', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(extraBeslag.handdoekdrager || 0, 'handdoekdrager', 'handdoekdrager', extraBeslag.prijsHanddoekdrager)}</td>
              </tr>
              <tr>
                <td className="py-1">🔲 Alubodem 600mm</td>
                <td className="py-1 text-right font-semibold">{extraBeslag.alubodem600 || 0}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('alubodem600')} onChange={(e) => updateExtra('alubodem600', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{extraBeslag.prijsAlubodem600.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('alubodem600', extraBeslag.prijsAlubodem600)} onChange={(e) => updateOverride('alubodem600', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(extraBeslag.alubodem600 || 0, 'alubodem600', 'alubodem600', extraBeslag.prijsAlubodem600)}</td>
              </tr>
              <tr>
                <td className="py-1">🔲 Alubodem 1200mm</td>
                <td className="py-1 text-right font-semibold">{extraBeslag.alubodem1200 || 0}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('alubodem1200')} onChange={(e) => updateExtra('alubodem1200', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{extraBeslag.prijsAlubodem1200.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('alubodem1200', extraBeslag.prijsAlubodem1200)} onChange={(e) => updateOverride('alubodem1200', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(extraBeslag.alubodem1200 || 0, 'alubodem1200', 'alubodem1200', extraBeslag.prijsAlubodem1200)}</td>
              </tr>
              <tr>
                <td className="py-1">🗑️ Vuilbaksysteem</td>
                <td className="py-1 text-right font-semibold">{extraBeslag.vuilbaksysteem || 0}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('vuilbaksysteem')} onChange={(e) => updateExtra('vuilbaksysteem', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{extraBeslag.prijsVuilbaksysteem.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('vuilbaksysteem', extraBeslag.prijsVuilbaksysteem)} onChange={(e) => updateOverride('vuilbaksysteem', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(extraBeslag.vuilbaksysteem || 0, 'vuilbaksysteem', 'vuilbaksysteem', extraBeslag.prijsVuilbaksysteem)}</td>
              </tr>
              <tr>
                <td className="py-1">Bestekbak</td>
                <td className="py-1 text-right font-semibold">{extraBeslag.bestekbak || 0}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('bestekbak')} onChange={(e) => updateExtra('bestekbak', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{extraBeslag.prijsBestekbak.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('bestekbak', extraBeslag.prijsBestekbak)} onChange={(e) => updateOverride('bestekbak', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(extraBeslag.bestekbak || 0, 'bestekbak', 'bestekbak', extraBeslag.prijsBestekbak)}</td>
              </tr>
              <tr>
                <td className="py-1">Slot</td>
                <td className="py-1 text-right font-semibold">{extraBeslag.slot || 0}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('slot')} onChange={(e) => updateExtra('slot', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{extraBeslag.prijsSlot.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('slot', extraBeslag.prijsSlot)} onChange={(e) => updateOverride('slot', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(extraBeslag.slot || 0, 'slot', 'slot', extraBeslag.prijsSlot)}</td>
              </tr>
              <tr>
                <td className="py-1">Cylinderslot</td>
                <td className="py-1 text-right font-semibold">{extraBeslag.cylinderslot || 0}</td>
                <td className="py-1 text-center">
                  <input type="number" className="w-14 px-1 py-0.5 border rounded text-center text-xs" value={getExtra('cylinderslot')} onChange={(e) => updateExtra('cylinderslot', e.target.value)} />
                </td>
                <td className="py-1 text-right text-xs">€{extraBeslag.prijsCylinderslot.toFixed(2)}/st</td>
                <td className="py-1 text-center">
                  <input type="number" step="0.01" className="w-16 px-1 py-0.5 border rounded text-center text-xs" value={getOverride('cylinderslot', extraBeslag.prijsCylinderslot)} onChange={(e) => updateOverride('cylinderslot', e.target.value)} />
                </td>
                <td className="py-1 text-xs pl-1">st</td>
                <td className="py-1 text-right font-bold text-green-700">€{calculateTotal(extraBeslag.cylinderslot || 0, 'cylinderslot', 'cylinderslot', extraBeslag.prijsCylinderslot)}</td>
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
      </div>
    </div>
  );
};

export default TotalenOverzicht;
