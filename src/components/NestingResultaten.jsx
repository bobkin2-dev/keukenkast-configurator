import React, { useState, useMemo } from 'react';
import { berekenAlleKasten, bouwNestingGroepen, getKerfForMaterial } from '../utils/kastCalculator';
import { computeUtilisation } from '../utils/binPack';

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

// Pieces of a part that was too big for the plate and had to be divided
const SPLIT_COLOR = { fill: '#fca5a5', stroke: '#b91c1c' };

const PlatePreview = ({ plate, scale, partColorOf }) => {
  const w = plate.length * scale;
  const h = plate.width * scale;
  return (
    <div className="inline-block mr-3 mb-2" style={{ verticalAlign: 'top' }}>
      <svg width={w} height={h} style={{ display: 'block', border: '1.5px solid #6b7280', background: '#f9fafb' }}>
        {plate.placements.map((p, i) => {
          const c = p.split ? SPLIT_COLOR : partColorOf(p.name);
          const x = p.x * scale;
          const y = p.y * scale;
          const pw = p.w * scale;
          const ph = p.h * scale;
          const showLabel = pw > 36 && ph > 18;
          return (
            <g key={i}>
              <rect x={x} y={y} width={pw} height={ph} fill={c.fill} stroke={c.stroke} strokeWidth={p.split ? 2 : 1} />
              {showLabel && (
                <text x={x + pw / 2} y={y + ph / 2} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#374151" style={{ pointerEvents: 'none' }}>
                  {p.name || `${Math.round(p.w)}×${Math.round(p.h)}`}
                </text>
              )}
              <title>{`${p.name || 'onbenoemd'} — ${Math.round(p.w)}×${Math.round(p.h)}mm${p.rotated ? ' (gedraaid)' : ''}${p.split ? ' — GESPLITST: stuk paste niet op de plaat' : ''}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="text-xs text-center text-gray-500 mt-1" style={{ width: w }}>
        {plate.placements.length} stuk{plate.placements.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

const MaterialBlock = ({ groep }) => {
  const { title, mat, rects, result, platen: platesNeeded } = groep;

  const utilisation = computeUtilisation(result.plates);
  const kerf = getKerfForMaterial(mat);

  // Stable colour per unique part name
  const nameToColor = useMemo(() => {
    const m = {};
    let idx = 0;
    rects.forEach(r => {
      if (!(r.name in m)) {
        m[r.name] = PART_COLORS[idx % PART_COLORS.length];
        idx++;
      }
    });
    return m;
  }, [rects]);
  const partColorOf = (name) => nameToColor[name] || PART_COLORS[0];

  if (!rects || rects.length === 0) return null;

  // Visual scale: max ~280px wide per plate
  const scale = mat.breedte > 0 ? Math.min(280 / mat.breedte, 200 / mat.hoogte, 0.15) : 0.1;

  return (
    <div className="bg-white border border-gray-200 rounded p-3 mb-3">
      <div className="flex items-baseline gap-3 mb-2">
        <h4 className="font-semibold text-gray-700">{title}</h4>
        <span className="text-xs text-gray-500">{mat.naam} — {mat.breedte}×{mat.hoogte}mm — kerf {kerf}mm</span>
        <span className="ml-auto text-sm font-semibold text-gray-800">
          {platesNeeded} plaat{platesNeeded !== 1 ? 'en' : ''}
          {platesNeeded > result.plates.length && (
            <span className="text-xs text-gray-500 font-normal ml-1">
              ({result.plates.length} gepakt + 1 veiligheidsplaat)
            </span>
          )}
        </span>
        {result.plates.length > 0 && (
          <span className="text-xs text-gray-500">{Math.round(utilisation * 100)}% benut</span>
        )}
      </div>

      {result.split?.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded p-2 mb-2 text-xs text-red-700">
          ✂️ <strong>{result.split.length}</strong> stuk{result.split.length !== 1 ? 'ken' : ''} te groot voor de plaat
          ({mat.breedte}×{mat.hoogte}mm) en opgedeeld — <span className="font-semibold">rood</span> weergegeven:
          <ul className="mt-1 ml-4 list-disc">
            {result.split.map((sp, i) => (
              <li key={i}>{sp.name || 'onbenoemd'} — {Math.round(sp.length)}×{Math.round(sp.width)}mm → {sp.pieces} delen</li>
            ))}
          </ul>
        </div>
      )}

      {result.unfit.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-2 text-xs text-red-700">
          ⚠️ <strong>{result.unfit.length}</strong> onderdeel/onderdelen passen niet op een plaat
          ({mat.breedte}×{mat.hoogte}mm).
        </div>
      )}

      {result.plates.length > 0 && (
        <div className="overflow-x-auto bg-gray-50 p-2 rounded border border-gray-200">
          {result.plates.map((plate, i) => (
            <PlatePreview key={i} plate={plate} scale={scale} partColorOf={partColorOf} />
          ))}
        </div>
      )}
    </div>
  );
};

const NestingResultaten = ({
  kastenLijst,
  materiaalBinnenkast = [],
  materiaalBuitenzijde = [],
  materiaalTablet = [],
  geselecteerdMateriaalBinnen = 0,
  geselecteerdMateriaalBuiten = 0,
  geselecteerdMateriaalTablet = 0,
  alternatieveMateriaal = {},
  plaatMaterialen = [],
  productionParams,
  rendementBinnenzijde = 75,
  rendementBuitenzijde = 70,
  nestingBuffer = 0.05,
}) => {
  const [open, setOpen] = useState(true);

  // Same calculation the totaallijst uses (bouwNestingGroepen), so plate counts always match
  const groepen = useMemo(() => {
    const afvalfactorBinnen = (rendementBinnenzijde > 0) ? 100 / rendementBinnenzijde : 1.33;
    const afvalfactorBuiten = (rendementBuitenzijde > 0) ? 100 / rendementBuitenzijde : 1.43;
    const { totalen } = berekenAlleKasten(kastenLijst, {
      afvalfactorBinnen, afvalfactorBuiten, productionParams
    });
    return bouwNestingGroepen(
      totalen,
      { materiaalBinnenkast, materiaalBuitenzijde, materiaalTablet, plaatMaterialen },
      { geselecteerdMateriaalBinnen, geselecteerdMateriaalBuiten, geselecteerdMateriaalTablet },
      alternatieveMateriaal
    );
  }, [kastenLijst, rendementBinnenzijde, rendementBuitenzijde, productionParams,
      materiaalBinnenkast, materiaalBuitenzijde, materiaalTablet, plaatMaterialen,
      geselecteerdMateriaalBinnen, geselecteerdMateriaalBuiten, geselecteerdMateriaalTablet, alternatieveMateriaal]);

  const groepLijst = [
    groepen.binnenkast,
    groepen.rug,
    groepen.leggers,
    groepen.buitenzijde,
    groepen.tablet,
    ...Object.values(groepen.vrijeKast),
  ].filter(g => g && g.rects.length > 0 && !g.samengevoegdIn);

  const totalPlates = groepLijst.reduce((sum, g) => sum + g.platen, 0);
  const totalSplit = groepLijst.reduce((sum, g) => sum + (g.result.split?.length || 0), 0);

  if (!kastenLijst || kastenLijst.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg mb-4 border border-gray-200 shadow-sm klassiek:bg-cyan-50 klassiek:border-2 klassiek:border-cyan-200 klassiek:shadow-none">
      <h2
        className="text-lg font-bold text-gray-800 cursor-pointer flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <span>
          Nesting resultaten
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({totalPlates} plaat{totalPlates !== 1 ? 'en' : ''} totaal · slim afgerond)
          </span>
          {totalSplit > 0 && (
            <span className="ml-2 text-sm font-semibold text-red-600">
              ✂️ {totalSplit} gesplitst
            </span>
          )}
        </span>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </h2>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-500 italic mb-2">
            Visuele weergave van hoe onderdelen op platen geplaatst worden.
            Kerf is automatisch 14mm voor M-prefix materialen, 4mm voor andere.
            Stukken die niet op een plaat passen worden opgedeeld en in het rood getoond.
            Onderdelen met hetzelfde plaatmateriaal worden samen genest.
            Met de Nesting-toggle in de Plaatmateriaal-tabel gebruikt de totaallijst exact deze aantallen.
          </p>

          {groepLijst.map(g => (
            <MaterialBlock key={g.key} groep={g} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NestingResultaten;
