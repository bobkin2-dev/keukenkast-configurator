import React, { useState, useEffect } from 'react';
import { db, auth, isAdmin } from '../../lib/supabase';

const HomePage = ({ user, onSelectProject, onNewProject, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const userIsAdmin = isAdmin(user?.email);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await db.getProjects();

    if (error) {
      setError('Kon projecten niet laden: ' + error.message);
    } else {
      setProjects(data || []);
    }

    setLoading(false);
  };

  const handleDeleteProject = async (projectId) => {
    const { error } = await db.deleteProject(projectId);

    if (error) {
      setError('Kon project niet verwijderen: ' + error.message);
    } else {
      setProjects(projects.filter(p => p.id !== projectId));
    }

    setDeleteConfirm(null);
  };

  const handleNewProject = async () => {
    const { data, error } = await db.createProject({
      name: 'Nieuw Project',
      meubelnummer: '',
    });

    if (error) {
      setError('Kon project niet aanmaken: ' + error.message);
    } else if (data) {
      onSelectProject(data.id);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              🗄️ Keukenkast Configurator
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
          <h2 className="text-xl font-semibold text-gray-800">
            Mijn Projecten
          </h2>
          <button
            onClick={handleNewProject}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition shadow-md hover:shadow-lg"
          >
            <span className="text-xl">+</span>
            Nieuw Project
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Projecten laden...</p>
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Nog geen projecten
            </h3>
            <p className="text-gray-600 mb-6">
              Maak je eerste keukenkast configuratie aan
            </p>
            <button
              onClick={handleNewProject}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              + Nieuw Project
            </button>
          </div>
        ) : (
          /* Projects grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
              >
                {/* Project header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800 truncate">
                      {project.name || 'Naamloos Project'}
                    </h3>
                    {project.meubelnummer && (
                      <p className="text-sm text-gray-500">
                        #{project.meubelnummer}
                      </p>
                    )}
                  </div>
                  <div className="text-2xl">🗄️</div>
                </div>

                {/* Project info */}
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  <p>
                    <span className="text-gray-400">Aangemaakt:</span>{' '}
                    {formatDate(project.created_at)}
                  </p>
                  <p>
                    <span className="text-gray-400">Laatst bewerkt:</span>{' '}
                    {formatDate(project.updated_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectProject(project.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    Openen
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(project.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Verwijderen"
                  >
                    🗑️
                  </button>
                </div>

                {/* Delete confirmation */}
                {deleteConfirm === project.id && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 mb-2">
                      Weet je zeker dat je dit project wilt verwijderen?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                      >
                        Ja, verwijderen
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium"
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Merger.be - Keukenkast Configurator
      </footer>
    </div>
  );
};

export default HomePage;
