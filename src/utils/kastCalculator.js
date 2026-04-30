// kastCalculator.js - Single source of truth for per-cabinet calculations
// Each cabinet produces a structured result with onderdelen (parts with m2 + materiaalType)

import { COMPLEXITEIT_UREN } from '../constants/cabinet';

import { packParts } from './binPack';

// Constants
const MM2_TO_M2 = 1000000;
const MM_TO_M = 1000;
const PROFIEL_BK_MULTIPLIER = 1.2;
const KERF_NESTED = 14; // chipboard nested cuts (M-prefix)
const KERF_CUT = 4;     // standard cuts

// Materials starting with "M" are chipboard nested → larger kerf
export const getKerfForMaterial = (mat) => {
  const naam = (mat?.naam || '').trim();
  return /^m/i.test(naam) ? KERF_NESTED : KERF_CUT;
};

// Helper: detect Vrije Kast type (including legacy 'Open Nis HPL')
const isVrijeKast = (type) => type === 'Vrije Kast' || type === 'Open Nis HPL';

// Helper: get onderdelen from Vrije Kast (backward compat with old hplOnderdelen field)
const getVrijeKastOnderdelen = (kast) => kast.vrijeKastOnderdelen || kast.hplOnderdelen || {};

// Helper: get material id from Vrije Kast (backward compat: old saved data uses hplMateriaal as index)
const getVrijeKastMateriaalId = (kast) => {
  if (kast.vrijeKastMateriaalId !== undefined && kast.vrijeKastMateriaalId !== null) {
    return kast.vrijeKastMateriaalId;
  }
  return kast.hplMateriaal;
};

// Hinge calculation based on door height
const calculateHingesPerDoor = (doorHeight) => {
  if (doorHeight >= 2600) return 7;
  if (doorHeight >= 2400) return 6;
  if (doorHeight >= 2200) return 5;
  if (doorHeight >= 1700) return 4;
  if (doorHeight >= 1000) return 3;
  return 2;
};

// Kastpootjes calculation based on width
const calculateKastpootjes = (breedte) => {
  if (breedte < 601) return 4;
  if (breedte < 1201) return 6;
  return Math.ceil(breedte / 600) * 2 + 2;
};

// Helper: push an onderdeel built from one or more raw rectangles.
// Each rect must carry: { breedte, hoogte, naam?, iv? }
//   iv (isVertical) = true  → grain runs along HOOGTE (vertical parts: sides, doors, backs)
//   iv (isVertical) = false → grain runs along BREEDTE (horizontal parts: shelves, top, bottom)
// m² is summed with afvalfactor applied so the legacy m²/plate-area path keeps working.
const pushOnderdeel = (result, naam, materiaalType, rects, afvalfactor, vrijeKastMateriaalRef) => {
  let totalArea = 0;
  for (const r of rects) totalArea += (r.breedte || 0) * (r.hoogte || 0);
  const onderdeel = {
    naam,
    m2: totalArea / MM2_TO_M2 * afvalfactor,
    materiaalType,
    rects: rects.map(r => ({
      breedte: r.breedte,
      hoogte: r.hoogte,
      naam: r.naam || naam,
      iv: r.iv !== undefined ? r.iv : false,
    })),
  };
  if (vrijeKastMateriaalRef !== undefined) onderdeel.vrijeKastMateriaalRef = vrijeKastMateriaalRef;
  result.onderdelen.push(onderdeel);
};

// Push filler onderdelen onto a cabinet result.
const addFillerOnderdelen = (result, kast, afvalfactorBuiten) => {
  const breedte = kast.breedte || 0;
  const hoogte = kast.hoogte || 0;

  const topH = kast.topFillerHoogte || 0;
  const sideW = kast.sideFillerBreedte || 0;
  if (topH > 0) {
    // Horizontal strip across the top
    pushOnderdeel(result, 'Paslat boven', 'buitenzijde',
      [{ breedte: breedte + sideW, hoogte: topH, iv: false }], afvalfactorBuiten);
  }
  if (sideW > 0) {
    // Vertical strip along the side
    pushOnderdeel(result, 'Paslat zij', 'buitenzijde',
      [{ breedte: sideW, hoogte: hoogte, iv: true }], afvalfactorBuiten);
  }

  const pb = kast.paslatBovenkant;
  if (pb && (pb.breedte || 0) > 0 && (pb.hoogte || 0) > 0) {
    pushOnderdeel(result, 'Paslat bovenkant', 'buitenzijde',
      [{ breedte: pb.breedte, hoogte: pb.hoogte, iv: false }], afvalfactorBuiten);
  }
  const pz = kast.paslatZijkant;
  if (pz && (pz.breedte || 0) > 0 && (pz.hoogte || 0) > 0) {
    pushOnderdeel(result, 'Paslat zijkant', 'buitenzijde',
      [{ breedte: pz.breedte, hoogte: pz.hoogte, iv: true }], afvalfactorBuiten);
  }
};

