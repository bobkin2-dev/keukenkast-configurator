import React, { useState, useMemo } from 'react';
import { CABINET_TYPE_CONFIG } from '../constants/cabinet';

// Classify a cabinet for layout: 'upper' | 'base' | 'tall' | 'skip'
const classifyKast = (kast) => {
  if (!kast || kast.isZijpaneel) return 'skip';
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

// Color key per type
const getColorKey = (kast) => {
  const t = kast?.type;
  if (CABINET_TYPE_CONFIG[t]) return CABINET_TYPE_CONFIG[t].colorClass;
  if (t === 'Vaatwasserdeur') return 'rose';
  if (t === 'Onderkast Schuifdeur') return 'teal';
  if (t === 'Kolomkast Schuifdeur') return 'green';
  if (t === 'Vrije Kast' || t === 'Open Nis HPL') return 'pink';
  return 'gray';
};

// Tailwind-equivalent hex pairs
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

// Whether the dragged kind can be inserted between items of `targetKind`
const isCompatibleTrack = (draggedKind, targetKind) => {
  if (draggedKind === 'tall') return true; // tall can go anywhere
  if (draggedKind === 'upper') return targetKind === 'upper' || targetKind === 'tall';
  if (draggedKind === 'base') return targetKind === 'base' || targetKind === 'tall';
  return false;
};

const KastenVooraanzicht = ({ kastenLijst, setKastenLijst }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [draggedId, setDraggedId] = useState(null);
  const [hoveredZoneIdx, setHoveredZoneIdx] = useState(null);

  // ── Layout (always computes from current kastenLijst) ──────
  const layout = useMemo(() => {
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

    return {
      blocks,
      topX,
      bottomX,
      totalWidthMm: Math.max(topX, bottomX, 1),
      drawingHeightMm: Math.max(2100, maxHoogte, 1),
      maxHoogte
    };
  }, [kastenLijst]);

  const { blocks, topX, bottomX, totalWidthMm, drawingHeightMm, maxHoogte } = layout;

  // Pixel scale
  const TARGET_HEIGHT_PX = 240;
  const scale = TARGET_HEIGHT_PX / drawingHeightMm;
  const containerW = totalWidthMm * scale;
  const containerH = drawingHeightMm * scale;

  // ── Drop zones (only meaningful during drag — but the hook must run every render) ──
  const draggedBlock = draggedId !== null ? blocks.find(b => b.kast.id === draggedId) : null;
  const draggedKind = draggedBlock ? draggedBlock.kind : null;

  const dropZones = useMemo(() => {
    if (!draggedBlock) return [];

    const trackBlocks = blocks.filter(b =>
      b.kast.id !== draggedId && isCompatibleTrack(draggedKind, b.kind)
    );

    if (trackBlocks.length === 0) {
      return [{ beforeKastId: null, x: 4, kind: draggedKind }];
    }

    const zones = [];
    zones.push({
      beforeKastId: trackBlocks[0].kast.id,
      x: trackBlocks[0].x * scale,
      kind: trackBlocks[0].kind === 'tall' ? 'tall' : draggedKind,
    });
    for (let i = 0; i < trackBlocks.length - 1; i++) {
      const left = trackBlocks[i];
      const right = trackBlocks[i + 1];
      const midMm = (left.x + left.w + right.x) / 2;
      zones.push({
        beforeKastId: right.kast.id,
        x: midMm * scale,
        kind: 'tall',
      });
    }
    const last = trackBlocks[trackBlocks.length - 1];
    zones.push({
      beforeKastId: null,
      x: (last.x + last.w) * scale,
      kind: last.kind === 'tall' ? 'tall' : draggedKind,
    });

    return zones;
  }, [draggedId, draggedKind, blocks, scale, draggedBlock]);

  // Early return — must come AFTER all hooks
  if (!kastenLijst || kastenLijst.length === 0) return null;

  // ── Tally ──────────────────────────────────────────────────
  const counts = {};
  const widths = {};
  kastenLijst.forEach(k => {
    if (classifyKast(k) === 'skip') return;
    const t = k.type;
    counts[t] = (counts[t] || 0) + 1;
    widths[t] = (widths[t] || 0) + (k.breedte || 0);
  });

  const topGap = totalWidthMm - topX;
  const bottomGap = totalWidthMm - bottomX;

  const handleDragStart = (e, kast) => {
    setDraggedId(kast.id);
    e.dataTransfer.effectAllowed = 'move';
    // Some browsers need data set for drag to work
    try { e.dataTransfer.setData('text/plain', String(kast.id)); } catch {}
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setHoveredZoneIdx(null);
  };

  const handleZoneDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredZoneIdx(idx);
  };

  const handleZoneDrop = (e, zone) => {
    e.preventDefault();
    if (draggedId === null) return;
    const draggedKast = kastenLijst.find(k => k.id === draggedId);
    if (!draggedKast) return;

    const without = kastenLijst.filter(k => k.id !== draggedId);
    let newList;
    if (zone.beforeKastId === null) {
      newList = [...without, draggedKast];
    } else {
      const targetIdx = without.findIndex(k => k.id === zone.beforeKastId);
      if (targetIdx === -1) {
        newList = [...without, draggedKast];
      } else {
        newList = [...without.slice(0, targetIdx), draggedKast, ...without.slice(targetIdx)];
      }
    }
    setKastenLijst(newList);
    setDraggedId(null);
    setHoveredZoneIdx(null);
  };

  // Per-zone visual height/top
  const zoneRect = (zone) => {
    if (zone.kind === 'tall') return { top: 0, height: containerH };
    if (zone.kind === 'upper') return { top: 0, height: containerH * 0.45 };
    return { top: containerH * 0.55, height: containerH * 0.45 };
  };

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
          {/* Tally per type */}
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
            {draggedId === null && setKastenLijst && (
              <span className="ml-auto text-gray-400 italic">Sleep een kast om te herschikken</span>
            )}
          </div>

          {/* Drawing */}
          <div className="overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200">
            <div
              className="relative"
              style={{ width: containerW, height: containerH, minWidth: 120 }}
            >
              {/* Floor line */}
              <div
                className="absolute left-0 right-0"
                style={{ bottom: 0, height: 0, borderBottom: '1.5px solid #9ca3af' }}
              />
              {/* Ceiling reference */}
              <div
                className="absolute left-0 right-0"
                style={{ top: 0, height: 0, borderTop: '1px dashed #e5e7eb' }}
              />

              {/* Cabinet blocks */}
              {blocks.map((b) => {
                const colorKey = getColorKey(b.kast);
                const c = COLOR_HEX[colorKey] || COLOR_HEX.gray;
                const x = b.x * scale;
                const w = b.w * scale;
                const h = b.h * scale;
                const top = b.kind === 'upper' ? 0 : containerH - h;
                const showLabel = w > 28 && h > 14;
                const showDims = w > 50 && h > 28;
                const isDragging = draggedId === b.kast.id;

                return (
                  <div
                    key={b.kast.id}
                    draggable={!!setKastenLijst}
                    onDragStart={(e) => handleDragStart(e, b.kast)}
                    onDragEnd={handleDragEnd}
                    title={`${b.kast.type} — ${b.kast.breedte}×${b.kast.hoogte}×${b.kast.diepte || 0}mm`}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: top,
                      width: w,
                      height: h,
                      backgroundColor: c.fill,
                      border: `1.5px solid ${c.stroke}`,
                      cursor: setKastenLijst ? 'grab' : 'default',
                      opacity: isDragging ? 0.4 : 1,
                      transition: 'opacity 0.1s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      userSelect: 'none',
                    }}
                  >
                    {showLabel && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', lineHeight: 1.1, pointerEvents: 'none' }}>
                        {SHORT_LABEL[b.kast.type] || b.kast.type}
                      </span>
                    )}
                    {showDims && (
                      <span style={{ fontSize: 9, color: '#6b7280', lineHeight: 1.1, marginTop: 2, pointerEvents: 'none' }}>
                        {b.kast.breedte}×{b.kast.hoogte}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Drop zones (drag indicators) */}
              {draggedId !== null && dropZones.map((zone, i) => {
                const rect = zoneRect(zone);
                const isHovered = hoveredZoneIdx === i;
                const ZONE_W = 48;
                return (
                  <div
                    key={`zone-${i}`}
                    onDragOver={(e) => handleZoneDragOver(e, i)}
                    onDragLeave={() => setHoveredZoneIdx(prev => prev === i ? null : prev)}
                    onDrop={(e) => handleZoneDrop(e, zone)}
                    style={{
                      position: 'absolute',
                      left: zone.x - ZONE_W / 2,
                      top: rect.top,
                      width: ZONE_W,
                      height: rect.height,
                      backgroundColor: isHovered ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                      borderLeft: isHovered ? '3px solid #3b82f6' : '3px solid transparent',
                      transition: 'background-color 0.1s, border-color 0.1s',
                      zIndex: 10,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KastenVooraanzicht;
