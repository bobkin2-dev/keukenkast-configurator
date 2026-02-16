import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/supabase';
import LoginPage from './components/Auth/LoginPage';
import HomePage from './components/Home/HomePage';
import KeukenKastInvoer from './App';

// App states
const APP_STATES = {
  LOADING: 'loading',
  LOGIN: 'login',
  HOME: 'home',
  CONFIGURATOR: 'configurator'
};

const AppRouter = () => {
  const [appState, setAppState] = useState(APP_STATES.LOADING);
  const [user, setUser] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectData, setProjectData] = useState(null);

  // Check auth on mount
  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setAppState(APP_STATES.HOME);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentProjectId(null);
        setProjectData(null);
        setAppState(APP_STATES.LOGIN);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const session = await auth.getSession();
    if (session?.user) {
      setUser(session.user);
      setAppState(APP_STATES.HOME);
    } else {
      setAppState(APP_STATES.LOGIN);
    }
  };

  const handleLogin = (user) => {
    setUser(user);
    setAppState(APP_STATES.HOME);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setCurrentProjectId(null);
    setProjectData(null);
    setAppState(APP_STATES.LOGIN);
  };

  const handleSelectProject = async (projectId) => {
    // Load project data
    const { data, error } = await db.getProject(projectId);

    if (error) {
      console.error('Error loading project:', error);
      alert('Kon project niet laden: ' + error.message);
      return;
    }

    setCurrentProjectId(projectId);
    setProjectData(data);
    setAppState(APP_STATES.CONFIGURATOR);
  };

  const handleBackToHome = () => {
    setCurrentProjectId(null);
    setProjectData(null);
    setAppState(APP_STATES.HOME);
  };

  // Loading state
  if (appState === APP_STATES.LOADING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  // Login page
  if (appState === APP_STATES.LOGIN) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Home page
  if (appState === APP_STATES.HOME) {
    return (
      <HomePage
        user={user}
        onSelectProject={handleSelectProject}
        onLogout={handleLogout}
      />
    );
  }

  // Configurator
  if (appState === APP_STATES.CONFIGURATOR) {
    return (
      <KeukenKastInvoer
        user={user}
        projectId={currentProjectId}
        initialData={projectData}
        onBackToHome={handleBackToHome}
        onLogout={handleLogout}
      />
    );
  }

  return null;
};

export default AppRouter;