/**
 * Calculate montage hours for a single cabinet
 */
const FILLER_HOURS = 0.25;

const countFillers = (kast) => {
  let n = 0;
  if ((kast.topFillerHoogte || 0) > 0) n++;
  if ((kast.sideFillerBreedte || 0) > 0) n++;
  if (kast.paslatBovenkant && (kast.paslatBovenkant.breedte || 0) > 0 && (kast.paslatBovenkant.hoogte || 0) > 0) n++;
  if (kast.paslatZijkant && (kast.paslatZijkant.breedte || 0) > 0 && (kast.paslatZijkant.hoogte || 0) > 0) n++;
  return n;
};

export const berekenMontageUren = (kast, params) => {
  if (kast.isZijpaneel) return 0.17;

  const { type, complexiteit } = kast;
  const fillerExtra = countFillers(kast) * FILLER_HOURS;

  if (isVrijeKast(type)) {
    return (COMPLEXITEIT_UREN[complexiteit || 'gemiddeld'] || 3) + fillerExtra;
  }

  if (type === 'Tablet') {
    return 2 + (kast.spatwand ? 1 : 0) + fillerExtra;
  }

  if (!params) return 1.5 + fillerExtra;

  const typeMultiplier = params.typeMultipliers?.[type] || 1.0;
  return (params.baseMontageUren || 1.5) * typeMultiplier + fillerExtra;
};

/**
 * Calculate all parts and accessories for a single cabinet.
 *
 * Rect grain convention (iv flag):
 *   iv=true  → part is VERTICAL, grain runs along hoogte (doors, sides, backs, side fillers)
 *   iv=false → part is HORIZONTAL, grain runs along breedte (shelves, top, bottom, tablets)
 */
