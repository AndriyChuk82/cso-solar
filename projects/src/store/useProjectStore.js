import { create } from 'zustand';
import { projectService } from '../services/api';

export const useProjectStore = create((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const data = await projectService.getProjects(email);
      if (data.success) {
        set({ projects: data.projects || [], isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
