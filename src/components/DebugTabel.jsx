import React from 'react';
import { DEFAULT_PRODUCTION_PARAMS } from './Admin/AdminSettings';

const DebugTabel = ({ kastenLijst, materiaalTablet, rendementBinnenzijde, rendementBuitenzijde, productionParams }) => {
  if (kastenLijst.length === 0) return null;

  const afvalfactorBinnen = 100 / rendementBinnenzijde;
  const afvalfactorBuiten = 100 / rendementBuitenzijde;

  // Use production params or defaults
  const params = productionParams || DEFAULT_PRODUCTION_PARAMS;

  // Open Nis HPL complexity hours mapping
  const openNisComplexiteitUren = {
    'heel_gemakkelijk': 1,
    'gemakkelijk': 2,
    'gemiddeld': 3,
    'moeilijk': 4,
    'heel_moeilijk': 6
  };

  // Calculate montage hours for a single cabinet
  const berekenMontageUren = (kast) => {
    if (kast.isZijpaneel) {
      return 0.17; // ~10 min for side panel
    }

    const { hoogte, breedte, diepte, aantalDeuren, aantalLades, aantalLeggers, aantalTussensteunen, type, aantalToestellen, complexiteit } = kast;

    // Special handling for Open Nis HPL - use complexity-based hours
    if (type === 'Open Nis HPL') {
      const complexiteitKey = complexiteit || 'gemiddeld';
      return openNisComplexiteitUren[complexiteitKey] || 3;
    }

    // Get type multiplier
    const typeMultiplier = params.typeMultipliers?.[type] || 1.0;

    // Base time
    let uren = params.baseMontageUren * typeMultiplier;

    // Extra doors (above base)
    const extraDeuren = Math.max(0, (aantalDeuren || 0) - params.baseMontageDoors);
    uren += extraDeuren * params.extraUurPerDeur;

    // Drawers
    uren += (aantalLades || 0) * params.extraUurPerLade;

    // Shelves
    uren += (aantalLeggers || 0) * params.extraUurPerLegger;

    // Supports
    uren += (aantalTussensteunen || 0) * params.extraUurPerTussensteun;

    // Size adjustments
    const hoogteVerschil = Math.max(0, hoogte - params.baseMontageHoogte) / 100;
    const breedteVerschil = Math.max(0, breedte - params.baseMontageBreedte) / 100;
    const diepteVerschil = Math.max(0, diepte - params.baseMontageDiepte) / 100;

    uren += hoogteVerschil * params.hoogteFactorPer100mm;
    uren += breedteVerschil * params.breedteFactorPer100mm;
    uren += diepteVerschil * params.diepteFactorPer100mm;

    // Appliances (1 hour each)
    uren += (aantalToestellen || 0);

    return uren;
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg mb-4 border-2 border-green-300 shadow-md">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Debug: Berekeningen per Kast</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-green-200">
              <th className="border border-green-400 px-2 py-1">#</th>
              <th className="border border-green-400 px-2 py-1">Type</th>
              <th className="border border-green-400 px-2 py-1">H×B×D</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Binnen (m²)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Rug (m²)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Leggers (m²)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Buiten (m²)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Tablet (m²)</th>
              <th className="border border-green-400 px-2 py-1">Oppervlakte Open Nis (m²)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Open Nis</th>
              <th className="border border-green-400 px-2 py-1">Afplakken (lm)</th>
              <th className="border border-green-400 px-2 py-1 bg-orange-200">Montage (u)</th>
            </tr>
          </thead>
          <tbody>
            {kastenLijst.map((kast, index) => {
              const { hoogte, breedte, diepte, aantalLeggers, aantalDeuren, aantalLades, aantalTussensteunen, type, isZijpaneel, hplOnderdelen, hplMateriaal } = kast;

              let m2Binnen = 0, m2Rug = 0, m2Leggers = 0, m2Buiten = 0, m2Tablet = 0, m2OpenNis = 0, afplakken = 0;
              let openNisMateriaal = '-';
              const montageUren = berekenMontageUren(kast);

              if (isZijpaneel) {
                m2Buiten = (breedte * hoogte) / 1000000 * afvalfactorBuiten;
                afplakken = (2 * breedte + 2 * hoogte) / 1000;
              } else if (type === 'Open Nis HPL' && hplOnderdelen) {
                if (hplOnderdelen.LZ) {
                  m2OpenNis += (hoogte * diepte) / 1000000 * afvalfactorBuiten;
                  afplakken += hoogte / 1000;
                }
                if (hplOnderdelen.RZ) {
                  m2OpenNis += (hoogte * diepte) / 1000000 * afvalfactorBuiten;
                  afplakken += hoogte / 1000;
                }
                if (hplOnderdelen.BK) {
                  m2OpenNis += (breedte * diepte) / 1000000 * afvalfactorBuiten;
                  afplakken += breedte / 1000;
                }
                if (hplOnderdelen.OK) {
                  m2OpenNis += (breedte * diepte) / 1000000 * afvalfactorBuiten;
                  afplakken += breedte / 1000;
                }
                if (hplOnderdelen.RUG) {
                  m2OpenNis += (breedte * hoogte) / 1000000 * afvalfactorBuiten;
                }
                if (aantalDeuren > 0) {
                  m2OpenNis += (breedte * hoogte) / 1000000 * afvalfactorBuiten;
                  afplakken += (hoogte * 2 * aantalDeuren) / 1000;
                }
                if (aantalLeggers > 0) {
                  m2Leggers = (breedte * diepte * aantalLeggers) / 1000000 * afvalfactorBinnen;
                  afplakken += (breedte * aantalLeggers) / 1000;
                }
                if (aantalTussensteunen > 0) {
                  afplakken += (hoogte * aantalTussensteunen) / 1000;
                }

                if (hplMateriaal !== undefined && materiaalTablet[hplMateriaal]) {
                  openNisMateriaal = materiaalTablet[hplMateriaal].naam;
                }
              } else {
                m2Binnen = ((diepte * hoogte * (2 + aantalTussensteunen)) + (breedte * diepte * 2)) / 1000000 * afvalfactorBinnen;
                m2Rug = (breedte * hoogte) / 1000000 * afvalfactorBinnen;
                if (aantalLeggers > 0) {
                  m2Leggers = (breedte * diepte * aantalLeggers) / 1000000 * afvalfactorBinnen;
                }
                if (aantalDeuren > 0) {
                  m2Buiten = (breedte * hoogte) / 1000000 * afvalfactorBuiten;
                }
                afplakken = ((breedte * (2 + aantalLeggers)) + (hoogte * (2 + aantalTussensteunen)) + (hoogte * 2 * aantalDeuren) + (breedte * 2)) / 1000;
              }

              return (
                <tr key={kast.id} className={isZijpaneel ? 'bg-yellow-100' : type === 'Open Nis HPL' ? 'bg-blue-100' : ''}>
                  <td className="border border-green-300 px-2 py-1">{index + 1}</td>
                  <td className="border border-green-300 px-2 py-1">{type}</td>
                  <td className="border border-green-300 px-2 py-1 font-mono">{hoogte}×{breedte}×{diepte}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Binnen.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Rug.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Leggers.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Buiten.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Tablet.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right font-bold text-blue-600">{m2OpenNis.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 font-semibold text-blue-600">{openNisMateriaal}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{afplakken.toFixed(2)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right bg-orange-50 font-semibold text-orange-700">{montageUren.toFixed(2)}</td>
                </tr>
              );
            })}

            {/* Total row */}
            <tr className="bg-green-300 font-bold">
              <td colSpan="3" className="border border-green-400 px-2 py-1">TOTAAL</td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {kastenLijst.reduce((sum, kast) => {
                  if (kast.isZijpaneel || kast.type === 'Open Nis HPL') return sum;
                  return sum + ((kast.diepte * kast.hoogte * (2 + kast.aantalTussensteunen)) + (kast.breedte * kast.diepte * 2)) / 1000000 * afvalfactorBinnen;
                }, 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {kastenLijst.reduce((sum, kast) => {
                  if (kast.isZijpaneel || kast.type === 'Open Nis HPL') return sum;
                  return sum + (kast.breedte * kast.hoogte) / 1000000 * afvalfactorBinnen;
                }, 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {kastenLijst.reduce((sum, kast) => {
                  if (kast.isZijpaneel) return sum;
                  if (kast.aantalLeggers === 0) return sum;
                  return sum + (kast.breedte * kast.diepte * kast.aantalLeggers) / 1000000 * afvalfactorBinnen;
                }, 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {kastenLijst.reduce((sum, kast) => {
                  if (kast.type === 'Open Nis HPL') return sum;
                  if (kast.isZijpaneel) {
                    return sum + (kast.breedte * kast.hoogte) / 1000000 * afvalfactorBuiten;
                  }
                  if (kast.aantalDeuren === 0) return sum;
                  return sum + (kast.breedte * kast.hoogte) / 1000000 * afvalfactorBuiten;
                }, 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right">0.000</td>
              <td className="border border-green-400 px-2 py-1 text-right font-bold text-blue-600">
                {kastenLijst.reduce((sum, kast) => {
                  if (kast.type !== 'Open Nis HPL') return sum;
                  let m2 = 0;
                  if (kast.hplOnderdelen) {
                    if (kast.hplOnderdelen.LZ) m2 += (kast.hoogte * kast.diepte) / 1000000 * afvalfactorBuiten;
                    if (kast.hplOnderdelen.RZ) m2 += (kast.hoogte * kast.diepte) / 1000000 * afvalfactorBuiten;
                    if (kast.hplOnderdelen.BK) m2 += (kast.breedte * kast.diepte) / 1000000 * afvalfactorBuiten;
                    if (kast.hplOnderdelen.OK) m2 += (kast.breedte * kast.diepte) / 1000000 * afvalfactorBuiten;
                    if (kast.hplOnderdelen.RUG) m2 += (kast.breedte * kast.hoogte) / 1000000 * afvalfactorBuiten;
                  }
                  if (kast.aantalDeuren > 0) m2 += (kast.breedte * kast.hoogte) / 1000000 * afvalfactorBuiten;
                  return sum + m2;
                }, 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1">Zie detail</td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {kastenLijst.reduce((sum, kast) => {
                  let afplakken = 0;
                  if (kast.isZijpaneel) {
                    afplakken = (2 * kast.breedte + 2 * kast.hoogte) / 1000;
                  } else if (kast.type === 'Open Nis HPL') {
                    if (kast.hplOnderdelen) {
                      if (kast.hplOnderdelen.LZ) afplakken += kast.hoogte / 1000;
                      if (kast.hplOnderdelen.RZ) afplakken += kast.hoogte / 1000;
                      if (kast.hplOnderdelen.BK) afplakken += kast.breedte / 1000;
                      if (kast.hplOnderdelen.OK) afplakken += kast.breedte / 1000;
                    }
                    if (kast.aantalDeuren > 0) afplakken += (kast.hoogte * 2 * kast.aantalDeuren) / 1000;
                    if (kast.aantalLeggers > 0) afplakken += (kast.breedte * kast.aantalLeggers) / 1000;
                    if (kast.aantalTussensteunen > 0) afplakken += (kast.hoogte * kast.aantalTussensteunen) / 1000;
                  } else {
                    afplakken = ((kast.breedte * (2 + kast.aantalLeggers)) + (kast.hoogte * (2 + kast.aantalTussensteunen)) + (kast.hoogte * 2 * kast.aantalDeuren) + (kast.breedte * 2)) / 1000;
                  }
                  return sum + afplakken;
                }, 0).toFixed(2)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right bg-orange-200 font-bold text-orange-800">
                {kastenLijst.reduce((sum, kast) => sum + berekenMontageUren(kast), 0).toFixed(2)}
              </td>
            </tr>

            {/* Detail per Open Nis material */}
            {(() => {
              const materiaalGroups = {};
              kastenLijst.filter(k => k.type === 'Open Nis HPL').forEach(kast => {
                const matIndex = kast.hplMateriaal !== undefined ? kast.hplMateriaal : 0;
                const matNaam = materiaalTablet[matIndex]?.naam || 'Onbekend';

                if (!materiaalGroups[matNaam]) {
                  materiaalGroups[matNaam] = { m2: 0, matIndex: matIndex };
                }

                let m2 = 0;

                if (kast.hplOnderdelen) {
                  if (kast.hplOnderdelen.LZ) m2 += (kast.hoogte * kast.diepte) / 1000000 * afvalfactorBuiten;
                  if (kast.hplOnderdelen.RZ) m2 += (kast.hoogte * kast.diepte) / 1000000 * afvalfactorBuiten;
                  if (kast.hplOnderdelen.BK) m2 += (kast.breedte * kast.diepte) / 1000000 * afvalfactorBuiten;
                  if (kast.hplOnderdelen.OK) m2 += (kast.breedte * kast.diepte) / 1000000 * afvalfactorBuiten;
                  if (kast.hplOnderdelen.RUG) m2 += (kast.breedte * kast.hoogte) / 1000000 * afvalfactorBuiten;
                }
                if (kast.aantalDeuren > 0) m2 += (kast.breedte * kast.hoogte) / 1000000 * afvalfactorBuiten;

                materiaalGroups[matNaam].m2 += m2;
              });

              return Object.entries(materiaalGroups).map(([matNaam, data]) => {
                const mat = materiaalTablet[data.matIndex];
                if (!mat) return null;
                const m2PerPlaat = (mat.breedte / 1000) * (mat.hoogte / 1000);
                const aantalPlaten = Math.ceil(data.m2 / m2PerPlaat);

                return (
                  <tr key={`detail-${matNaam}`} className="bg-blue-200 text-sm">
                    <td colSpan="8" className="border border-green-400 px-2 py-1"></td>
                    <td className="border border-green-400 px-2 py-1 text-right font-bold">{data.m2.toFixed(3)}</td>
                    <td className="border border-green-400 px-2 py-1 font-semibold">{matNaam} → {aantalPlaten} platen</td>
                    <td className="border border-green-400 px-2 py-1"></td>
                    <td className="border border-green-400 px-2 py-1"></td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DebugTabel;
