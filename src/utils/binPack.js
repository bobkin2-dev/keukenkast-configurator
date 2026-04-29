// 2D guillotine bin-packing with free-rectangle splitting.
//
// All dimensions in mm. `kerf` is added to the right + bottom of each placed
// part so consecutive parts are spaced by the saw blade width.
//
// Inputs:
//   plateLength   long edge of the plate (typically the grain direction)
//   plateWidth    short edge
//   parts         [{ id, amount, length, width, name }]
//   grain         true → parts can NOT be rotated 90° (length stays along plate length)
//   kerf          mm of saw kerf between parts (default 4)
//
// Output:
//   {
//     plates: [{ length, width, placements: [{ x, y, w, h, name, sourceId, rotated }] }],
//     unfit:  [{ id, length, width, name }]   // parts too big for a single plate
//   }

export const packParts = ({ plateLength, plateWidth, parts, grain = false, kerf = 4 }) => {
  if (!plateLength || !plateWidth || !parts || parts.length === 0) {
    return { plates: [], unfit: [] };
  }

  // Expand by amount
  const expanded = [];
  let pid = 0;
  for (const p of parts) {
    const amount = Math.max(1, p.amount || 1);
    const length = p.length || 0;
    const width = p.width || 0;
    if (length <= 0 || width <= 0) continue;
    for (let i = 0; i < amount; i++) {
      expanded.push({
        copyId: pid++,
        sourceId: p.id,
        length,
        width,
        name: p.name || ''
      });
    }
  }

  // Sort by max dimension descending — works well for guillotine packing
  expanded.sort((a, b) =>
    Math.max(b.length, b.width) - Math.max(a.length, a.width)
  );

  const plates = [];
  const unfit = [];

  for (const part of expanded) {
    if (!canFitOnFreshPlate(plateLength, plateWidth, part, grain, kerf)) {
      unfit.push({
        id: part.sourceId,
        length: part.length,
        width: part.width,
        name: part.name
      });
      continue;
    }

    let placed = false;
    for (const plate of plates) {
      if (placePartOnPlate(plate, part, grain, kerf)) {
        placed = true;
        break;
      }
    }
    if (!placed) {
      const newPlate = createPlate(plateLength, plateWidth);
      placePartOnPlate(newPlate, part, grain, kerf);
      plates.push(newPlate);
    }
  }

  return { plates, unfit };
};

const canFitOnFreshPlate = (plateL, plateW, part, grain, kerf) => {
  const fits = (l, w) => l + kerf <= plateL + kerf && w + kerf <= plateW + kerf;
  // Note: a part exactly the plate size still fits (kerf is "after" the part)
  if (fits(part.length, part.width)) return true;
  if (!grain && fits(part.width, part.length)) return true;
  return false;
};

const createPlate = (length, width) => ({
  length,
  width,
  freeRects: [{ x: 0, y: 0, w: length, h: width }],
  placements: []
});

// Try to place a part on the plate. Mutates the plate. Returns true on success.
const placePartOnPlate = (plate, part, grain, kerf) => {
  const orientations = grain
    ? [{ w: part.length, h: part.width, rotated: false }]
    : [
        { w: part.length, h: part.width, rotated: false },
        { w: part.width, h: part.length, rotated: true }
      ];

  // Best-fit: pick the orientation + free rect with the smallest leftover area
  let best = null;
  for (const ori of orientations) {
    const needW = ori.w + kerf;
    const needH = ori.h + kerf;
    for (let i = 0; i < plate.freeRects.length; i++) {
      const r = plate.freeRects[i];
      if (r.w >= ori.w && r.h >= ori.h) {
        // Use ori dims for the fit check; kerf is already-consumed neighbour space
        const score = (r.w * r.h) - (ori.w * ori.h);
        if (!best || score < best.score) {
          best = { rectIdx: i, ori, score, needW, needH };
        }
      }
    }
  }

  if (!best) return false;

  const rect = plate.freeRects[best.rectIdx];
  const ori = best.ori;

  plate.placements.push({
    x: rect.x,
    y: rect.y,
    w: ori.w,
    h: ori.h,
    name: part.name,
    rotated: ori.rotated,
    sourceId: part.sourceId
  });

  // Guillotine split: vertical-priority. Right strip = full height, bottom strip = only under part.
  const usedW = Math.min(rect.w, ori.w + kerf);
  const usedH = Math.min(rect.h, ori.h + kerf);

  const rightRect = {
    x: rect.x + usedW,
    y: rect.y,
    w: rect.w - usedW,
    h: rect.h
  };
  const bottomRect = {
    x: rect.x,
    y: rect.y + usedH,
    w: usedW,
    h: rect.h - usedH
  };

  plate.freeRects.splice(best.rectIdx, 1);
  if (rightRect.w > 0 && rightRect.h > 0) plate.freeRects.push(rightRect);
  if (bottomRect.w > 0 && bottomRect.h > 0) plate.freeRects.push(bottomRect);

  return true;
};

// Helper: total used m² across all plates (for utilisation %)
export const computeUtilisation = (plates) => {
  let used = 0;
  let total = 0;
  for (const plate of plates) {
    total += (plate.length * plate.width) / 1_000_000;
    for (const p of plate.placements) {
      used += (p.w * p.h) / 1_000_000;
    }
  }
  return total > 0 ? used / total : 0;
};
