import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helpers for Vrije Kast display
const isVrijeKast = (type) => type === 'Vrije Kast' || type === 'Open Nis HPL';
const getOnderdelen = (kast) => kast.vrijeKastOnderdelen || kast.hplOnderdelen || {};
const getVrijeKastMateriaalNaam = (kast, plaatMaterialen) => {
  if (kast.vrijeKastMateriaalId != null) {
    const mat = plaatMaterialen.find(m => m.id === kast.vrijeKastMateriaalId);
    if (mat) return mat.naam;
  }
  if (kast.hplMateriaal !== undefined) {
    const mat = plaatMaterialen[kast.hplMateriaal];
    if (mat) return mat.naam;
  }
  return '';
};

const euro = (val) => `\u20AC${val.toFixed(2)}`;
const euroInt = (val) => `\u20AC${Math.round(val)}`;

const HEADER_COLOR = [55, 65, 81];
const SUB_HEADER_COLOR = [107, 114, 128];

export const generateOffertePDF = ({
  projectInfo,
  groupInfo,
  kastenLijst,
  plaatMaterialen,
  arbeidRows,
  plaatRows,
  kantenbandRows,
  beslagRows,
  toestellenRows,
  schuifdeurRows,
  grandTotal,
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // ====== PAGE 1: Title block + Kastenlijst ======

  // Group name (title)
  if (groupInfo?.naam) {
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(groupInfo.naam, margin, y + 6);
    y += 9;
    if (groupInfo.klant) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Klant: ${groupInfo.klant}`, margin, y + 4);
      y += 7;
    }
    y += 2;
  }

  // Project + meubelnummer
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Project: ${projectInfo.project || 'Naamloos'}`, margin, y + 4);
  if (projectInfo.meubelnummer) {
    doc.text(`Meubelnummer: ${projectInfo.meubelnummer}`, pageWidth / 2, y + 4);
  }
  y += 7;

  // Date
  const today = new Date();
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Datum: ${today.toLocaleDateString('nl-BE')}`, margin, y + 3);
  doc.setTextColor(0);
  y += 10;

  // Kastenlijst table
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Kastenlijst', margin, y + 4);
  y += 6;

  const kastenBody = kastenLijst.map((kast, i) => {
    let typeStr = kast.type;
    if (kast.naam) typeStr += ` - ${kast.naam}`;
    if (kast.isOpen) typeStr += ' (open)';
    if (kast.isZijpaneel) typeStr += ' [ZP]';
    if (isVrijeKast(kast.type)) {
      const onderdelen = getOnderdelen(kast);
      const active = Object.entries(onderdelen).filter(([, v]) => v).map(([k]) => k);
      if (active.length > 0) typeStr += ` [${active.join(', ')}]`;
      const matNaam = getVrijeKastMateriaalNaam(kast, plaatMaterialen);
      if (matNaam) typeStr += `\n${matNaam}`;
    }
    return [
      i + 1,
      typeStr,
      `${kast.hoogte} x ${kast.breedte} x ${kast.diepte}`,
      kast.aantalLeggers || '-',
      kast.aantalTussensteunen || '-',
      kast.aantalDeuren || '-',
      kast.aantalLades || '-',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Type', 'H\u00D7B\u00D7D (mm)', 'Leggers', 'Steunen', 'Deuren', 'Lades']],
    body: kastenBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
    },
  });

  // ====== PAGE 2: Totaallijst Materialen & Arbeid ======
  doc.addPage();
  y = margin;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Totaallijst Materialen & Arbeid', margin, y + 5);
  y += 12;

  // Reusable: add a section with title + table
  const DIM_COLOR = [180, 180, 180];
  const addSection = (title, head, body, colStyles = {}, zeroRows = []) => {
    if (body.length === 0) return;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(title, margin, y + 4);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: SUB_HEADER_COLOR, textColor: 255, fontStyle: 'bold', fontSize: 7 },
      columnStyles: colStyles,
      willDrawCell: (data) => {
        if (data.section === 'body' && zeroRows[data.row.index]) {
          data.cell.styles.textColor = DIM_COLOR;
          data.cell.styles.fontStyle = 'normal';
        }
      },
    });
    y = doc.lastAutoTable.finalY + 6;
  };

  // --- Arbeid ---
  addSection(
    'Arbeid',
    ['Taak', 'Uren', '\u20AC/uur', 'Totaal'],
    arbeidRows.map(r => [r.label, r.uren.toFixed(1), euroInt(r.prijs), euroInt(r.totaal)]),
    { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
    arbeidRows.map(r => r.isZero)
  );

  // --- Plaatmateriaal ---
  addSection(
    'Plaatmateriaal',
    ['Materiaal', 'Info', 'Aantal', 'Prijs/plaat', 'Totaal'],
    plaatRows.map(r => [r.label, r.info, r.aantal, euroInt(r.prijs), euroInt(r.totaal)]),
    { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    plaatRows.map(r => r.isZero)
  );

  // --- Kantenband ---
  addSection(
    'Kantenband',
    ['Type', 'Aantal', 'Prijs', 'Totaal'],
    kantenbandRows.map(r => [r.label, r.aantal.toFixed(1), euro(r.prijs), euro(r.totaal)]),
    { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
    kantenbandRows.map(r => r.isZero)
  );

  // --- Meubelbeslag ---
  addSection(
    'Meubelbeslag',
    ['Item', 'Aantal', 'Prijs', 'Totaal'],
    beslagRows.map(r => [r.label, r.aantalDisplay, euro(r.prijs), euro(r.totaal)]),
    { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
    beslagRows.map(r => r.isZero)
  );

  // --- Keukentoestellen ---
  if (toestellenRows.length > 0) {
    addSection(
      'Keukentoestellen',
      ['Toestel', 'Model', 'Klasse', 'Aantal', 'Prijs/st', 'Totaal'],
      toestellenRows.map(r => [r.naam, r.model, r.klasse, r.aantal, euroInt(r.prijs), euroInt(r.totaal)]),
      { 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right', fontStyle: 'bold' } }
    );
  }

  // --- Schuifdeursystemen ---
  if (schuifdeurRows.length > 0) {
    addSection(
      'Schuifdeursystemen',
      ['Item', 'Aantal', 'Prijs/st', 'Totaal'],
      schuifdeurRows.map(r => [r.label, r.aantal, euroInt(r.prijs), euroInt(r.totaal)]),
      { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } }
    );
  }

  // --- Grand Total ---
  y += 2;
  doc.setDrawColor(...HEADER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAAL', margin, y);
  doc.text(euro(grandTotal), pageWidth - margin, y, { align: 'right' });

  // --- Footer on all pages ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150);
    doc.text(
      `Merger.be \u2014 Keukenkast Configurator  |  Pagina ${i}/${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
    doc.setTextColor(0);
  }

  // --- Save ---
  const parts = [groupInfo?.naam, projectInfo.project, projectInfo.meubelnummer].filter(Boolean);
  const filename = `offerte_${parts.join('_').replace(/[^a-zA-Z0-9_.-]/g, '_')}.pdf`;
  doc.save(filename);
};
