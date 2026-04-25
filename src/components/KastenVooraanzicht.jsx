import React, { useState } from 'react';
import { CABINET_TYPE_CONFIG } from '../constants/cabinet';

// Classify a cabinet for layout purposes
// Returns 'upper' | 'base' | 'tall' | 'skip'
const classifyKast = (kast) => {
  if (kast.isZijpaneel) return 'skip';
  const t = kast.type;
  if (t === 'Bovenkast') return 'upper';
  if (t === 'Onderkast' || t === 'Ladekast') return 'base';
  if (t === 'Kolomkast') return 'tall';
  if (t === 'Vaatwasserdeur') return 'base';
  if (t === 'Onderkast Schuifdeur') return 'base';
  if (t === 'Kolomkast Schuifdeur') return 'tall';
  if (t === 'Tablet') return 'skip';
  if (t === 'Vrije Kast' || t === 'Open Nis HPL') {
    if ((kast.hoogte || 0) > 1500) return 'tall';
    if ((kast.hoogte || 0) < 700) return 'upper';
    return 'base';
  }
  return 'skip';
};

// Color per cabinet type
const getColorKey = (kast) => {
  const t = kast.type;
  if (CABINET_TYPE_CONFIG[t]) return CABINET_TYPE_CONFIG[t].colorClass;
  if (t === 'Vaatwasserdeur') return 'rose';
  if (t === 'Onderkast Schuifdeur') return 'teal';
  if (t === 'Kolomkast Schuifdeur') return 'green';
  if (t === 'Vrije Kast' || t === 'Open Nis HPL') return 'pink';
  return 'gray';
};

// Tailwind color → hex (SVG can't use Tailwind classes)
const COLOR_HEX = {
  purple: { fill: '#f5f3ff', stroke: '#a78bfa' },
  green:  { fill: '#ecfdf5', stroke: '#34d399' },
  blue:   { fill: '#eff6ff', stroke: '#60a5fa' },
  orange: { fill: '#fff7ed', stroke: '#fb923c' },
  teal:   { fill: '#f0fdfa', stroke: '#2dd4bf' },
  rose:   { fill: '#fff1f2', stroke: '#fb7185' },
  amber:  { fill: '#fffbeb', stroke: '#fbbf24' },
  pink:   { fill: '#fdf2f8', stroke: '#f472b6' },
  gray:   { fill: '#f9fafb', stroke: '#9ca3af' },
};

// Short labels for blocks
const SHORT_LABEL = {
  'Bovenkast': 'BK',
  'Onderkast': 'OK',
  'Kolomkast': 'KK',
  'Ladekast': 'LK',
  'Vaatwasserdeur': 'VWD',
  'Onderkast Schuifdeur': 'OKS',
  'Kolomkast Schuifdeur': 'KKS',
  'Vrije Kast': 'VRK',
  'Open Nis HPL': 'VRK',
};

