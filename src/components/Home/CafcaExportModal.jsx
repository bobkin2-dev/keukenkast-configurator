import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import { bouwCafcaBestanden, maakPostTekst } from '../../utils/cafcaExport';

// Export a dossier (project group) to Cafca: every checked offerte becomes one post.
// Uses the Cafca list each offerte saves with its settings (settings.cafcaLijst).

const natuurlijk = (a, b) => (a.name || '').localeCompare(b.name || '', 'nl', { numeric: true, sensitivity: 'base' });
const euro = (v) => `€${Math.round(v || 0).toLocaleString('nl-BE')}`;

const CafcaExportModal = ({ group, projects, user, onClose }) => {
  const lijst = useMemo(() => [...projects].sort(natuurlijk), [projects]);

  const [aangevinkt, setAangevinkt] = useState(() => new Set(
    lijst.filter(p => p.settings?.cafcaLijst && !/^test/i.test(p.name || '')).map(p => p.id)
  ));
  const [teksten, setTeksten] = useState(() => Object.fromEntries(
    lijst.map(p => [p.id, maakPostTekst(p.name || 'Meubelgeheel', p.settings?.cafcaLijst)])
  ));
  const [openTekst, setOpenTekst] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const toggle = (id) => setAangevinkt(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const exporteerbaar = lijst.filter(p => p.settings?.cafcaLijst);
  const alles = () => setAangevinkt(new Set(exporteerbaar.map(p => p.id)));
  const niets = () => setAangevinkt(new Set());

  const gekozen = lijst.filter(p => aangevinkt.has(p.id) && p.settings?.cafcaLijst);
  const totaal = gekozen.reduce((s, p) => s + (p.settings?.totaalPrijs?.exclMarge || 0), 0);

  const exporteer = async () => {
    setFout('');
    if (gekozen.length === 0) { setFout('Vink minstens één offerte aan.'); return; }
    setBezig(true);
    try {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      // Temporary id — Cafca assigns its own next offerte number on import
      const id = `CFG${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
      const bestanden = bouwCafcaBestanden({
        id,
        omschrijving: (group.naam || '').slice(0, 50),
        klant: (group.klant || '').slice(0, 100),
        gebruiker: (user?.email || '').split('@')[0].slice(0, 15),
        offertes: gekozen.map(p => ({ titel: p.name, tekst: teksten[p.id], cafcaLijst: p.settings.cafcaLijst })),
      });
      const zip = new JSZip();
      Object.entries(bestanden).forEach(([naam, inhoud]) => zip.file(naam, inhoud));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cafca_${(group.naam || 'export').replace(/[^\w-]+/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setFout(`Export mislukt: ${e.message}`);
    }
    setBezig(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-bold text-gray-800">Export naar Cafca</h3>
            <p className="text-xs text-gray-500">{group.naam}{group.klant ? ` — ${group.klant}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-600">Elke aangevinkte offerte wordt één post in Cafca, in deze volgorde.</span>
          <span className="flex gap-3">
            <button onClick={alles} className="text-blue-600 hover:underline">Alles aanvinken</button>
            <button onClick={niets} className="text-blue-600 hover:underline">Niets</button>
          </span>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-2">
          {lijst.map(p => {
            const lijstOk = !!p.settings?.cafcaLijst;
            const aan = aangevinkt.has(p.id) && lijstOk;
            return (
              <div key={p.id} className="border-b border-gray-100 py-2">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={aan} disabled={!lijstOk} onChange={() => toggle(p.id)} className="w-4 h-4" />
                  <span className={`flex-1 text-sm ${aan ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{p.name || 'Naamloos'}</span>
                  {lijstOk ? (
                    <span className="text-sm text-gray-600 w-24 text-right">{euro(p.settings?.totaalPrijs?.exclMarge)}</span>
                  ) : (
                    <span className="text-xs text-orange-600" title="Deze offerte heeft nog geen Cafca-gegevens">
                      ⚠ open de offerte één keer
                    </span>
                  )}
                  {lijstOk && (
                    <button
                      onClick={() => setOpenTekst(openTekst === p.id ? null : p.id)}
                      className="text-xs text-blue-600 hover:underline w-20 text-right"
                    >
                      {openTekst === p.id ? 'Tekst ▲' : 'Tekst ▼'}
                    </button>
                  )}
                </div>
                {openTekst === p.id && (
                  <textarea
                    value={teksten[p.id]}
                    onChange={(e) => setTeksten(prev => ({ ...prev, [p.id]: e.target.value }))}
                    rows={Math.min(10, (teksten[p.id] || '').split('\n').length + 1)}
                    className="mt-2 ml-7 w-[calc(100%-1.75rem)] px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 space-y-2">
          {fout && <p className="text-sm text-red-600">{fout}</p>}
          <p className="text-xs text-gray-500">
            Je krijgt een zip met 3 bestanden. Pak ze uit in één map en kies in Cafca → Offertes → <strong>&lt;= Import</strong> het
            bestand <code>OFF_…xml</code>. Cafca maakt een nieuwe offerte aan; kies daarna de klant en het adres in Cafca.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              <strong>{gekozen.length}</strong> post{gekozen.length !== 1 ? 'en' : ''} · {euro(totaal)} excl. marge
            </span>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                Annuleer
              </button>
              <button
                onClick={exporteer}
                disabled={bezig || gekozen.length === 0}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-gray-300 text-white rounded-lg font-semibold text-sm"
              >
                {bezig ? 'Bezig…' : 'Exporteer (.zip)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CafcaExportModal;
