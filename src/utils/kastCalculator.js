// kastCalculator.js - Single source of truth for per-cabinet calculations
// Each cabinet produces a structured result with onderdelen (parts with m2 + materiaalType)

import { COMPLEXITEIT_UREN } from '../constants/cabinet';

// Constants
const MM2_TO_M2 = 1000000;
const MM_TO_M = 1000;
const PROFIEL_BK_MULTIPLIER = 1.2;

// Helper: detect Vrije Kast type (including legacy 'Open Nis HPL')
const isVrijeKast = (type) => type === 'Vrije Kast' || type === 'Open Nis HPL';

// Helper: get onderdelen from Vrije Kast (backward compat with old hplOnderdelen field)
const getVrijeKastOnderdelen = (kast) => kast.vrijeKastOnderdelen || kast.hplOnderdelen || {};

// Helper: get material id from Vrije Kast (backward compat: old saved data uses hplMateriaal as index)
const getVrijeKastMateriaalId = (kast) => {
  if (kast.vrijeKastMateriaalId !== undefined && kast.vrijeKastMateriaalId !== null) {
    return kast.vrijeKastMateriaalId;
  }
  // Legacy: hplMateriaal was an array index into materiaalTablet
  // We store it as-is; the lookup logic in convertToFlatTotalen handles both id and index
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

/**
 * Calculate montage hours for a single cabinet
 * @param {Object} kast - Cabinet configuration
 * @param {Object} params - Production parameters (from AdminSettings)
 * @returns {number} Hours of montage work
 */
export const berekenMontageUren = (kast, params) => {
  if (kast.isZijpaneel) return 0.17; // ~10 min for side panel

  const { type, complexiteit } = kast;

  // Vrije Kast (and legacy Open Nis HPL) uses complexity-based hours
  if (isVrijeKast(type)) {
    return COMPLEXITEIT_UREN[complexiteit || 'gemiddeld'] || 3;
  }

  if (!params) return 1.5; // fallback

  // Standard cabinet: base montage × type multiplier
  const typeMultiplier = params.typeMultipliers?.[type] || 1.0;
  return (params.baseMontageUren || 1.5) * typeMultiplier;
};

/**
 * Calculate all parts and accessories for a single cabinet.
 * Returns a structured result where every surface area is coupled to its materiaalType.
 *
 * materiaalType values:
 *   'binnenkast' - interior cabinet material (sides, top, bottom, supports)
 *   'rug'        - back panel (same material category as binnenkast, but can use alternative)
 *   'leggers'    - shelves (same material category as binnenkast, but can use alternative)
 *   'buitenzijde'- exterior/door material
 *   'vrijeKast'  - Vrije Kast material (coupled to specific material id from plaatMaterialen)
 *
 * @param {Object} kast - Cabinet configuration
 * @param {Object} options - { afvalfactorBinnen, afvalfactorBuiten, productionParams }
 * @returns {Object} Structured result
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

  // Result structure
  const result = {
    onderdelen: [],      // Array of { naam, m2, materiaalType, vrijeKastMateriaalRef? }
    afplakken: 0,        // linear meters of edge banding
    kastpootjes: 0,
    scharnieren110: 0,
    scharnieren170: 0,
    handgrepen: 0,
    ladenStandaard: 0,
    profielBK: 0,
    ophangsysteemBK: 0,
    montageUren: 0
  };

  // Skip invalid dimensions
  if (hoogte <= 0 || breedte <= 0) return result;

  // Calculate montage hours
  result.montageUren = berekenMontageUren(kast, productionParams);

  // ──────────────────────────────────────────────
  // ZIJPANEEL (side panel)
  // ──────────────────────────────────────────────
  if (isZijpaneel) {
    result.onderdelen.push({
      naam: 'Zijpaneel',
      m2: (breedte * hoogte) / MM2_TO_M2 * afvalfactorBuiten,
      materiaalType: 'buitenzijde'
    });
    result.afplakken = (2 * breedte + 2 * hoogte) / MM_TO_M;
    return result;
  }

  // ──────────────────────────────────────────────
  // VRIJE KAST (also handles legacy 'Open Nis HPL')
  // ──────────────────────────────────────────────
  if (isVrijeKast(type)) {
    const onderdelen = getVrijeKastOnderdelen(kast);
    const materiaalRef = getVrijeKastMateriaalId(kast);

    // Surface parts (each coupled to 'vrijeKast' with specific material reference)
    if (onderdelen.LZ) {
      result.onderdelen.push({
        naam: 'Vrije Kast LZ',
        m2: (hoogte * diepte) / MM2_TO_M2 * afvalfactorBuiten,
        materiaalType: 'vrijeKast',
        vrijeKastMateriaalRef: materiaalRef
      });
      result.afplakken += hoogte / MM_TO_M;
    }
    if (onderdelen.RZ) {
      result.onderdelen.push({
        naam: 'Vrije Kast RZ',
        m2: (hoogte * diepte) / MM2_TO_M2 * afvalfactorBuiten,
        materiaalType: 'vrijeKast',
        vrijeKastMateriaalRef: materiaalRef
      });
      result.afplakken += hoogte / MM_TO_M;
    }
    if (onderdelen.BK) {
      result.onderdelen.push({
        naam: 'Vrije Kast BK',
        m2: (breedte * diepte) / MM2_TO_M2 * afvalfactorBuiten,
        materiaalType: 'vrijeKast',
        vrijeKastMateriaalRef: materiaalRef
      });
      result.afplakken += breedte / MM_TO_M;
    }
    if (onderdelen.OK) {
      result.onderdelen.push({
        naam: 'Vrije Kast OK',
        m2: (breedte * diepte) / MM2_TO_M2 * afvalfactorBuiten,
        materiaalType: 'vrijeKast',
        vrijeKastMateriaalRef: materiaalRef
      });
      result.afplakken += breedte / MM_TO_M;
    }
    if (onderdelen.RUG) {
      result.onderdelen.push({
        naam: 'Vrije Kast Rug',
        m2: (breedte * hoogte) / MM2_TO_M2 * afvalfactorBuiten,
        materiaalType: 'vrijeKast',
        vrijeKastMateriaalRef: materiaalRef
      });
      // No edge banding for back panel
    }

    // Doors on Vrije Kast
    if (aantalDeuren > 0) {
      result.onderdelen.push({
        naam: 'Vrije Kast Deuren',
        m2: (breedte * hoogte) / MM2_TO_M2 * afvalfactorBuiten,
        materiaalType: 'vrijeKast',
        vrijeKastMateriaalRef: materiaalRef
      });
      result.handgrepen += aantalDeuren;
      const scharnierenPerDeur = calculateHingesPerDoor(hoogte);
      result.scharnieren110 += aantalDeuren * scharnierenPerDeur;
      result.afplakken += (hoogte * 2 * aantalDeuren) / MM_TO_M;
    }

    // Shelves in Vrije Kast use binnenkast material
    if (aantalLeggers > 0) {
      result.onderdelen.push({
        naam: 'Vrije Kast Leggers',
        m2: (breedte * diepte * aantalLeggers) / MM2_TO_M2 * afvalfactorBinnen,
        materiaalType: 'leggers'
      });
      result.afplakken += (breedte * aantalLeggers) / MM_TO_M;
    }

    // Supports
    if (aantalTussensteunen > 0) {
      result.afplakken += (hoogte * aantalTussensteunen) / MM_TO_M;
    }

    return result;
  }

  // ──────────────────────────────────────────────
  // NORMAL CABINET (Bovenkast, Onderkast, Kolomkast, Ladekast)
  // Supports isOpen toggle: open cabinets use buitenzijde material for
  // structural parts (sides, top, bottom), rug stays as rug, no doors/hinges
  // ──────────────────────────────────────────────

  const isOpenCabinet = kast.isOpen === true;

  if (isOpenCabinet) {
    // OPEN CABINET: structural parts in buitenzijde material
    result.onderdelen.push({
      naam: 'Structuur (open)',
      m2: ((diepte * hoogte * (2 + aantalTussensteunen)) + (breedte * diepte * 2)) / MM2_TO_M2 * afvalfactorBuiten,
      materiaalType: 'buitenzijde'
    });

    // Back panel stays in rug material (user confirmed)
    result.onderdelen.push({
      naam: 'Rug',
      m2: (breedte * hoogte) / MM2_TO_M2 * afvalfactorBinnen,
      materiaalType: 'rug'
    });

    // Shelves in open cabinet also use buitenzijde
    if (aantalLeggers > 0) {
      result.onderdelen.push({
        naam: 'Leggers (open)',
        m2: (breedte * diepte * aantalLeggers) / MM2_TO_M2 * afvalfactorBuiten,
        materiaalType: 'buitenzijde'
      });
    }

    // No doors, no hinges for open cabinets
    // Edge banding (no door edges)
    result.afplakken = (
      (breedte * (2 + aantalLeggers)) +
      (hoogte * (2 + aantalTussensteunen)) +
      (breedte * 2)
    ) / MM_TO_M;

  } else {
    // CLOSED CABINET: standard material assignment
    result.onderdelen.push({
      naam: 'Binnenkast',
      m2: ((diepte * hoogte * (2 + aantalTussensteunen)) + (breedte * diepte * 2)) / MM2_TO_M2 * afvalfactorBinnen,
      materiaalType: 'binnenkast'
    });

    result.onderdelen.push({
      naam: 'Rug',
      m2: (breedte * hoogte) / MM2_TO_M2 * afvalfactorBinnen,
      materiaalType: 'rug'
    });

    if (aantalLeggers > 0) {
      result.onderdelen.push({
        naam: 'Leggers',
        m2: (breedte * diepte * aantalLeggers) / MM2_TO_M2 * afvalfactorBinnen,
        materiaalType: 'leggers'
      });
    }

    // Doors (exterior)
    if (aantalDeuren > 0) {
      result.onderdelen.push({
        naam: 'Deuren',
        m2: (breedte * hoogte) / MM2_TO_M2 * afvalfactorBuiten,
        materiaalType: 'buitenzijde'
      });

      const scharnierenPerDeur = calculateHingesPerDoor(hoogte);
      result.scharnieren110 += aantalDeuren * scharnierenPerDeur;
    }

    // Edge banding (kantenband)
    result.afplakken = (
      (breedte * (2 + aantalLeggers)) +
      (hoogte * (2 + aantalTussensteunen)) +
      (hoogte * 2 * aantalDeuren) +
      (breedte * 2)
    ) / MM_TO_M;
  }

  // Kastpootjes (only for Onderkast & Ladekast)
  if (type === 'Onderkast' || type === 'Ladekast') {
    result.kastpootjes = calculateKastpootjes(breedte);
  }

  // Bovenkast specifics
  if (type === 'Bovenkast') {
    result.profielBK = (breedte / MM_TO_M) * PROFIEL_BK_MULTIPLIER;
    result.ophangsysteemBK = 2;
  }

  // Handles (only for doors on closed cabinets, always for drawers)
  result.handgrepen = (isOpenCabinet ? 0 : aantalDeuren) + aantalLades;

  // Drawers
  if (aantalLades > 0) {
    result.ladenStandaard = aantalLades;
  }

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

      // For vrijeKast, also track per material reference
      if (type === 'vrijeKast' && onderdeel.vrijeKastMateriaalRef !== undefined) {
        const ref = onderdeel.vrijeKastMateriaalRef;
        const key = String(ref); // could be id or legacy index
        if (!totalen.m2VrijeKastPerMateriaal[key]) {
          totalen.m2VrijeKastPerMateriaal[key] = 0;
        }
        totalen.m2VrijeKastPerMateriaal[key] += onderdeel.m2;
      }
    });

    // Sum accessories
    totalen.afplakken += result.afplakken;
    totalen.kastpootjes += result.kastpootjes;
    totalen.scharnieren110 += result.scharnieren110;
    totalen.scharnieren170 += result.scharnieren170;
    totalen.handgrepen += result.handgrepen;
    totalen.ladenStandaard += result.ladenStandaard;
    totalen.profielBK += result.profielBK;
    totalen.ophangsysteemBK += result.ophangsysteemBK;
    totalen.montageUren += result.montageUren;
  });

  return totalen;
};

/**
 * Create an empty totals object
 */
const emptyTotalen = () => ({
  m2PerType: {},                // { binnenkast: x, rug: x, leggers: x, buitenzijde: x, vrijeKast: x }
  m2VrijeKastPerMateriaal: {},  // { [materiaalRef]: m2 } - grouped by material id (or legacy index)
  afplakken: 0,
  kastpootjes: 0,
  scharnieren110: 0,
  scharnieren170: 0,
  handgrepen: 0,
  ladenStandaard: 0,
  ladenGoedkoper: 0,
  profielBK: 0,
  ophangsysteemBK: 0,
  montageUren: 0
});

/**
 * Convert aggregated totals to the flat format expected by TotalenOverzicht / berekenArbeid.
 * Also calculates plate counts based on material selections.
 *
 * @param {Object} aggTotalen - Result from aggregeerTotalen
 * @param {Object} materials - { materiaalBinnenkast, materiaalBuitenzijde, materiaalTablet, plaatMaterialen }
 * @param {Object} selections - { geselecteerdMateriaalBinnen, geselecteerdMateriaalBuiten, geselecteerdMateriaalTablet }
 * @param {Object} alternatieveMateriaal - { ruggenGebruiken, ruggenMateriaal, leggersGebruiken, leggersMateriaal }
 * @returns {Object} Flat totals compatible with existing TotalenOverzicht
 */
export const convertToFlatTotalen = (aggTotalen, materials, selections, alternatieveMateriaal) => {
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
  const m2Tablet = 0; // Regular tablets not yet implemented

  const flat = {
    m2Binnenkast,
    m2Rug,
    m2Leggers,
    m2Buitenzijde,
    m2Tablet,
    kantenbandStandaard: aggTotalen.afplakken,
    kantenbandSpeciaal: 0,
    kastpootjes: aggTotalen.kastpootjes,
    scharnieren110: aggTotalen.scharnieren110,
    scharnieren170: aggTotalen.scharnieren170,
    profielBK: aggTotalen.profielBK,
    ophangsysteemBK: aggTotalen.ophangsysteemBK,
    ladenStandaard: aggTotalen.ladenStandaard,
    ladenGoedkoper: aggTotalen.ladenGoedkoper || 0,
    handgrepen: aggTotalen.handgrepen,
    montageUren: aggTotalen.montageUren
  };

  // ── Plate counts ──

  // Helper: safe material access
  const getMat = (arr, idx) => arr?.[idx] || arr?.[0] || { breedte: 1000, hoogte: 1000, prijs: 0 };
  const m2PerPlaat = (mat) => (mat.breedte / MM_TO_M) * (mat.hoogte / MM_TO_M);

  // Helper: find material by id in plaatMaterialen, fallback to index in materiaalTablet
  const findVrijeKastMat = (ref) => {
    if (ref === null || ref === undefined) return plaatMaterialen[0] || materiaalTablet[0] || { breedte: 1000, hoogte: 1000, prijs: 0 };
    // Try to find by id first (new format)
    const byId = plaatMaterialen.find(m => m.id === ref);
    if (byId) return byId;
    // Fallback: treat ref as index into materiaalTablet (legacy format)
    const idx = parseInt(ref);
    if (!isNaN(idx) && materiaalTablet[idx]) return materiaalTablet[idx];
    return plaatMaterialen[0] || { breedte: 1000, hoogte: 1000, prijs: 0 };
  };

  // Binnenkast plates (may include rug & leggers if not alternative)
  const binnenMat = getMat(materiaalBinnenkast, geselecteerdMateriaalBinnen);
  let totaalM2Binnenkast = m2Binnenkast;

  if (!alternatieveMateriaal?.ruggenGebruiken) {
    totaalM2Binnenkast += m2Rug;
  }
  if (!alternatieveMateriaal?.leggersGebruiken) {
    totaalM2Binnenkast += m2Leggers;
  }

  const m2PPBinnen = m2PerPlaat(binnenMat);
  flat.platenBinnenkast = m2PPBinnen > 0 ? Math.ceil(totaalM2Binnenkast / m2PPBinnen) : 0;

  // Alternative rug plates
  if (alternatieveMateriaal?.ruggenGebruiken) {
    const rugMat = getMat(materiaalBinnenkast, alternatieveMateriaal.ruggenMateriaal);
    const m2PP = m2PerPlaat(rugMat);
    flat.platenRug = m2PP > 0 ? Math.ceil(m2Rug / m2PP) : 0;
  } else {
    flat.platenRug = 0;
  }

  // Alternative legger plates
  if (alternatieveMateriaal?.leggersGebruiken) {
    const leggerMat = getMat(materiaalBinnenkast, alternatieveMateriaal.leggersMateriaal);
    const m2PP = m2PerPlaat(leggerMat);
    flat.platenLeggers = m2PP > 0 ? Math.ceil(m2Leggers / m2PP) : 0;
  } else {
    flat.platenLeggers = 0;
  }

  // Buitenzijde plates
  const buitenMat = getMat(materiaalBuitenzijde, geselecteerdMateriaalBuiten);
  const m2PPBuiten = m2PerPlaat(buitenMat);
  flat.platenBuitenzijde = m2PPBuiten > 0 ? Math.ceil(m2Buitenzijde / m2PPBuiten) : 0;

  // Vrije Kast plates (grouped by material reference)
  let totaalPlatenVrijeKast = 0;
  Object.entries(aggTotalen.m2VrijeKastPerMateriaal || {}).forEach(([matRef, m2]) => {
    const mat = findVrijeKastMat(parseInt(matRef) || matRef);
    if (mat) {
      const m2PP = m2PerPlaat(mat);
      if (m2PP > 0) {
        totaalPlatenVrijeKast += Math.ceil(m2 / m2PP);
      }
    }
  });
  flat.platenTablet = totaalPlatenVrijeKast;

  return flat;
};