const KastenVooraanzicht = ({ kastenLijst }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!kastenLijst || kastenLijst.length === 0) return null;

  // ── Compute layout ──────────────────────────────────────────
  let topX = 0;
  let bottomX = 0;
  let maxHoogte = 0;
  const blocks = [];

  kastenLijst.forEach((kast, idx) => {
    const kind = classifyKast(kast);
    if (kind === 'skip') return;
    const w = kast.breedte || 0;
    const h = kast.hoogte || 0;
    if (h > maxHoogte) maxHoogte = h;

    if (kind === 'upper') {
      blocks.push({ x: topX, w, h, kind, kast, idx });
      topX += w;
    } else if (kind === 'base') {
      blocks.push({ x: bottomX, w, h, kind, kast, idx });
      bottomX += w;
    } else if (kind === 'tall') {
      const newX = Math.max(topX, bottomX);
      blocks.push({ x: newX, w, h, kind, kast, idx });
      topX = newX + w;
      bottomX = newX + w;
    }
  });

  const totalWidthMm = Math.max(topX, bottomX, 1);
  const drawingHeightMm = Math.max(2100, maxHoogte, 1);

  // ── Compute tally ───────────────────────────────────────────
  const counts = {};
  const widths = {};
  kastenLijst.forEach(k => {
    if (k.isZijpaneel) return;
    const kind = classifyKast(k);
    if (kind === 'skip') return;
    const t = k.type;
    counts[t] = (counts[t] || 0) + 1;
    widths[t] = (widths[t] || 0) + (k.breedte || 0);
  });

  const topGap = totalWidthMm - topX;
  const bottomGap = totalWidthMm - bottomX;

  // ── SVG sizing ──────────────────────────────────────────────
  const TARGET_HEIGHT_PX = 240;
  const scale = TARGET_HEIGHT_PX / drawingHeightMm;
  const svgW = totalWidthMm * scale;
  const svgH = drawingHeightMm * scale;

  return (
    <div className="bg-white p-4 rounded-lg mb-4 border-2 border-gray-300 shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-lg font-bold text-gray-800">
          Vooraanzicht ({blocks.length} kast{blocks.length !== 1 ? 'en' : ''})
        </h2>
        <span className="text-gray-500 text-xl">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Tally: counts + widths per type */}
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(counts).map(([type, count]) => {
              const colorKey = getColorKey({ type });
              const c = COLOR_HEX[colorKey] || COLOR_HEX.gray;
              return (
                <span
                  key={type}
                  className="px-2 py-1 rounded font-medium border"
                  style={{ backgroundColor: c.fill, borderColor: c.stroke, color: '#374151' }}
                >
                  {type}: <strong>{count}×</strong> <span className="text-gray-500">({widths[type]}mm)</span>
                </span>
              );
            })}
          </div>

          {/* Track totals */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 border-t border-gray-100 pt-2">
            <span>Boventrack: <strong>{topX}mm</strong>{topGap > 0 && <span className="text-amber-600 ml-1">(− {topGap}mm gat)</span>}</span>
            <span>Ondertrack: <strong>{bottomX}mm</strong>{bottomGap > 0 && <span className="text-amber-600 ml-1">(− {bottomGap}mm gat)</span>}</span>
            <span>Totale wand: <strong>{totalWidthMm}mm</strong></span>
            <span>Hoogste kast: <strong>{maxHoogte}mm</strong></span>
          </div>

          {/* SVG drawing */}
          <div className="overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200">
            <svg width={svgW} height={svgH} style={{ display: 'block' }}>
              {/* Floor line */}
              <line x1="0" y1={svgH} x2={svgW} y2={svgH} stroke="#9ca3af" strokeWidth="1.5" />
              {/* Ceiling reference line (top of tallest cabinet) */}
              <line x1="0" y1="0" x2={svgW} y2="0" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />

              {blocks.map((b, i) => {
                const colorKey = getColorKey(b.kast);
                const c = COLOR_HEX[colorKey] || COLOR_HEX.gray;
                const x = b.x * scale;
                const w = b.w * scale;
                const h = b.h * scale;
                // upper anchored top (y=0); base/tall anchored bottom (y = svgH - h)
                const y = b.kind === 'upper' ? 0 : svgH - h;
                const showLabel = w > 28 && h > 14;
                const showDims = w > 50 && h > 28;

                return (
                  <g key={b.idx}>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill={c.fill}
                      stroke={c.stroke}
                      strokeWidth="1.5"
                    />
                    {showLabel && (
                      <text
                        x={x + w / 2}
                        y={y + h / 2 - (showDims ? 6 : 0)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#374151"
                        style={{ pointerEvents: 'none' }}
                      >
                        {SHORT_LABEL[b.kast.type] || b.kast.type}
                      </text>
                    )}
                    {showDims && (
                      <text
                        x={x + w / 2}
                        y={y + h / 2 + 8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                        fill="#6b7280"
                        style={{ pointerEvents: 'none' }}
                      >
                        {b.kast.breedte}×{b.kast.hoogte}
                      </text>
                    )}
                    {/* Hover title for full info */}
                    <title>{`${b.kast.type} — ${b.kast.breedte}×${b.kast.hoogte}×${b.kast.diepte || 0}mm`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default KastenVooraanzicht;
