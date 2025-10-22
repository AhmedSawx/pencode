<template>
  <div v-if="project" class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Brush Management</h2>
      <div class="flex gap-2">
        <input type="file" id="brush-importer" ref="brushImporter" @change="handleBrushImport" accept=".penbrush" class="hidden" />
        <Button as="label" for="brush-importer" variant="outline">
          <Upload class="h-4 w-4 mr-2" />
          Import Brush
        </Button>
        <CreateBrushDialog :project="project" />
      </div>
    </div>

    <div v-if="visibleBrushes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card v-for="brush in visibleBrushes" :key="brush.name">
        <CardHeader>
          <CardTitle>{{ brush.name }}</CardTitle>
          <CardDescription>{{ brush.type }}</CardDescription>
        </CardHeader>
        <CardFooter class="flex justify-between">
          <Button variant="outline" size="sm" as-child>
            <router-link :to="`/project/${project.id}/brush/${encodeURIComponent(brush.name)}`">
              <Pencil class="h-4 w-4 mr-2" />
              Edit
            </router-link>
          </Button>
          <Button variant="outline" size="sm" @click="handleExportBrush(brush)">
            <Upload class="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" @click="promptDelete(brush)">
            <Trash2 class="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
    <div v-else class="text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-12">
      <h3 class="text-lg font-semibold">No Custom Brushes</h3>
      <p class="mt-1 text-sm">Create your first brush to get started.</p>
    </div>

    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <DialogContent class="sm:max-w-md" @interact-outside.prevent>
        <DialogHeader>
          <DialogTitle>Delete Brush</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the brush "{{ brushToDelete?.name }}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">Cancel</Button>
          <Button variant="destructive" @click="handleDeleteBrush">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="showImportConflictDialog" @update:open="showImportConflictDialog = $event">
      <DialogContent class="sm:max-w-md" @interact-outside.prevent>
        <DialogHeader>
          <DialogTitle>Brush Name Conflict</DialogTitle>
          <DialogDescription>
            A brush named "{{ conflictingBrushName }}" already exists. What would you like to do?
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
import { defineComponent } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CreateBrushDialog from '@/components/CreateBrushDialog.vue';
import { Upload, Pencil, Trash2 } from 'lucide-vue-next';
import { projectStore } from '@/mocks/project-store';
import { updateProject } from '@/mocks/projects';
import type { Brush } from '@/mocks/types';
import { state } from '@/services/state';

import { decodePenbrush, encodePenbrush } from '@/lib/brush-format';
import { isDesktop } from '@/services/api';

export default defineComponent({
  name: 'BrushManager',
  components: {
    Button,
    CreateBrushDialog,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
    Upload,
    Pencil,
    Trash2,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  },
  data() {
    return {
      brushToDelete: null as Brush | null,
      showDeleteDialog: false,
      showImportConflictDialog: false,
      conflictingBrushName: '',
      importedBrush: null as Brush | null,
    };
  },
  computed: {
    project() {
      // Since this component is only shown inside Workspace, we can assume the project is the one in the route.
      return projectStore.projects.find(p => p.id === this.$route.params.id);
    },
    visibleBrushes() {
      if (!this.project || !this.project.brushes) return [];
      return this.project.brushes.filter(b => b.status !== 'discarded');
    }
  },
  methods: {
    promptDelete(brush: Brush) {
      this.brushToDelete = brush;
      this.showDeleteDialog = true;
    },
    handleDeleteBrush() {
      if (!this.brushToDelete || !this.project || !this.project.brushes) return;

      const brushIndex = this.project.brushes.findIndex(b => b.name === this.brushToDelete!.name);
      if (brushIndex !== -1) {
        const updatedBrushes = [...this.project.brushes];
        updatedBrushes[brushIndex].status = 'discarded';
        updateProject(this.project.id, { brushes: updatedBrushes });

        // Add to discarded list
        state.discardedBrushes.push(this.brushToDelete.name);
      }

      this.showDeleteDialog = false;
      this.brushToDelete = null;
    },
    handleBrushImport(event: Event) {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file || !this.project) return;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          if (!arrayBuffer || !this.project) return;

          const importedBrush = decodePenbrush(new Uint8Array(arrayBuffer));
          
          const existingBrushIndex = this.project.brushes?.findIndex(b => b.name === importedBrush.name) ?? -1;

          if (existingBrushIndex !== -1) {
            const existingBrush = this.project.brushes![existingBrushIndex];
            if (existingBrush.status === 'discarded') {
              // Revive and overwrite the discarded brush
              const updatedBrushes = [...this.project.brushes!];
              updatedBrushes[existingBrushIndex] = importedBrush; // Replace with imported data
              if (updatedBrushes[existingBrushIndex].status) {
                delete updatedBrushes[existingBrushIndex].status;
              }
              updateProject(this.project.id, { brushes: updatedBrushes });

              const discardedIndex = state.discardedBrushes.indexOf(importedBrush.name);
              if (discardedIndex > -1) {
                state.discardedBrushes.splice(discardedIndex, 1);
              }
            } else {
              // It's an active brush, so it's a real conflict
              this.importedBrush = importedBrush;
              this.conflictingBrushName = importedBrush.name;
              this.showImportConflictDialog = true;
            }
          } else {
            // No brush with this name exists, add it
            const updatedBrushes = [...(this.project.brushes || []), importedBrush];
            updateProject(this.project.id, { brushes: updatedBrushes });
          }

        } catch (error) {
          console.error("Failed to import brush:", error);
          // Optionally, show a toast notification to the user
        }
      };
      reader.readAsArrayBuffer(file);

      // Reset file input
      target.value = '';
    },
    handleImportCancel() {
      this.showImportConflictDialog = false;
      this.importedBrush = null;
      this.conflictingBrushName = '';
    },
    handleImportRename() {
      if (!this.importedBrush || !this.project) return;

      let newName = this.importedBrush.name;
      let counter = 1;
      while (this.project.brushes?.some(b => b.name === newName)) {
        newName = `${this.importedBrush.name} (${counter++})`;
      }
      this.importedBrush.name = newName;

      const updatedBrushes = [...(this.project.brushes || []), this.importedBrush];
      updateProject(this.project.id, { brushes: updatedBrushes });

      this.handleImportCancel(); // Reset state
    },
    handleImportOverwrite() {
      if (!this.importedBrush || !this.project || !this.project.brushes) return;

      const brushIndex = this.project.brushes.findIndex(b => b.name === this.conflictingBrushName);
      if (brushIndex !== -1) {
        const updatedBrushes = [...this.project.brushes];
        updatedBrushes[brushIndex] = this.importedBrush;
        updateProject(this.project.id, { brushes: updatedBrushes });
      }

      this.handleImportCancel(); // Reset state
    },
    async handleExportBrush(brush: Brush) {
      if (!this.project) return;

      const binaryData = encodePenbrush(brush);
      const blob = new Blob([binaryData], { type: "application/octet-stream" });

      if (isDesktop.value) {
        const defaultName = `${brush.name}.penbrush`;
        const filePath = await window.pywebview!.api.show_save_as_dialog(defaultName, ['PenCode Brushes (*.penbrush)']);
        if (filePath) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Data = (e.target?.result as string).split(",")[1];
            await window.pywebview!.api.save_brush(filePath, base64Data);
          };
          reader.readAsDataURL(blob);
        }
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${brush.name}.penbrush`;
        link.click();
        URL.revokeObjectURL(url);
      }
    },
  },
});
</script>
