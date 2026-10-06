// Export a group of offertes to Cafca's offerte import format (3 ADO rowset XML files).
// Each configurator offerte becomes one Cafca post ("element") whose middelen follow the
// standard element template; project-specific lines go into free rows (call_id 'x').
//
// Input per offerte: the `cafcaLijst` saved with the project (see TotalenOverzicht.bouwCafcaLijst):
//   { lijnen: [{ key, groep, omschrijving, matNaam, eenheid, aantal, prijs }],
//     arbeid: [{ key, uren, prijs }] }

import {
  OFF_HEAD, POS_HEAD, MID_HEAD, OFF_ROW, POS_TITEL_ROW, POS_POST_ROW,
  MID_STANDAARD_ROWS, MID_VRIJE_ROW,
} from '../data/cafca/sjabloon';

// ── Mapping configurator → Cafca standard rows (by call_id) ─────────────────────
const ARBEID_RIJ = {
  tekenwerk: 'A-001',
  montageWerkhuis: 'A-002',
  plaatsing: 'A-004-2025', // priced as subcontract (KP OA)
  transport: 'A-003',
};

// Plate material name (configurator) → Cafca plate row
const PLAAT_RIJ = {
  'M18 Wit': 'B-001A',
  'M25 Wit': 'B-001C',
  'M18 Unikleur': 'B-002A',
  'M25 Uni': 'B-002C',
  'L18 Wit': 'T-001A',
  'L18 Unikleur': 'T-002A**',
  'L18 Duur': 'T-002A***',
  'L36 Duur': 'T-003B*',
};

const KANTENBAND_RIJ = {
  kantenbandStd: 'O-04C.0040.02310',
  kantenbandSpec: 'AFPLAK_EIK_43MM',
};

const BESLAG_RIJ = {
  kastpootjes: 'HAFELE-POOT',
  scharnier110: '0205 71B3590IND',
  scharnier170: '0205 71B7590',
  ophangsysteem: '0709 800 LI WIT',
  ladenStd: 'MOVENTO HOUT',
  handgrepen: 'STGREEP',
  slot: 'Symco',
  led: 'LED-BUDGET',
  handdoekdrager: '0710 350 2ZXT',
  alubodem600: '0712 ALU 060',
  vuilbaksysteem: 'VUILBAK-BUDGET',
  bestekbak: '0122 BL2I508/90',
  kitwerk: '010',
};

// Client-facing material names for the post text
const KLANT_NAAM = {
  'M18 Wit': 'melamine wit',
  'M25 Wit': 'melamine wit',
  'M18 Unikleur': 'melamine unikleur',
  'L18 Duur': 'L18 Houtprint standaard gamma',
  'L18 Unikleur': 'L18 unikleur',
  'L18 Wit': 'L18 wit',
  'L18 MTX WR Hout': 'MTX WR Hout',
  'L27 MTX WR Hout': 'MTX WR Hout',
  'L36 MTX WR Hout': 'MTX WR Hout',
  'L18 MTX Houtprint': 'MTX Houtprint',
};
const klantNaam = (mat) => KLANT_NAAM[mat] || mat;

// ── Helpers ─────────────────────────────────────────────────────────────────────
const CRLF = '\r\n';