export const berekenKast = (kast, options = {}) => {
  const {
    afvalfactorBinnen = 1.33,
    afvalfactorBuiten = 1.43,
    productionParams = null
  } = options;

  const {
    hoogte = 0, breedte = 0, diepte = 0,
    aantalLeggers = 0, aantalDeuren = 0,
    aantalLades = 0, aantalTussensteunen = 0,
    type, isZijpaneel
  } = kast;

  const result = {
    onderdelen: [],
    afplakken: 0,
    afplakkenSpeciaal: 0,
    kastpootjes: 0,
    scharnieren110: 0,
    scharnieren170: 0,
    handgrepen: 0,
    ladenStandaard: 0,
    profielBK: 0,
    ophangsysteemBK: 0,
    montageUren: 0,
    schuifdeursystemen: [],
    profielen: []
  };

  if (hoogte <= 0 || breedte <= 0) return result;

  result.montageUren = berekenMontageUren(kast, productionParams);

  // ──────────────────────────────────────────────
  // ZIJPANEEL (side panel) — vertical, grain along hoogte
  // ──────────────────────────────────────────────
  if (isZijpaneel) {
    pushOnderdeel(result, 'Zijpaneel', 'buitenzijde',
      [{ breedte, hoogte, iv: true }], afvalfactorBuiten);
    result.afplakken = (2 * breedte + 2 * hoogte) / MM_TO_M;
    return result;
  }

  // ──────────────────────────────────────────────
  // VRIJE KAST (also handles legacy 'Open Nis HPL')
  // ──────────────────────────────────────────────
  if (isVrijeKast(type)) {
    const onderdelen = getVrijeKastOnderdelen(kast);
    const materiaalRef = getVrijeKastMateriaalId(kast);

    if (onderdelen.LZ) {
      // Left side — vertical (grain along hoogte)
      pushOnderdeel(result, 'Vrije Kast LZ', 'vrijeKast',
        [{ breedte: diepte, hoogte: hoogte, iv: true }], afvalfactorBuiten, materiaalRef);
      result.afplakken += hoogte / MM_TO_M;
    }
    if (onderdelen.RZ) {
      // Right side — vertical
      pushOnderdeel(result, 'Vrije Kast RZ', 'vrijeKast',
        [{ breedte: diepte, hoogte: hoogte, iv: true }], afvalfactorBuiten, materiaalRef);
      result.afplakken += hoogte / MM_TO_M;
    }
    if (onderdelen.BK) {
      // Bottom — horizontal (grain along breedte)
      pushOnderdeel(result, 'Vrije Kast BK', 'vrijeKast',
        [{ breedte: breedte, hoogte: diepte, iv: false }], afvalfactorBuiten, materiaalRef);
      result.afplakken += breedte / MM_TO_M;
    }
    if (onderdelen.OK) {
      // Top — horizontal
      pushOnderdeel(result, 'Vrije Kast OK', 'vrijeKast',
        [{ breedte: breedte, hoogte: diepte, iv: false }], afvalfactorBuiten, materiaalRef);
      result.afplakken += breedte / MM_TO_M;
    }
    if (onderdelen.RUG) {
      // Back — vertical
      pushOnderdeel(result, 'Vrije Kast Rug', 'vrijeKast',
        [{ breedte, hoogte, iv: true }], afvalfactorBuiten, materiaalRef);
    }
    if (onderdelen.VK) {
      // Front panel — vertical
      pushOnderdeel(result, 'Vrije Kast VK', 'vrijeKast',
        [{ breedte, hoogte, iv: true }], afvalfactorBuiten, materiaalRef);
      result.afplakken += (2 * breedte + 2 * hoogte) / MM_TO_M;
    }

    // Doors — vertical (grain along hoogte)
    if (aantalDeuren > 0) {
      const doorW = Math.floor(breedte / aantalDeuren);
      const doorRects = [];
      for (let i = 0; i < aantalDeuren; i++) {
        doorRects.push({ breedte: doorW, hoogte, naam: `Deur ${i + 1}`, iv: true });
      }
      pushOnderdeel(result, 'Vrije Kast Deuren', 'vrijeKast',
        doorRects, afvalfactorBuiten, materiaalRef);
      result.handgrepen += aantalDeuren;
      const scharnierenPerDeur = calculateHingesPerDoor(hoogte);
      result.scharnieren110 += aantalDeuren * scharnierenPerDeur;
      result.afplakken += (hoogte * 2 * aantalDeuren) / MM_TO_M;
    }

    // Shelves — horizontal (grain along breedte)
    if (aantalLeggers > 0) {
      const shelfRects = [];
      for (let i = 0; i < aantalLeggers; i++) {
        shelfRects.push({ breedte, hoogte: diepte, naam: `Legger ${i + 1}`, iv: false });
      }
      pushOnderdeel(result, 'Vrije Kast Leggers', 'leggers',
        shelfRects, afvalfactorBinnen);
      result.afplakken += (breedte * aantalLeggers) / MM_TO_M;
    }

    if (aantalTussensteunen > 0) {
      result.afplakken += (hoogte * aantalTussensteunen) / MM_TO_M;
    }

    return result;
  }

  // ──────────────────────────────────────────────
  // VAATWASSERDEUR — single vertical door panel
  // ──────────────────────────────────────────────
  if (type === 'Vaatwasserdeur') {
    pushOnderdeel(result, 'Vaatwasserdeur', 'buitenzijde',
      [{ breedte, hoogte, iv: true }], afvalfactorBuiten);
    result.afplakken = 2 * (breedte + hoogte) / MM_TO_M;
    result.handgrepen = 1;
    addFillerOnderdelen(result, kast, afvalfactorBuiten);
    return result;
  }

  // ──────────────────────────────────────────────
  // ONDERKAST SCHUIFDEUR
  // ──────────────────────────────────────────────
  if (type === 'Onderkast Schuifdeur') {
    // Vertical parts: sides and intermediate supports (grain along hoogte)
    const sideRects = [];
    for (let i = 0; i < 2 + aantalTussensteunen; i++) {
      sideRects.push({ breedte: diepte, hoogte, naam: i < 2 ? 'Zijwand' : 'Tussensteun', iv: true });
    }
    pushOnderdeel(result, 'Zijwanden', 'binnenkast', sideRects, afvalfactorBinnen);

    // Horizontal parts: top and bottom (grain along breedte)
    pushOnderdeel(result, 'Bodem/Dek', 'binnenkast', [
      { breedte, hoogte: diepte, naam: 'Boven', iv: false },
      { breedte, hoogte: diepte, naam: 'Onder', iv: false },
    ], afvalfactorBinnen);

    // Back — vertical
    pushOnderdeel(result, 'Rug', 'rug', [{ breedte, hoogte, iv: true }], afvalfactorBinnen);

    if (aantalLeggers > 0) {
      const shelfRects = [];
      for (let i = 0; i < aantalLeggers; i++) {
        shelfRects.push({ breedte, hoogte: diepte, naam: `Legger ${i + 1}`, iv: false });
      }
      pushOnderdeel(result, 'Leggers', 'leggers', shelfRects, afvalfactorBinnen);
    }

    // Sliding doors — vertical (grain along hoogte)
    const slideW = Math.floor(breedte / 2);
    pushOnderdeel(result, 'Schuifdeuren', 'buitenzijde', [
      { breedte: slideW, hoogte, naam: 'Schuifdeur 1', iv: true },
      { breedte: slideW, hoogte, naam: 'Schuifdeur 2', iv: true },
    ], afvalfactorBuiten);

    result.afplakken = (
      (breedte * (2 + aantalLeggers)) +
      (hoogte * (2 + aantalTussensteunen)) +
      (hoogte * 2 * 2) +
      (breedte * 2)
    ) / MM_TO_M;
    result.kastpootjes = calculateKastpootjes(breedte);
    result.handgrepen = 2;
    result.schuifdeursystemen.push({
      gewicht: 'licht',
      demping: kast.schuifdeurDemping || 'geen',
      aantal: 2
    });
    result.profielen.push({
      type: 'bovenprofiel',
      gewicht: 'licht',
      maat: kast.schuifdeurBovenprofiel || '2_5m',
      aantal: 1
    });
    addFillerOnderdelen(result, kast, afvalfactorBuiten);
    return result;
  }

  // ──────────────────────────────────────────────
  // KOLOMKAST SCHUIFDEUR
  // ──────────────────────────────────────────────
  if (type === 'Kolomkast Schuifdeur') {
    const sideRects = [];
    for (let i = 0; i < 2 + aantalTussensteunen; i++) {
      sideRects.push({ breedte: diepte, hoogte, naam: i < 2 ? 'Zijwand' : 'Tussensteun', iv: true });
    }
    pushOnderdeel(result, 'Zijwanden', 'binnenkast', sideRects, afvalfactorBinnen);

    pushOnderdeel(result, 'Bodem/Dek', 'binnenkast', [
      { breedte, hoogte: diepte, naam: 'Boven', iv: false },
      { breedte, hoogte: diepte, naam: 'Onder', iv: false },
    ], afvalfactorBinnen);

    pushOnderdeel(result, 'Rug', 'rug', [{ breedte, hoogte, iv: true }], afvalfactorBinnen);

    if (aantalLeggers > 0) {
      const shelfRects = [];
      for (let i = 0; i < aantalLeggers; i++) {
        shelfRects.push({ breedte, hoogte: diepte, naam: `Legger ${i + 1}`, iv: false });
      }
      pushOnderdeel(result, 'Leggers', 'leggers', shelfRects, afvalfactorBinnen);
    }

    const slideW = Math.floor(breedte / 2);
    pushOnderdeel(result, 'Schuifdeuren', 'buitenzijde', [
      { breedte: slideW, hoogte, naam: 'Schuifdeur 1', iv: true },
      { breedte: slideW, hoogte, naam: 'Schuifdeur 2', iv: true },
    ], afvalfactorBuiten);

    result.afplakken = (
      (breedte * (2 + aantalLeggers)) +
      (hoogte * (2 + aantalTussensteunen)) +
      (hoogte * 2 * 2) +
      (breedte * 2)
    ) / MM_TO_M;
    result.kastpootjes = calculateKastpootjes(breedte);
    result.handgrepen = 2;
    result.schuifdeursystemen.push({
      gewicht: 'zwaar',
      demping: kast.schuifdeurDemping || 'geen',
      aantal: 2
    });
    result.profielen.push({
      type: 'bovenprofiel',
      gewicht: 'zwaar',
      maat: kast.schuifdeurBovenprofiel || '2_5m',
      aantal: 1
    });
    result.profielen.push({
      type: 'onderprofiel',
      gewicht: 'zwaar',
      maat: kast.schuifdeurOnderprofiel || '2_5m',
      aantal: 1
    });
    addFillerOnderdelen(result, kast, afvalfactorBuiten);
    return result;
  }

  // ──────────────────────────────────────────────
  // TABLET — horizontal plate + optional vertical spatwand
  // ──────────────────────────────────────────────
  if (type === 'Tablet') {
    // Tablet plate is horizontal (grain along breedte)
    pushOnderdeel(result, 'Tablet', 'tablet',
      [{ breedte, hoogte: diepte, iv: false }], afvalfactorBuiten);
    result.afplakkenSpeciaal = 2 * (breedte + diepte) / MM_TO_M;
    if (kast.spatwand) {
      // Spatwand is vertical (grain along hoogte)
      pushOnderdeel(result, 'Spatwand', 'buitenzijde',
        [{ breedte, hoogte, iv: true }], afvalfactorBuiten);
    }
    addFillerOnderdelen(result, kast, afvalfactorBuiten);
    return result;
  }

  // ──────────────────────────────────────────────
  // NORMAL CABINET (Bovenkast, Onderkast, Kolomkast, Ladekast)
  // ──────────────────────────────────────────────

  const isOpenCabinet = kast.isOpen === true;

  if (isOpenCabinet) {
    // OPEN CABINET: structural parts in buitenzijde material
    // Vertical: sides + supports
    const sideRects = [];
    for (let i = 0; i < 2 + aantalTussensteunen; i++) {
      sideRects.push({ breedte: diepte, hoogte, naam: i < 2 ? 'Zijwand' : 'Tussensteun', iv: true });
    }
    pushOnderdeel(result, 'Zijwanden (open)', 'buitenzijde', sideRects, afvalfactorBuiten);

    // Horizontal: top and bottom
    pushOnderdeel(result, 'Bodem/Dek (open)', 'buitenzijde', [
      { breedte, hoogte: diepte, naam: 'Boven', iv: false },
      { breedte, hoogte: diepte, naam: 'Onder', iv: false },
    ], afvalfactorBuiten);

    // Back — vertical
    pushOnderdeel(result, 'Rug', 'rug', [{ breedte, hoogte, iv: true }], afvalfactorBinnen);

    if (aantalLeggers > 0) {
      const shelfRects = [];
      for (let i = 0; i < aantalLeggers; i++) {
        shelfRects.push({ breedte, hoogte: diepte, naam: `Legger ${i + 1}`, iv: false });
      }
      // Open cabinet: shelves in buitenzijde material
      pushOnderdeel(result, 'Leggers (open)', 'buitenzijde', shelfRects, afvalfactorBuiten);
    }

    result.afplakken = (
      (breedte * (2 + aantalLeggers)) +
      (hoogte * (2 + aantalTussensteunen)) +
      (breedte * 2)
    ) / MM_TO_M;

  } else {
    // CLOSED CABINET: standard material assignment
    // Vertical: sides + supports
    const sideRects = [];
    for (let i = 0; i < 2 + aantalTussensteunen; i++) {
      sideRects.push({ breedte: diepte, hoogte, naam: i < 2 ? 'Zijwand' : 'Tussensteun', iv: true });
    }
    pushOnderdeel(result, 'Zijwanden', 'binnenkast', sideRects, afvalfactorBinnen);

    // Horizontal: top and bottom
    pushOnderdeel(result, 'Bodem/Dek', 'binnenkast', [
      { breedte, hoogte: diepte, naam: 'Boven', iv: false },
      { breedte, hoogte: diepte, naam: 'Onder', iv: false },
    ], afvalfactorBinnen);

    // Back — vertical
    pushOnderdeel(result, 'Rug', 'rug', [{ breedte, hoogte, iv: true }], afvalfactorBinnen);

    if (aantalLeggers > 0) {
      const shelfRects = [];
      for (let i = 0; i < aantalLeggers; i++) {
        shelfRects.push({ breedte, hoogte: diepte, naam: `Legger ${i + 1}`, iv: false });
      }
      pushOnderdeel(result, 'Leggers', 'leggers', shelfRects, afvalfactorBinnen);
    }

    // Doors — vertical (grain along hoogte)
    if (aantalDeuren > 0) {
      const doorW = Math.floor(breedte / aantalDeuren);
      const doorRects = [];
      for (let i = 0; i < aantalDeuren; i++) {
        doorRects.push({ breedte: doorW, hoogte, naam: `Deur ${i + 1}`, iv: true });
      }
      pushOnderdeel(result, 'Deuren', 'buitenzijde', doorRects, afvalfactorBuiten);
      const scharnierenPerDeur = calculateHingesPerDoor(hoogte);
      result.scharnieren110 += aantalDeuren * scharnierenPerDeur;
    }

    result.afplakken = (
      (breedte * (2 + aantalLeggers)) +
      (hoogte * (2 + aantalTussensteunen)) +
      (hoogte * 2 * aantalDeuren) +
      (breedte * 2)
    ) / MM_TO_M;
  }

  if (type === 'Onderkast' || type === 'Ladekast' || type === 'Kolomkast') {
    result.kastpootjes = calculateKastpootjes(breedte);
  }

  if (type === 'Bovenkast') {
    result.profielBK = (breedte / MM_TO_M) * PROFIEL_BK_MULTIPLIER;
    result.ophangsysteemBK = 2;
  }

  result.handgrepen = (isOpenCabinet ? 0 : aantalDeuren) + aantalLades;

  if (aantalLades > 0) {
    result.ladenStandaard = aantalLades;
  }

  addFillerOnderdelen(result, kast, afvalfactorBuiten);

  return result;
};

