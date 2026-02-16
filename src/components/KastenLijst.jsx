import React from 'react';

const KastenLijst = ({ kastenLijst, materiaalTablet, voegZijpaneelToe, verwijderKast }) => {
  if (kastenLijst.length === 0) return null;

  return (
    <>
      {/* Compact table view */}
      <div className="bg-white p-4 rounded-lg mb-4 border-2 border-gray-300 shadow-md">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Kasten Lijst ({kastenLijst.length})</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2 font-semibold">#</th>
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
                  className={`border-b border-gray-200 hover:bg-gray-50 ${kast.isZijpaneel ? 'bg-yellow-50' : ''
                    }`}
                >
                  <td className="py-2 px-2 text-gray-600">{index + 1}</td>
                  <td className="py-2 px-2 font-medium">
                    {kast.type}
                    {kast.type === 'Open Nis HPL' && (
                      <>
                        {kast.hplOnderdelen && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({Object.entries(kast.hplOnderdelen).filter(([_, v]) => v).map(([k]) => k).join(', ')})
                          </span>
                        )}
                        {kast.hplMateriaal !== undefined && (
                          <span className="text-xs text-blue-600 block">
                            {materiaalTablet[kast.hplMateriaal]?.naam || 'Materiaal onbekend'}
                          </span>
                        )}
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
      </div>

      {/* Visual list view with previews */}
      <div className="bg-white p-4 rounded-lg mb-4 border-2 border-gray-300 shadow-md">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Kasten Lijst ({kastenLijst.length})</h2>

        <div className="space-y-2">
          {kastenLijst.map((kast) => (
            <div
              key={kast.id}
              className={`flex items-center gap-3 p-3 rounded border-2 ${kast.isZijpaneel ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-300'
                }`}
            >
              {/* Mini preview */}
              <div
                className="border-2 border-gray-700 bg-gray-100 flex-shrink-0 relative"
                style={{
                  width: `${Math.min(kast.breedte / 10, 60)}px`,
                  height: `${Math.min(kast.hoogte / 10, 60)}px`
                }}
              >
                {Array.from({ length: kast.aantalLeggers }).map((_, i) => (
                  <div
                    key={`legger-${i}`}
                    className="absolute w-full border-t border-gray-500"
                    style={{ top: `${((i + 1) * 100) / (kast.aantalLeggers + 1)}%` }}
                  />
                ))}
                {Array.from({ length: kast.aantalTussensteunen }).map((_, i) => (
                  <div
                    key={`steun-${i}`}
                    className="absolute h-full border-l border-gray-500"
                    style={{ left: `${((i + 1) * 100) / (kast.aantalTussensteunen + 1)}%` }}
                  />
                ))}
              </div>

              {/* Info */}
              <div className="flex-1 grid grid-cols-6 gap-2 text-xs">
                <div>
                  <strong>{kast.type}</strong>
                  {kast.isZijpaneel && <span className="text-yellow-700"> (Zijpaneel)</span>}
                </div>
                <div>{kast.breedte} × {kast.hoogte} × {kast.diepte} mm</div>
                <div>Leggers: {kast.aantalLeggers}</div>
                <div>Lades: {kast.aantalLades}</div>
                <div>Deuren: {kast.aantalDeuren}</div>
                <div>Steunen: {kast.aantalTussensteunen}</div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                {!kast.isZijpaneel && (
                  <button
                    onClick={() => voegZijpaneelToe(kast)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold"
                    title="Zijpaneel toevoegen"
                  >
                    Zijpaneel
                  </button>
                )}
                <button
                  onClick={() => verwijderKast(kast.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold"
                >
                  Verwijder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default KastenLijst;