// Escape a NEW value for an ADO rowset attribute (template values are already escaped)
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&#x26;').replace(/</g, '&#x3c;').replace(/>/g, '&#x3e;')
  .replace(/'/g, '&#x27;').replace(/"/g, '&#x22;')
  .replace(/\r?\n/g, CRLF); // Cafca keeps raw CRLF inside descr

const num = (v) => {
  const n = Number(v) || 0;
  return String(Math.round(n * 1e6) / 1e6);
};

const rowXml = (pairs, overrides = {}) => {
  const attrs = pairs.map(([k, v]) => {
    if (Object.prototype.hasOwnProperty.call(overrides, k)) return `${k}='${esc(overrides[k])}'`;
    return `${k}='${v}'`;
  });
  return `\t<z:row ${attrs.join(' ')}/>`;
};

const wrap = (head, rows) => `${head}<rs:data>${CRLF}${rows.join(CRLF)}${CRLF}</rs:data>${CRLF}</xml>${CRLF}`;

const get = (pairs, k) => pairs.find(([a]) => a === k)?.[1];
const STD_BY_CALL = Object.fromEntries(MID_STANDAARD_ROWS.map(r => [get(r, 'call_id'), r]));

const nu = () => new Date().toISOString().slice(0, 19);
const vandaag = () => `${new Date().toISOString().slice(0, 10)}T00:00:00`;

// ── Post text (shown to the client) ─────────────────────────────────────────────
export const maakPostTekst = (titel, cafcaLijst) => {
  const lijnen = cafcaLijst?.lijnen || [];
  const plaat = (key) => lijnen.find(l => l.key === key && l.aantal > 0);
  const som = (keys) => lijnen.filter(l => keys.includes(l.key)).reduce((s, l) => s + (l.aantal || 0), 0);
  const regels = [titel];

  const binnen = plaat('binnenkast');
  const buiten = plaat('buitenzijde');
  if (binnen && buiten && binnen.matNaam === buiten.matNaam) {
    regels.push(`- kasten binnen en buiten in ${klantNaam(binnen.matNaam)}`);
  } else {
    if (binnen) regels.push(`- binnenkasten in ${klantNaam(binnen.matNaam)}`);
    if (buiten) regels.push(`- fronten in ${klantNaam(buiten.matNaam)}`);
  }
  const vrij = [...new Set(lijnen.filter(l => l.key?.startsWith('vrijeKast') && l.aantal > 0).map(l => klantNaam(l.matNaam)))];
  if (vrij.length) regels.push(`- vrije kasten in ${vrij.join(' en ')}`);
  const tablet = plaat('tablet');
  if (tablet) regels.push(`- tablet in ${klantNaam(tablet.matNaam)}`);

  const lades = som(['ladenStd', 'ladenGoedkoper']);
  if (lades) regels.push(`- ${lades}x lade`);
  const sloten = som(['slot', 'cylinderslot']);
  if (sloten) regels.push(`- ${sloten}x slot`);
  const vuilbak = som(['vuilbaksysteem']) > 0;
  const bestek = som(['bestekbak']) > 0;
  if (vuilbak && bestek) regels.push('- incl. afvalindeling en bestekbak');
  else if (vuilbak) regels.push('- incl. afvalindeling');
  else if (bestek) regels.push('- incl. bestekbak');

  // Special hardware / appliances last (extra plates are not mentioned to the client)
  lijnen
    .filter(l => l.aantal > 0 && l.prijs > 0 && (
      (l.groep === 'Beslag' && (l.key === 'custom' || l.key === 'tabletsteun')) ||
      l.groep === 'Toestel' || l.groep === 'Schuifdeur'))
    .forEach(l => {
      let naam = l.omschrijving.charAt(0).toLowerCase() + l.omschrijving.slice(1);
      if (l.key === 'tabletsteun') {
        const mm = l.omschrijving.match(/(\d+)\s*mm/);
        naam = mm ? `tabletsteun ${mm[1]} mm` : 'tabletsteun';
      }
      regels.push(l.aantal > 1 ? `- ${l.aantal}x ${naam}` : `- ${naam}`);
    });
  return regels.join('\n');
};

// ── Middelen for one post ───────────────────────────────────────────────────────
const bouwMiddelen = (cafcaLijst) => {
  // Start from the standard rows, quantities 0
  const rijen = MID_STANDAARD_ROWS.map(pairs => ({ pairs, over: {} }));
  const byCall = Object.fromEntries(rijen.map(r => [get(r.pairs, 'call_id'), r]));
  const vrij = []; // free rows: { descr, unit, aantal, prijs }

  // Werkuren
  for (const a of cafcaLijst.arbeid || []) {
    const rij = byCall[ARBEID_RIJ[a.key]];
    if (!rij) continue;
    rij.over.quantity = num(a.uren);
    if (a.key === 'plaatsing') {
      rij.over.costprice_subcontract = num(a.prijs);
    } else {
      rij.over.costprice_labor = num(a.prijs);
      rij.over.labor_c_price = num(a.prijs);
    }
  }

  // Material lines
  const plaatsOp = (callId, l) => {
    const rij = callId && byCall[callId];
    if (!rij) return false;
    const huidig = Number(rij.over.quantity || 0);
    const huidigePrijs = rij.over.costprice_material !== undefined ? Number(rij.over.costprice_material) : null;
    // Same row already used with a different price → keep both visible: use a free row instead
    if (huidig > 0 && huidigePrijs !== null && Math.abs(huidigePrijs - l.prijs) > 0.0001) return false;
    rij.over.quantity = num(huidig + l.aantal);
    rij.over.costprice_material = num(l.prijs);
    return true;
  };

  for (const l of cafcaLijst.lijnen || []) {
    if (!(l.aantal > 0) || !(l.prijs > 0)) continue;
    let callId = null;
    if (l.groep === 'Plaat') callId = PLAAT_RIJ[l.matNaam];
    else if (l.groep === 'Kantenband') callId = KANTENBAND_RIJ[l.key];
    else if (l.groep === 'Beslag') callId = BESLAG_RIJ[l.key];
    if (!plaatsOp(callId, l)) {
      vrij.push({ descr: l.groep === 'Plaat' ? l.matNaam || l.omschrijving : l.omschrijving, unit: l.eenheid, aantal: l.aantal, prijs: l.prijs });
    }
  }

  // Serialize: standard rows, separator, free rows (at least the template's 17 empty ones)
  const totaal = { materiaal: 0, arbeid: 0, onderaanneming: 0, uren: 0 };
  for (const r of rijen) {
    const q = Number(r.over.quantity ?? get(r.pairs, 'quantity')) || 0;
    const cm = Number(r.over.costprice_material ?? get(r.pairs, 'costprice_material')) || 0;
    const cl = Number(r.over.costprice_labor ?? get(r.pairs, 'costprice_labor')) || 0;
    const cs = Number(r.over.costprice_subcontract ?? get(r.pairs, 'costprice_subcontract')) || 0;
    const norm = Number(get(r.pairs, 'norm')) || 0;
    totaal.materiaal += q * cm;
    totaal.arbeid += q * cl * (norm || 0);
    totaal.onderaanneming += q * cs;
    totaal.uren += q * norm;
  }
  for (const v of vrij) totaal.materiaal += v.aantal * v.prijs;

  const vrijeRijen = [...vrij];
  while (vrijeRijen.length < 17) vrijeRijen.push(null);

  return { rijen, vrijeRijen, totaal };
};

// ── Build the 3 files ───────────────────────────────────────────────────────────
// offertes: [{ titel, tekst, cafcaLijst }] in post order
export const bouwCafcaBestanden = ({ id, omschrijving, klant, gebruiker = '', offertes }) => {
  const posRows = [rowXml(POS_TITEL_ROW, { estimate_id: id })];
  const midRows = [];
  let totaalKost = 0;
  let totaalPrijs = 0;

  offertes.forEach((o, i) => {
    const postNr = i + 1;
    const { rijen, vrijeRijen, totaal } = bouwMiddelen(o.cafcaLijst);
    const factorArbeid = Number(get(POS_POST_ROW, 'factor_labor')) || 0;
    const factorOA = Number(get(POS_POST_ROW, 'factor_subcontract')) || 0;
    const factorMat = Number(get(POS_POST_ROW, 'factor_material')) || 0;
    const vpArbeid = totaal.arbeid * (1 + factorArbeid / 100);
    const vpOA = totaal.onderaanneming * (1 + factorOA / 100);
    const vpMat = totaal.materiaal * (1 + factorMat / 100);
    const kost = totaal.materiaal + totaal.arbeid + totaal.onderaanneming;
    const prijs = vpArbeid + vpOA + vpMat;
    totaalKost += kost;
    totaalPrijs += prijs;

    posRows.push(rowXml(POS_POST_ROW, {
      composition_id: postNr,
      descr: o.tekst,
      estimate_id: id,
      estimate_position: postNr,
      seq_nr: postNr,
      costprice_material: num(totaal.materiaal),
      costprice_subcontract: num(totaal.onderaanneming),
      total_costprice_material: num(totaal.materiaal),
      total_costprice_labor: num(totaal.arbeid),
      total_costprice_subcontract: num(totaal.onderaanneming),
      total_costprice: num(kost),
      total_hours: num(totaal.uren),
      norm: num(totaal.uren),
      labor_c_price: num(totaal.uren > 0 ? totaal.arbeid / totaal.uren : 0),
      salesprice_material: num(vpMat),
      salesprice_labor: num(vpArbeid),
      salesprice_subcontract: num(vpOA),
      total_price: num(prijs),
      unit_price: num(prijs),
    }));

    let seq = 0;
    for (const r of rijen) {
      midRows.push(rowXml(r.pairs, { ...r.over, composition_id: postNr, estimate_id: id, seq_nr: seq++ }));
    }
    for (const v of vrijeRijen) {
      midRows.push(rowXml(MID_VRIJE_ROW, v
        ? { composition_id: postNr, estimate_id: id, seq_nr: seq++, descr: v.descr, unit: v.unit, quantity: num(v.aantal), costprice_material: num(v.prijs) }
        : { composition_id: postNr, estimate_id: id, seq_nr: seq++ }));
    }
  });

  const off = wrap(OFF_HEAD, [rowXml(OFF_ROW, {
    id,
    descr: omschrijving,
    name: klant,
    date: vandaag(),
    ts_crea: nu(),
    ts_modif: nu(),
    user_crea: gebruiker,
    user_modif: gebruiker,
    total_costprice: num(totaalKost),
    total_price: num(totaalPrijs),
  })]);

  return {
    [`OFF_${id}.xml`]: off,
    [`POS_${id}.xml2`]: wrap(POS_HEAD, posRows),
    [`MID_${id}.xml2`]: wrap(MID_HEAD, midRows),
  };
};
