import React, { useState } from 'react';

// Aspect ratio limits (shared with KastPreview)
const MIN_RATIO = 400 / 3000;
const MAX_RATIO = 3000 / 800;

const getMiniDimensions = (breedte, hoogte, maxW = 50, maxH = 40) => {
  const rawRatio = breedte / hoogte;
  const ratio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, rawRatio));
  let w, h;
  if (ratio > maxW / maxH) {
    w = maxW;
    h = maxW / ratio;
  } else {
    h = maxH;
    w = maxH * ratio;
  }
  return { width: `${Math.round(w)}px`, height: `${Math.round(h)}px` };
};

// Helper: detect Vrije Kast type (including legacy 'Open Nis HPL')
const isVrijeKast = (type) => type === 'Vrije Kast' || type === 'Open Nis HPL';

// Helper: get onderdelen (backward compat)
const getOnderdelen = (kast) => kast.vrijeKastOnderdelen || kast.hplOnderdelen || {};

// Helper: get material name for Vrije Kast
const getVrijeKastMateriaalNaam = (kast, plaatMaterialen) => {
  if (kast.vrijeKastMateriaalId !== undefined && kast.vrijeKastMateriaalId !== null) {
    const mat = plaatMaterialen.find(m => m.id === kast.vrijeKastMateriaalId);
    if (mat) return mat.naam;
  }
  if (kast.hplMateriaal !== undefined) {
    const mat = plaatMaterialen[kast.hplMateriaal];
    if (mat) return mat.naam;
  }
  return 'Materiaal onbekend';
};

// Mini preview for the table
const MiniPreview = ({ kast }) => (
  <div
    className={`border border-gray-600 flex-shrink-0 relative ${kast.isOpen ? 'bg-yellow-50' : 'bg-gray-100'}`}
    style={getMiniDimensions(kast.breedte, kast.hoogte)}
  >
    {Array.from({ length: kast.aantalLeggers }).map((_, i) => (
      <div
        key={`l-${i}`}
        className="absolute w-full border-t border-gray-400"
        style={{ top: `${((i + 1) * 100) / (kast.aantalLeggers + 1)}%` }}
      />
    ))}
    {Array.from({ length: kast.aantalTussensteunen }).map((_, i) => (
      <div
        key={`s-${i}`}
        className="absolute h-full border-l border-gray-400"
        style={{ left: `${((i + 1) * 100) / (kast.aantalTussensteunen + 1)}%` }}
      />
    ))}
  </div>
);

const KastenLijst = ({ kastenLijst, plaatMaterialen = [], voegZijpaneelToe, kopieerKast, verwijderKast }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (kastenLijst.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg mb-4 border-2 border-gray-300 shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-lg font-bold text-gray-800">Kasten Lijst ({kastenLijst.length})</h2>
        <span className="text-gray-500 text-xl">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>

      {isOpen && (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2 font-semibold">#</th>
                <th className="text-left py-2 px-1 font-semibold"></th>
                <th className="text-left py-2 px-2 font-semibold">Type</th>
                <th className="text-right py-2 px-2 font-semibold">H×B×D (mm)</th>
                <th className="text-center py-2 px-2 font-semibold">Leggers</th>
                <th className="text-center py-2 px-2 font-semibold">Steunen</th>
                <th className="text-center py-2 px-2 font-semibold">Deuren</th>
                <th className="text-center py-2 px-2 font-semibold">Lades</th>
                <th className="text-right py-2 px-2 font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody>
              {kastenLijst.map((kast, index) => (
                <tr
                  key={kast.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${kast.isZijpaneel ? 'bg-yellow-50' : ''}`}
                >
                  <td className="py-2 px-2 text-gray-600">{index + 1}</td>
                  <td className="py-2 px-1">
                    <MiniPreview kast={kast} />
                  </td>
                  <td className="py-2 px-2 font-medium">
                    {kast.type}{kast.naam && <span className="text-gray-500 font-normal"> - {kast.naam}</span>}
                    {kast.isOpen && <span className="text-yellow-600 text-xs ml-1">(open)</span>}
                    {isVrijeKast(kast.type) && (
                      <>
                        {(() => {
                          const onderdelen = getOnderdelen(kast);
                          const activeOnderdelen = Object.entries(onderdelen).filter(([_, v]) => v).map(([k]) => k);
                          return activeOnderdelen.length > 0 ? (
                            <span className="text-xs text-gray-500 ml-2">
                              ({activeOnderdelen.join(', ')})
                            </span>
                          ) : null;
                        })()}
                        <span className="text-xs text-blue-600 block">
                          {getVrijeKastMateriaalNaam(kast, plaatMaterialen)}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700 font-mono text-xs">
                    {kast.hoogte}×{kast.breedte}×{kast.diepte}
                  </td>
                  <td className="py-2 px-2 text-center">{kast.aantalLeggers || '-'}</td>
                  <td className="py-2 px-2 text-center">{kast.aantalTussensteunen || '-'}</td>
                  <td className="py-2 px-2 text-center">{kast.aantalDeuren || '-'}</td>
                  <td className="py-2 px-2 text-center">{kast.aantalLades || '-'}</td>
                  <td className="py-2 px-2 text-right">
                    <div className="flex gap-1 justify-end">
                      {!kast.isZijpaneel && (
                        <button
                          onClick={() => voegZijpaneelToe(kast)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs"
                          title="Zijpaneel toevoegen"
                        >
                          Zijpaneel
                        </button>
                      )}
                      <button
                        onClick={() => kopieerKast(kast)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                        title="Kopiëren"
                      >
                        Kopieer
                      </button>
                      <button
                        onClick={() => verwijderKast(kast.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        title="Verwijderen"
                      >
                        Verwijder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default KastenLijst;
