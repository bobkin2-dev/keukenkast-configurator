import React, { useState } from 'react';

const BESLAG_CATEGORIES = [
  'Scharnieren',
  'Ladesystemen',
  'Sloten',
  'Verbindingsbeslag & Profielen',
  'Schuifdeurbeslag',
  'Bouwbeslag',
  'Verlichting',
  'Bank- & Tabletdragers',
  'Kantoorinrichting',
  'Keuken & Badkamer',
  'Multimedia & Specials',
  'Poten',
  'Wielen',
  'Garderobe',
];

const BeslagBibliotheekModal = ({ bibliotheek, onSave, onClose, onSelectItem }) => {
  const [zoek, setZoek] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [newItem, setNewItem] = useState(null);

  const filtered = bibliotheek.filter(item => {
    const matchZoek = !zoek || item.label.toLowerCase().includes(zoek.toLowerCase()) ||
      (item.artikelnr && item.artikelnr.toLowerCase().includes(zoek.toLowerCase()));
    const matchCat = !activeCategory || item.categorie === activeCategory;
    return matchZoek && matchCat;
  });

  const itemsByCategory = {};
  filtered.forEach(item => {
    const cat = item.categorie || 'Overig';
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  });

  // Sort categories: BESLAG_CATEGORIES order first, then 'Overig'
  const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
    const ia = BESLAG_CATEGORIES.indexOf(a);
    const ib = BESLAG_CATEGORIES.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const handleSaveItem = (item, originalIndex) => {
    const newLib = [...bibliotheek];
    if (originalIndex !== null && originalIndex !== undefined) {
      newLib[originalIndex] = item;
    } else {
      newLib.push(item);
    }
    onSave(newLib);
    setEditItem(null);
    setNewItem(null);
  };

  const handleDeleteItem = (idx) => {
    const newLib = bibliotheek.filter((_, i) => i !== idx);
    onSave(newLib);
  };

  const handleSelect = (item) => {
    if (onSelectItem) {
      onSelectItem({ label: item.label, aantal: 1, prijs: item.prijs });
    }
    onClose();
  };

  const ItemForm = ({ item, onSaveForm, onCancel }) => {
    const [form, setForm] = useState({
      label: item?.label || '',
      artikelnr: item?.artikelnr || '',
      prijs: item?.prijs || 0,
      eenheid: item?.eenheid || '/st',
      categorie: item?.categorie || BESLAG_CATEGORIES[0],
    });

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Omschrijving *</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border rounded text-sm"
              value={form.label}
              onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="bijv. Blum Clip Top 110°"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Artikelnr</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border rounded text-sm"
              value={form.artikelnr}
              onChange={(e) => setForm(f => ({ ...f, artikelnr: e.target.value }))}
              placeholder="bijv. 71B3550"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Categorie</label>
            <select
              className="w-full px-2 py-1.5 border rounded text-sm"
              value={form.categorie}
              onChange={(e) => setForm(f => ({ ...f, categorie: e.target.value }))}
            >
              {BESLAG_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Prijs (€)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-2 py-1.5 border rounded text-sm"
                value={form.prijs}
                onChange={(e) => setForm(f => ({ ...f, prijs: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Eenheid</label>
              <select
                className="w-full px-2 py-1.5 border rounded text-sm"
                value={form.eenheid}
                onChange={(e) => setForm(f => ({ ...f, eenheid: e.target.value }))}
              >
                <option value="/st">/st</option>
                <option value="/m">/m</option>
                <option value="/set">/set</option>
                <option value="/paar">/paar</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
          >
            Annuleren
          </button>
          <button
            onClick={() => form.label.trim() && onSaveForm(form)}
            disabled={!form.label.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-40"
          >
            Opslaan
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Beslag Bibliotheek</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-3">
          <input
            type="text"
            className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
            placeholder="Zoeken op naam of artikelnr..."
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
          />
          <button
            onClick={() => setNewItem({})}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium whitespace-nowrap"
          >
            + Nieuw item
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <div className="w-52 border-r bg-gray-50 overflow-y-auto flex-shrink-0">
            <button
              onClick={() => setActiveCategory(null)}
              className={`w-full text-left px-4 py-2 text-sm transition ${!activeCategory ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              Alles ({bibliotheek.length})
            </button>
            {BESLAG_CATEGORIES.map(cat => {
              const count = bibliotheek.filter(b => b.categorie === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`w-full text-left px-4 py-2 text-sm transition ${activeCategory === cat ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {cat} {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {/* New item form */}
            {newItem && (
              <ItemForm
                item={newItem}
                onSaveForm={(form) => handleSaveItem(form, null)}
                onCancel={() => setNewItem(null)}
              />
            )}

            {filtered.length === 0 && !newItem ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg mb-1">Geen items gevonden</p>
                <p className="text-sm">Voeg een nieuw item toe of pas je zoekterm aan</p>
              </div>
            ) : (
              sortedCategories.map(cat => (
                <div key={cat} className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">{cat}</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {itemsByCategory[cat].map(item => {
                        const globalIdx = bibliotheek.indexOf(item);
                        const isEditing = editItem === globalIdx;

                        if (isEditing) {
                          return (
                            <tr key={globalIdx}>
                              <td colSpan={4} className="py-1">
                                <ItemForm
                                  item={item}
                                  onSaveForm={(form) => handleSaveItem(form, globalIdx)}
                                  onCancel={() => setEditItem(null)}
                                />
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={globalIdx} className="border-b border-gray-100 hover:bg-gray-50 group">
                            <td className="py-1.5 px-1">
                              <span className="font-medium text-gray-800">{item.label}</span>
                              {item.artikelnr && (
                                <span className="ml-2 text-xs text-gray-400">{item.artikelnr}</span>
                              )}
                            </td>
                            <td className="py-1.5 px-1 text-right whitespace-nowrap text-gray-600">
                              €{item.prijs.toFixed(2)}{item.eenheid || '/st'}
                            </td>
                            <td className="py-1.5 px-1 text-right w-24">
                              <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition">
                                {onSelectItem && (
                                  <button
                                    onClick={() => handleSelect(item)}
                                    className="px-2 py-0.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium"
                                  >
                                    Toevoegen
                                  </button>
                                )}
                                <button
                                  onClick={() => setEditItem(globalIdx)}
                                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(globalIdx)}
                                  className="px-2 py-0.5 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { BESLAG_CATEGORIES };
export default BeslagBibliotheekModal;
