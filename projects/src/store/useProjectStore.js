import { create } from 'zustand';
import { projectService } from '../services/api';

export const useProjectStore = create((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async (email) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[ProjectStore] Fetching projects for:', email);
      const data = await projectService.getProjects(email);
      console.log('[ProjectStore] Response:', data);
      console.log('[ProjectStore] Projects count:', data.projects?.length);
      console.log('[ProjectStore] Projects:', data.projects);

      if (data.success) {
        set({ projects: data.projects || [], isLoading: false });
        console.log('[ProjectStore] State updated with', data.projects?.length, 'projects');
      } else {
        console.error('[ProjectStore] Error:', data.error);
        set({ error: data.error, isLoading: false });
      }
    } catch (err) {
      console.error('[ProjectStore] Exception:', err);
      set({ error: err.message, isLoading: false });
    }
  },
}));
