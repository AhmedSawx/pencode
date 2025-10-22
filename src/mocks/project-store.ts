import { reactive } from 'vue';
import type { Project } from './types';

interface ProjectStore {
  projects: Project[];
  isLoading: boolean;
}

export const projectStore = reactive<ProjectStore>({
  projects: [],
  isLoading: true,
});
