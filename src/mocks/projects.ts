import * as api from '../services/api';
import type { Project } from './types';
import { projectStore } from './project-store';

let isInitialized = false;

/**
 * Initializes the project store by loading projects from the appropriate source (API or localStorage).
 */
export const initProjects = async () => {
  if (isInitialized) return;
  console.log('[projects.ts] initProjects: Starting.');

  projectStore.isLoading = true;
  try {
    const projects = await api.listProjects();
    projectStore.projects = projects;
  } catch (error) {
    console.error('Failed to initialize projects:', error);
    projectStore.projects = [];
  } finally {
    projectStore.isLoading = false;
    isInitialized = true;
    console.log('[projects.ts] initProjects: Finished.');
  }
};

/**
 * Gets a project by its ID from the local store.
 * @param projectId The ID of the project to retrieve.
 * @returns The project object or undefined if not found.
 */
export const getProject = (projectId: string): Project | undefined => {
  return projectStore.projects.find(p => p.id === projectId);
};

/**
 * Adds a new draft project to the store.
 * Note: This operation is currently client-only until the project is saved for the first time.
 * @param projectData The initial data for the new project.
 * @returns The newly created project object.
 */
export const addProject = (projectData: Omit<Project, 'id' | 'status'>): Project => {
  const newProject: Project = {
    ...projectData,
    id: Date.now().toString(),
    status: 'draft',
    hasUnsavedChanges: true,
  };
  projectStore.projects.unshift(newProject);
  return newProject;
};

/**
 * Updates a project in the local store with new data.
 * @param projectId The ID of the project to update.
 * @param updates The partial project data to apply.
 * @returns The updated project object.
 */
export const updateProject = (projectId: string, updates: Partial<Project>): Project => {
  const index = projectStore.projects.findIndex(p => p.id === projectId);
  if (index === -1) {
    throw new Error(`Project with id ${projectId} not found for update.`);
  }
  const updatedProject = { ...projectStore.projects[index], ...updates };
  projectStore.projects[index] = updatedProject;
  return updatedProject;
};

/**
 * Saves a project to the persistent backend (API or localStorage).
 * @param project The project object to save.
 * @returns The saved project object.
 */
export const saveProject = async (project: Project): Promise<Project> => {
  try {
    const projectToSave: Project = {
      ...project,
      status: 'saved',
      hasUnsavedChanges: false,
      lastModified: new Date().toISOString(),
    };

    if (projectToSave.brushes) {
      projectToSave.brushes = projectToSave.brushes.filter(b => b.status !== 'discarded');
    }

    const savedProject = await api.saveProject(projectToSave);
    // Update the local store with the saved version
    updateProject(project.id, savedProject);
    return savedProject;
  } catch (error) {
    console.error(`Failed to save project ${project.id}:`, error);
    // Optionally revert optimistic updates or show an error to the user
    throw error;
  }
};

/**
 * Deletes a project from the persistent backend and the local store.
 * @param projectId The ID of the project to delete.
 */
export const deleteProject = async (projectId: string): Promise<void> => {
    const projectToDelete = getProject(projectId);
    if (!projectToDelete) {
        console.warn(`Project with id ${projectId} not found for deletion.`);
        return;
    }

  try {
    await api.deleteProject(projectId, projectToDelete.filePath);
    // Remove from local store on successful deletion
    const index = projectStore.projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      projectStore.projects.splice(index, 1);
    }
  } catch (error) {
    console.error(`Failed to delete project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Deletes a project from the persistent backend and the local store.
 * @param projectId The ID of the project to delete.
 */
/**
 * Adds a project loaded from a file into the store.
 * If the project already exists, it's updated. Otherwise, it's added.
 * @param project The project object loaded from a file.
 */
export const addLoadedProject = (project: Project): void => {
  const existingIndex = projectStore.projects.findIndex(p => p.id === project.id);

  if (existingIndex !== -1) {
    // Update existing project
    projectStore.projects[existingIndex] = project;
  } else {
    // Add new project to the top of the list
    projectStore.projects.unshift(project);
  }

  // Also save to localStorage in web environment
  if (!api.isDesktop.value) {
    localStorage.setItem(`pencode-project-${project.id}`, JSON.stringify(project));
  }
};
