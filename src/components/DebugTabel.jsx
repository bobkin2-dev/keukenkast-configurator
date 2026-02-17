import React, { useMemo } from 'react';
import { berekenAlleKasten } from '../utils/kastCalculator';

// Helper: detect Vrije Kast type (including legacy)
const isVrijeKast = (type) => type === 'Vrije Kast' || type === 'Open Nis HPL';

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
  return '-';
};

const DebugTabel = ({ kastenLijst, plaatMaterialen = [], rendementBinnenzijde, rendementBuitenzijde, productionParams }) => {
  if (kastenLijst.length === 0) return null;

  const afvalfactorBinnen = 100 / rendementBinnenzijde;
  const afvalfactorBuiten = 100 / rendementBuitenzijde;

  // Use kastCalculator for all per-cabinet calculations (single source of truth)
  const { perKast, totalen } = useMemo(() =>
    berekenAlleKasten(kastenLijst, {
      afvalfactorBinnen,
      afvalfactorBuiten,
      productionParams
    }),
    [kastenLijst, afvalfactorBinnen, afvalfactorBuiten, productionParams]
  );

  // Helper: sum m2 from onderdelen by materiaalType for a single cabinet result
  const getM2 = (result, type) =>
    result.onderdelen
      .filter(o => o.materiaalType === type)
      .reduce((sum, o) => sum + o.m2, 0);

  return (
    <div className="bg-green-50 p-4 rounded-lg mb-4 border-2 border-green-300 shadow-md">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Debug: Berekeningen per Kast</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-green-200">
              <th className="border border-green-400 px-2 py-1">#</th>
              <th className="border border-green-400 px-2 py-1">Type</th>
              <th className="border border-green-400 px-2 py-1">H&times;B&times;D</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Binnen (m&sup2;)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Rug (m&sup2;)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Leggers (m&sup2;)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Buiten (m&sup2;)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Tablet (m&sup2;)</th>
              <th className="border border-green-400 px-2 py-1">Oppervlakte Vrije Kast (m&sup2;)</th>
              <th className="border border-green-400 px-2 py-1">Materiaal Vrije Kast</th>
              <th className="border border-green-400 px-2 py-1">Afplakken (lm)</th>
              <th className="border border-green-400 px-2 py-1 bg-orange-200">Montage (u)</th>
            </tr>
          </thead>
          <tbody>
            {kastenLijst.map((kast, index) => {
              const result = perKast[index];
              if (!result) return null;

              const { type, isZijpaneel } = kast;

              // Extract m2 per materiaalType from this cabinet's onderdelen
              const m2Binnen = getM2(result, 'binnenkast');
              const m2Rug = getM2(result, 'rug');
              const m2Leggers = getM2(result, 'leggers');
              const m2Buiten = getM2(result, 'buitenzijde');
              const m2Tablet = 0;
              const m2VrijeKast = getM2(result, 'vrijeKast');

              // Get Vrije Kast material name
              const vrijeKastMateriaal = isVrijeKast(type)
                ? getVrijeKastMateriaalNaam(kast, plaatMaterialen)
                : '-';

              return (
                <tr key={kast.id} className={isZijpaneel ? 'bg-yellow-100' : isVrijeKast(type) ? 'bg-blue-100' : ''}>
                  <td className="border border-green-300 px-2 py-1">{index + 1}</td>
                  <td className="border border-green-300 px-2 py-1">{type}</td>
                  <td className="border border-green-300 px-2 py-1 font-mono">{kast.hoogte}&times;{kast.breedte}&times;{kast.diepte}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Binnen.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Rug.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Leggers.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Buiten.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{m2Tablet.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right font-bold text-blue-600">{m2VrijeKast.toFixed(3)}</td>
                  <td className="border border-green-300 px-2 py-1 font-semibold text-blue-600">{vrijeKastMateriaal}</td>
                  <td className="border border-green-300 px-2 py-1 text-right">{result.afplakken.toFixed(2)}</td>
                  <td className="border border-green-300 px-2 py-1 text-right bg-orange-50 font-semibold text-orange-700">{result.montageUren.toFixed(2)}</td>
                </tr>
              );
            })}

            {/* Total row */}
            <tr className="bg-green-300 font-bold">
              <td colSpan="3" className="border border-green-400 px-2 py-1">TOTAAL</td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {(totalen.m2PerType.binnenkast || 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {(totalen.m2PerType.rug || 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {(totalen.m2PerType.leggers || 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {(totalen.m2PerType.buitenzijde || 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right">0.000</td>
              <td className="border border-green-400 px-2 py-1 text-right font-bold text-blue-600">
                {(totalen.m2PerType.vrijeKast || 0).toFixed(3)}
              </td>
              <td className="border border-green-400 px-2 py-1">Zie detail</td>
              <td className="border border-green-400 px-2 py-1 text-right">
                {totalen.afplakken.toFixed(2)}
              </td>
              <td className="border border-green-400 px-2 py-1 text-right bg-orange-200 font-bold text-orange-800">
                {totalen.montageUren.toFixed(2)}
              </td>
            </tr>

            {/* Detail per Vrije Kast material */}
            {(() => {
              const materiaalGroups = {};
              Object.entries(totalen.m2VrijeKastPerMateriaal || {}).forEach(([matRef, m2]) => {
                let mat = null;
                const refNum = parseInt(matRef);
                if (!isNaN(refNum)) {
                  mat = plaatMaterialen.find(m => m.id === refNum) || plaatMaterialen[refNum];
                }
                const matNaam = mat?.naam || 'Onbekend';
                if (!materiaalGroups[matNaam]) {
                  materiaalGroups[matNaam] = { m2: 0, mat };
                }
                materiaalGroups[matNaam].m2 += m2;
              });

              return Object.entries(materiaalGroups).map(([matNaam, data]) => {
                if (!data.mat) return null;
                const m2PerPlaat = (data.mat.breedte / 1000) * (data.mat.hoogte / 1000);
                const aantalPlaten = Math.ceil(data.m2 / m2PerPlaat);

                return (
                  <tr key={`detail-${matNaam}`} className="bg-blue-200 text-sm">
                    <td colSpan="8" className="border border-green-400 px-2 py-1"></td>
                    <td className="border border-green-400 px-2 py-1 text-right font-bold">{data.m2.toFixed(3)}</td>
                    <td className="border border-green-400 px-2 py-1 font-semibold">{matNaam} &rarr; {aantalPlaten} platen</td>
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