/**
 * Calculate all cabinets and return per-cabinet results + aggregated totals.
 */
export const berekenAlleKasten = (kastenLijst, options = {}) => {
  if (!kastenLijst || !Array.isArray(kastenLijst) || kastenLijst.length === 0) {
    return {
      perKast: [],
      totalen: emptyTotalen()
    };
  }

  const perKast = kastenLijst.map(kast => berekenKast(kast, options));
  const totalen = aggregeerTotalen(perKast);

  return { perKast, totalen };
};

/**
 * Aggregate per-cabinet results into totals.
 * Groups onderdelen by materiaalType and sums accessories.
 *
 * Grain convention: rects are stored with length = grain direction, width = cross-grain.
 *   iv=true  → length = hoogte (grain), width = breedte
 *   iv=false → length = breedte (grain), width = hoogte
 */
const aggregeerTotalen = (perKast) => {
  const totalen = emptyTotalen();

  perKast.forEach(result => {
    result.onderdelen.forEach(onderdeel => {
      const type = onderdeel.materiaalType;
      if (!totalen.m2PerType[type]) {
        totalen.m2PerType[type] = 0;
      }
      totalen.m2PerType[type] += onderdeel.m2;

      // Collect raw rects (no afvalfactor) for nesting.
      // length = grain direction, width = cross-grain.
      if (onderdeel.rects && onderdeel.rects.length > 0) {
        if (!totalen.rectsPerType[type]) totalen.rectsPerType[type] = [];
        onderdeel.rects.forEach(r => {
          const length = r.iv ? r.hoogte : r.breedte; // grain direction
          const width  = r.iv ? r.breedte : r.hoogte; // cross-grain
          totalen.rectsPerType[type].push({
            length,
            width,
            name: r.naam || onderdeel.naam,
            amount: 1,
          });
        });
      }

      // For vrijeKast, also track per material reference
      if (type === 'vrijeKast' && onderdeel.vrijeKastMateriaalRef !== undefined) {
        const ref = onderdeel.vrijeKastMateriaalRef;
        const key = String(ref);
        if (!totalen.m2VrijeKastPerMateriaal[key]) {
          totalen.m2VrijeKastPerMateriaal[key] = 0;
        }
        totalen.m2VrijeKastPerMateriaal[key] += onderdeel.m2;

        if (onderdeel.rects && onderdeel.rects.length > 0) {
          if (!totalen.rectsVrijeKastPerMateriaal[key]) totalen.rectsVrijeKastPerMateriaal[key] = [];
          onderdeel.rects.forEach(r => {
            const length = r.iv ? r.hoogte : r.breedte;
            const width  = r.iv ? r.breedte : r.hoogte;
            totalen.rectsVrijeKastPerMateriaal[key].push({
              length,
              width,
              name: r.naam || onderdeel.naam,
              amount: 1,
            });
          });
        }
      }
    });

    totalen.afplakken += result.afplakken;
    totalen.afplakkenSpeciaal += result.afplakkenSpeciaal || 0;
    totalen.kastpootjes += result.kastpootjes;
    totalen.scharnieren110 += result.scharnieren110;
    totalen.scharnieren170 += result.scharnieren170;
    totalen.handgrepen += result.handgrepen;
    totalen.ladenStandaard += result.ladenStandaard;
    totalen.profielBK += result.profielBK;
    totalen.ophangsysteemBK += result.ophangsysteemBK;
    totalen.montageUren += result.montageUren;

    (result.schuifdeursystemen || []).forEach(s => {
      const existing = totalen.schuifdeursystemen.find(
        e => e.gewicht === s.gewicht && e.demping === s.demping
      );
      if (existing) {
        existing.aantal += s.aantal;
      } else {
        totalen.schuifdeursystemen.push({ ...s });
      }
    });

    (result.profielen || []).forEach(p => {
      const existing = totalen.profielen.find(
        e => e.type === p.type && e.gewicht === p.gewicht && e.maat === p.maat
      );
      if (existing) {
        existing.aantal += p.aantal;
      } else {
        totalen.profielen.push({ ...p });
      }
    });
  });

  return totalen;
};

