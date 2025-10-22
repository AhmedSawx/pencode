import { ref } from 'vue';
import type { Project } from '@/mocks/types';
import { encodeProject, decodePencodeFile, base64ToUint8Array, uint8ArrayToBase64 } from '@/lib/file-format';

// --- Environment Detection ---

export const isDesktop = ref(false);

/**
 * Checks if the app is running in the desktop environment by pinging the Python backend.
 * This should be called once when the application initializes.
 */
export async function initializeEnvironment() {
  console.log('[api.ts] initializeEnvironment: Starting environment detection.');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000); // 1-second timeout

  try {
    const response = await fetch('/api/ping', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok') {
        isDesktop.value = true;
        console.log('[api.ts] initializeEnvironment: Desktop environment detected.');
        return;
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    // Fetch will fail in a standard web environment, which is expected.
    console.log('[api.ts] initializeEnvironment: Web environment detected.');
  }
  isDesktop.value = false;
}

// --- API Abstraction Layer ---

async function fetchWrapper(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed with status: ' + response.status }));
    throw new Error(errorData.error || 'An unknown API error occurred');
  }
  return response.json();
}

// --- Project Management API ---

export async function listProjects(): Promise<Project[]> {
  if (isDesktop.value) {
    const { files } = await fetchWrapper('/api/projects');
    if (!files) return [];

    const projectPromises = files.map(async (path: string) => {
      const { data } = await fetchWrapper('/api/load_project', {
        method: 'POST',
        body: JSON.stringify({ path }),
      });
      const project = decodePencodeFile(base64ToUint8Array(data));
      project.filePath = path;
      return project;
    });

    return Promise.all(projectPromises);

  } else {
    // Web environment: Load from localStorage
    const projects: Project[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pencode-project-')) {
        const project = JSON.parse(localStorage.getItem(key)!);
        projects.push(project);
      }
    }
    return projects;
  }
}

export async function saveProject(project: Project): Promise<Project> {
  if (isDesktop.value) {
    if (!project.filePath) {
      throw new Error('File path is required to save a project in desktop mode.');
    }
    const binaryData = encodeProject(project);
    const base64Data = uint8ArrayToBase64(binaryData);

    await fetchWrapper('/api/save_project', {
      method: 'POST',
      body: JSON.stringify({ path: project.filePath, data: base64Data }),
    });
    return project;
  } else {
    // Web environment: Save to localStorage
    localStorage.setItem(`pencode-project-${project.id}`, JSON.stringify(project));
    return project;
  }
}

export async function deleteProject(projectId: string, filePath?: string): Promise<void> {
  if (isDesktop.value) {
    if (!filePath) {
        // This case should ideally not happen if projects are loaded correctly
        throw new Error('File path is required to delete a project in desktop mode.');
    }
    await fetchWrapper('/api/delete_project', {
        method: 'POST',
        body: JSON.stringify({ path: filePath }),
    });
  } else {
    // Web environment: Remove from localStorage
    localStorage.removeItem(`pencode-project-${projectId}`);
  }
}
