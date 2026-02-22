import React from 'react';

const FloatingKastenLijst = ({ kastenLijst, voegZijpaneelToe, kopieerKast, verwijderKast }) => {
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
                  className={`border-b border-gray-100 hover:bg-gray-50 ${kast.isZijpaneel ? 'bg-yellow-50' : ''}`}
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
                      onClick={() => verwijderKast(kast.id)}
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
    </div>
  );
};

export default FloatingKastenLijst;
