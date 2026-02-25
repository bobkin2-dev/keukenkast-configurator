import React, { useState, useEffect } from 'react';
import { db, auth, isAdmin } from '../../lib/supabase';

const HomePage = ({ user, onSelectProject, onNewProject, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [editingGroup, setEditingGroup] = useState(null);
  const [editNaam, setEditNaam] = useState('');
  const [editKlant, setEditKlant] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupNaam, setNewGroupNaam] = useState('');
  const [newGroupKlant, setNewGroupKlant] = useState('');
  const [dragOverTarget, setDragOverTarget] = useState(null); // group ID or 'loose'

  const userIsAdmin = isAdmin(user?.email);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    const [projectsResult, groupsResult] = await Promise.all([
      db.getProjects(),
      db.getGroups(),
    ]);

    if (projectsResult.error) {
      setError('Kon projecten niet laden: ' + projectsResult.error.message);
    } else {
      setProjects(projectsResult.data || []);
    }

    if (groupsResult.error) {
      setError(prev => prev ? prev + ' | ' + groupsResult.error.message : groupsResult.error.message);
    } else {
      const g = groupsResult.data || [];
      setGroups(g);
      // Expand all groups by default
      setExpandedGroups(new Set(g.map(gr => gr.id)));
    }

    setLoading(false);
  };

  const handleDeleteProject = async (projectId) => {
    const { error } = await db.deleteProject(projectId);
    if (error) {
      setError('Kon offerte niet verwijderen: ' + error.message);
    } else {
      setProjects(projects.filter(p => p.id !== projectId));
    }
    setDeleteConfirm(null);
  };

  const handleDeleteGroup = async (groupId) => {
    const { error } = await db.deleteGroup(groupId);
    if (error) {
      setError('Kon groep niet verwijderen: ' + error.message);
    } else {
      setGroups(groups.filter(g => g.id !== groupId));
      // Projects in this group become loose (group_id = NULL via ON DELETE SET NULL)
      setProjects(projects.map(p => p.group_id === groupId ? { ...p, group_id: null } : p));
    }
    setDeleteGroupConfirm(null);
  };

  const handleNewLooseProject = async () => {
    const { data, error } = await db.createProject({
      name: 'Nieuwe Offerte',
      meubelnummer: '',
    });
    if (error) {
      setError('Kon offerte niet aanmaken: ' + error.message);
    } else if (data) {
      onSelectProject(data.id);
    }
  };

  const handleNewProjectInGroup = async (groupId) => {
    const { data, error } = await db.createProject({
      name: 'Nieuwe Offerte',
      meubelnummer: '',
      group_id: groupId,
    });
    if (error) {
      setError('Kon offerte niet aanmaken: ' + error.message);
    } else if (data) {
      onSelectProject(data.id);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupNaam.trim()) return;
    const { data, error } = await db.createGroup({
      naam: newGroupNaam.trim(),
      klant: newGroupKlant.trim(),
    });
    if (error) {
      setError('Kon groep niet aanmaken: ' + error.message);
    } else if (data) {
      setGroups([data, ...groups]);
      setExpandedGroups(prev => new Set([...prev, data.id]));
      setShowNewGroup(false);
      setNewGroupNaam('');
      setNewGroupKlant('');
    }
  };

  const handleStartEditGroup = (group) => {
    setEditingGroup(group.id);
    setEditNaam(group.naam);
    setEditKlant(group.klant || '');
  };

  const handleSaveEditGroup = async () => {
    if (!editingGroup) return;
    const { data, error } = await db.updateGroup(editingGroup, {
      naam: editNaam.trim() || 'Naamloos',
      klant: editKlant.trim(),
    });
    if (error) {
      setError('Kon groep niet bijwerken: ' + error.message);
    } else if (data) {
      setGroups(groups.map(g => g.id === editingGroup ? data : g));
    }
    setEditingGroup(null);
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // --- Drag & Drop ---
  const handleMoveProject = async (projectId, newGroupId) => {
    const { error } = await db.updateProject(projectId, { group_id: newGroupId });
    if (error) {
      setError('Kon offerte niet verplaatsen: ' + error.message);
    } else {
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, group_id: newGroupId } : p
      ));
    }
  };

  const handleDragStart = (e, project) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: project.id, group_id: project.group_id }));
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDragOverTarget(null);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  };

  const handleDragLeave = (e, targetId) => {
    // Only clear if actually leaving the target (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTarget(prev => prev === targetId ? null : prev);
    }
  };

  const handleDrop = async (e, targetGroupId) => {
    e.preventDefault();
    setDragOverTarget(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.group_id !== targetGroupId) {
        await handleMoveProject(data.id, targetGroupId);
      }
    } catch (err) {
      // Ignore invalid drag data
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortByName = (a, b) => (a.name || '').localeCompare(b.name || '', 'nl');
  const getProjectsForGroup = (groupId) => projects.filter(p => p.group_id === groupId).sort(sortByName);
  const looseProjects = projects.filter(p => !p.group_id).sort(sortByName);

  // Reusable offerte row (draggable)
  const OfferteRow = ({ project }) => (
    <>
      <tr
        draggable="true"
        onDragStart={(e) => handleDragStart(e, project)}
        onDragEnd={handleDragEnd}
        className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition group"
        onClick={() => onSelectProject(project.id)}
      >
        <td className="py-2 px-1 text-center cursor-grab active:cursor-grabbing w-8" onClick={(e) => e.stopPropagation()}>
          <span className="text-gray-300 group-hover:text-gray-400 text-sm select-none">&#x2807;</span>
        </td>
        <td className="py-2 px-3 font-medium text-gray-800">
          {project.name || 'Naamloos'}
          {project.meubelnummer && (
            <span className="ml-2 text-xs text-gray-400">#{project.meubelnummer}</span>
          )}
        </td>
        <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(project.updated_at)}</td>
        <td className="py-2 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          {deleteConfirm === project.id ? (
            <span className="inline-flex gap-1 items-center">
              <span className="text-xs text-red-600 mr-1">Verwijderen?</span>
              <button
                onClick={() => handleDeleteProject(project.id)}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
              >
                Ja
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium"
              >
                Nee
              </button>
            </span>
          ) : (
            <button
              onClick={() => setDeleteConfirm(project.id)}
              className="text-gray-300 hover:text-red-500 transition"
              title="Verwijderen"
            >
              ✕
            </button>
          )}
        </td>
      </tr>
    </>
  );

  // Reusable table wrapper for offerte rows
  const OfferteTable = ({ projectList }) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-400 border-b border-gray-200">
          <th className="w-8"></th>
          <th className="text-left py-1.5 px-3 font-medium">Naam</th>
          <th className="text-left py-1.5 px-3 font-medium">Laatst bewerkt</th>
          <th className="text-right py-1.5 px-3 font-medium w-24"></th>
        </tr>
      </thead>
      <tbody>
        {projectList.map(project => (
          <OfferteRow key={project.id} project={project} />
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Keukenkast Configurator
            </h1>
            <p className="text-sm text-gray-600">
              Ingelogd als: <span className="font-medium">{user?.email}</span>
              {userIsAdmin && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Admin
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            Uitloggen
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Action bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Mijn Projecten</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewGroup(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition text-sm"
            >
              + Nieuwe Groep
            </button>
            <button
              onClick={handleNewLooseProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition text-sm"
            >
              + Nieuwe Offerte
            </button>
          </div>
        </div>

        {/* New group form */}
        {showNewGroup && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-indigo-800 mb-3">Nieuwe Groep Aanmaken</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Project Naam</label>
                <input
                  type="text"
                  value={newGroupNaam}
                  onChange={(e) => setNewGroupNaam(e.target.value)}
                  placeholder="bijv. Keuken Stuckens"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Klant</label>
                <input
                  type="text"
                  value={newGroupKlant}
                  onChange={(e) => setNewGroupKlant(e.target.value)}
                  placeholder="bijv. Fam. Stuckens"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                />
              </div>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm"
              >
                Aanmaken
              </button>
              <button
                onClick={() => { setShowNewGroup(false); setNewGroupNaam(''); setNewGroupKlant(''); }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError('')} className="float-right text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Laden...</p>
          </div>
        ) : groups.length === 0 && projects.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nog geen projecten</h3>
            <p className="text-gray-600 mb-6">Maak een groep of offerte aan om te beginnen</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowNewGroup(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              >
                + Nieuwe Groep
              </button>
              <button
                onClick={handleNewLooseProject}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                + Nieuwe Offerte
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Groups */}
            {groups.map(group => {
              const groupProjects = getProjectsForGroup(group.id);
              const isExpanded = expandedGroups.has(group.id);
              const isEditing = editingGroup === group.id;
              const isDragOver = dragOverTarget === group.id;

              return (
                <div
                  key={group.id}
                  className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-colors ${
                    isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  }`}
                  onDragOver={(e) => handleDragOver(e, group.id)}
                  onDragLeave={(e) => handleDragLeave(e, group.id)}
                  onDrop={(e) => handleDrop(e, group.id)}
                >
                  {/* Group header */}
                  <div
                    className={`flex items-center gap-3 px-5 py-3 border-b cursor-pointer transition ${
                      isDragOver ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => !isEditing && toggleGroup(group.id)}
                  >
                    <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      &#9654;
                    </span>

                    {isEditing ? (
                      <div className="flex gap-2 items-center flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editNaam}
                          onChange={(e) => setEditNaam(e.target.value)}
                          className="px-2 py-1 border rounded text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditGroup()}
                        />
                        <input
                          type="text"
                          value={editKlant}
                          onChange={(e) => setEditKlant(e.target.value)}
                          placeholder="Klant"
                          className="px-2 py-1 border rounded text-sm flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditGroup()}
                        />
                        <button
                          onClick={handleSaveEditGroup}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                        >
                          Opslaan
                        </button>
                        <button
                          onClick={() => setEditingGroup(null)}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium"
                        >
                          Annuleren
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-800">{group.naam}</span>
                          {group.klant && (
                            <span className="ml-2 text-sm text-gray-500">- {group.klant}</span>
                          )}
                          <span className="ml-2 text-xs text-gray-400">
                            ({groupProjects.length} offerte{groupProjects.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleStartEditGroup(group)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                            title="Bewerken"
                          >
                            &#9998;
                          </button>
                          <button
                            onClick={() => setDeleteGroupConfirm(group.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Groep verwijderen"
                          >
                            ✕
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Delete group confirmation */}
                  {deleteGroupConfirm === group.id && (
                    <div className="px-5 py-3 bg-red-50 border-b border-red-200">
                      <p className="text-sm text-red-700 mb-2">
                        Groep verwijderen? De offertes worden niet verwijderd, maar verschijnen als losse offertes.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                        >
                          Ja, verwijderen
                        </button>
                        <button
                          onClick={() => setDeleteGroupConfirm(null)}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Group content */}
                  {isExpanded && (
                    <div className="p-4">
                      {groupProjects.length === 0 && !isDragOver ? (
                        <p className="text-sm text-gray-400 italic mb-3">Nog geen offertes in deze groep.</p>
                      ) : groupProjects.length === 0 && isDragOver ? (
                        <p className="text-sm text-blue-500 italic mb-3">Sleep hier om toe te voegen...</p>
                      ) : (
                        <div className="mb-3">
                          <OfferteTable projectList={groupProjects} />
                        </div>
                      )}
                      <button
                        onClick={() => handleNewProjectInGroup(group.id)}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 transition"
                      >
                        + Offerte toevoegen
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loose projects drop zone — always visible when groups exist */}
            {groups.length > 0 && (
              <div
                onDragOver={(e) => handleDragOver(e, 'loose')}
                onDragLeave={(e) => handleDragLeave(e, 'loose')}
                onDrop={(e) => handleDrop(e, null)}
              >
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Losse Offertes</h3>
                <div className={`rounded-xl shadow-sm border-2 overflow-hidden p-4 transition-colors ${
                  dragOverTarget === 'loose' ? 'border-blue-400 bg-blue-50' : looseProjects.length > 0 ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-300'
                }`}>
                  {looseProjects.length > 0 ? (
                    <OfferteTable projectList={looseProjects} />
                  ) : (
                    <p className={`text-sm italic text-center py-2 ${dragOverTarget === 'loose' ? 'text-blue-500' : 'text-gray-400'}`}>
                      {dragOverTarget === 'loose' ? 'Sleep hier om los te koppelen...' : 'Sleep een offerte hierheen om los te koppelen'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Loose projects when no groups exist */}
            {groups.length === 0 && looseProjects.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
                <OfferteTable projectList={looseProjects} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Merger.be - Keukenkast Configurator
      </footer>
    </div>
  );
};

export default HomePage;