const emptyTotalen = () => ({
  m2PerType: {},
  m2VrijeKastPerMateriaal: {},
  rectsPerType: {},
  rectsVrijeKastPerMateriaal: {},
  afplakken: 0,
  afplakkenSpeciaal: 0,
  kastpootjes: 0,
  scharnieren110: 0,
  scharnieren170: 0,
  handgrepen: 0,
  ladenStandaard: 0,
  ladenGoedkoper: 0,
  profielBK: 0,
  ophangsysteemBK: 0,
  montageUren: 0,
  schuifdeursystemen: [],
  profielen: []
});

/**
 * Convert aggregated totals to the flat format expected by TotalenOverzicht / berekenArbeid.
 */
const platesByNesting = (rects, mat, buffer = 0) => {
  if (!rects || rects.length === 0 || !mat?.breedte || !mat?.hoogte) return 0;
  const result = packParts({
    plateLength: mat.breedte,
    plateWidth: mat.hoogte,
    parts: rects,
    grain: mat.grain || false,
    kerf: getKerfForMaterial(mat),
  });
  return Math.ceil(result.plates.length * (1 + buffer));
};

export const convertToFlatTotalen = (aggTotalen, materials, selections, alternatieveMateriaal, options = {}) => {
  const { useNesting = false, nestingBuffer = 0.05 } = options;
  const {
    materiaalBinnenkast = [],
    materiaalBuitenzijde = [],
    materiaalTablet = [],
    plaatMaterialen = []
  } = materials;

  const {
    geselecteerdMateriaalBinnen = 0,
    geselecteerdMateriaalBuiten = 0,
    geselecteerdMateriaalTablet = 0
  } = selections;

  const m2Binnenkast = aggTotalen.m2PerType.binnenkast || 0;
  const m2Rug = aggTotalen.m2PerType.rug || 0;
  const m2Leggers = aggTotalen.m2PerType.leggers || 0;
  const m2Buitenzijde = aggTotalen.m2PerType.buitenzijde || 0;
  const m2Tablet = aggTotalen.m2PerType.tablet || 0;

  const flat = {
    m2Binnenkast,
    m2Rug,
    m2Leggers,
    m2Buitenzijde,
    m2Tablet,
    kantenbandStandaard: aggTotalen.afplakken,
    kantenbandSpeciaal: aggTotalen.afplakkenSpeciaal || 0,
    kastpootjes: aggTotalen.kastpootjes,
    scharnieren110: aggTotalen.scharnieren110,
    scharnieren170: aggTotalen.scharnieren170,
    profielBK: aggTotalen.profielBK,
    ophangsysteemBK: aggTotalen.ophangsysteemBK,
    ladenStandaard: aggTotalen.ladenStandaard,
    ladenGoedkoper: aggTotalen.ladenGoedkoper || 0,
    handgrepen: aggTotalen.handgrepen,
    montageUren: aggTotalen.montageUren,
    schuifdeursystemen: aggTotalen.schuifdeursystemen || [],
    profielen: aggTotalen.profielen || []
  };

  const getMat = (arr, idx) => arr?.[idx] || arr?.[0] || { breedte: 1000, hoogte: 1000, prijs: 0 };
  const m2PerPlaat = (mat) => (mat.breedte / MM_TO_M) * (mat.hoogte / MM_TO_M);

  const findVrijeKastMat = (ref) => {
    if (ref === null || ref === undefined) return plaatMaterialen[0] || materiaalTablet[0] || { breedte: 1000, hoogte: 1000, prijs: 0 };
    const byId = plaatMaterialen.find(m => m.id === ref);
    if (byId) return byId;
    const idx = parseInt(ref);
    if (!isNaN(idx) && materiaalTablet[idx]) return materiaalTablet[idx];
    return plaatMaterialen[0] || { breedte: 1000, hoogte: 1000, prijs: 0 };
  };

  const binnenMat = getMat(materiaalBinnenkast, geselecteerdMateriaalBinnen);
  const rectsByType = aggTotalen.rectsPerType || {};

  if (useNesting) {
    const binnenRects = [...(rectsByType.binnenkast || [])];
    if (!alternatieveMateriaal?.ruggenGebruiken) binnenRects.push(...(rectsByType.rug || []));
    if (!alternatieveMateriaal?.leggersGebruiken) binnenRects.push(...(rectsByType.leggers || []));
    flat.platenBinnenkast = platesByNesting(binnenRects, binnenMat, nestingBuffer);

    if (alternatieveMateriaal?.ruggenGebruiken) {
      const rugMat = getMat(materiaalBinnenkast, alternatieveMateriaal.ruggenMateriaal);
      flat.platenRug = platesByNesting(rectsByType.rug || [], rugMat, nestingBuffer);
    } else {
      flat.platenRug = 0;
    }
    if (alternatieveMateriaal?.leggersGebruiken) {
      const leggerMat = getMat(materiaalBinnenkast, alternatieveMateriaal.leggersMateriaal);
      flat.platenLeggers = platesByNesting(rectsByType.leggers || [], leggerMat, nestingBuffer);
    } else {
      flat.platenLeggers = 0;
    }

    const buitenMat = getMat(materiaalBuitenzijde, geselecteerdMateriaalBuiten);
    flat.platenBuitenzijde = platesByNesting(rectsByType.buitenzijde || [], buitenMat, nestingBuffer);

    const tabletMat = getMat(materiaalTablet, geselecteerdMateriaalTablet);
    flat.platenTablet = platesByNesting(rectsByType.tablet || [], tabletMat, nestingBuffer);

    flat.platenVrijeKast = {};
    Object.entries(aggTotalen.rectsVrijeKastPerMateriaal || {}).forEach(([matRef, rects]) => {
      const mat = findVrijeKastMat(parseInt(matRef) || matRef);
      if (mat) {
        flat.platenVrijeKast[matRef] = {
          platen: platesByNesting(rects, mat, nestingBuffer),
          m2: aggTotalen.m2VrijeKastPerMateriaal[matRef] || 0,
          mat
        };
      }
    });
  } else {
    let totaalM2Binnenkast = m2Binnenkast;
    if (!alternatieveMateriaal?.ruggenGebruiken) totaalM2Binnenkast += m2Rug;
    if (!alternatieveMateriaal?.leggersGebruiken) totaalM2Binnenkast += m2Leggers;
    const m2PPBinnen = m2PerPlaat(binnenMat);
    flat.platenBinnenkast = m2PPBinnen > 0 ? Math.ceil(totaalM2Binnenkast / m2PPBinnen) : 0;

    if (alternatieveMateriaal?.ruggenGebruiken) {
      const rugMat = getMat(materiaalBinnenkast, alternatieveMateriaal.ruggenMateriaal);
      const m2PP = m2PerPlaat(rugMat);
      flat.platenRug = m2PP > 0 ? Math.ceil(m2Rug / m2PP) : 0;
    } else {
      flat.platenRug = 0;
    }
    if (alternatieveMateriaal?.leggersGebruiken) {
      const leggerMat = getMat(materiaalBinnenkast, alternatieveMateriaal.leggersMateriaal);
      const m2PP = m2PerPlaat(leggerMat);
      flat.platenLeggers = m2PP > 0 ? Math.ceil(m2Leggers / m2PP) : 0;
    } else {
      flat.platenLeggers = 0;
    }

    const buitenMat = getMat(materiaalBuitenzijde, geselecteerdMateriaalBuiten);
    const m2PPBuiten = m2PerPlaat(buitenMat);
    flat.platenBuitenzijde = m2PPBuiten > 0 ? Math.ceil(m2Buitenzijde / m2PPBuiten) : 0;

    const tabletMat = getMat(materiaalTablet, geselecteerdMateriaalTablet);
    const m2PPTablet = m2PerPlaat(tabletMat);
    flat.platenTablet = m2PPTablet > 0 ? Math.ceil(m2Tablet / m2PPTablet) : 0;

    flat.platenVrijeKast = {};
    Object.entries(aggTotalen.m2VrijeKastPerMateriaal || {}).forEach(([matRef, m2]) => {
      const mat = findVrijeKastMat(parseInt(matRef) || matRef);
      if (mat) {
        const m2PP = m2PerPlaat(mat);
        if (m2PP > 0) {
          flat.platenVrijeKast[matRef] = {
            platen: Math.ceil(m2 / m2PP),
            m2,
            mat
          };
        }
      }
    });
  }

  return flat;
};
