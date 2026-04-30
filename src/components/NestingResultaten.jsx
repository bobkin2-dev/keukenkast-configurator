import React, { useState, useMemo } from 'react';
import { berekenAlleKasten, getKerfForMaterial } from '../utils/kastCalculator';
import { packParts, computeUtilisation } from '../utils/binPack';

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

const safeMat = (arr, idx) => arr?.[idx] || arr?.[0] || { breedte: 1000, hoogte: 1000, prijs: 0, naam: '' };

const PlatePreview = ({ plate, scale, partColorOf }) => {
  const w = plate.length * scale;
  const h = plate.width * scale;
  return (
    <div className="inline-block mr-3 mb-2" style={{ verticalAlign: 'top' }}>
      <svg width={w} height={h} style={{ display: 'block', border: '1.5px solid #6b7280', background: '#f9fafb' }}>
        {plate.placements.map((p, i) => {
          const c = partColorOf(p.name);
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
        {plate.placements.length} stuk{plate.placements.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

const MaterialBlock = ({ title, mat, rects, buffer }) => {
  const result = useMemo(() => {
    if (!mat?.breedte || !mat?.hoogte || !rects || rects.length === 0) {
      return { plates: [], unfit: [] };
    }
    return packParts({
      plateLength: mat.breedte,
      plateWidth: mat.hoogte,
      parts: rects,
      grain: mat.grain || false,
      kerf: getKerfForMaterial(mat),
    });
  }, [mat, rects]);

  if (!rects || rects.length === 0) return null;

  const platesNeeded = Math.ceil(result.plates.length * (1 + (buffer || 0)));
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

  // Visual scale: max ~280px wide per plate
  const scale = mat.breedte > 0 ? Math.min(280 / mat.breedte, 200 / mat.hoogte, 0.15) : 0.1;

  return (
    <div className="bg-white border border-gray-200 rounded p-3 mb-3">
      <div className="flex items-baseline gap-3 mb-2">
        <h4 className="font-semibold text-gray-700">{title}</h4>
        <span className="text-xs text-gray-500">{mat.naam} — {mat.breedte}×{mat.hoogte}mm — kerf {kerf}mm</span>
        <span className="ml-auto text-sm font-semibold text-gray-800">
          {platesNeeded} plaat{platesNeeded !== 1 ? 'en' : ''}
          {buffer > 0 && (
            <span className="text-xs text-gray-500 font-normal ml-1">
              ({result.plates.length} packed + {Math.round(buffer * 100)}% buffer)
            </span>
          )}
        </span>
        {result.plates.length > 0 && (
          <span className="text-xs text-gray-500">{Math.round(utilisation * 100)}% benut</span>
        )}
      </div>

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
  const [open, setOpen] = useState(false);

  // Aggregate rects per material (rerun the same calc the totals use, but only to grab rects)
  const aggTotalen = useMemo(() => {
    const afvalfactorBinnen = (rendementBinnenzijde > 0) ? 100 / rendementBinnenzijde : 1.33;
    const afvalfactorBuiten = (rendementBuitenzijde > 0) ? 100 / rendementBuitenzijde : 1.43;
    const { totalen } = berekenAlleKasten(kastenLijst, {
      afvalfactorBinnen, afvalfactorBuiten, productionParams
    });
    return totalen;
  }, [kastenLijst, rendementBinnenzijde, rendementBuitenzijde, productionParams]);

  const rectsByType = aggTotalen.rectsPerType || {};
  const rectsVrijeKast = aggTotalen.rectsVrijeKastPerMateriaal || {};

  const findVrijeKastMat = (ref) => {
    if (ref === null || ref === undefined) return null;
    const byId = plaatMaterialen.find(m => String(m.id) === String(ref));
    if (byId) return byId;
    const idx = parseInt(ref);
    if (!isNaN(idx) && materiaalTablet[idx]) return materiaalTablet[idx];
    return plaatMaterialen[0] || null;
  };

  // Combine binnenkast + (rug if not alt) + (leggers if not alt)
  const binnenRects = useMemo(() => {
    const out = [...(rectsByType.binnenkast || [])];
    if (!alternatieveMateriaal?.ruggenGebruiken) out.push(...(rectsByType.rug || []));
    if (!alternatieveMateriaal?.leggersGebruiken) out.push(...(rectsByType.leggers || []));
    return out;
  }, [rectsByType, alternatieveMateriaal]);

  const binnenMat = safeMat(materiaalBinnenkast, geselecteerdMateriaalBinnen);
  const buitenMat = safeMat(materiaalBuitenzijde, geselecteerdMateriaalBuiten);
  const tabletMat = safeMat(materiaalTablet, geselecteerdMateriaalTablet);
  const rugMat = alternatieveMateriaal?.ruggenGebruiken
    ? safeMat(materiaalBinnenkast, alternatieveMateriaal.ruggenMateriaal)
    : null;
  const leggersMat = alternatieveMateriaal?.leggersGebruiken
    ? safeMat(materiaalBinnenkast, alternatieveMateriaal.leggersMateriaal)
    : null;

  // Total plates summary across all sections (for header badge)
  // NOTE: must be declared before any early return to avoid a hook-order violation
  const totalPlates = useMemo(() => {
    const tally = (rects, mat) => {
      if (!rects?.length || !mat?.breedte) return 0;
      const r = packParts({ plateLength: mat.breedte, plateWidth: mat.hoogte, parts: rects, grain: false, kerf: getKerfForMaterial(mat) });
      return Math.ceil(r.plates.length * (1 + nestingBuffer));
    };
    let n = 0;
    n += tally(binnenRects, binnenMat);
    if (rugMat) n += tally(rectsByType.rug || [], rugMat);
    if (leggersMat) n += tally(rectsByType.leggers || [], leggersMat);
    n += tally(rectsByType.buitenzijde || [], buitenMat);
    n += tally(rectsByType.tablet || [], tabletMat);
    Object.entries(rectsVrijeKast).forEach(([ref, rects]) => {
      const mat = findVrijeKastMat(ref);
      if (mat) n += tally(rects, mat);
    });
    return n;
  }, [binnenRects, binnenMat, rugMat, leggersMat, rectsByType, buitenMat, tabletMat, rectsVrijeKast, nestingBuffer]);

  // Early return AFTER all hooks (moving this above any hook causes a hook-order violation)
  if (!kastenLijst || kastenLijst.length === 0) return null;

  return (
    <div className="bg-cyan-50 p-4 rounded-lg mb-4 border-2 border-cyan-200">
      <h2
        className="text-lg font-bold text-gray-800 cursor-pointer flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <span>
          Nesting resultaten
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({totalPlates} plaat{totalPlates !== 1 ? 'en' : ''} totaal · buffer {Math.round(nestingBuffer * 100)}%)
          </span>
        </span>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </h2>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-500 italic mb-2">
            Visuele weergave van hoe onderdelen op platen geplaatst worden.
            Kerf is automatisch 14mm voor M-prefix materialen, 4mm voor andere.
            Werkt onafhankelijk van de Nesting-toggle in de Plaatmateriaal-tabel.
          </p>

          <MaterialBlock
            title="Binnenkast"
            mat={binnenMat}
            rects={binnenRects}
            buffer={nestingBuffer}
          />
          {rugMat && (
            <MaterialBlock
              title="Rug (apart materiaal)"
              mat={rugMat}
              rects={rectsByType.rug || []}
              buffer={nestingBuffer}
            />
          )}
          {leggersMat && (
            <MaterialBlock
              title="Leggers (apart materiaal)"
              mat={leggersMat}
              rects={rectsByType.leggers || []}
              buffer={nestingBuffer}
            />
          )}
          <MaterialBlock
            title="Buitenzijde"
            mat={buitenMat}
            rects={rectsByType.buitenzijde || []}
            buffer={nestingBuffer}
          />
          <MaterialBlock
            title="Tablet"
            mat={tabletMat}
            rects={rectsByType.tablet || []}
            buffer={nestingBuffer}
          />
          {Object.entries(rectsVrijeKast).map(([ref, rects]) => {
            const mat = findVrijeKastMat(ref);
            if (!mat) return null;
            return (
              <MaterialBlock
                key={`vk-${ref}`}
                title="Vrije Kast"
                mat={mat}
                rects={rects}
                buffer={nestingBuffer}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NestingResultaten;
