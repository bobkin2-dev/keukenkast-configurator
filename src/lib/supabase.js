import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zwiyibewosgpxrzwgvte.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3aXlpYmV3b3NncHhyendndnRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTE4NjIsImV4cCI6MjA4NTc2Nzg2Mn0.rGg9IeVoTUE5AX7NBLYzLYTv40hu4YADgaxLK1rraGk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { ADMIN_EMAIL, ALLOWED_DOMAIN } from '../constants/app';

// Check if email is allowed (must be @merger.be)
export const isEmailAllowed = (email) => {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return domain === ALLOWED_DOMAIN;
};

// Check if user is admin
export const isAdmin = (email) => {
  return email?.toLowerCase() === ADMIN_EMAIL;
};

// Auth helper functions
export const auth = {
  // Sign up with email (only @merger.be allowed)
  signUp: async (email, password) => {
    if (!isEmailAllowed(email)) {
      return { error: { message: 'Only @merger.be email addresses are allowed' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in
  signIn: async (email, password) => {
    if (!isEmailAllowed(email)) {
      return { error: { message: 'Only @merger.be email addresses are allowed' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get session
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helper functions for projects
export const db = {
  // Get all projects for current user
  getProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    return { data, error };
  },

  // Get single project with its cabinets
  getProject: async (projectId) => {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, project_groups(naam, klant)')
      .eq('id', projectId)
      .single();

    if (projectError) return { data: null, error: projectError };

    const { data: cabinets, error: cabinetsError } = await supabase
      .from('cabinets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    return {
      data: { ...project, cabinets: cabinets || [] },
      error: cabinetsError
    };
  },

  // Create new project
  createProject: async (projectData) => {
    const user = await auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const insertData = {
      user_id: user.id,
      name: projectData.name || 'Nieuw Project',
      meubelnummer: projectData.meubelnummer || '',
      settings: projectData.settings || {},
    };
    if (projectData.group_id) {
      insertData.group_id = projectData.group_id;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single();
    return { data, error };
  },

  // Update project
  updateProject: async (projectId, updates) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();
    return { data, error };
  },

  // Delete project (cascades to cabinets)
  deleteProject: async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    return { error };
  },

  // Save cabinets for a project (replaces all existing)
  saveCabinets: async (projectId, cabinets) => {
    // First delete existing cabinets
    await supabase
      .from('cabinets')
      .delete()
      .eq('project_id', projectId);

    // Then insert new ones
    if (cabinets.length > 0) {
      const cabinetsToInsert = cabinets.map(cabinet => ({
        project_id: projectId,
        type: cabinet.type,
        config: cabinet, // Store full cabinet config as JSON
      }));

      const { error } = await supabase
        .from('cabinets')
        .insert(cabinetsToInsert);
      return { error };
    }
    return { error: null };
  },

  // --- Project Groups ---

  // Get all groups for current user
  getGroups: async () => {
    const { data, error } = await supabase
      .from('project_groups')
      .select('*')
      .order('updated_at', { ascending: false });
    return { data, error };
  },

  // Create a new group
  createGroup: async ({ naam, klant }) => {
    const user = await auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
      .from('project_groups')
      .insert({
        user_id: user.id,
        naam: naam || 'Nieuw Project',
        klant: klant || '',
      })
      .select()
      .single();
    return { data, error };
  },

  // Update a group
  updateGroup: async (groupId, updates) => {
    const { data, error } = await supabase
      .from('project_groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select()
      .single();
    return { data, error };
  },

  // Delete a group (projects get group_id = NULL via ON DELETE SET NULL)
  deleteGroup: async (groupId) => {
    const { error } = await supabase
      .from('project_groups')
      .delete()
      .eq('id', groupId);
    return { error };
  },

  // Save full project state (settings + cabinets)
  saveProjectState: async (projectId, projectInfo, settings, cabinets) => {
    // Update project settings
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        name: projectInfo.project || 'Nieuw Project',
        meubelnummer: projectInfo.meubelnummer || '',
        settings: settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (projectError) return { error: projectError };

    // Save cabinets
    return await db.saveCabinets(projectId, cabinets);
  }
};
