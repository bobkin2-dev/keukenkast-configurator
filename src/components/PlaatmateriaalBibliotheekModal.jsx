import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const MATERIAAL_CATEGORIES = ['Binnenkast', 'Buitenzijde', 'Tablet'];
const CATEGORY_EMOJI = {
  'Binnenkast': '\uD83C\uDFE0',
  'Buitenzijde': '\uD83C\uDFA8',
  'Tablet': '\uD83D\uDCCF',
};
const CATEGORY_KEYS = {
  'Binnenkast': 'binnenkast',
  'Buitenzijde': 'buitenzijde',
  'Tablet': 'tablet',
};

const PlaatmateriaalBibliotheekModal = ({ materialen, onClose, onReload }) => {
  const [zoek, setZoek] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [newItem, setNewItem] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRows, setBulkRows] = useState([{ naam: '', breedte: '', hoogte: '', prijs: '' }]);

  // Filter materials
  const filtered = materialen.filter(mat => {
    const matchZoek = !zoek || mat.naam.toLowerCase().includes(zoek.toLowerCase());
    if (!activeCategory) return matchZoek;
    const catKey = CATEGORY_KEYS[activeCategory];
    return matchZoek && mat[catKey];
  });

  // Group by category
  const getCategories = (mat) => {
    const cats = [];
    if (mat.binnenkast) cats.push('Binnenkast');
    if (mat.buitenzijde) cats.push('Buitenzijde');
    if (mat.tablet) cats.push('Tablet');
    return cats.length > 0 ? cats : ['Overig'];
  };

  const itemsByCategory = {};
  filtered.forEach(mat => {
    const cats = getCategories(mat);
    // Place in first matching category for display
    const displayCat = activeCategory || cats[0];
    if (!itemsByCategory[displayCat]) itemsByCategory[displayCat] = [];
    if (!itemsByCategory[displayCat].find(m => m.id === mat.id)) {
      itemsByCategory[displayCat].push(mat);
    }
  });

  const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
    const ia = MATERIAAL_CATEGORIES.indexOf(a);
    const ib = MATERIAAL_CATEGORIES.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  // CRUD operations
  const handleSaveItem = async (form, originalId) => {
    const afmeting = `${form.breedte} x ${form.hoogte}`;
    const record = {
      naam: form.naam,
      afmeting,
      breedte: parseInt(form.breedte) || 0,
      hoogte: parseInt(form.hoogte) || 0,
      prijs: parseFloat(form.prijs) || 0,
      binnenkast: form.binnenkast || false,
      buitenzijde: form.buitenzijde || false,
      tablet: form.tablet || false,
    };

    if (originalId) {
      await supabase.from('plaat_materialen').update(record).eq('id', originalId);
    } else {
      await supabase.from('plaat_materialen').insert(record);
    }
    onReload();
    setEditItem(null);
    setNewItem(null);
  };

  const handleDeleteItem = async (id) => {
    await supabase.from('plaat_materialen').delete().eq('id', id);
    onReload();
  };

  const handleBulkSave = async () => {
    const validRows = bulkRows.filter(r => r.naam.trim());
    if (validRows.length === 0) return;
    const records = validRows.map(r => ({
      naam: r.naam.trim(),
      breedte: parseInt(r.breedte) || 0,
      hoogte: parseInt(r.hoogte) || 0,
      afmeting: `${parseInt(r.breedte) || 0} x ${parseInt(r.hoogte) || 0}`,
      prijs: parseFloat(r.prijs) || 0,
      binnenkast: false,
      buitenzijde: false,
      tablet: false,
    }));
    await supabase.from('plaat_materialen').insert(records);
    onReload();
    setBulkRows([{ naam: '', breedte: '', hoogte: '', prijs: '' }]);
    setBulkMode(false);
  };

  const updateBulkRow = (idx, field, value) => {
    setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  // Inline form for add/edit
  const ItemForm = ({ item, onSaveForm, onCancel }) => {
    const [form, setForm] = useState({
      naam: item?.naam || '',
      breedte: item?.breedte || '',
      hoogte: item?.hoogte || '',
      prijs: item?.prijs || '',
      binnenkast: item?.binnenkast || false,
      buitenzijde: item?.buitenzijde || false,
      tablet: item?.tablet || false,
    });

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Naam *</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border rounded text-sm"
              value={form.naam}
              onChange={(e) => setForm(f => ({ ...f, naam: e.target.value }))}
              placeholder="bijv. M18 Wit"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Prijs (€/m²) *</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-2 py-1.5 border rounded text-sm"
              value={form.prijs}
              onChange={(e) => setForm(f => ({ ...f, prijs: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Breedte (mm)</label>
            <input
              type="number"
              className="w-full px-2 py-1.5 border rounded text-sm"
              value={form.breedte}
              onChange={(e) => setForm(f => ({ ...f, breedte: e.target.value }))}
              placeholder="bijv. 2800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Hoogte (mm)</label>
            <input
              type="number"
              className="w-full px-2 py-1.5 border rounded text-sm"
              value={form.hoogte}
              onChange={(e) => setForm(f => ({ ...f, hoogte: e.target.value }))}
              placeholder="bijv. 2070"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs font-medium text-gray-600">Populair voor:</span>
          {MATERIAAL_CATEGORIES.map(cat => {
            const key = CATEGORY_KEYS[cat];
            return (
              <label key={cat} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={form[key] || false}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-xs">{CATEGORY_EMOJI[cat]} {cat}</span>
              </label>
            );
          })}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
          >
            Annuleren
          </button>
          <button
            onClick={() => form.naam.trim() && onSaveForm(form)}
            disabled={!form.naam.trim()}
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
          <h2 className="text-lg font-bold text-gray-800">Plaatmateriaal Bibliotheek</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-3">
          <input
            type="text"
            className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
            placeholder="Zoeken op naam..."
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
          />
          <button
            onClick={() => { setNewItem({}); setBulkMode(false); }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium whitespace-nowrap"
          >
            + Nieuw materiaal
          </button>
          <button
            onClick={() => { setBulkMode(!bulkMode); setNewItem(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              bulkMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
            }`}
          >
            ⚡ Bulk toevoegen
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <div className="w-44 border-r bg-gray-50 overflow-y-auto flex-shrink-0">
            <button
              onClick={() => setActiveCategory(null)}
              className={`w-full text-left px-4 py-2 text-sm transition ${!activeCategory ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              Alles ({materialen.length})
            </button>
            {MATERIAAL_CATEGORIES.map(cat => {
              const catKey = CATEGORY_KEYS[cat];
              const count = materialen.filter(m => m[catKey]).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`w-full text-left px-4 py-2 text-sm transition ${activeCategory === cat ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {CATEGORY_EMOJI[cat] && <span className="mr-1.5">{CATEGORY_EMOJI[cat]}</span>}
                  {cat} {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {/* Bulk add form */}
            {bulkMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-bold text-amber-800 mb-2">Bulk toevoegen — meerdere materialen</h4>
                <table className="w-full text-sm mb-2">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b">
                      <th className="text-left py-1 w-8">#</th>
                      <th className="text-left py-1">Naam *</th>
                      <th className="text-left py-1 w-24">Breedte</th>
                      <th className="text-left py-1 w-24">Hoogte</th>
                      <th className="text-left py-1 w-24">€/m²</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-0.5 text-xs text-gray-400">{idx + 1}</td>
                        <td className="py-0.5 pr-1">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border rounded text-sm"
                            value={row.naam}
                            onChange={(e) => updateBulkRow(idx, 'naam', e.target.value)}
                            placeholder="Naam"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && row.naam.trim()) {
                                if (idx === bulkRows.length - 1) {
                                  setBulkRows(prev => [...prev, { naam: '', breedte: '', hoogte: '', prijs: '' }]);
                                  setTimeout(() => e.target.closest('tbody').querySelector(`tr:nth-child(${idx + 2}) input`)?.focus(), 50);
                                }
                              }
                            }}
                          />
                        </td>
                        <td className="py-0.5 pr-1">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border rounded text-sm"
                            value={row.breedte}
                            onChange={(e) => updateBulkRow(idx, 'breedte', e.target.value)}
                            placeholder="mm"
                          />
                        </td>
                        <td className="py-0.5 pr-1">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border rounded text-sm"
                            value={row.hoogte}
                            onChange={(e) => updateBulkRow(idx, 'hoogte', e.target.value)}
                            placeholder="mm"
                          />
                        </td>
                        <td className="py-0.5 pr-1">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1 border rounded text-sm"
                            value={row.prijs}
                            onChange={(e) => updateBulkRow(idx, 'prijs', e.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-0.5">
                          {bulkRows.length > 1 && (
                            <button
                              onClick={() => setBulkRows(prev => prev.filter((_, i) => i !== idx))}
                              className="text-gray-300 hover:text-red-500 text-xs"
                            >✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setBulkRows(prev => [...prev, { naam: '', breedte: '', hoogte: '', prijs: '' }])}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-medium"
                  >
                    + Rij toevoegen
                  </button>
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-400 self-center">
                      {bulkRows.filter(r => r.naam.trim()).length} materiaal/materialen
                    </span>
                    <button
                      onClick={() => { setBulkMode(false); setBulkRows([{ naam: '', breedte: '', hoogte: '', prijs: '' }]); }}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleBulkSave}
                      disabled={!bulkRows.some(r => r.naam.trim())}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm font-medium disabled:opacity-40"
                    >
                      Alles opslaan ({bulkRows.filter(r => r.naam.trim()).length})
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                <p className="text-lg mb-1">Geen materialen gevonden</p>
                <p className="text-sm">Voeg een nieuw materiaal toe of pas je zoekterm aan</p>
              </div>
            ) : (
              sortedCategories.map(cat => (
                <div key={cat} className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">
                    {CATEGORY_EMOJI[cat] && <span className="mr-1">{CATEGORY_EMOJI[cat]}</span>}{cat}
                  </h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {itemsByCategory[cat].map(mat => {
                        const isEditing = editItem === mat.id;

                        if (isEditing) {
                          return (
                            <tr key={mat.id}>
                              <td colSpan={4} className="py-1">
                                <ItemForm
                                  item={mat}
                                  onSaveForm={(form) => handleSaveItem(form, mat.id)}
                                  onCancel={() => setEditItem(null)}
                                />
                              </td>
                            </tr>
                          );
                        }

                        const catBadges = [];
                        if (mat.binnenkast) catBadges.push('BK');
                        if (mat.buitenzijde) catBadges.push('BZ');
                        if (mat.tablet) catBadges.push('TB');

                        return (
                          <tr key={mat.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                            <td className="py-1.5 px-1">
                              <span className="font-medium text-gray-800">{mat.naam}</span>
                              <span className="ml-2 text-xs text-gray-400">{mat.afmeting} mm</span>
                              {catBadges.length > 0 && (
                                <span className="ml-2">
                                  {catBadges.map(b => (
                                    <span key={b} className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-medium rounded mr-0.5">{b}</span>
                                  ))}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-1 text-right whitespace-nowrap text-gray-600">
                              €{mat.prijs.toFixed(2)}/m²
                            </td>
                            <td className="py-1.5 px-1 text-right w-20">
                              <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => setEditItem(mat.id)}
                                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(mat.id)}
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

export default PlaatmateriaalBibliotheekModal;
