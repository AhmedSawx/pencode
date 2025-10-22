<template>
  <div class="flex flex-col h-full w-full">
    <header class="flex justify-between pr-2 h-16 border-b border-border shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div class="flex items-center gap-2 px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div class="flex items-center gap-2 pr-4">
        <CreateProjectDialog @project-create="handleProjectCreate" />
      </div>
    </header>
    <input type="file" ref="fileInput" @change="handleFileSelected" accept=".pencode" class="hidden" />
    <main class="flex-1 overflow-auto">
      <div class="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <!-- Header Section -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-foreground mb-2">
            My Projects
          </h1>
          <p class="text-muted-foreground">
            Create and manage your Pencode drawing projects
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 text-center">
          <p class="text-lg font-medium text-foreground mb-2">Loading Projects...</p>
          <p class="text-muted-foreground">Please wait while we fetch your work.</p>
        </div>

        <!-- Projects Grid -->
        <div v-else-if="projects.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <ProjectCard
            v-for="project in projects"
            :key="project.id"
            :id="project.id"
            :title="project.title"
            :canvas-image="project.canvasImage"
            :last-modified="project.lastModified"
            :status="project.status"
            :has-unsaved-changes="project.hasUnsavedChanges"

          />
        </div>

        <!-- Empty State (if no projects) -->
        <div v-else class="flex flex-col items-center justify-center py-12 text-center">
          <div class="text-6xl mb-4 opacity-30">📝</div>
          <h3 class="text-lg font-medium text-foreground mb-2">
            No projects yet
          </h3>
          <p class="text-muted-foreground mb-6 max-w-md">
            Create your first Pencode project to start drawing with code
          </p>
        </div>
      </div>
    </main>

    <Dialog :open="showProjectConflictDialog" @update:open="showProjectConflictDialog = $event">
      <DialogContent class="sm:max-w-md" @interact-outside.prevent>
        <DialogHeader>
          <DialogTitle>Project Name Conflict</DialogTitle>
          <DialogDescription>
            A project named "{{ conflictingProjectName }}" already exists. What would you like to do?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="handleImportCancel">Cancel</Button>
          <Button @click="handleImportRename">Rename</Button>
          <Button variant="destructive" @click="handleImportOverwrite">Overwrite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script lang="ts">
import ProjectCard from '@/components/project-card.vue';
import CreateProjectDialog from '@/components/CreateProjectDialog.vue';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import * as projectManager from '@/mocks/projects';
import { projectStore } from '@/mocks/project-store';
import * as api from '@/services/api';
import { isDesktop } from '@/services/api';
import { decodePencodeFile, base64ToUint8Array } from '@/lib/file-format';
import { defineComponent } from 'vue';
import type { Project } from '@/mocks/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default defineComponent({
  name: 'Home',
  components: {
    ProjectCard,
    CreateProjectDialog,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    Separator,
    SidebarTrigger,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Button,
  },
  data() {
    return {
      showProjectConflictDialog: false,
      conflictingProjectName: '',
      importedProject: null as Project | null,
      existingProject: null as Project | null,
    };
  },
  computed: {
    projects() {
      return [...projectStore.projects].sort((a, b) => {
        const dateA = new Date(a.lastModified || a.createdAt || 0);
        const dateB = new Date(b.lastModified || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    },
    isLoading() {
      return projectStore.isLoading;
    }
  },
  mounted() {
    console.log('[Home.vue] Mounted hook.');
    window.addEventListener('open-project-dialog', this.handleOpenProject);
  },
  beforeUnmount() {
    window.removeEventListener('open-project-dialog', this.handleOpenProject);
  },
  created() {
    console.log('[Home.vue] Created hook: Initializing projects.');
    projectManager.initProjects();
  },
  methods: {
    handleProjectCreate() {
      // No longer needed, reactivity handles it
    },
    handleOpenProject() {
      if (isDesktop.value) {
        this.handleOpenProjectDesktop();
      } else {
        (this.$refs.fileInput as HTMLInputElement).click();
      }
    },
    async handleOpenProjectDesktop() {
      if (!window.pywebview) return;
      const filePath = await window.pywebview.api.show_open_dialog(['Pencode Projects (*.pencode)']);
      if (filePath) {
        const { data } = await window.pywebview.api.load_project(filePath);
        if (data) {
          const project = decodePencodeFile(base64ToUint8Array(data));
          project.filePath = filePath;
          this.handleProjectData(project);
        }
      }
    },
    handleFileSelected(event: Event) {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const arrayBuffer = e.target?.result;
        if (arrayBuffer instanceof ArrayBuffer) {
          const project = decodePencodeFile(new Uint8Array(arrayBuffer));
          this.handleProjectData(project);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    handleProjectData(project: Project) {
      const existingProject = projectStore.projects.find(p => p.title === project.title);
      if (existingProject) {
        this.importedProject = project;
        this.existingProject = existingProject;
        this.conflictingProjectName = project.title;
        this.showProjectConflictDialog = true;
      } else {
        projectManager.addLoadedProject(project);
        this.$router.push(`/project/${project.id}`);
      }
    },
    handleImportCancel() {
      this.showProjectConflictDialog = false;
      this.importedProject = null;
      this.existingProject = null;
      this.conflictingProjectName = '';
    },
    async handleImportRename() {
      if (!this.importedProject) return;

      let newName = this.importedProject.title;
      let counter = 1;
      while (projectStore.projects.some(p => p.title === newName)) {
        newName = `${this.importedProject.title} (${counter++})`;
      }
      
      const newProject: Project = {
        ...this.importedProject,
        id: Date.now().toString(),
        title: newName,
        status: 'saved', // It will be saved immediately
        hasUnsavedChanges: false,
        lastModified: new Date().toISOString(),
      };
      
      // If on desktop, the renamed project is a new file, so it shouldn't have a path yet.
      if (isDesktop.value) {
        delete newProject.filePath;
      }

      await api.saveProject(newProject);
      projectManager.addLoadedProject(newProject);
      
      this.$router.push(`/project/${newProject.id}`);

      this.handleImportCancel();
    },
    async handleImportOverwrite() {
      if (!this.importedProject || !this.existingProject) return;

      const projectToOverwrite = {
        ...this.importedProject, // content from imported
        id: this.existingProject.id, // id from existing
        filePath: this.existingProject.filePath, // path from existing
        createdAt: this.existingProject.createdAt, // keep original creation date
      };

      await projectManager.saveProject(projectToOverwrite);
      
      this.$router.push(`/project/${projectToOverwrite.id}`);
      this.handleImportCancel();
    },
  },
});
</script>