import React, { useState } from 'react';
import { KastEditModal } from './KastenLijst';

const FloatingKastenLijst = ({ kastenLijst, voegZijpaneelToe, kopieerKast, updateKast, verwijderKast, plaatMaterialen = [] }) => {
  const [gekozenKast, setGekozenKast] = useState(null);   // kast clicked → action popup
  const [editingKast, setEditingKast] = useState(null);   // kast being edited
  if (kastenLijst.length === 0) {
    return (
      <div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-600">Kasten (0)</h3>
          <p className="text-xs text-gray-400 mt-2">Nog geen kasten toegevoegd.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg border-2 border-gray-300 shadow-md overflow-hidden">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
          <h3 className="text-sm font-bold text-gray-700">Kasten ({kastenLijst.length})</h3>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600">#</th>
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600">Type</th>
                <th className="text-right py-1.5 px-2 font-semibold text-gray-600">H×B×D</th>
                <th className="py-1.5 px-1"></th>
              </tr>
            </thead>
            <tbody>
              {kastenLijst.map((kast, index) => (
                <tr
                  key={kast.id}
                  onClick={() => setGekozenKast({ kast, nummer: index + 1 })}
                  className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer ${kast.isZijpaneel ? 'bg-yellow-50' : ''}`}
                  title="Klik om aan te passen of te kopiëren"
                >
                  <td className="py-1 px-2 text-gray-500">{index + 1}</td>
                  <td className="py-1 px-2 font-medium text-gray-700 truncate max-w-[120px]" title={kast.type}>
                    {kast.type}
                    {kast.naam && <span className="text-gray-400 font-normal"> {kast.naam}</span>}
                    {kast.isOpen && <span className="text-yellow-600 ml-0.5">(o)</span>}
                  </td>
                  <td className="py-1 px-2 text-right text-gray-600 font-mono whitespace-nowrap">
                    {kast.hoogte}×{kast.breedte}×{kast.diepte}
                  </td>
                  <td className="py-1 px-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); verwijderKast(kast.id); }}
                      className="text-red-400 hover:text-red-600 text-xs px-1"
                      title="Verwijderen"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action popup: aanpassen of kopiëren */}
      {gekozenKast && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={() => setGekozenKast(null)}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800">
              #{gekozenKast.nummer} {gekozenKast.kast.type}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {gekozenKast.kast.naam ? `${gekozenKast.kast.naam} — ` : ''}
              {gekozenKast.kast.hoogte}×{gekozenKast.kast.breedte}×{gekozenKast.kast.diepte} mm
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setEditingKast(gekozenKast.kast); setGekozenKast(null); }}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-sm"
              >
                ✎ Aanpassen
              </button>
              <button
                onClick={() => { kopieerKast(gekozenKast.kast); setGekozenKast(null); }}
                className="w-full px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-lg font-semibold text-sm"
              >
                ⧉ Kopiëren
              </button>
              <button
                onClick={() => setGekozenKast(null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}

      {editingKast && (
        <KastEditModal
          kast={editingKast}
          plaatMaterialen={plaatMaterialen}
          onSave={(data) => { updateKast(editingKast.id, data); setEditingKast(null); }}
          onCancel={() => setEditingKast(null)}
        />
      )}
    </div>
  );
};

export default FloatingKastenLijst;
